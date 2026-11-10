// A second of one aircraft's poses on the server, tick by tick, for lag compensation: a round is tested against a
// target where the shooter saw it, a few hundred milliseconds ago. Poses are kept in a ring of preallocated objects.
// Dawn Patrol's src/mp/history.js (D243, with the product owner's approval), recording a velocity too: this game's
// hit test allows for the target's own motion over the step (src/weapons/projectiles.js).

import { Quaternion, Vector3 } from 'three';
import { POSE_HISTORY_TICKS } from './netConfig.js';

export class PoseHistory {
  constructor(size = POSE_HISTORY_TICKS) {
    this.size = size;
    this.ticks = new Array(size).fill(-1);
    this.poses = Array.from({ length: size }, () => ({ position: new Vector3(), quaternion: new Quaternion(), velocity: new Vector3() }));
    this.newest = -1;
    this.oldest = -1;
  }

  /** The pose after tick `tick` (a body: position, quaternion, velocity). */
  record(tick, body) {
    const k = tick % this.size;
    this.ticks[k] = tick;
    this.poses[k].position.copy(body.position);
    this.poses[k].quaternion.copy(body.quaternion);
    this.poses[k].velocity.copy(body.velocity);
    this.newest = tick;
    this.oldest = this.oldest < 0 ? tick : Math.max(this.oldest, tick - this.size + 1);
  }

  /** The pose at `tick`: the nearest kept one if that tick is not here; null if nothing is kept. */
  at(tick) {
    if (this.newest < 0) return null;
    const t = Math.max(this.oldest, Math.min(this.newest, tick));
    for (let b = 0; b < this.size; b += 1) {
      const k = (t - b) % this.size;
      if (k >= 0 && this.ticks[k] === t - b) return this.poses[k];
    }
    return this.poses[this.newest % this.size];
  }

  /** Forgets everything (a respawn: the old poses are somewhere else entirely). */
  clear() {
    this.ticks.fill(-1);
    this.newest = -1;
    this.oldest = -1;
  }
}
