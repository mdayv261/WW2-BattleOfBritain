// The land of south-east England and the Pas-de-Calais (D51), drawn from the terrain grid: square chunks of the grid,
// each built at four levels of detail and swapped by distance from the camera, so the frame rate holds. A margin of
// chunks beyond the map's edge carries the land on (src/world/terrain.js fades it).
//   Colour: built-up areas grey-brown, beaches sand, steep slopes beside the sea white chalk (the cliffs), woods dark
//   green, farmland in varied greens and yellows (lighter on the downs); a field-pattern texture adds hedges and fields
//   close up. The sea is the separate sea plane (src/render/scene.js); sea points are dropped below it.

import * as THREE from 'three';
import { TERRAIN_GRID } from '../world/terrainGrid.js';
import { toWorld } from '../world/geo.js';
import { urbanMask } from '../world/landCover.js';

const CHUNK = 64; // grid cells along a chunk's side
const MARGIN = 2; // chunks beyond the map's edge on each side
const STEPS = [1, 2, 4, 8]; // grid cells between vertices at each level of detail
const RANGES = [7000, 16000, 36000]; // m: beyond each range the next, coarser level is used
const SEA_DEPTH = -4; // m: sea points, below the sea plane
const SKIRT = 40; // m: the skirt hanging below each chunk's edge hides cracks between levels
const DETAIL_TILE = 1600; // m: one repeat of the field texture

const COLOURS = {
  urban: new THREE.Color(0x8f8676), sand: new THREE.Color(0xd6cba4), chalk: new THREE.Color(0xe9e6da),
  wood: new THREE.Color(0x3e5a2f), marsh: new THREE.Color(0x7d8f63), sea: new THREE.Color(0x3d5f6e),
  fields: [0x6f8f4a, 0x7c9a52, 0x8aa35a, 0xa7a35e, 0x93a865].map((c) => new THREE.Color(c)),
  downs: new THREE.Color(0xa4ad6c),
};

/** Smooth value noise in 0..1 with a given cell size (m), deterministic. */
function noise(x, z, size, seed) {
  const hash = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const fx = x / size;
  const fz = z / size;
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const u = fx - i;
  const v = fz - j;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * su;
  const b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * su;
  return a + (b - a) * sv;
}

