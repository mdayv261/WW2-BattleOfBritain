import { describe, it, expect } from 'vitest';
import { aeroCoefficients, wingConstants, peakLiftAngle } from '../../src/physics/aero.js';
import { authority } from '../../src/physics/controls.js';
import { spitfire } from '../../src/aircraft/spitfire.js';
import { hurricane } from '../../src/aircraft/hurricane.js';
import { bf109e4 } from '../../src/aircraft/bf109e4.js';

const flow = (o = {}) => ({ alpha: 0.05, beta: 0, p: 0, q: 0, r: 0, airspeed: 100, qBar: 5000, slipQ: 0, ...o });
const surfaces = (o = {}) => ({ elevator: 0, aileron: 0, rudder: 0, trim: 0, flaps: 0, gear: 0, radiator: 0, slatLeft: 1, slatRight: 1, ...o });
const peakCl = (ac, s = surfaces()) => {
  let best = 0;
  for (let a = -0.1; a < 0.6; a += 0.001) best = Math.max(best, aeroCoefficients(ac, flow({ alpha: a }), s).cl);
  return best;
};

describe('aerodynamics', () => {
  it('reaches exactly the sourced maximum lift, flaps up and down', () => {
    for (const ac of [spitfire, hurricane, bf109e4]) {
      expect(peakCl(ac)).toBeCloseTo(ac.aero.clMax, 2);
      expect(peakCl(ac, surfaces({ flaps: 1 }))).toBeCloseTo(ac.aero.clMaxFlaps, 2);
    }
  });

  it('has a lift slope typical of the aspect ratio (Helmbold)', () => {
    const w = wingConstants(spitfire);
    expect(w.aspectRatio).toBeCloseTo(5.63, 1);
    expect(w.clAlpha).toBeGreaterThan(3.8);
    expect(w.clAlpha).toBeLessThan(4.6);
  });

  it('damps roll and gives a stable dihedral effect in attached flow', () => {
    const roll = (o) => aeroCoefficients(spitfire, flow(o), surfaces()).croll - spitfire.aero.rollRig;
    expect(roll({ p: 0.5 })).toBeLessThan(0);
    expect(roll({ beta: 0.05 })).toBeLessThan(0);
  });

  it('autorotates when stalled: rolling increases the roll moment instead of damping it', () => {
    const w = wingConstants(spitfire);
    const stalledAlpha = spitfire.aero.alphaZeroLift + peakLiftAngle(w.clAlpha, spitfire.aero.clMax) + 0.08;
    const roll = (p) => aeroCoefficients(spitfire, flow({ alpha: stalledAlpha, airspeed: 45, qBar: 1200, p }), surfaces()).croll;
    expect(roll(0.3) - roll(0)).toBeGreaterThan(0);
  });

  it('yaws toward the dropping wing when one half is stalled', () => {
    const w = wingConstants(spitfire);
    const stalledAlpha = spitfire.aero.alphaZeroLift + peakLiftAngle(w.clAlpha, spitfire.aero.clMax) + 0.03;
    const c = aeroCoefficients(spitfire, flow({ alpha: stalledAlpha, airspeed: 45, qBar: 1200, p: 0.4 }), surfaces());
    expect(c.cyaw - spitfire.aero.yawRig).toBeGreaterThan(0); // right wing going down, extra drag on the right: nose right
  });

  it('loses lift on the Bf 109 when the slats stay closed, and rolls if only one opens', () => {
    expect(peakCl(bf109e4, surfaces({ slatLeft: 0, slatRight: 0 }))).toBeCloseTo(bf109e4.slats.clMaxClosed, 2);
    const w = wingConstants(bf109e4);
    const high = bf109e4.aero.alphaZeroLift + peakLiftAngle(w.clAlpha, bf109e4.slats.clMaxClosed) + 0.04;
    const c = aeroCoefficients(bf109e4, flow({ alpha: high, airspeed: 50, qBar: 1500 }), surfaces({ slatLeft: 1, slatRight: 0 }));
    expect(c.croll - bf109e4.aero.rollRig - bf109e4.aero.stallBias * 0.5 * (c.stalledLeft + c.stalledRight)).toBeGreaterThan(0.005);
  });

  it('pitches nose down as angle of attack rises (static stability) and nose up with up elevator', () => {
    const cm = (o, s) => aeroCoefficients(hurricane, flow(o), surfaces(s)).cpitch;
    expect(cm({ alpha: 0.1 })).toBeLessThan(cm({ alpha: 0.0 }));
    expect(cm({}, { elevator: 1 })).toBeGreaterThan(cm({}));
  });

  it('increases lift in the propeller slipstream', () => {
    expect(aeroCoefficients(spitfire, flow({ slipQ: 2000 }), surfaces()).cl).toBeGreaterThan(aeroCoefficients(spitfire, flow(), surfaces()).cl);
  });
});

describe('pilot force limits', () => {
  it('allows full deflection at low speed and only part at high speed', () => {
    const { rollHinge } = spitfire.controls;
    expect(authority(rollHinge, 133, 1000)).toBe(1);
    expect(authority(rollHinge, 133, 15000)).toBeLessThan(0.3);
  });
});
