// Towns and rivers on the map (D51): low houses scattered over the built-up areas (Natural Earth's urban outlines,
// rasterised in src/world/landCover.js), shown only near the camera so the frame rate holds, and the Thames as a
// ribbon of water over the land.

import * as THREE from 'three';
import { TERRAIN_GRID } from '../world/terrainGrid.js';
import { toWorld } from '../world/geo.js';
import { urbanMask } from '../world/landCover.js';
import { RIVERS } from '../world/mapFeatures.js';

const BLOCK = 32; // grid cells along a block of houses' side
const HOUSES_PER_CELL = 2;
const SHOW_WITHIN = 9000; // m: houses are drawn within this distance of the camera
const RIVER_WIDTH = 220; // m
const ROOF_COLOURS = [0x8a4b38, 0x6f5d52, 0x9a5a43, 0x5d5c5a].map((c) => new THREE.Color(c));

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** A house: walls (a box) and a pitched roof (a prism), as one geometry, base on the ground. */
function houseGeometry() {
  const walls = new THREE.BoxGeometry(9, 6, 7).translate(0, 3, 0);
  const roof = new THREE.CylinderGeometry(4.6, 4.6, 9.4, 3, 1).rotateZ(Math.PI / 2).scale(1, 0.55, 1).translate(0, 6.9, 0);
  const merged = new THREE.BufferGeometry();
  const pos = [...walls.toNonIndexed().attributes.position.array, ...roof.toNonIndexed().attributes.position.array];
  const wallCount = walls.toNonIndexed().attributes.position.count;
  const colours = [];
  for (let i = 0; i < pos.length / 3; i += 1) {
    const c = i < wallCount ? [0.78, 0.72, 0.62] : [1, 1, 1]; // roofs take the instance colour
    colours.push(...c);
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  merged.computeVertexNormals();
  return merged;
}

/** Houses and rivers. Returns { group, update(camera) }. */
export function buildTowns(terrain) {
  const { cols, rows, lon0, lat0, dLon, dLat } = TERRAIN_GRID;
  const urban = urbanMask();
  const group = new THREE.Group();
  group.name = 'towns';
  const geometry = houseGeometry();
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });

  // Blocks of the grid that contain built-up cells; each block's houses are made when first needed.
  const blocks = [];
  for (let r0 = 0; r0 < rows; r0 += BLOCK) {
    for (let c0 = 0; c0 < cols; c0 += BLOCK) {
      const cells = [];
      for (let r = r0; r < Math.min(rows, r0 + BLOCK); r += 1) {
        for (let c = c0; c < Math.min(cols, c0 + BLOCK); c += 1) if (urban[r * cols + c]) cells.push([r, c]);
      }
      if (cells.length) blocks.push({ cells, centre: toWorld(lat0 - (r0 + BLOCK / 2) * dLat, lon0 + (c0 + BLOCK / 2) * dLon), mesh: null, seed: r0 * 7919 + c0 });
    }
  }
  const makeHouses = (block) => {
    const rand = seeded(block.seed + 1);
    const mesh = new THREE.InstancedMesh(geometry, material, block.cells.length * HOUSES_PER_CELL);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    let n = 0;
    for (const [r, c] of block.cells) {
      for (let k = 0; k < HOUSES_PER_CELL; k += 1) {
        const { x, z } = toWorld(lat0 - (r + rand() - 0.5) * dLat, lon0 + (c + rand() - 0.5) * dLon);
        const s = terrain.surfaceAt(x, z);
        if (s.water || terrain.onAirfield(x, z)) continue;
        q.setFromAxisAngle(up, rand() * Math.PI);
        const size = 0.8 + rand() * 0.6;
        m.compose(new THREE.Vector3(x, s.height, z), q, new THREE.Vector3(size, 0.8 + rand() * 0.5, size));
        mesh.setMatrixAt(n, m);
        mesh.setColorAt(n, ROOF_COLOURS[Math.floor(rand() * ROOF_COLOURS.length)]);
        n += 1;
      }
    }
    mesh.count = n;
    mesh.computeBoundingSphere();
    return mesh;
  };

  // Rivers: a flat ribbon a little above the land.
  const water = new THREE.MeshLambertMaterial({ color: 0x46677a, polygonOffset: true, polygonOffsetFactor: -3 });
  for (const river of RIVERS) {
    const pts = river.points.map(([lon, lat]) => toWorld(lat, lon));
    const positions = [];
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      const nx = (-(b.z - a.z) / len) * (RIVER_WIDTH / 2);
      const nz = ((b.x - a.x) / len) * (RIVER_WIDTH / 2);
      const ya = terrain.heightAt(a.x, a.z) + 0.5;
      const yb = terrain.heightAt(b.x, b.z) + 0.5;
      positions.push(a.x + nx, ya, a.z + nz, a.x - nx, ya, a.z - nz, b.x + nx, yb, b.z + nz);
      positions.push(b.x + nx, yb, b.z + nz, a.x - nx, ya, a.z - nz, b.x - nx, yb, b.z - nz);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, water);
    mesh.material.side = THREE.DoubleSide;
    group.add(mesh);
  }

  const update = (camera) => {
    const cam = camera.position;
    for (const b of blocks) {
      const near = Math.hypot(cam.x - b.centre.x, cam.z - b.centre.z) < SHOW_WITHIN + Math.max(0, cam.y);
      if (near && !b.mesh) {
        b.mesh = makeHouses(b);
        group.add(b.mesh);
      }
      if (b.mesh) b.mesh.visible = near;
    }
  };
  return { group, update };
}
