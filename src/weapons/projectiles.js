// The rounds in flight (Phase 5, D67): stepped at the fixed physics rate with gravity and drag (ballistics.js), removed
// when they reach the ground or after MAX_AGE. Each keeps its kind and who fired it, for the tracers and, in checkpoint
// 4, for hits. Free of rendering, so the multiplayer server can run it.

import { Vector3 } from 'three';
import { ballistics } from '../aircraft/ammunition.js';
import { stepRound } from './ballistics.js';
import { firstHit } from './hitZones.js';

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

  /**
   * Advances every round by dt; drops those that hit the ground (terrain.surfaceAt) or grow too old. `targets` are the
   * aircraft rounds can hit: [{ who, plane }]; a round never hits the `who` that fired it. For each hit, onHit(target,
   * { zone, kind, velocity (relative to the aircraft) }) is called and the round removed (D68).
   */
  step(dt, terrain, targets = [], onHit = () => {}) {
    const keep = [];
    const from = new Vector3();
    const to = new Vector3();
    for (const r of this.live) {
      from.set(r.p.x, r.p.y, r.p.z);
      stepRound(r.b, r.p, r.v, dt);
      r.age += dt;
      if (r.age > MAX_AGE) continue;
      if (terrain && r.p.y < terrain.surfaceAt(r.p.x, r.p.z).height) continue;
      to.set(r.p.x, r.p.y, r.p.z);
      const struck = this.strike(r, from, to, targets, dt);
      if (struck) {
        onHit(struck.target, struck.hit);
        continue;
      }
      keep.push(r);
    }
    this.live = keep;
  }

  /** The first aircraft a round hits between two points over a step of dt, with the hit, or null. */
  strike(r, from, to, targets, dt) {
    let best = null;
    for (const target of targets) {
      if (target.who === r.owner || !target.plane) continue;
      // Test the path relative to the aircraft, which moved during the step too: seen from where the aircraft is now,
      // the round started its step displaced by the aircraft's own motion over the step.
      const body = target.plane.body;
      const start = from.clone().addScaledVector(body.velocity, dt);
      const hit = firstHit(target.plane.ac, body, start, to);
      if (hit && (!best || hit.at < best.hit.at)) best = { target, hit };
    }
    if (!best) return null;
    const { body } = best.target.plane;
    const velocity = new Vector3(r.v.x, r.v.y, r.v.z).sub(body.velocity);
    return { target: best.target, hit: { zone: best.hit.zone, point: best.hit.point, kind: r.kind, velocity } };
  }

  clear() {
    this.live = [];
  }
}
