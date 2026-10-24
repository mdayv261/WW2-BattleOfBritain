// From the pilot's inputs to control-surface positions.
//
// The pilot's stick and pedal positions are fractions (-1..1). How far a surface actually moves is
// limited by how hard the pilot can push: the force needed grows with dynamic pressure, so at high
// speed full stick moves the surface only part of the way. For each axis the stick force at full
// deflection is hinge x dynamic pressure (hinge in N per Pa), and the pilot's strength is capped
// (common.pilotMaxForce). This is what made the Spitfire's ailerons and the Bf 109's controls heavy.
//
// ControlInput fields (all optional):
//   pitch, roll, yaw: -1..1 (pitch +1 = stick back, roll +1 = right, yaw +1 = right rudder)
//   throttle 0..1, rpm 0..1 (constant-speed lever), pitchSwitch -1/0/+1 (VDM: +1 coarser)
//   trim -1..1, flaps 0/1, gear 0 (up) / 1 (down), radiator 0..1,
//   emergency (boost cut-out pulled), engineAssist (automatic rpm on the Bf 109)

import { common } from '../aircraft/common.js';
import { clamp } from './interp.js';

export function createSurfaces() {
  return { elevator: 0, aileron: 0, rudder: 0, trim: 0, flaps: 0, gear: 0, radiator: 0, slatLeft: 0, slatRight: 0 };
}

/** Fraction of full deflection the pilot can reach on one axis at dynamic pressure q. */
export function authority(hinge, maxForce, q) {
  return Math.min(1, maxForce / Math.max(hinge * q, 1e-9));
}

/** Moves a value toward a target at a fixed rate (units per second). */
function approach(value, target, rate, dt) {
  return value + clamp(target - value, -rate * dt, rate * dt);
}

/**
 * Updates the surface positions for one step.
 *   q: free-stream dynamic pressure (Pa); tailQ: dynamic pressure at the tail (includes slipstream).
 */
export function updateSurfaces(ac, s, input, { q, tailQ }, dt) {
  const c = ac.controls;
  const f = common.pilotMaxForce;
  s.elevator = clamp(input.pitch ?? 0, -1, 1) * authority(c.pitchHinge, f.pitch, tailQ);
  s.aileron = clamp(input.roll ?? 0, -1, 1) * authority(c.rollHinge, f.roll, q);
  s.rudder = clamp(input.yaw ?? 0, -1, 1) * authority(c.yawHinge, f.yaw, tailQ);
  s.trim = clamp(input.trim ?? 0, -1, 1);
  s.radiator = clamp(input.radiator ?? 0, 0, 1);
  s.flaps = approach(s.flaps, input.flaps ? 1 : 0, 1 / c.flapTime, dt);
  s.gear = approach(s.gear, input.gear ? 1 : 0, 1 / c.gearTime, dt);
  return s;
}

/** Bf 109 slats: each opens with its wing half's angle of attack (measured from zero lift). */
export function updateSlats(ac, s, alphaLeft, alphaRight, dt) {
  if (!ac.slats) {
    s.slatLeft = 0;
    s.slatRight = 0;
    return s;
  }
  const { openAlpha, fullAlpha, rate } = ac.slats;
  const target = (a) => clamp((a - openAlpha) / (fullAlpha - openAlpha), 0, 1);
  s.slatLeft = approach(s.slatLeft, target(alphaLeft), rate, dt);
  s.slatRight = approach(s.slatRight, target(alphaRight), rate, dt);
  return s;
}
