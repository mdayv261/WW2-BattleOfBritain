// Hit zones (D68): each aircraft's zones match its size; a round through a zone registers that zone, one through empty
// air does not; rounds never hit the aircraft that fired them; the seeded dice repeat exactly.
import { describe, it, expect } from 'vitest';
import { Vector3, Quaternion } from 'three';
import { aircraftList, aircraftById } from '../../src/aircraft/index.js';
import { zonesFor, firstHit, segmentEnters } from '../../src/weapons/hitZones.js';
import { Projectiles } from '../../src/weapons/projectiles.js';
import { seededRandom, pickWeighted } from '../../src/weapons/random.js';

const at = (x, y, z) => new Vector3(x, y, z);
const still = { position: new Vector3(), quaternion: new Quaternion(), velocity: new Vector3() };

describe('hit zones', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: the zones span the wing and run the length of the aircraft`, () => {
      const { zones } = zonesFor(ac);
      const xs = zones.flatMap((z) => [z.min.x, z.max.x]);
      const zsAll = zones.flatMap((z) => [z.min.z, z.max.z]);
      expect(Math.max(...zsAll) - Math.min(...zsAll)).toBeCloseTo(ac.geometry.span, 1);
      expect((Math.max(...xs) - Math.min(...xs)) / ac.geometry.length).toBeGreaterThan(0.95);
      expect((Math.max(...xs) - Math.min(...xs)) / ac.geometry.length).toBeLessThan(1.05);
    });
  }

  it('a round fired from behind along the centre line enters the tail first', () => {
    const ac = aircraftById.spitfire;
    const hit = firstHit(ac, still, at(-30, 0.1, 0), at(10, 0.1, 0));
    expect(hit.zone.kind).toBe('tail');
  });

  it('a round from ahead into the nose hits the engine; one from above into a wing tip hits the outer wing', () => {
    const ac = aircraftById.bf109e4;
    expect(firstHit(ac, still, at(20, 0, 0), at(0, 0, 0)).zone.kind).toBe('engine');
    const tip = firstHit(ac, still, at(0, 5, 4.5), at(0, -5, 4.5));
    expect(tip.zone.name).toBe('wingOuterRight');
  });

  it('a round through empty air misses', () => {
    expect(firstHit(aircraftById.hurricane, still, at(-30, 5, 0), at(30, 5, 0))).toBeNull();
    expect(firstHit(aircraftById.hurricane, still, at(-30, 0, 9), at(30, 0, 9))).toBeNull();
  });

  it('the twins have engine nacelles that hits can reach', () => {
    const ac = aircraftById.bf110c4;
    const m = ac.engines.right;
    const hit = firstHit(ac, still, at(m.x + 10, m.y, m.z), at(m.x - 1, m.y, m.z));
    expect(hit.zone.name).toBe('engineRight');
    expect(hit.zone.engine).toBe(1);
  });

  it('follows the aircraft\'s attitude (a banked aircraft\'s wing is where it now points)', () => {
    const ac = aircraftById.spitfire;
    const banked = { ...still, quaternion: new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2) };
    // Rolled 90° (right wing down): the right wing now points down, below the aircraft.
    expect(firstHit(ac, banked, at(0.5, -4.5, 5), at(0.5, -4.5, -5))?.zone.name).toBe('wingOuterRight');
  });

  it('box crossing: enters at the right fraction, or not at all', () => {
    const min = at(-1, -1, -1);
    const max = at(1, 1, 1);
    expect(segmentEnters(at(-3, 0, 0), at(3, 0, 0), min, max)).toBeCloseTo(1 / 3, 6);
    expect(segmentEnters(at(-3, 2, 0), at(3, 2, 0), min, max)).toBeNull();
  });
});

describe('rounds and their owners', () => {
  it('a round never hits the aircraft that fired it, and hits another in its path', () => {
    const shooter = { name: 'shooter' };
    const ac = aircraftById.hurricane;
    const target = { who: { name: 'target' }, plane: { ac, body: still } };
    const self = { who: shooter, plane: { ac, body: still } };
    const p = new Projectiles();
    p.spawn({ position: at(-20, 0, 0), velocity: at(800, 0, 0), ballistics: 'mk7', kind: 'ball303' }, shooter);
    const hits = [];
    for (let i = 0; i < 10; i += 1) p.step(1 / 120, null, [self], (t) => hits.push(t));
    expect(hits).toHaveLength(0);
    const q = new Projectiles();
    q.spawn({ position: at(-20, 0, 0), velocity: at(800, 0, 0), ballistics: 'mk7', kind: 'ball303' }, shooter);
    for (let i = 0; i < 10; i += 1) q.step(1 / 120, null, [self, target], (t, hit) => hits.push([t, hit]));
    expect(hits).toHaveLength(1);
    expect(hits[0][0]).toBe(target);
    expect(q.live).toHaveLength(0); // the round is spent
  });
});

describe('seeded dice', () => {
  it('the same seed gives the same picks', () => {
    const w = { a: 1, b: 2, c: 3 };
    const r1 = seededRandom(42);
    const r2 = seededRandom(42);
    const s1 = Array.from({ length: 20 }, () => pickWeighted(w, r1));
    const s2 = Array.from({ length: 20 }, () => pickWeighted(w, r2));
    expect(s1).toEqual(s2);
    expect(new Set(s1).size).toBe(3);
  });
});
