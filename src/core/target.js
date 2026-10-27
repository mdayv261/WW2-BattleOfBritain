// The target aircraft (Phase 5, D68): a test aid the product owner asked for (D59). It appears ahead of the player at the
// same height and heading, cruising at its level speed for common.target.throttle, and flies straight and level on its
// autopilot (src/core/autopilot.js) with its own full flight model. It doesn't fight or dodge. Hits damage it like any
// aircraft (src/weapons/damage.js); a killed pilot leaves its controls where they were.

import { Vector3 } from 'three';
import { createAircraft, stepAircraft } from '../physics/flightModel.js';
import { topSpeed } from '../physics/performance.js';
import { engineFor } from '../aircraft/index.js';
import { common } from '../aircraft/common.js';
import { createAutopilot, flyAutopilot, attitude } from './autopilot.js';
import { seededRandom } from '../weapons/random.js';

/** The target's cruising speed (m/s, true): its level speed at the target throttle, at that height. */
export function cruiseSpeed(ac, altitude) {
  const pr = ac.propeller;
  const speed = pr.type === 'constantSpeed' ? pr.rpmMax : engineFor(ac).refSpeed;
  return topSpeed(ac, { speed, throttle: common.target.throttle }, altitude) || 90;
}

export class TargetAircraft {
  /** A target of type `ac` ahead of the `player` plane, in `world`; `seed` sets its damage dice. */
  constructor(ac, player, world, seed = 1) {
    const { heading } = attitude(player);
    const ahead = new Vector3(Math.sin(heading), 0, -Math.cos(heading)).multiplyScalar(common.target.distance);
    const at = player.body.position.clone().add(ahead);
    const ground = world.terrain.surfaceAt(at.x, at.z).height;
    const altitude = Math.max(player.body.position.y, ground + common.target.minHeight);
    const speed = cruiseSpeed(ac, altitude);
    this.ac = ac;
    this.plane = createAircraft(ac, { altitude, speed, heading, throttle: common.target.throttle, x: at.x, z: at.z, terrain: world.terrain });
    this.input = {
      throttle: common.target.throttle, rpm: 0.8, pitch: 0, roll: 0, yaw: 0, trim: this.plane.trim,
      engines: ac.engines ? [{}, {}] : [{}],
    };
    this.autopilot = createAutopilot({ altitude, heading, speed });
    this.random = seededRandom(seed);
    this.previous = { position: this.plane.body.position.clone(), quaternion: this.plane.body.quaternion.clone() };
    this.destroyed = null; // { cause } once it breaks up, its pilot is killed or it reaches the ground
  }

  /** Advances the target by dt: the autopilot flies it while its pilot lives. */
  step(dt) {
    if (this.destroyed) return;
    this.previous.position.copy(this.plane.body.position);
    this.previous.quaternion.copy(this.plane.body.quaternion);
    if (this.plane.damage.pilot > 0) flyAutopilot(this.autopilot, this.plane, this.input, dt);
    stepAircraft(this.plane, this.input, dt);
    const { failed } = this.plane.damage;
    const crash = this.plane.ground.crash;
    if (failed || crash) this.destroyed = { cause: failed?.cause ?? crash.cause };
  }
}
