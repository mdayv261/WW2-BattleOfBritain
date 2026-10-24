import { describe, it, expect } from 'vitest';
import { atmosphere, altitudeForPressure, densityRatio, equivalentAirspeed, trueAirspeed } from '../../src/physics/atmosphere.js';

describe('International Standard Atmosphere', () => {
  it('has the standard sea-level values', () => {
    const a = atmosphere(0);
    expect(a.temperature).toBeCloseTo(288.15, 2);
    expect(a.pressure).toBeCloseTo(101325, 0);
    expect(a.density).toBeCloseTo(1.225, 3);
    expect(a.soundSpeed).toBeCloseTo(340.3, 1);
  });

  it('matches published ISA values at 5 km and 11 km', () => {
    expect(atmosphere(5000).pressure).toBeCloseTo(54020, -2);
    expect(atmosphere(5000).density).toBeCloseTo(0.7364, 3);
    expect(atmosphere(11000).temperature).toBeCloseTo(216.65, 2);
    expect(atmosphere(11000).pressure).toBeCloseTo(22632, -2);
  });

  it('inverts pressure back to altitude', () => {
    for (const h of [0, 1500, 4000, 9000]) expect(altitudeForPressure(atmosphere(h).pressure)).toBeCloseTo(h, 3);
  });

  it('converts between true and equivalent airspeed', () => {
    expect(densityRatio(0)).toBeCloseTo(1, 6);
    expect(trueAirspeed(equivalentAirspeed(150, 6000), 6000)).toBeCloseTo(150, 9);
    expect(equivalentAirspeed(150, 6000)).toBeLessThan(150);
  });
});
