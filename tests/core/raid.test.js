// Raids (Phase 7 checkpoint 2, D227): the route from the Luftwaffe's field near Calais to a Kent target and back; three
// or six bombers as one formation (the second Kette behind and below the first); the raid's escort a mile behind and
// above (S38), keeping station.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { common } from '../../src/aircraft/common.js';
import { Simulation } from '../../src/core/simulation.js';
import { airfieldNamed } from '../../src/world/airfields.js';
import { raidRoute, raidCourse, spawnRaid, TARGETS, RAID_FIELD, inRaid } from '../../src/core/raid.js';

const DT = 1 / 120;

describe('raids', () => {
  it('fly from the Luftwaffe field near Calais to the target, then back over that field', () => {
    for (const target of TARGETS) {
      const [to, home] = raidRoute(target);
      expect(to).toEqual({ x: airfieldNamed(target).x, z: airfieldNamed(target).z });
      expect(home).toEqual({ x: airfieldNamed(RAID_FIELD).x, z: airfieldNamed(RAID_FIELD).z });
      const c = raidCourse(target, 4000);
      expect(c.length).toBeGreaterThan(30000);
      expect(c.length).toBeLessThan(70000);
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
