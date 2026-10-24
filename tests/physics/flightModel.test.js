import { describe, it, expect } from 'vitest';
import { createAircraft, stepAircraft } from '../../src/physics/flightModel.js';
import { spitfire } from '../../src/aircraft/spitfire.js';
import { hurricane } from '../../src/aircraft/hurricane.js';
import { bf109e4 } from '../../src/aircraft/bf109e4.js';
import { UNIT } from '../../src/core/constants.js';

const DT = 1 / 120;
const fly = (plane, input, seconds, each) => {
  for (let t = 0; t < seconds; t += DT) {
    stepAircraft(plane, input, DT);
    each?.(plane);
  }
  return plane;
};

describe('flight model', () => {
  it('flies 30 s hands-off from trimmed level flight without diverging', () => {
    for (const ac of [hurricane, spitfire, bf109e4]) {
      const plane = createAircraft(ac, { altitude: 3000, speed: 110, throttle: 0.8, rpm: 0.8 });
      const input = { throttle: 0.8, rpm: 0.8, trim: plane.trim, engineAssist: true };
      fly(plane, input, 30);
      const d = plane.last;
      expect(Number.isFinite(d.altitude)).toBe(true);
      expect(Math.abs(d.altitude - 3000)).toBeLessThan(800);
      expect(d.airspeed).toBeGreaterThan(60);
      expect(d.airspeed).toBeLessThan(200);
    }
  });

  it('holds the constant-speed lever setting with the governor', () => {
    const plane = createAircraft(spitfire, { altitude: 2000, speed: 120, throttle: 1, rpm: 1 });
    fly(plane, { throttle: 1, rpm: 1, trim: plane.trim }, 6);
    expect(plane.omega / UNIT.RPM).toBeCloseTo(3000, -2);
    fly(plane, { throttle: 1, rpm: 0.5, trim: plane.trim }, 8);
    expect(plane.omega / UNIT.RPM).toBeCloseTo(2400, -2);
  });

  it('lets the Bf 109 pilot change rpm with the pitch switch', () => {
    const plane = createAircraft(bf109e4, { altitude: 2000, speed: 120, throttle: 1 });
    fly(plane, { throttle: 1, trim: plane.trim }, 2);
    const before = plane.omega;
    fly(plane, { throttle: 1, trim: plane.trim, pitchSwitch: 1 }, 2); // coarser
    expect(plane.omega).toBeLessThan(before - 5 * UNIT.RPM);
  });

  it('cuts the Merlin under negative g but not the DB 601', () => {
    for (const [ac, cuts] of [[spitfire, true], [bf109e4, false]]) {
      const plane = createAircraft(ac, { altitude: 3000, speed: 120, throttle: 1, rpm: 1 });
      const input = { throttle: 1, rpm: 1, trim: plane.trim, pitch: -1, engineAssist: true };
      let minFactor = 1;
      let minG = 1;
      fly(plane, input, 1.5, (p) => {
        minFactor = Math.min(minFactor, p.cutout.factor);
        minG = Math.min(minG, p.last.loadFactor);
      });
      expect(minG).toBeLessThan(0);
      if (cuts) expect(minFactor).toBeLessThan(0.1);
      else expect(minFactor).toBe(1);
    }
  });

  it('stalls with full back stick at low speed and idle power', () => {
    const plane = createAircraft(hurricane, { altitude: 2000, speed: 60, throttle: 0.1, rpm: 1 });
    let stalled = 0;
    fly(plane, { throttle: 0, rpm: 1, trim: plane.trim, pitch: 1 }, 4, (p) => {
      stalled = Math.max(stalled, p.last.stalledLeft, p.last.stalledRight);
    });
    expect(stalled).toBeGreaterThan(0.5);
  });

  it('gets heavier on the controls at high speed (less aileron for full stick)', () => {
    const slow = createAircraft(spitfire, { altitude: 3000, speed: 70 });
    const fast = createAircraft(spitfire, { altitude: 3000, speed: 170 });
    stepAircraft(slow, { roll: 1, throttle: 0.8 }, DT);
    stepAircraft(fast, { roll: 1, throttle: 0.8 }, DT);
    expect(slow.surfaces.aileron).toBe(1);
    expect(fast.surfaces.aileron).toBeLessThan(0.5);
  });
});
