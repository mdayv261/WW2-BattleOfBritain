// Solving the fixed rigging (D25, D73): the roll rigging against engine torque (aero.rollRig) and the fin offset or
// ground-set tab against slipstream swirl (aero.yawRig) that let an aircraft fly straight hands-off at the air start
// (1,500 m, 110 m/s, at the throttle that holds it level), as a rigger sets a real aircraft for its cruise. They are
// found with the full flight model: the two values that leave no roll or yaw building up from the start. Used by
// scripts/fitRig.mjs and tests/physics/rigging.test.js.

import { Vector3 } from 'three';
import { Simulation } from '../core/simulation.js';

const DT = 1 / 120;

/** The aircraft's roll and yaw rates (body p and r, rad/s) `seconds` after the air start with the given rigging. */
export function driftRates(ac, rollRig, yawRig, seconds = 2) {
  const keep = { rollRig: ac.aero.rollRig, yawRig: ac.aero.yawRig };
  ac.aero.rollRig = rollRig;
  ac.aero.yawRig = yawRig;
  try {
    const sim = new Simulation(ac, 'air');
    for (let t = 0; t < seconds - 1e-9; t += DT) sim.step(DT);
    const w = sim.plane.body.angularVelocity;
    return [w.x, -w.y];
  } finally {
    Object.assign(ac.aero, keep);
  }
}

/**
 * The rollRig and yawRig that zero the roll and yaw rates building up from the air start (Newton's method on the two
 * rates, with finite-difference slopes; the rates are close to linear in the rigging).
 */
export function solveRig(ac, { seconds = 2, iterations = 6 } = {}) {
  let x = [ac.aero.rollRig, ac.aero.yawRig];
  const h = 1e-4;
  for (let n = 0; n < iterations; n += 1) {
    const f = driftRates(ac, x[0], x[1], seconds);
    const fr = driftRates(ac, x[0] + h, x[1], seconds);
    const fy = driftRates(ac, x[0], x[1] + h, seconds);
    // Jacobian columns: the change in [p, r] per unit of each rig value.
    const a = (fr[0] - f[0]) / h;
    const b = (fy[0] - f[0]) / h;
    const c = (fr[1] - f[1]) / h;
    const d = (fy[1] - f[1]) / h;
    const det = a * d - b * c;
    const dx = [(d * -f[0] - b * -f[1]) / det, (a * -f[1] - c * -f[0]) / det];
    x = [x[0] + dx[0], x[1] + dx[1]];
    if (Math.abs(dx[0]) < 1e-7 && Math.abs(dx[1]) < 1e-7) break;
  }
  return { rollRig: x[0], yawRig: x[1] };
}

/** Bank and heading change (rad) after `seconds` hands-off from the air start, with the aircraft's own rigging. */
export function handsOffDrift(ac, seconds = 30) {
  const sim = new Simulation(ac, 'air');
  const nose0 = new Vector3(1, 0, 0).applyQuaternion(sim.plane.body.quaternion);
  for (let t = 0; t < seconds - 1e-9; t += DT) sim.step(DT);
  const q = sim.plane.body.quaternion;
  const right = new Vector3(0, 0, 1).applyQuaternion(q);
  const nose = new Vector3(1, 0, 0).applyQuaternion(q);
  const heading = Math.atan2(nose0.x * nose.z - nose0.z * nose.x, nose0.x * nose.x + nose0.z * nose.z);
  return { bank: -Math.asin(right.y), heading };
}
