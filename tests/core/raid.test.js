// Raids (Phase 7 checkpoint 2, D227, D228): the route from mid-Channel, on the way from the Luftwaffe's field near
// Calais, to a Kent target and back to mid-Channel; three
// or six bombers as one formation (the second Kette behind and below the first); the raid's escort a mile behind and
// above (S38), keeping station.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { common } from '../../src/aircraft/common.js';
import { Simulation } from '../../src/core/simulation.js';
import { airfieldNamed } from '../../src/world/airfields.js';
import { raidRoute, raidCourse, spawnRaid, TARGETS, RAID_FIELD, RAID_START, inRaid } from '../../src/core/raid.js';
import { toLatLon } from '../../src/world/geo.js';

const DT = 1 / 120;

describe('raids', () => {
  it('start halfway from the Luftwaffe field near Calais to the target, over the Strait of Dover, and end back there', () => {
    expect(RAID_START).toBe(0.5);
    for (const target of TARGETS) {
      const [to, back] = raidRoute(target);
      const field = airfieldNamed(RAID_FIELD);
      const c = raidCourse(target, 4000);
      expect(to).toEqual({ x: airfieldNamed(target).x, z: airfieldNamed(target).z });
      expect(back.x).toBeCloseTo(c.origin.x, 6);
      expect(back.z).toBeCloseTo(c.origin.z, 6);
      expect(c.field.x).toBe(field.x);
      // Halfway: as far from the field as from the target, the full way 30-70 km.
      const fromField = Math.hypot(c.origin.x - field.x, c.origin.z - field.z);
      expect(fromField).toBeCloseTo(c.length, 0);
      expect(c.length).toBeGreaterThan(15000);
      expect(c.length).toBeLessThan(35000);
      // Over the Strait, between Kent's coast and Cap Gris-Nez.
      const { lat, lon } = toLatLon(c.origin.x, c.origin.z);
      expect(lat).toBeGreaterThan(50.9);
      expect(lat).toBeLessThan(51.2);
      expect(lon).toBeGreaterThan(1.3);
      expect(lon).toBeLessThan(1.6);
    }
  });

  it('six bombers are one formation, the second Kette behind and below the first', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const raid = spawnRaid(sim, { target: 'Hawkinge', bombers: 6, escorts: 0, altitude: 4000 });
    expect(raid.group.formation).toBe('ketten');
    expect(raid.group.bombers).toHaveLength(6);
    const lead = raid.bombers[0].plane.body.position;
    const second = raid.bombers[3].plane.body.position;
    const along = second.clone().sub(lead).setY(0).dot(raid.course.dir);
    expect(along).toBeCloseTo(-(common.formations.ketten.back + 0), -1);
    expect(lead.y - second.y).toBeCloseTo(common.formations.ketten.below, 0);
    expect(spawnRaid(new Simulation(aircraftById.spitfire, 'air'), { target: 'Lympne', bombers: 3, altitude: 4000 }).group.formation).toBe('kette');
  });

  it('the raid\'s escort starts a mile behind and above the bombers and keeps station for a minute', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.body.position.x += 100000; // the player far away, out of every pilot's sight
    const raid = spawnRaid(sim, { target: 'Manston', bombers: 3, escorts: 2, altitude: 4000 });
    expect(raid.escorts).toHaveLength(2);
    const gap = () => {
      const d = raid.escorts[0].plane.body.position.clone().sub(raid.bombers[0].plane.body.position);
      return { behind: -d.clone().setY(0).dot(raid.course.dir), above: d.y };
    };
    expect(gap().behind).toBeCloseTo(common.formations.escort.behind, -2);
    for (let i = 0; i < 120 * 60; i += 1) sim.step(DT);
    const g = gap();
    expect(g.behind).toBeGreaterThan(800);
    expect(g.behind).toBeLessThan(2500);
    expect(g.above).toBeGreaterThan(200);
    expect(raid.bombers.every((c) => inRaid(sim, c))).toBe(true);
  });
});