/** Fields and hedges in greys, multiplied over the vertex colours close up. */
function fieldTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  let seed = 31;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  g.fillStyle = '#c8c8c8';
  g.fillRect(0, 0, size, size);
  const cells = 7;
  const step = size / cells;
  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const shade = 170 + Math.floor(rand() * 70);
      g.fillStyle = `rgb(${shade},${shade},${shade})`;
      g.fillRect(i * step, j * step, step + 2, step + 2);
      if (rand() < 0.4) {
        const s2 = 170 + Math.floor(rand() * 70);
        g.fillStyle = `rgb(${s2},${s2},${s2})`;
        g.fillRect(i * step, j * step, step / 2, step + 2);
      }
    }
  }
  g.strokeStyle = '#5c5c5c';
  g.lineWidth = 3;
  for (let k = 0; k <= cells; k += 1) {
    g.beginPath();
    g.moveTo(k * step, 0);
    g.lineTo(k * step, size);
    g.moveTo(0, k * step);
    g.lineTo(size, k * step);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Lambert material with vertex colours and the field texture blended in by a per-vertex `detail` weight. */
function terrainMaterial() {
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const detailMap = fieldTexture();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.detailMap = { value: detailMap };
    shader.vertexShader = `attribute float detail;\nvarying float vDetail;\nvarying vec2 vFieldUv;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvDetail = detail;\nvFieldUv = (modelMatrix * vec4(position, 1.0)).xz / ${DETAIL_TILE.toFixed(1)};`);
    shader.fragmentShader = `uniform sampler2D detailMap;\nvarying float vDetail;\nvarying vec2 vFieldUv;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>', 'diffuseColor.rgb *= mix(vec3(1.0), texture2D(detailMap, vFieldUv).rgb * 1.3, vDetail);');
  };
  return material;
}

/**
 * The colour and close-up texture weight of a grid point: { colour, detail }.
 *   at(r, c) -> { x, z, height, water } for grid points (beyond the edge too); urban: the grid's built-up mask.
 */
function cover(r, c, p, at, urban) {
  const { cols, rows } = TERRAIN_GRID;
  if (p.water) return { colour: COLOURS.sea, detail: 0 };
  const inGrid = r >= 0 && c >= 0 && r < rows && c < cols;
  if (inGrid && urban[r * cols + c] && !at.onAirfield(p)) return { colour: COLOURS.urban, detail: 0.35 };
  const n = [at(r - 1, c), at(r + 1, c), at(r, c - 1), at(r, c + 1)];
  const nearSea = n.some((q) => q.water);
  const slope = Math.max(...n.map((q) => Math.abs(q.height - p.height))) / 230;
  if (nearSea && slope > 0.12) return { colour: COLOURS.chalk, detail: 0 };
  if (nearSea && p.height < 6) return { colour: COLOURS.sand, detail: 0 };
  if (p.height < 3) return { colour: COLOURS.marsh, detail: 0.5 };
  if (noise(p.x, p.z, 2600, 3) > 0.68) return { colour: COLOURS.wood, detail: 0.25 };
  const pick = COLOURS.fields[Math.floor(noise(p.x, p.z, 1800, 7) * COLOURS.fields.length * 0.999)];
  const colour = pick.clone();
  if (p.height > 120) colour.lerp(COLOURS.downs, Math.min(1, (p.height - 120) / 100));
  return { colour, detail: 1 };
}

/** The land as chunks with levels of detail. Returns { group, update(camera) }. */
export function buildTerrainMesh(terrain) {
  const { cols, rows, lon0, lat0, dLon, dLat } = TERRAIN_GRID;
  const urban = urbanMask();
  const material = terrainMaterial();
  const group = new THREE.Group();
  group.name = 'terrain';

  const points = new Map();
  /** A grid point's world position, height and sea flag (cached while a chunk is built). */
  at.onAirfield = (p) => terrain.onAirfield(p.x, p.z);
  function at(r, c) {
    const key = r * 100000 + c;
    let p = points.get(key);
    if (!p) {
      const { x, z } = toWorld(lat0 - r * dLat, lon0 + c * dLon);
      const s = terrain.surfaceAt(x, z);
      p = { x, z, height: s.water ? SEA_DEPTH : terrain.heightAt(x, z), water: s.water };
      points.set(key, p);
    }
    return p;
  }

  /** The geometry of one chunk at one level of detail, with a skirt round its edge. */
  const build = (r0, c0, step) => {
    const n = CHUNK / step + 1;
    const positions = [];
    const colours = [];
    const detail = [];
    const index = [];
    const vertex = (r, c, drop = 0) => {
      const p = at(r, c);
      const k = cover(r, c, p, at, urban);
      positions.push(p.x, p.height - drop, p.z);
      colours.push(k.colour.r, k.colour.g, k.colour.b);
      detail.push(k.detail);
      return positions.length / 3 - 1;
    };
    for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) vertex(r0 + i * step, c0 + j * step);
    const id = (i, j) => i * n + j;
    for (let i = 0; i < n - 1; i += 1) {
      for (let j = 0; j < n - 1; j += 1) index.push(id(i, j), id(i + 1, j), id(i, j + 1), id(i, j + 1), id(i + 1, j), id(i + 1, j + 1));
    }
    // Skirt: each edge vertex again, dropped, joined to the edge.
    const edges = [
      Array.from({ length: n }, (_, j) => [0, j]), Array.from({ length: n }, (_, i) => [i, n - 1]),
      Array.from({ length: n }, (_, j) => [n - 1, n - 1 - j]), Array.from({ length: n }, (_, i) => [n - 1 - i, 0]),
    ];
    for (const edge of edges) {
      const low = edge.map(([i, j]) => vertex(r0 + i * step, c0 + j * step, SKIRT));
      for (let k = 0; k < edge.length - 1; k += 1) {
        const a = id(...edge[k]);
        const b = id(...edge[k + 1]);
        index.push(a, low[k], b, b, low[k], low[k + 1]);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
    geometry.setAttribute('detail', new THREE.Float32BufferAttribute(detail, 1));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    points.clear(); // the cache only serves one chunk's build (neighbours); the whole grid would be too much memory
    return geometry;
  };

  const chunks = [];
  for (let r0 = -MARGIN * CHUNK; r0 < rows + MARGIN * CHUNK; r0 += CHUNK) {
    for (let c0 = -MARGIN * CHUNK; c0 < cols + MARGIN * CHUNK; c0 += CHUNK) {
      const centre = at(r0 + CHUNK / 2, c0 + CHUNK / 2);
      const mesh = new THREE.Mesh(undefined, material);
      mesh.frustumCulled = true;
      chunks.push({ r0, c0, centre, mesh, lod: -1, geometries: [] });
      group.add(mesh);
    }
  }
  const halfSize = (CHUNK / 2) * dLat * 111195;

  /** Picks each chunk's level of detail for the camera's position (call each frame). */
  const update = (camera) => {
    const cam = camera.position;
    for (const ch of chunks) {
      const d = Math.max(0, Math.hypot(cam.x - ch.centre.x, cam.z - ch.centre.z) - halfSize) + Math.max(0, cam.y - 500) * 0.5;
      let lod = RANGES.findIndex((range) => d < range);
      if (lod < 0) lod = STEPS.length - 1;
      if (lod !== ch.lod) {
        ch.geometries[lod] ??= build(ch.r0, ch.c0, STEPS[lod]);
        ch.mesh.geometry = ch.geometries[lod];
        ch.lod = lod;
      }
    }
  };
  return { group, update };
}
