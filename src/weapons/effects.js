// What a damaged aircraft gives off, for the visible effects (Phase 5 checkpoint 5, D69): read from its damage state,
// placed in its hit zones (src/weapons/hitZones.js) so a trail starts where the hits went in.
//   glycol       white vapour while the coolant leaks, or boils off past its limit (common.engineWear.boilMargin), from
//                under the radiator's zone (systems.coolant)
//   oil          a thin dark trail while the oil leaks, from under the oil cooler's zone (systems.oil)
//   engineSmoke  from the engine or nacelle when it is badly worn or seized
//   fire         flames and black smoke from under the zone where the fire started (outside the skin, where it shows)
// Free of rendering: src/render/effects.js turns these into particles.

import { Vector3 } from 'three';
import { zonesFor } from './hitZones.js';
import { coolantLimit } from '../physics/cooling.js';
import { common } from '../aircraft/common.js';

// Display threshold (D69): smoke shows from this much engine wear, and grows to full at seizure.
const SMOKE_FROM_WEAR = 0.3;

const centre = (z) => new Vector3().addVectors(z.min, z.max).multiplyScalar(0.5);
const under = (z) => centre(z).setY(z.min.y);
const above = (z) => centre(z).setY(z.max.y);

/** The zones named in one of an aircraft's systems (coolant or oil) that serve engine `i`. */
function systemZones(ac, system, i) {
  const { zones } = zonesFor(ac);
  return Object.entries(ac.systems?.[system] ?? {})
    .filter(([, engine]) => engine === i)
    .map(([name]) => zones.find((z) => z.name === name))
    .filter(Boolean);
}

/** The zone of engine i: the nose section of a single, the nacelle of a twin. */
const engineZone = (ac, i) => zonesFor(ac).zones.find((z) => z.kind === 'engine' && z.engine === i);

/** How strongly (0-1) engine `e` smokes: from wear past SMOKE_FROM_WEAR, fully once seized. */
export function engineSmoke(e) {
  if (e.heat.seized) return 1;
  return Math.min(1, Math.max(0, e.heat.wear - SMOKE_FROM_WEAR) / (1 - SMOKE_FROM_WEAR));
}

/** Whether engine `e`'s coolant is boiling off (the heat model's boilMargin past its limit), venting vapour. */
export function boiling(plane, e) {
  return e.heat.coolantLeft > 0 && e.heat.coolant > coolantLimit(plane.engine, plane.body.position.y) + common.engineWear.boilMargin;
}

/** The emitters on an aircraft now: [{ type, point (body axes, Vector3), strength (0-1) }]; none when undamaged. */
export function damageSources(plane) {
  const { ac } = plane;
  const out = [];
  plane.engines.forEach((e, i) => {
    const h = e.heat;
    if ((h.coolantLeak > 0 && h.coolantLeft > 0) || boiling(plane, e)) {
      for (const z of systemZones(ac, 'coolant', i)) out.push({ type: 'glycol', point: under(z), strength: Math.min(1, h.coolantLeft * 2) });
    }
    if (h.oilLeak > 0 && h.oilLeft > 0) {
      for (const z of systemZones(ac, 'oil', i)) out.push({ type: 'oil', point: under(z), strength: Math.min(1, h.oilLeft * 2) });
    }
    const smoke = engineSmoke(e);
    const zone = engineZone(ac, i);
    if (smoke > 0 && zone) out.push({ type: 'engineSmoke', point: above(zone), strength: smoke });
  });
  const fire = plane.damage.fire;
  if (fire) {
    const zone = zonesFor(ac).zones.find((z) => z.name === fire.zone) ?? engineZone(ac, 0);
    if (zone) out.push({ type: 'fire', point: under(zone), strength: 1 });
  }
  return out;
}
