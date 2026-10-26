// The rounds in flight (Phase 5, D67): stepped at the fixed physics rate with gravity and drag (ballistics.js), removed
// when they reach the ground or after MAX_AGE. Each keeps its kind and who fired it, for the tracers and, in checkpoint
// 4, for hits. Free of rendering, so the multiplayer server can run it.

import { ballistics } from '../aircraft/ammunition.js';
import { stepRound } from './ballistics.js';

const MAX_AGE = 5; // s: by then a round has fallen far below any useful range (about 1.5-2 km)

export class Projectiles {
  constructor() {
    this.live = [];
  }

  /** Adds a round: { position, velocity } (world, Vector3), ballistics key, kind, owner. */
  spawn({ position, velocity, ballistics: key, kind }, owner = null) {
    this.live.push({
      p: { x: position.x, y: position.y, z: position.z },
      v: { x: velocity.x, y: velocity.y, z: velocity.z },
      start: { x: position.x, y: position.y, z: position.z },
      b: ballistics[key], kind, owner, age: 0,
    });
  }

  /** Advances every round by dt; drops those that hit the ground (terrain.surfaceAt) or grow too old. */
  step(dt, terrain) {
    const keep = [];
    for (const r of this.live) {
      stepRound(r.b, r.p, r.v, dt);
      r.age += dt;
      if (r.age > MAX_AGE) continue;
      if (terrain && r.p.y < terrain.surfaceAt(r.p.x, r.p.z).height) continue;
      keep.push(r);
    }
    this.live = keep;
  }

  clear() {
    this.live = [];
  }
}
