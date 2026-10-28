// Air gunners (D83), in seeded encounters run headless: an Ace gunner hits a fighter crossing 300 m behind, a Novice
// fewer; no gunner fires above 2 g (S25); a killed gunner falls silent; each He 111 position fires only into its own
// arc; the player's Bf 110 rear gunner fires at an enemy behind and never at friends; hits in the He 111's fuselage can
// wound its gunners; killed crewmen don't bail out.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createPilot } from '../../src/ai/pilots.js';
import { stepGunners } from '../../src/ai/gunner.js';
import { inArc } from '../../src/weapons/mounts.js';
import { zonesFor } from '../../src/weapons/hitZones.js';
import { applyHit, componentsOf, crewHealth } from '../../src/weapons/damage.js';
import { startBailout } from '../../src/core/bailout.js';
import { seededRandom } from '../../src/weapons/random.js';
import { Vector3 } from 'three';

const DT = 1 / 120;

/** A simulation with the player parked far away, and the centre of the empty sky (500 m above the start). */
function emptySky(id = 'spitfire') {
  const sim = new Simulation(aircraftById[id], 'air');
  const centre = sim.plane.body.position.clone().add(new Vector3(0, 500, 0));
  sim.plane.body.position.x += 100000;
  return { sim, centre };
}

/** An aircraft of `id` flying straight on `heading` at `speed` from `at`, its pilot holding his course. */
function straight(sim, id, side, at, heading, speed, { skill = 'regular', seed = 1 } = {}) {
  const ac = aircraftById[id];
  const craft = new Craft(ac, {
    start: { altitude: at.y, speed, heading, throttle: levelThrottle(ac, at.y, speed, 1), rpm: 1, x: at.x, z: at.z },
    pilot: createPilot({ role: 'bomber', seed }), side, skill, seed, label: `${id} ${side}`,
  });
  sim.others.push(craft);
  return craft;
}

/** Counts the rounds each aircraft fires (by owner). */
function countShots(sim) {
  const shots = new Map();
  const spawn = sim.projectiles.spawn.bind(sim.projectiles);
  sim.projectiles.spawn = (round, owner) => {
    shots.set(owner, (shots.get(owner) ?? 0) + 1);
    spawn(round, owner);
  };
  return shots;
}

/** An He 111 flying north at 90 m/s, a Hurricane keeping pace while it crosses 300 m behind, for 8 s: its hits. */
function crossing(skill, seed) {
  const { sim, centre } = emptySky();
  const bomber = straight(sim, 'he111h', 'Luftwaffe', centre, 0, 90, { skill, seed });
  const fighter = straight(sim, 'hurricane', 'RAF', centre.clone().add(new Vector3(-300, 50, 300)), Math.atan2(60, 90), Math.hypot(60, 90), { seed: 50 });
  for (let t = 0; t < 8; t += DT) sim.step(DT);
  expect(bomber.alive).toBe(true);
  return fighter.plane.damage.hits;
}

