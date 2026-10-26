// Structural limits (Phase 5, D62): past the g limit the airframe wrinkles (more drag), at the ultimate load the wings
// fail; past the diving limit the control surfaces flutter, lose their effect and tear away.
import { describe, it, expect } from 'vitest';
import { aircraftById, aircraftList } from '../../src/aircraft/index.js';
import { createDamage, stepStructure, damagedSurfaces, damageDrag } from '../../src/physics/structure.js';

const planeOf = (ac) => ({ ac, damage: createDamage() });

describe('structural limits', () => {
  it('does nothing within the limits', () => {
    const p = planeOf(aircraftById.spitfire);
    for (let i = 0; i < 600; i += 1) stepStructure(p, { loadFactor: 8.5, eas: 190 }, 0.01);
    expect(p.damage).toEqual(createDamage());
    expect(damageDrag(p.ac, p.damage)).toBe(0);
  });

  it('wrinkles the airframe past the damage limit, and the damage stays', () => {
    const p = planeOf(aircraftById.spitfire);
    stepStructure(p, { loadFactor: 11, eas: 150 }, 0.01); // halfway from 9 g to 13 g
    expect(p.damage.airframe).toBeCloseTo(0.5, 6);
    stepStructure(p, { loadFactor: 1, eas: 150 }, 0.01);
    expect(p.damage.airframe).toBeCloseTo(0.5, 6);
    expect(damageDrag(p.ac, p.damage)).toBeGreaterThan(0);
    expect(p.damage.failed).toBeNull();
  });

  it('fails the wings at the ultimate load, positive or negative (half the positive)', () => {
    for (const ac of aircraftList) {
      const up = planeOf(ac);
      stepStructure(up, { loadFactor: ac.limits.g.fail + 0.1, eas: 100 }, 0.01);
      expect(up.damage.failed?.cause, ac.id).toMatch(/wings failed/);
      const down = planeOf(ac);
      stepStructure(down, { loadFactor: -ac.limits.g.fail / 2 - 0.1, eas: 100 }, 0.01);
      expect(down.damage.failed, ac.id).not.toBeNull();
    }
  });

  it('makes the control surfaces flutter past the diving limit until they tear away', () => {
    const p = planeOf(aircraftById.bf109e4);
    const over = p.ac.limits.diveEas * 1.1;
    for (let t = 0; t < 2; t += 0.01) stepStructure(p, { loadFactor: 1, eas: over }, 0.01);
    const s = damagedSurfaces({ aileron: 1, elevator: 1, rudder: 1, flaps: 0 }, p.damage);
    expect(s.aileron).toBeGreaterThan(0);
    expect(s.aileron).toBeLessThan(1);
    for (let t = 0; t < 4; t += 0.01) stepStructure(p, { loadFactor: 1, eas: over }, 0.01);
    expect(p.damage.flutter).toBe(1);
    expect(damagedSurfaces({ aileron: 1, elevator: 1, rudder: 1 }, p.damage).elevator).toBe(0);
  });

  it('gives an aircraft without a diving limit no flutter (the He 111: none found)', () => {
    const p = planeOf(aircraftById.he111h);
    stepStructure(p, { loadFactor: 1, eas: 250 }, 1);
    expect(p.damage.flutter).toBe(0);
  });

  it('leaves the surfaces object untouched when undamaged (the flight model is unchanged)', () => {
    const s = { aileron: 0.3, elevator: -0.2, rudder: 0.1 };
    expect(damagedSurfaces(s, createDamage())).toBe(s);
  });
});
