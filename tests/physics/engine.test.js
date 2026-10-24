import { describe, it, expect } from 'vitest';
import { enginePower, createCutout, updateCutout } from '../../src/physics/engine.js';
import { merlin3 } from '../../src/aircraft/merlin3.js';
import { db601a } from '../../src/aircraft/db601a.js';
import { UNIT } from '../../src/core/constants.js';

const HP = UNIT.HP;
const PS = UNIT.PS;
const RPM = UNIT.RPM;
const p = (engine, o) => enginePower(engine, { airspeed: 0, throttle: 1, ...o }).power;

describe('Merlin III', () => {
  it('gives the chart powers at sea level, static (S9)', () => {
    expect(p(merlin3, { altitude: 0, speed: 3000 * RPM }) / HP).toBeCloseTo(876, -1);
    expect(p(merlin3, { altitude: 0, speed: 3000 * RPM, emergency: true }) / HP).toBeCloseTo(1187, -1);
  });

  it('peaks at the full-throttle height and falls above it', () => {
    const at = (h) => p(merlin3, { altitude: h, speed: 3000 * RPM });
    expect(at(4846) / HP).toBeCloseTo(1028, -1);
    expect(at(7000)).toBeLessThan(at(4846));
    expect(at(10000)).toBeLessThan(at(8000));
    expect(at(10000)).toBeGreaterThan(0);
  });

  it('holds +12 lb boost only to about 10,000 ft', () => {
    const extra = (h) => p(merlin3, { altitude: h, speed: 3000 * RPM, emergency: true }) - p(merlin3, { altitude: h, speed: 3000 * RPM });
    expect(extra(0)).toBeGreaterThan(200 * HP);
    expect(extra(5500)).toBeCloseTo(0, -3);
  });

  it('loses full-throttle height at lower rpm, as N3171 did (S4)', () => {
    const at = (h, rpm) => p(merlin3, { altitude: h, speed: rpm * RPM });
    expect(at(2000, 2600)).toBeCloseTo(at(2000, 3000), -3); // same power below full-throttle height
    expect(at(5500, 2600)).toBeLessThan(at(5500, 3000));
  });

  it('gains power above full-throttle height from ram air', () => {
    expect(enginePower(merlin3, { altitude: 6000, airspeed: 150, throttle: 1, speed: 3000 * RPM }).power)
      .toBeGreaterThan(p(merlin3, { altitude: 6000, speed: 3000 * RPM }));
  });

  it('gives little power with the throttle closed', () => {
    expect(enginePower(merlin3, { altitude: 0, airspeed: 0, throttle: 0, speed: 3000 * RPM }).power / HP).toBeLessThan(100);
  });

  it('cuts out under negative g and recovers after positive g returns', () => {
    const cut = createCutout();
    for (let i = 0; i < 60; i += 1) updateCutout(merlin3, cut, -0.5, 1 / 120);
    expect(cut.factor).toBeLessThan(0.05);
    for (let i = 0; i < 120 * 0.5; i += 1) updateCutout(merlin3, cut, 1, 1 / 120);
    expect(cut.factor).toBeLessThan(0.05); // still flooded
    for (let i = 0; i < 120 * 3; i += 1) updateCutout(merlin3, cut, 1, 1 / 120);
    expect(cut.factor).toBeCloseTo(1, 6);
  });
});

describe('DB 601A', () => {
  it('gives the manual powers at sea level (S18)', () => {
    expect(p(db601a, { altitude: 0, speed: 2400 * RPM }) / PS).toBeCloseTo(990, -1);
    const thirty = enginePower(db601a, { altitude: 0, airspeed: 0, throttle: (1.23 * UNIT.ATA - db601a.idleMap) / (db601a.ratings.normal.map - db601a.idleMap), speed: 2300 * RPM }).power / PS;
    const cont = enginePower(db601a, { altitude: 0, airspeed: 0, throttle: (1.15 * UNIT.ATA - db601a.idleMap) / (db601a.ratings.normal.map - db601a.idleMap), speed: 2200 * RPM }).power / PS;
    expect(Math.abs(thirty - 910) / 910).toBeLessThan(0.02);
    expect(Math.abs(cont - 810) / 810).toBeLessThan(0.02);
  });

  it('has the hydraulic supercharger hump at about 2 km and its full-throttle height at 4.5 km', () => {
    const at = (h) => p(db601a, { altitude: h, speed: 2400 * RPM }) / PS;
    expect(at(2100)).toBeGreaterThan(at(0));
    expect(at(2100)).toBeGreaterThan(at(4000));
    expect(at(4500)).toBeCloseTo(1020, -1);
    expect(at(7000)).toBeLessThan(800);
  });

  it('does not cut out under negative g (direct injection)', () => {
    const cut = createCutout();
    for (let i = 0; i < 240; i += 1) updateCutout(db601a, cut, -1, 1 / 120);
    expect(cut.factor).toBe(1);
  });
});
