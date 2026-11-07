// What a fighter pilot knows of his own aircraft and the enemy's (Phase 6, D217): the best steady climb and the top
// level speed at full throttle, full rpm and the emergency rating where the engine has one (the Merlin's +12 lb), at a
// height. Read from the same flight model (src/physics/performance.js) as the validation, so that a Bf 109 chooses its
// escape by what each aircraft can really do: it climbs away only from an enemy that climbs worse, and extends only
// from one that is slower. Worked out coarsely (a few milliseconds, not the validation's fine search) and kept per type
// and BAND of height, so that no frame waits long for it.

import { steadyFlight } from '../physics/performance.js';

const BAND = 1000; // m
const CLIMB_SPEEDS = [55, 65, 75, 85, 95, 105]; // m/s (true): where the fighters' best climbs lie
const SPEED_STEPS = 12; // halvings of the search for the top speed, between 50 and 260 m/s

const cache = new Map();

/** { climb (m/s), speed (m/s, true) } of `ac` at full combat power near `altitude` (m). */
export function combatPerformance(ac, altitude) {
  const band = Math.max(0, Math.round(altitude / BAND));
  const key = `${ac.id}:${band}`;
  let p = cache.get(key);
  if (!p) {
    const setting = { speed: ac.propeller.rpmMax, throttle: 1, emergency: true };
    const h = band * BAND;
    const climb = Math.max(...CLIMB_SPEEDS.map((v) => steadyFlight(ac, setting, h, v)?.climbRate ?? -Infinity));
    let lo = 50;
    let hi = 260;
    for (let i = 0; i < SPEED_STEPS; i += 1) {
      const mid = 0.5 * (lo + hi);
      if ((steadyFlight(ac, setting, h, mid)?.spare ?? -1) >= 0) lo = mid;
      else hi = mid;
    }
    p = { climb, speed: lo };
    cache.set(key, p);
  }
  return p;
}
