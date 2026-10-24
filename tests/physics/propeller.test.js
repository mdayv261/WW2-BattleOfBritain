import { describe, it, expect } from 'vitest';
import { propellerCoefficients, propellerLoads, bladeAngleForPower } from '../../src/physics/propeller.js';
import { naca640 } from '../../src/aircraft/naca640.js';
import { interpPairs } from '../../src/physics/interp.js';
import { spitfire } from '../../src/aircraft/spitfire.js';
import { UNIT } from '../../src/core/constants.js';

const DEG = UNIT.DEG;

describe('propeller coefficients (NACA Report 640)', () => {
  it('reproduces the measured thrust coefficients at the measured blade angles', () => {
    for (const [key, series] of Object.entries(naca640.ct)) {
      const beta = Number(key.slice(1)) * DEG;
      for (const [j, ct] of series) expect(propellerCoefficients(j, beta).ct).toBeCloseTo(ct, 6);
    }
  });

  it('gives thrust, power and efficiency consistent with the measured efficiency', () => {
    for (const [key, series] of Object.entries(naca640.eta)) {
      const beta = Number(key.slice(1)) * DEG;
      for (const [j, eta] of series) {
        if (eta < 0.3) continue;
        const { ct, cp } = propellerCoefficients(j, beta);
        expect((ct * j) / cp).toBeCloseTo(eta, 1);
      }
    }
  });

  it('peaks near the measured 3-blade efficiency envelope (0.86)', () => {
    let best = 0;
    for (let b = 15; b <= 45; b += 1) {
      for (let j = 0.4; j < 2.6; j += 0.02) {
        const { ct, cp } = propellerCoefficients(j, b * DEG);
        if (ct > 0 && cp > 0) best = Math.max(best, (ct * j) / cp);
      }
    }
    expect(best).toBeGreaterThan(0.83);
    expect(best).toBeLessThan(0.89);
  });

  it('is continuous at the edge of the measured blade angles', () => {
    for (const j of [1.0, 2.0, 2.5]) {
      const inside = propellerCoefficients(j, 44.999 * DEG);
      const outside = propellerCoefficients(j, 45.001 * DEG);
      expect(outside.ct).toBeCloseTo(inside.ct, 3);
      expect(outside.cp).toBeCloseTo(inside.cp, 3);
    }
  });

  it('moves the zero-thrust point outwards beyond 45 degrees', () => {
    const j0At45 = naca640.ct.b45.at(-1)[0];
    expect(propellerCoefficients(j0At45, 45 * DEG).ct).toBeCloseTo(0, 6);
    expect(propellerCoefficients(j0At45, 50 * DEG).ct).toBeGreaterThan(0.02);
  });

  it('finds the blade angle that absorbs a given power', () => {
    const omega = 3000 * UNIT.RPM * spitfire.propeller.gearRatio;
    const v = 150;
    const rho = 0.7;
    const beta = bladeAngleForPower(spitfire.propeller, { omega, v, rho, power: 700e3 });
    expect(propellerLoads(spitfire.propeller, { omega, beta, v, rho }).power).toBeCloseTo(700e3, -3);
    const more = bladeAngleForPower(spitfire.propeller, { omega, v, rho, power: 800e3 });
    expect(more).toBeGreaterThan(beta);
  });

  it('turns efficiency into thrust as expected at top speed (T V / P about 0.8)', () => {
    const omega = 3000 * UNIT.RPM * spitfire.propeller.gearRatio;
    const v = 158;
    const rho = 0.67;
    const beta = bladeAngleForPower(spitfire.propeller, { omega, v, rho, power: 740e3 });
    const loads = propellerLoads(spitfire.propeller, { omega, beta, v, rho });
    const eta = (loads.thrust * v) / loads.power;
    expect(eta).toBeGreaterThan(0.75);
    expect(eta).toBeLessThan(0.88);
    expect(interpPairs(naca640.cpStatic, 30)).toBeCloseTo(0.21, 6);
  });
});
