// Rounds in flight as the eye would see them by day (Phase 5, D67): the 20 mm tracer shells as short bright streaks, the
// RAF's old-type incendiary as grey smoke trails (Dowding's "smoke-tracer effect", S38), every other round unseen. Each
// trail lasts its round's burn time (src/aircraft/ammunition.js). Drawn as line segments in two pooled buffers.

import * as THREE from 'three';
import { roundTypes } from '../aircraft/ammunition.js';

const MAX = 3000; // segments of each kind drawn at once
const STREAK = 0.025; // s: a tracer's streak is the path it covers in this time (display choice)
const SMOKE = 150; // m: the longest smoke trail drawn behind a round (display choice)

function segments(colour, opacity, blending) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 6), 3));
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity, blending, depthWrite: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  return lines;
}

export class ProjectileView {
  constructor(scene) {
    this.tracers = segments(0xfff2c8, 1, THREE.AdditiveBlending);
    this.smoke = segments(0xb8b8b2, 0.55, THREE.NormalBlending);
    scene.add(this.tracers, this.smoke);
  }

  /** Redraws the trails of the rounds in `projectiles` (src/weapons/projectiles.js). */
  update(projectiles) {
    let nt = 0;
    let ns = 0;
    const tp = this.tracers.geometry.attributes.position.array;
    const sp = this.smoke.geometry.attributes.position.array;
    for (const r of projectiles.live) {
      const type = roundTypes[r.kind];
      if (!type?.shows || r.age > type.burn) continue;
      const { p, v } = r;
      if (type.shows === 'tracer' && nt < MAX) {
        tp.set([p.x, p.y, p.z, p.x - v.x * STREAK, p.y - v.y * STREAK, p.z - v.z * STREAK], nt * 6);
        nt += 1;
      } else if (type.shows === 'smoke' && ns < MAX) {
        // The smoke stays where it was laid: from the round back along its path, towards where it was fired.
        const back = Math.min(1, SMOKE / Math.max(1, Math.hypot(p.x - r.start.x, p.y - r.start.y, p.z - r.start.z)));
        sp.set([p.x, p.y, p.z, p.x + (r.start.x - p.x) * back, p.y + (r.start.y - p.y) * back, p.z + (r.start.z - p.z) * back], ns * 6);
        ns += 1;
      }
    }
    this.tracers.geometry.setDrawRange(0, nt * 2);
    this.smoke.geometry.setDrawRange(0, ns * 2);
    this.tracers.geometry.attributes.position.needsUpdate = true;
    this.smoke.geometry.attributes.position.needsUpdate = true;
  }
}

export const FLASH_AHEAD = 0.1; // m: a muzzle flash is drawn this far ahead of its muzzle, along the bore
export const FLASH_SIZE = { mg: 0.06, cannon: 0.25 }; // m: radius of the flash ball (display choice)

/** Muzzle flashes for an aircraft's guns: small glowing balls at the muzzles, shown just after each round (D67). */
export function buildMuzzleFlashes(armament) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flashes = armament.map((gun) => {
    const size = FLASH_SIZE[gun.group];
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6), material);
    mesh.position.copy(gun.position).addScaledVector(gun.bore, FLASH_AHEAD);
    mesh.visible = false;
    group.add(mesh);
    return { gun, mesh };
  });
  /** Shows each gun's flash for a moment after it fires, at simulation time `now`. */
  const update = (now) => {
    for (const f of flashes) f.mesh.visible = now - f.gun.lastShot < 0.03;
  };
  return { group, update };
}
