// Sourced performance figures (docs/FLIGHT_VALIDATION.md). Tolerances are the Phase 1 acceptance test,
// and the proposed Phase 2 one for take-offs and landings. Known deviations are listed with their reasons
// and must stay outside tolerance (so a fix is noticed and the list updated).
import { describe, it, expect } from 'vitest';
import { validateAircraft } from '../../src/physics/validation.js';
import { UNIT } from '../../src/core/constants.js';

const TOLERANCE = {
  bankTime: 0.15, speed: 0.05, climbTime: 0.10, ceiling: 0.05, roll: 0.15, takeoffRun: 0.15, takeoffScreen: 0.15, landingRun: 0.15, landingScreen: 0.15,
};
const STALL_TOLERANCE = 5 * UNIT.MPH;
const CALIBRATION_TOLERANCE = 0.01;

// id|kind|altitude (or id|kind|label): reason. See docs/FLIGHT_VALIDATION.md.
const KNOWN = {
  'spitfire|ceiling|': 'ceiling about 7% low even with the blade-width correction (D24)',
  'spitfire|roll|full': 'full-aileron roll 15% below NACA once the 30 lb roll is matched (D26)',
  'hurricane|ceiling|Data sheet, mean weight ceiling': 'about 5% low (the maximum-weight ceiling is within 4%)',
  'bf109e4|climbTime|2000': 'specification climb (S17) faster than the model; rating of the specification not stated',
  'bf109e4|climbTime|4000': 'as above; the Rechlin figure (S22) agrees within 4%',
  'bf109e4|climbTime|5000': 'as above',
  'bf109e4|climbTime|6000': 'as above',
  'spitfire|bankTime|3048': 'RAE time to 45 degrees at 400 mph (4 s) about three times the model\'s 1.2 s (D30)',
  'bf109e4|bankTime|3048': 'as for the Spitfire: the 109 is fitted to roll like the model\'s Spitfire there, as S32 found (D30)',
  // Phase 2 take-offs and landings (scripted pilot, D29).
  'spitfire|takeoffScreen|': 'climb to 50 ft too long: the model lifts off close to its (NACA) stalling speed',
  'spitfire|landingRun|': 'landing run too long: the wing still carries most of the weight for the first part of the run',
  'bf109e4|takeoffRun|': 'ground run too short: the scripted pilot lifts off near the stall; the 109 was held on the ground (S32)',
  'bf109e4|takeoffScreen|': 'as above',
  // Phase 3: the Bf 110 against its data sheet (S23), FLIGHT_VALIDATION.md item 14.
  'bf110c4|climbTime|1000': 'data sheet climb faster low down; its engine rating is not stated (30-minute rating assumed)',
  'bf110c4|climbTime|2000': 'as above',
  'bf110c4|ceiling|': 'model ceiling 6.6% above the data sheet\'s 9,500 m, with the span efficiency lowered to 0.7 (D37)',
};

for (const id of ['spitfire', 'hurricane', 'bf109e4', 'bf110c4']) {
  describe(`validation: ${id}`, () => {
    const rows = validateAircraft(id);
    for (const r of rows) {
      const key = r.fullDeflection ? `${id}|${r.kind}|full`
        : KNOWN[`${id}|${r.kind}|${r.label}`] ? `${id}|${r.kind}|${r.label}` : `${id}|${r.kind}|${r.altitude ?? ''}`;
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
