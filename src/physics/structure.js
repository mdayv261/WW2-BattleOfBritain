// Structural limits (Phase 5, D62): the airframe's g limits and its diving speed limit, from each aircraft's `limits`.
//   - Past limits.g.damage the airframe is overstressed: the skin wrinkles and the aircraft carries more drag, in
//     proportion to how far towards limits.g.fail it went (the worst so far: the damage stays). At limits.g.fail the
//     wings fail. Negative g has limits a share (common.structure.negativeShare) of the positive ones (estimate).
//   - Past limits.diveEas the control surfaces flutter: damage builds up with the time and the excess speed, and costs
//     them their effect, until they are torn away.
// The damage state is shared with the hits of checkpoint 4 (src/weapons).

import { common } from '../aircraft/common.js';
import { clamp } from './interp.js';

/** A fresh damage state: airframe and flutter from 0 (none) to 1 (failed); `failed` is { cause } once it breaks up. */
export function createDamage() {
  return { airframe: 0, flutter: 0, failed: null };
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

/** The control surfaces as they act after flutter damage: the same object when there is none. */
export function damagedSurfaces(surfaces, damage) {
  if (!damage?.flutter) return surfaces;
  const left = 1 - common.structure.flutterLoss * damage.flutter;
  const torn = damage.flutter >= 1 ? 0 : left;
  return { ...surfaces, aileron: surfaces.aileron * torn, elevator: surfaces.elevator * torn, rudder: surfaces.rudder * torn };
}

/** Extra drag coefficient of a damaged airframe (wrinkled skin; torn-away control surfaces). */
export function damageDrag(ac, damage) {
  if (!damage) return 0;
  const s = common.structure;
  return ac.aero.cd0 * (s.airframeDrag * damage.airframe + (damage.flutter >= 1 ? s.tornSurfaceDrag : 0));
}
