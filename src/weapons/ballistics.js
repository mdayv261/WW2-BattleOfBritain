// The flight of a round (Phase 5, D67): gravity and air drag, with the drag coefficient against Mach number fitted to the
// round's sourced range table (src/aircraft/ammunition.js) and the ISA density and speed of sound at its height.
// Free of rendering, so the multiplayer server can run it too.

import { atmosphere } from '../physics/atmosphere.js';
import { interpPairs } from '../physics/interp.js';
import { G } from '../core/constants.js';

/** Drag deceleration factor k (1/m) of a round at an altitude and speed: dv/dt = -k |v| v. */
export function dragFactor(b, altitude, speed) {
  const air = atmosphere(altitude);
  const cd = interpPairs(b.drag, speed / air.soundSpeed);
  const area = (Math.PI * b.calibre * b.calibre) / 4;
  return (air.density * area * cd) / (2 * b.mass);
}

/**
 * Advances one round by dt: p and v are { x, y, z } (world, m and m/s), changed in place. The drag factor is worked out
 * at the start of the step (rounds are stepped at the 120 Hz physics rate, short enough for this to be accurate).
 */
export function stepRound(b, p, v, dt) {
  const speed = Math.hypot(v.x, v.y, v.z);
  const k = dragFactor(b, p.y, speed) * speed;
  v.x -= k * v.x * dt;
  v.y -= (k * v.y + G) * dt;
  v.z -= k * v.z * dt;
  p.x += v.x * dt;
  p.y += v.y * dt;
  p.z += v.z * dt;
}

/**
 * A round fired level at sea level from rest: its speed, time of flight and drop below the line of departure at each
 * range (m). For the tests (against the range tables) and the guns' harmonisation.
 */
export function flightTable(b, ranges, { dt = 1 / 1200, altitude = 0 } = {}) {
  const p = { x: 0, y: altitude, z: 0 };
  const v = { x: b.muzzleVelocity, y: 0, z: 0 };
  let t = 0;
  return [...ranges].sort((a, c) => a - c).map((range) => {
    while (p.x < range) {
      const before = { x: p.x, y: p.y, vx: v.x, vy: v.y };
      stepRound(b, p, v, dt);
      t += dt;
      if (p.x >= range) {
        // Back to exactly the range by linear interpolation within the step.
        const f = (range - before.x) / (p.x - before.x);
        return {
          range, time: t - dt * (1 - f), speed: Math.hypot(before.vx + (v.x - before.vx) * f, before.vy + (v.y - before.vy) * f),
          drop: altitude - (before.y + (p.y - before.y) * f),
        };
      }
    }
    return { range, time: t, speed: Math.hypot(v.x, v.y), drop: altitude - p.y };
  });
}
