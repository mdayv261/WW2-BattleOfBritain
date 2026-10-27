// Structural limits (Phase 5, D62): the airframe's g limits and its diving speed limit, from each aircraft's `limits`.
//   - Past limits.g.damage the airframe is overstressed: the skin wrinkles and the aircraft carries more drag, in
//     proportion to how far towards limits.g.fail it went (the worst so far: the damage stays). At limits.g.fail the
//     wings fail. Negative g has limits a share (common.structure.negativeShare) of the positive ones (estimate).
//   - Past limits.diveEas the control surfaces flutter: damage builds up with the time and the excess speed, and costs
//     them their effect, until they are torn away.
// The damage state is shared with the hits of checkpoint 4 (src/weapons).

import { common } from '../aircraft/common.js';
import { clamp } from './interp.js';

/**
 * A fresh damage state. Structural: airframe and flutter from 0 (none) to 1 (failed). From hits (src/weapons/damage.js):
 * each wing half's [inner, outer] panel damage (left first), the controls' remaining effect, the tail structure, the
 * pilot's health, a fire, jammed flaps or undercarriage, and a log of recent hits. `failed` is { cause } once the
 * aircraft breaks up or its pilot is killed.
 */
export function createDamage() {
  return {
    airframe: 0, flutter: 0, failed: null,
    hits: 0, log: [], wing: [[0, 0], [0, 0]], controls: { aileron: 1, elevator: 1, rudder: 1 }, tail: 0, pilot: 1,
    fire: null, gearJammed: false, flapsJammed: false,
  };
}

/** True when nothing has changed the control surfaces or the wing panels (the flight model is then untouched). */
function surfacesIntact(d) {
  return !d.flutter && d.controls.aileron === 1 && d.controls.elevator === 1 && d.controls.rudder === 1
    && d.wing[0][0] === 0 && d.wing[0][1] === 0 && d.wing[1][0] === 0 && d.wing[1][1] === 0;
}

/** Advances the structural damage for the loads of this step (loadFactor in g, eas in m/s). */
export function stepStructure(plane, { loadFactor, eas }, dt) {
  const { limits } = plane.ac;
  const d = plane.damage;
  if (!limits || d.failed) return;
  const share = loadFactor >= 0 ? 1 : common.structure.negativeShare;
  const n = Math.abs(loadFactor);
  const from = limits.g.damage * share;
  const to = limits.g.fail * share;
  if (n > from) d.airframe = Math.max(d.airframe, clamp((n - from) / (to - from), 0, 1));
  if (n >= to) d.failed = { cause: `The wings failed at ${loadFactor.toFixed(1)} g` };

  if (limits.diveEas && eas > limits.diveEas) {
    const s = common.structure;
    d.flutter = Math.min(1, d.flutter + ((eas / limits.diveEas - 1) / s.flutterSpan / s.flutterLife) * dt);
  }
}

/**
 * The control surfaces as they act after damage: flutter, and hits on the controls (their remaining effect), with the
 * wing panels' damage passed on to the aerodynamics. The same object when nothing is damaged.
 */
export function damagedSurfaces(surfaces, damage) {
  if (!damage || surfacesIntact(damage)) return surfaces;
  const fluttered = damage.flutter >= 1 ? 0 : 1 - common.structure.flutterLoss * damage.flutter;
  const c = damage.controls;
  return {
    ...surfaces,
    aileron: surfaces.aileron * fluttered * c.aileron,
    elevator: surfaces.elevator * fluttered * c.elevator,
    rudder: surfaces.rudder * fluttered * c.rudder,
    wingDamage: damage.wing,
  };
}

/** Extra drag coefficient of a damaged airframe (wrinkled skin; torn-away control surfaces). */
export function damageDrag(ac, damage) {
  if (!damage) return 0;
  const s = common.structure;
  return ac.aero.cd0 * (s.airframeDrag * damage.airframe + (damage.flutter >= 1 ? s.tornSurfaceDrag : 0));
}
