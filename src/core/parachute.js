// Parachutists (Phase 6, D80): a man who has left his aircraft falls, pulls his ripcord after a count of three, his
// canopy opens over 1.6 s and he comes down at about 4.9 m/s (S42, the RAF's 24 ft Irvin; common.parachute). Free fall
// and the canopy are each air drag in proportion to the square of the speed, settling at their speed limit; both limits
// grow in thinner air (as the square root of the density ratio), so the figures hold at sea level. The canopy's drag
// grows smoothly while it opens. He lands on the ground or in the sea; one who reaches the ground before his canopy is
// open is killed. Free of rendering, so the multiplayer server could run it.

import { Vector3 } from 'three';
import { G } from './constants.js';
import { common } from '../aircraft/common.js';
import { atmosphere } from '../physics/atmosphere.js';

const SEA_LEVEL = atmosphere(0).density;

/**
 * A man leaving his aircraft at `position` with its `velocity` (both copied); `quaternion` is the aircraft's attitude
 * as he left (kept as `facing`, for the view that follows him).
 */
export function createJumper({ position, velocity, quaternion = null, side = 'RAF', label = '', player = false }) {
  return {
    position: position.clone(), velocity: velocity.clone(), facing: quaternion?.clone() ?? null, side, label, player,
    time: 0, state: 'falling', open: 0, landedAt: null,
  };
}

/** The speed limit (m/s) his drag settles at now: free fall, the canopy, or between while it opens; at height `y`. */
function limit(j, y) {
  const p = common.parachute;
  const thin = Math.sqrt(SEA_LEVEL / atmosphere(Math.max(y, 0)).density);
  // While the canopy opens its drag area grows from the man's to the canopy's: the limit moves between them geometrically.
  const free = p.freeFallMax;
  return free * (p.canopyRate / free) ** j.open * thin;
}

/** Advances a jumper by dt over `terrain` (surfaceAt(x, z) -> { height, water }). */
export function stepJumper(j, dt, terrain) {
  if (j.landedAt) return;
  const p = common.parachute;
  j.time += dt;
  if (j.time > p.pullDelay) {
    j.open = Math.min(1, (j.time - p.pullDelay) / p.openTime);
    j.state = j.open < 1 ? 'opening' : 'open';
  }
  // Gravity, then quadratic drag taken exactly over the step (stable even as the canopy bites).
  j.velocity.y -= G * dt;
  const v = j.velocity.length();
  const k = G / limit(j, j.position.y) ** 2;
  if (v > 0) j.velocity.multiplyScalar(1 / (1 + k * v * dt));
  j.position.addScaledVector(j.velocity, dt);
  const ground = terrain.surfaceAt(j.position.x, j.position.z);
  if (j.position.y <= ground.height) {
    j.position.y = ground.height;
    j.state = j.open < 1 ? 'killed' : ground.water ? 'sea' : 'landed';
    j.landedAt = j.time;
    j.velocity.set(0, 0, 0);
  }
}

const KEEP = 60; // s a landed jumper is kept (and drawn) after landing

/** Steps every jumper in `jumpers` and returns those still worth keeping. */
export function stepJumpers(jumpers, dt, terrain) {
  for (const j of jumpers) stepJumper(j, dt, terrain);
  return jumpers.filter((j) => j.player || !j.landedAt || j.time - j.landedAt < KEEP);
}

/** Where a crewman sitting at `seat` (body axes) is in the world, for an aircraft body. */
export function seatPosition(body, seat) {
  return new Vector3(seat.x, seat.y, seat.z).applyQuaternion(body.quaternion).add(body.position);
}
