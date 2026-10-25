// The Phase 2 aerodrome and the land around it, built in code (D28): farmland in a patchwork of fields,
// the mown grass square with its boundary markers, landing T and windsock, a few hangars and huts, trees
// for judging height and speed, and the shingle of the coast to the south. Phase 4 replaces all of it
// with the real south-east of England.

import * as THREE from 'three';
import { AIRFIELD } from '../world/airfield.js';

const FIELD_TILE = 2000; // m: one repeat of the farmland texture
const LAND_EXTENT = 80000; // m: size of the land plane (the haze hides its edges)

/** A deterministic random generator, so the scenery is the same every time. */
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Square canvas texture drawn by `draw(g, size, rand)`, repeating. */
function canvasTexture(size, seed, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size, seeded(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Fields of pasture, hay and stubble divided by dark hedges. */
function farmlandTexture() {
  const colours = ['#6f8f4a', '#7c9a52', '#8aa35a', '#a7a35e', '#b9ad6c', '#5f8344', '#93a865'];
  return canvasTexture(512, 11, (g, size, rand) => {
    g.fillStyle = '#6a8a48';
    g.fillRect(0, 0, size, size);
    const cells = 6;
    const step = size / cells;
    for (let i = 0; i < cells; i += 1) {
      for (let j = 0; j < cells; j += 1) {
        const x = i * step + (rand() - 0.5) * 10;
        const y = j * step + (rand() - 0.5) * 10;
        g.fillStyle = colours[Math.floor(rand() * colours.length)];
        g.fillRect(x, y, step + 6, step + 6);
        if (rand() < 0.4) {
          // Some fields are split once more.
          g.fillStyle = colours[Math.floor(rand() * colours.length)];
          g.fillRect(x, y, step / 2, step + 6);
        }
      }
    }
    g.strokeStyle = '#3d5a2c';
    g.lineWidth = 3;
    for (let k = 0; k <= cells; k += 1) {
      g.beginPath();
      g.moveTo(k * step, 0);
      g.lineTo(k * step + (rand() - 0.5) * 12, size);
      g.stroke();
      g.beginPath();
      g.moveTo(0, k * step);
      g.lineTo(size, k * step + (rand() - 0.5) * 12);
      g.stroke();
    }
  });
}

/** Mown grass in broad light and dark stripes. */
function mownTexture() {
  return canvasTexture(256, 5, (g, size, rand) => {
    for (let i = 0; i < 8; i += 1) {
      g.fillStyle = i % 2 ? '#86a95c' : '#7a9d53';
      g.fillRect(0, (i * size) / 8, size, size / 8);
    }
    for (let i = 0; i < 1500; i += 1) {
      g.fillStyle = `rgba(60, 90, 40, ${0.15 + rand() * 0.2})`;
      g.fillRect(rand() * size, rand() * size, 2, 2);
    }
  });
}

const flat = (w, d, material, x, z, y = 0.1) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
};

const box = (w, h, d, colour, x, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: colour }));
  m.position.set(x, h / 2, z);
  return m;
};

/** The land north of the coast, the beach, and the mown aerodrome on top. */
function ground() {
  const group = new THREE.Group();
  const land = new THREE.MeshLambertMaterial({ map: farmlandTexture() });
  land.map.repeat.set(LAND_EXTENT / FIELD_TILE, LAND_EXTENT / FIELD_TILE);
  group.add(flat(LAND_EXTENT, LAND_EXTENT, land, 0, AIRFIELD.coastZ - LAND_EXTENT / 2, 0));
  group.add(flat(LAND_EXTENT, 60, new THREE.MeshLambertMaterial({ color: 0xcfc4a4 }), 0, AIRFIELD.coastZ - 30, 0.05));
  const grass = new THREE.MeshLambertMaterial({ map: mownTexture(), polygonOffset: true, polygonOffsetFactor: -2 });
  grass.map.repeat.set(4, 4);
  group.add(flat(AIRFIELD.size, AIRFIELD.size, grass, 0, 0, 0.1));
  return group;
}

/** White boundary markers every 100 m round the edge, the landing T and the windsock. */
function markings() {
  const group = new THREE.Group();
  const white = 0xf2f0e6;
  const half = AIRFIELD.size / 2;
  for (let d = -half; d <= half; d += 100) {
    group.add(box(3, 0.6, 3, white, d, -half), box(3, 0.6, 3, white, d, half));
    group.add(box(3, 0.6, 3, white, -half, d), box(3, 0.6, 3, white, half, d));
  }
  // Landing T, its crossbar at the downwind end, laid out for landings northward.
  const tee = new THREE.MeshLambertMaterial({ color: white, polygonOffset: true, polygonOffsetFactor: -4 });
  group.add(flat(4, 24, tee, -120, 330, 0.2), flat(18, 4, tee, -120, 344, 0.2));
  // Windsock on a pole at the north-west corner.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 8), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
  pole.position.set(-half + 30, 4, -half + 30);
  const sock = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0xe0782a, side: THREE.DoubleSide }));
  sock.rotation.z = Math.PI / 2.3; // calm air: hanging down
  sock.position.set(-half + 30, 6.4, -half + 30);
  group.add(pole, sock);
  return group;
}

/** Three hangars and a row of huts along the eastern edge, outside the landing area. */
function buildings() {
  const group = new THREE.Group();
  const x = AIRFIELD.size / 2 + 60;
  for (const z of [-250, -150, -50]) {
    group.add(box(36, 13, 45, 0x8a8577, x + 20, z));
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(22.5, 22.5, 36, 16, 1, false, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x6b6a62 }),
    );
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.scale.set(1, 1, 0.25);
    roof.position.set(x + 20, 13, z);
    group.add(roof);
  }
  for (let i = 0; i < 6; i += 1) group.add(box(8, 3.5, 18, 0x7d6e56, x + 5, 60 + i * 30));
  return group;
}

/** Trees along the hedges within a few kilometres: something to judge height and speed by. */
function trees() {
  const rand = seeded(23);
  const count = 1500;
  const geometry = new THREE.ConeGeometry(4, 14, 7);
  geometry.translate(0, 7, 0);
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshLambertMaterial({ color: 0x3f5f30 }), count);
  const m = new THREE.Matrix4();
  let n = 0;
  while (n < count) {
    // On the hedge lines of the farmland texture (every third of a tile), away from the aerodrome.
    const along = (rand() - 0.5) * 8000;
    const line = (Math.floor(rand() * 24) - 12) * (FIELD_TILE / 6);
    const [x, z] = rand() < 0.5 ? [along, line] : [line, along];
    if (Math.abs(x) < AIRFIELD.size * 0.7 && Math.abs(z) < AIRFIELD.size * 0.7) continue;
    if (z > AIRFIELD.coastZ - 80) continue;
    const s = 0.7 + rand() * 0.8;
    m.makeScale(s, s, s).setPosition(x, 0, z);
    mesh.setMatrixAt(n, m);
    n += 1;
  }
  return mesh;
}

/** Everything above, as one group. */
export function buildAirfield() {
  const group = new THREE.Group();
  group.add(ground(), markings(), buildings(), trees());
  return group;
}
