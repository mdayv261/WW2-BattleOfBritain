// Engine heat (Phase 5, D62): temperatures settle within the documented limits in a climb and a cruise, rise when the
// radiator is closed or the engine works hard on the ground, and too much heat, a lost coolant or over-revving wears
// the engine until it seizes. A seized engine gives no power and its airscrew stops.
import { describe, it, expect } from 'vitest';
import { aircraftList, aircraftById, engineFor } from '../../src/aircraft/index.js';
import { equilibrium, stepHeat, createHeat, coolantLimit, wearFactor } from '../../src/physics/cooling.js';
import { atmosphere } from '../../src/physics/atmosphere.js';
import { createAircraft, stepAircraft } from '../../src/physics/flightModel.js';
import { UNIT } from '../../src/core/constants.js';

const q = (v, h = 0) => 0.5 * atmosphere(h).density * v * v;
const disc = (ac) => (Math.PI * ac.propeller.diameter ** 2) / 4;
const slip = (ac, power, v) => (0.8 * power) / v / disc(ac);
const rated = (ac) => engineFor(ac).ratings.normal.cb[0][1];

/** Runs one engine's heat at steady conditions until it seizes or `limit` seconds pass; returns the seconds taken. */
function runUntilSeized(ac, heat, conditions, { limit = 1800, slipQ = 0, rpm = 2400, each } = {}) {
  const e = { heat, omega: rpm * UNIT.RPM, slipQ };
  let t = 0;
  while (!heat.seized && t < limit) {
    each?.(t, heat);
    stepHeat(ac, engineFor(ac), e, conditions, 0.1);
    t += 0.1;
  }
  return t;
}

describe('engine heat', () => {
  for (const ac of aircraftList) {
    describe(ac.id, () => {
      const en = engineFor(ac);
      const R = rated(ac);
      const { climb, cruise } = ac.cooling;

      it('settles within its limits climbing at full rated power, radiator open', () => {
        const t = equilibrium(ac, en, { altitude: 0, q: q(climb.eas), slipQ: slip(ac, R, climb.eas), power: R, radiator: 1 });
        expect(t.coolant).toBeLessThan(coolantLimit(en, 0));
        expect(t.oil).toBeLessThan(en.heat.oilLimit);
        expect(t.coolant).toBeGreaterThan(90);
      });

      it('settles within its limits cruising with the radiator closed', () => {
        const p = cruise.power * R;
        const t = equilibrium(ac, en, { altitude: 0, q: q(cruise.eas), slipQ: slip(ac, p, cruise.eas), power: p, radiator: 0 });
        expect(t.coolant).toBeLessThan(coolantLimit(en, 0) - 10);
      });

      it('runs hotter with the radiator closed', () => {
        const at = (radiator) => equilibrium(ac, en, { altitude: 0, q: q(climb.eas), slipQ: slip(ac, R, climb.eas), power: R, radiator });
        expect(at(0).coolant).toBeGreaterThan(at(1).coolant + 30);
        expect(at(0).coolant).toBeGreaterThan(coolantLimit(en, 0));
      });

      it('overheats and seizes at full power standing on the ground, but not idling', () => {
        const full = runUntilSeized(ac, createHeat(60, 40), { altitude: 0, q: 0, radiator: 1, power: R }, { slipQ: 10000 / disc(ac) });
        expect(full).toBeGreaterThan(120); // not instantly: the coolant takes time to heat
        expect(full).toBeLessThan(900);
        const idle = runUntilSeized(ac, createHeat(60, 40), { altitude: 0, q: 0, radiator: 1, power: 0.02 * R }, { slipQ: 30, rpm: 800 });
        expect(idle).toBeGreaterThanOrEqual(1800);
      });

      it('seizes about a minute after losing its coolant (the glycol leak of checkpoint 4)', () => {
        const p = cruise.power * R;
        const t = runUntilSeized(ac, createHeat(90, 80), { altitude: 0, q: q(100), radiator: 1, power: p }, {
          slipQ: slip(ac, p, 100), each: (time, h) => { h.coolantLeft = Math.max(0, 1 - time / 30); },
        });
        expect(t).toBeGreaterThan(30);
        expect(t).toBeLessThan(180);
      });

      it('wears out from over-revving past its diving limit, and not below it', () => {
        const cool = { altitude: 0, q: q(120), radiator: 1, power: 0.3 * R };
        const over = (en.heat.overRev / UNIT.RPM) + 300;
        expect(runUntilSeized(ac, createHeat(80, 70), cool, { rpm: over, limit: 60 })).toBeLessThan(15);
        expect(runUntilSeized(ac, createHeat(80, 70), cool, { rpm: en.heat.overRev / UNIT.RPM - 50, limit: 60 })).toBeGreaterThanOrEqual(60);
      });
    });
  }

  it('loses power only once worn past a third, and 60% by seizure', () => {
    expect(wearFactor({ wear: 0.2 })).toBe(1);
    expect(wearFactor({ wear: 1 })).toBeCloseTo(0.4, 6);
  });

  it('a seized engine gives no power and its airscrew stops in flight', () => {
    const ac = aircraftById.spitfire;
    const plane = createAircraft(ac, { altitude: 1500, speed: 110, throttle: 0.8 });
    const input = { throttle: 0.8, rpm: 0.8, pitch: 0, roll: 0, yaw: 0, trim: plane.trim, engines: [{}] };
    plane.engines[0].heat.seized = true;
    for (let t = 0; t < 5; t += 1 / 120) stepAircraft(plane, input, 1 / 120);
    expect(plane.last.power).toBe(0);
    expect(plane.engines[0].omega).toBeLessThan(1);
  });

  it('starts an air start at the temperatures of its flight, within the limits', () => {
    for (const ac of aircraftList) {
      const plane = createAircraft(ac, { altitude: 1500, speed: 110, throttle: 0.6 });
      const en = engineFor(ac);
      expect(plane.engines[0].heat.coolant).toBeLessThan(coolantLimit(en, 1500));
      expect(plane.engines[0].heat.coolant).toBeGreaterThan(40);
    }
  });
});
