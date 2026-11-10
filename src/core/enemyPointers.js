// Enemy pointers (D235): where each enemy aircraft within POINTER_RANGE lies, for the red arrowheads along the top of
// the screen (src/ui/enemyPointers.js), the product owner's game aid, switched in the settings. The bearing is taken on
// the horizontal from the aircraft's heading, as the radar's (D230): 0 dead ahead, ±1 dead astern (- to the left).
// True positions, with no delay: an aid, not period equipment (game design).

import { Vector3 } from 'three';
import { bearingOf, relative } from './radarPlot.js';

export const POINTER_RANGE = 5000; // m: enemies further than this aren't shown

const _nose = new Vector3();

/** The enemies to point at: [{ x (-1 to 1), above, range, nearest }], the nearest last. */
export function enemyPointers(sim) {
  const { body } = sim.plane;
  _nose.set(1, 0, 0).applyQuaternion(body.quaternion);
  const heading = bearingOf(_nose.x, _nose.z);
  const side = sim.ac.side;
  const out = [];
  for (const c of sim.others) {
    if (!c.side || c.side === side || c.abandoned || !c.alive) continue;
    const p = c.plane.body.position;
    const range = p.distanceTo(body.position);
    if (range > POINTER_RANGE) continue;
    const r = relative(bearingOf(p.x - body.position.x, p.z - body.position.z), heading); // 0-360, clockwise
    out.push({ x: (r > 180 ? r - 360 : r) / 180, above: p.y > body.position.y, range, nearest: false });
  }
  out.sort((a, b) => b.range - a.range);
  if (out.length) out[out.length - 1].nearest = true;
  return out;
}
