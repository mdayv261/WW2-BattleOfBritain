// What damaged aircraft give off (D69): nothing when undamaged; glycol from under the radiator, oil from under the oil
// cooler, smoke from a failing engine and flames where a fire started, each in the right place on each aircraft.
import { describe, it, expect } from 'vitest';
import { aircraftById, aircraftList } from '../../src/aircraft/index.js';
import { createAircraft } from '../../src/physics/flightModel.js';
import { damageSources, engineSmoke, boiling } from '../../src/weapons/effects.js';
import { hurt, burntAway } from '../../src/weapons/damage.js';
import { zonesFor } from '../../src/weapons/hitZones.js';
import { roundTypes } from '../../src/aircraft/ammunition.js';
import { seededRandom } from '../../src/weapons/random.js';

const planeOf = (id) => createAircraft(aircraftById[id], { altitude: 2000, speed: 110 });
const zone = (ac, name) => zonesFor(ac).zones.find((z) => z.name === name);
const of = (plane, type) => damageSources(plane).filter((s) => s.type === type);

describe('damage sources', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: an undamaged aircraft gives off nothing`, () => {
      expect(damageSources(createAircraft(ac, { altitude: 2000, speed: 110 }))).toEqual([]);
    });
  }

  it('a coolant leak trails glycol from under the radiator: the Spitfire\'s right wing, the Hurricane\'s belly', () => {
    const spit = planeOf('spitfire');
    spit.engines[0].heat.coolantLeak = 0.01;
    const [g] = of(spit, 'glycol');
    expect(g.point.z).toBeGreaterThan(0.4); // under the starboard wing (S33)
    expect(g.point.y).toBeLessThan(-0.5);
    const hurri = planeOf('hurricane');
    hurri.engines[0].heat.coolantLeak = 0.01;
    const [h] = of(hurri, 'glycol');
    expect(Math.abs(h.point.z)).toBeLessThan(0.1); // the ventral radiator
    expect(h.point.y).toBeLessThan(-0.5);
  });

  it('the Bf 109 trails glycol from both wing radiators, and stops once the coolant is gone', () => {
    const p = planeOf('bf109e4');
    p.engines[0].heat.coolantLeak = 0.01;
    const zs = of(p, 'glycol').map((s) => Math.sign(s.point.z)).sort();
    expect(zs).toEqual([-1, 1]);
    p.engines[0].heat.coolantLeft = 0;
    expect(of(p, 'glycol')).toHaveLength(0);
  });

  it('a twin trails glycol from the engine that was hit only', () => {
    const p = planeOf('he111h');
    p.engines[1].heat.coolantLeak = 0.01;
    const glycol = of(p, 'glycol');
    expect(glycol).toHaveLength(1);
    expect(glycol[0].point.z).toBeGreaterThan(1); // the right nacelle
  });

  it('an oil leak trails oil from under the oil cooler (the Spitfire\'s port wing)', () => {
    const p = planeOf('spitfire');
    p.engines[0].heat.oilLeak = 0.01;
    const [o] = of(p, 'oil');
    expect(o.point.z).toBeLessThan(-0.4);
  });

  it('an engine smokes as it wears out or seizes; boiling coolant vents as vapour', () => {
    const p = planeOf('spitfire');
    const e = p.engines[0];
    e.heat.wear = 0.2;
    expect(engineSmoke(e)).toBe(0);
    e.heat.wear = 0.65;
    expect(engineSmoke(e)).toBeCloseTo(0.5, 5);
    e.heat.wear = 0;
    expect(boiling(p, e)).toBe(false);
    e.heat.coolant = 200;
    expect(boiling(p, e)).toBe(true);
    expect(of(p, 'glycol')).toHaveLength(1);
    e.heat.coolant = 90;
    e.heat.seized = true;
    const [s] = of(p, 'engineSmoke');
    expect(s.strength).toBe(1);
    expect(s.point.x).toBeGreaterThan(0.3); // at the nose
  });

  it('a fire burns where it started', () => {
    const p = planeOf('hurricane');
    const wing = zone(p.ac, 'wingInnerLeft');
    hurt(p, wing, 'fuel', roundTypes.deWilde303, 1, { x: -1, y: 0, z: 0 }, 0, () => 0);
    expect(p.damage.fire.zone).toBe('wingInnerLeft');
    const [f] = of(p, 'fire');
    expect(f.point.z).toBeLessThan(-0.5);
    expect(f.point.z).toBeGreaterThan(wing.min.z);
  });

  it('a fire burns away the part it is in when the aircraft breaks up', () => {
    expect(burntAway('wingInnerRight')).toEqual(['wingRight']);
    expect(burntAway('engineLeft')).toEqual(['wingLeft']);
    expect(burntAway('cockpit')).toEqual(['tail']);
    expect(burntAway('engine')).toEqual([]);
  });

  it('a dead pilot\'s aircraft can still break up (seeded hits repeat)', () => {
    const p = planeOf('bf109e4');
    for (let i = 0; i < 3; i += 1) hurt(p, zone(p.ac, 'cockpit'), 'pilot', roundTypes.ap792, 1, { x: -1, y: 0, z: 0 }, 0, seededRandom(1));
    expect(p.damage.failed.pilotKilled).toBe(true);
    for (let i = 0; i < 6; i += 1) hurt(p, zone(p.ac, 'wingOuterRight'), 'wing', roundTypes.heTracer20, 5, { x: -1, y: 0, z: 0 }, 0, seededRandom(1));
    expect(p.damage.failed.parts).toEqual(['wingRight']);
  });
});
