// Sourced performance figures (docs/FLIGHT_VALIDATION.md). Tolerances are the proposed Phase 1
// acceptance test. Known deviations are listed with their reasons and must stay outside tolerance
// (so a fix is noticed and the list updated).
import { describe, it, expect } from 'vitest';
import { validateAircraft } from '../../src/physics/validation.js';
import { UNIT } from '../../src/core/constants.js';

const TOLERANCE = { speed: 0.05, climbTime: 0.10, ceiling: 0.05, roll: 0.15 };
const STALL_TOLERANCE = 5 * UNIT.MPH;
const CALIBRATION_TOLERANCE = 0.01;

// id|kind|altitude: reason. See docs/FLIGHT_VALIDATION.md.
const KNOWN = {
  'spitfire|climbTime|9144': 'climbs too slowly at altitude (propeller data from a narrower NACA propeller)',
  'spitfire|ceiling|': 'ceiling about 7% low, same cause',
  'bf109e4|climbTime|2000': 'specification climb (S17) faster than the model; rating of the specification not stated',
  'bf109e4|climbTime|4000': 'as above; the Rechlin figure (S22) agrees within 4%',
  'bf109e4|climbTime|5000': 'as above',
  'bf109e4|climbTime|6000': 'as above',
};

for (const id of ['spitfire', 'hurricane', 'bf109e4']) {
  describe(`validation: ${id}`, () => {
    const rows = validateAircraft(id);
    for (const r of rows) {
      const key = `${id}|${r.kind}|${r.altitude ?? ''}`;
      const name = `${r.source} ${r.kind} ${r.altitude ?? ''}${r.flaps ? ' flaps down' : ''}${r.stickForce ? ' 30 lb' : ''}`;
      const within = r.kind === 'stall'
        ? Math.abs(r.model - r.value) <= STALL_TOLERANCE
        : Math.abs(r.error) <= (r.calibration ? CALIBRATION_TOLERANCE : TOLERANCE[r.kind]);
      if (KNOWN[key] && r.source !== 'S22') {
        it(`${name}: known deviation (${KNOWN[key]})`, () => expect(within).toBe(false));
      } else {
        it(`${name}: within tolerance (error ${(r.error * 100).toFixed(1)}%)`, () => expect(within).toBe(true));
      }
    }
  });
}
