// Handling checks in the time-stepped simulation (Phase 1 checkpoint 3). Each test names its source;
// where the source is qualitative the test checks the direction or ordering it describes.
import { describe, it, expect } from 'vitest';
import { stallTest, spinTest, rollTest, hardPull, swingTest, stallEas } from '../../src/dev/flightTests.js';
import { stickForcePerG } from '../../src/physics/performance.js';
import { authority } from '../../src/physics/controls.js';
import { common } from '../../src/aircraft/common.js';
import { spitfire } from '../../src/aircraft/spitfire.js';
import { hurricane } from '../../src/aircraft/hurricane.js';
import { bf109e4 } from '../../src/aircraft/bf109e4.js';
import { UNIT } from '../../src/core/constants.js';

const MPH = UNIT.MPH;
const qAt = (eas) => 0.5 * 1.225 * eas * eas;

describe('stalls', () => {
  const results = Object.fromEntries([hurricane, spitfire, bf109e4].map((ac) => [ac.id, stallTest(ac)]));

  it('stall all three aircraft with the stick brought back at idle', () => {
    for (const r of Object.values(results)) expect(r.stalled).toBe(true);
  });

  it('drops the wing the way the sources describe', () => {
    expect(results.hurricane.wingDrop).toBeLessThan(0); // S12: left roll with the stick held back
    expect(results.bf109e4.wingDrop).toBeLessThan(0); // S20: left wing tends to drop
    expect(results.spitfire.wingDrop).toBeGreaterThan(0); // S31: mild right roll
  });

  it('gives the Spitfire the mildest stall of the three (S31)', () => {
    expect(Math.abs(results.spitfire.wingDrop)).toBeLessThan(Math.abs(results.hurricane.wingDrop));
    expect(Math.abs(results.spitfire.wingDrop)).toBeLessThan(Math.abs(results.bf109e4.wingDrop));
  });
});

describe('spins', () => {
  for (const ac of [hurricane, spitfire, bf109e4]) {
    for (const side of [-1, 1]) {
      it(`${ac.id}: enters a ${side < 0 ? 'left' : 'right'} spin and recovers with opposite rudder and stick forward`, () => {
        const r = spinTest(ac, side);
        expect(r.stalledInSpin).toBeGreaterThan(0.6);
        expect(Math.abs(r.turnsIn6s)).toBeGreaterThan(0.4);
        expect(r.turnsToRecover).toBeLessThan(2);
      });
    }
  }
});

describe('roll', () => {
  it('rolls at the NACA rate with full stick (30 lb) at 230 mph IAS, 10,000 ft (S13)', () => {
    expect(rollTest(spitfire, 230 * MPH, 3048).rollRate).toBeGreaterThan(63 * 0.85);
    expect(rollTest(spitfire, 230 * MPH, 3048).rollRate).toBeLessThan(63 * 1.15);
    expect(rollTest(hurricane, 230 * MPH, 3048).rollRate).toBeGreaterThan(64 * 0.85);
    expect(rollTest(hurricane, 230 * MPH, 3048).rollRate).toBeLessThan(64 * 1.15);
  });

  it('sideslips about 18 degrees in a full-aileron roll at 1.1 times stall speed, rudder fixed (S11)', () => {
    const r = rollTest(spitfire, 1.1 * stallEas(spitfire), 2000);
    expect(r.maxSideslip).toBeGreaterThan(13);
    expect(r.maxSideslip).toBeLessThan(23);
  });
});

describe('control forces', () => {
  it('matches the NACA elevator stick-force gradients within 10% (S11 5.0 lb/g, S12 8.1 lb/g)', () => {
    const at = { eas: 230 * MPH, altitude: 3048 };
    expect(stickForcePerG(spitfire, at) / UNIT.LBF).toBeCloseTo(5.0, 0);
    expect(Math.abs(stickForcePerG(spitfire, at) / UNIT.LBF - 5.0)).toBeLessThan(0.5);
    expect(Math.abs(stickForcePerG(hurricane, at) / UNIT.LBF - 8.1)).toBeLessThan(0.81);
  });

  it('limits the Spitfire to about half aileron at 300 mph (S11) but gives full aileron at 140 mph', () => {
    const f = common.pilotMaxForce.roll;
    expect(authority(spitfire.controls.rollHinge, f, qAt(140 * MPH))).toBe(1);
    const at300 = authority(spitfire.controls.rollHinge, f, qAt(300 * MPH));
    expect(at300).toBeGreaterThan(0.25);
    expect(at300).toBeLessThan(0.55);
  });

  it('makes the Bf 109 heavy above 250 mph and nearly immovable in pitch at 400 mph (S20, S21)', () => {
    const { pitch, roll } = common.pilotMaxForce;
    expect(authority(bf109e4.controls.rollHinge, roll, qAt(200 * MPH))).toBeGreaterThan(0.95);
    expect(authority(bf109e4.controls.pitchHinge, pitch, qAt(400 * MPH))).toBeLessThan(0.2);
    expect(authority(bf109e4.controls.rollHinge, roll, qAt(400 * MPH))).toBeLessThan(0.35);
  });
});

describe('Bf 109 slats (S21)', () => {
  it('open in a hard pull at moderate speed; the RAF fighters have none', () => {
    expect(hardPull(bf109e4, 220 * MPH).slatsOpened).toBeGreaterThan(0.9);
    expect(hardPull(spitfire, 220 * MPH).slatsOpened).toBe(0);
  });

  it('stay closed in level flight at cruising speed', () => {
    expect(hardPull(bf109e4, 300 * MPH, 2000, 0.15).slatsOpened).toBe(0); // the pull starts after 0.2 s
  });
});

describe('engine torque at full power and low speed', () => {
  it('swings the RAF fighters and the Bf 109 opposite ways (propellers turn opposite ways)', () => {
    const raf = swingTest(spitfire).sideslip;
    const lw = swingTest(bf109e4).sideslip;
    expect(Math.sign(raf)).toBe(-Math.sign(lw));
  });
});