describe('air gunners', () => {
  it('an Ace gunner hits a fighter crossing 300 m behind; a Novice hits less', () => {
    const ace = [1, 2, 3, 4, 5].map((s) => crossing('ace', s));
    const novice = [1, 2, 3, 4, 5].map((s) => crossing('novice', s));
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    expect(ace.filter((h) => h > 0).length).toBeGreaterThanOrEqual(3);
    expect(sum(ace)).toBeGreaterThan(2 * sum(novice));
  });

  it('nobody fires above 2 g (S25), and fire resumes once the g comes off', () => {
    const { sim, centre } = emptySky();
    const bomber = straight(sim, 'he111h', 'Luftwaffe', centre, 0, 90, { skill: 'ace' });
    straight(sim, 'hurricane', 'RAF', centre.clone().add(new Vector3(0, 60, 250)), 0, 95);
    const shots = countShots(sim);
    const run = (g, seconds) => {
      for (let t = 0; t < seconds; t += DT) {
        bomber.plane.last = { ...bomber.plane.last, loadFactor: g };
        stepGunners(bomber, sim, DT);
        sim.clock += DT;
      }
    };
    run(2.5, 4);
    expect(shots.get(bomber) ?? 0).toBe(0);
    run(1, 4);
    expect(shots.get(bomber)).toBeGreaterThan(0);
  });

  it('a killed gunner falls silent: the dorsal gun stops when its radio operator is killed', () => {
    const fire = (killed) => {
      const { sim, centre } = emptySky();
      const bomber = straight(sim, 'he111h', 'Luftwaffe', centre, 0, 90, { skill: 'ace' });
      if (killed) bomber.plane.damage.crew = { 2: 0 };
      straight(sim, 'hurricane', 'RAF', centre.clone().add(new Vector3(0, 80, 300)), 0, 95); // high astern: the dorsal's
      for (let t = 0; t < 5; t += DT) sim.step(DT);
      return bomber.gunnery.mounts.find((m) => m.id === 'dorsal').lastShot;
    };
    expect(fire(false)).toBeGreaterThan(0);
    expect(fire(true)).toBe(-Infinity);
  });

  it('each He 111 position fires only into its own arc: an attacker low astern meets the ventral gun, not the dorsal', () => {
    const { sim, centre } = emptySky();
    const bomber = straight(sim, 'he111h', 'Luftwaffe', centre, 0, 90, { skill: 'ace' });
    straight(sim, 'hurricane', 'RAF', centre.clone().add(new Vector3(30, -120, 300)), 0, 95);
    let outside = 0;
    for (let t = 0; t < 5; t += DT) {
      const before = bomber.gunnery.mounts.map((m) => m.lastShot);
      sim.step(DT);
      for (const [i, m] of bomber.gunnery.mounts.entries()) {
        if (m.lastShot === before[i]) continue;
        if (!inArc(m.spec, Math.atan2(m.bore.z, m.bore.x), Math.asin(m.bore.y))) outside += 1;
      }
    }
    const shot = (id) => bomber.gunnery.mounts.find((m) => m.id === id).lastShot;
    expect(outside).toBe(0);
    expect(shot('ventral')).toBeGreaterThan(0);
    expect(shot('dorsal')).toBe(-Infinity);
    expect(shot('nose')).toBe(-Infinity);
  });

  it('the player\'s Bf 110 rear gunner fires at an enemy behind, never at a friend, nor past one in the line', () => {
    const behind = (sim, id, side, back, up = 40) => {
      const p = sim.plane.body.position;
      return straight(sim, id, side, p.clone().add(new Vector3(0, up, back)), 0, sim.plane.body.velocity.length() + 5);
    };
    const shotsWith = (setup) => {
      const sim = new Simulation(aircraftById.bf110c4, 'air');
      sim.skill = 'ace';
      setup(sim);
      const shots = countShots(sim);
      for (let t = 0; t < 4; t += DT) sim.step(DT);
      return shots.get(sim) ?? 0;
    };
    expect(shotsWith((sim) => behind(sim, 'hurricane', 'RAF', 300))).toBeGreaterThan(0);
    expect(shotsWith((sim) => behind(sim, 'bf109e4', 'Luftwaffe', 300))).toBe(0);
    expect(shotsWith((sim) => {
      behind(sim, 'bf109e4', 'Luftwaffe', 150, 20);
      behind(sim, 'hurricane', 'RAF', 300, 40);
    })).toBe(0);
  });
});

describe('crew wounds', () => {
  const he111 = aircraftById.he111h;
  const fuselage = zonesFor(he111).zones.find((z) => z.kind === 'fuselage');

  it('the He 111\'s fuselage holds three gunners, who can be hit there (not the pilot)', () => {
    expect(componentsOf(he111, fuselage).crew).toBeCloseTo(0.3, 6);
    const { sim } = emptySky();
    const bomber = straight(sim, 'he111h', 'Luftwaffe', new Vector3(0, 1500, 0), 0, 90);
    const random = seededRandom(3);
    for (let i = 0; i < 60; i += 1) applyHit(bomber.plane, { zone: fuselage, kind: 'ap792', velocity: new Vector3(500, 0, 0) }, random);
    const hurt = [2, 3, 4].filter((i) => crewHealth(bomber.plane, i) < 1);
    expect(hurt.length).toBeGreaterThan(0);
    expect(bomber.plane.damage.pilot).toBe(1);
    expect(crewHealth(bomber.plane, 1)).toBe(1); // the observer sits in the cockpit
  });

  it('killed crewmen don\'t bail out', () => {
    const { sim } = emptySky();
    const bomber = straight(sim, 'he111h', 'Luftwaffe', new Vector3(0, 1500, 0), 0, 90);
    bomber.plane.damage.crew = { 2: 0, 4: -0.2 };
    const b = startBailout(sim, { ac: he111, side: 'Luftwaffe', label: 'x', body: () => bomber.plane.body, plane: bomber.plane });
    expect(b.men.map((m) => m.seat.role)).toEqual(['pilot', 'observer', 'flight engineer']);
  });
});
