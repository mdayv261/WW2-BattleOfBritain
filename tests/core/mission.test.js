// Missions (Phase 7 checkpoint 1, D225): a dogfight is built from its setup; it ends when the enemy is all gone, when the
// player is lost, or when he has landed; the player's kills, shared kills and damaged enemies are credited by who hit
// them last and when; and missions flown one after another leave nothing behind.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { noteShooter } from '../../src/core/combat.js';
import {
  createMission, startMission, stepMission, endMission, missionResults, enemyGroups, playerState, END_PAUSE, CREDIT_TIME,
} from '../../src/core/mission.js';

const DT = 1 / 120;

/** A dogfight started in a fresh simulation (the flat test world). */
function flying(setup = {}) {
  const sim = new Simulation(aircraftById.spitfire, 'ground');
  const mission = startMission(sim, createMission(setup));
  return { sim, mission };
}

/** Takes an enemy out of the sky as if it had crashed. */
const destroy = (sim, c) => {
  c.gone = true;
  sim.others = sim.others.filter((o) => o !== c);
};

describe('a dogfight mission', () => {
  it('builds the chosen enemy type, number and skill, the player in the air at the chosen height', () => {
    const { sim, mission } = flying({ aircraft: 'hurricane', enemy: 'bf110c4', count: 5, skill: 'ace', altitude: 3000 });
    expect(sim.ac.id).toBe('hurricane');
    expect(sim.mode).toBe('air');
    expect(sim.plane.body.position.y).toBeCloseTo(3000, 0);
    expect(mission.enemies).toHaveLength(5);
    expect(sim.others).toHaveLength(5);
    for (const c of mission.enemies) {
      expect(c.ac.id).toBe('bf110c4');
      expect(c.side).toBe('Luftwaffe');
      expect(c.pilot.skillKey).toBe('ace');
      expect(Math.abs(c.plane.body.position.y - 3300)).toBeLessThan(100);
    }
  });

  it('flies the enemy in its side\'s formations: Schwarms then a Rotte; vics of three', () => {
    expect(enemyGroups('Luftwaffe', 6)).toEqual([{ formation: 'schwarm', count: 4 }, { formation: 'rotte', count: 2 }]);
    expect(enemyGroups('Luftwaffe', 1)).toEqual([{ formation: 'single', count: 1 }]);
    expect(enemyGroups('RAF', 5)).toEqual([{ formation: 'vic', count: 3 }, { formation: 'vic', count: 2 }]);
  });

  it('ends once every enemy is gone, with the results END_PAUSE later', () => {
    const { sim, mission } = flying({ count: 2 });
    expect(stepMission(sim, mission)).toBe(false);
    for (const c of mission.enemies) c.pilot.home = true;
    expect(stepMission(sim, mission)).toBe(false);
    expect(mission.outcome).toBe('enemyGone');
    sim.clock += END_PAUSE;
    expect(stepMission(sim, mission)).toBe(true);
    const r = missionResults(sim, mission);
    expect(r.enemiesHome).toBe(2);
    expect(r.kills).toBe(0);
  });

  it('ends when the player is lost, with the cause in the results', () => {
    const { sim, mission } = flying();
    sim.crashed = true;
    sim.crashCause = 'You bailed out';
    stepMission(sim, mission);
    expect(mission.outcome).toBe('lost');
    expect(missionResults(sim, mission).outcomeText).toBe('You bailed out');
  });

  it('a mission ended from the pause menu shows its results at once', () => {
    const { sim, mission } = flying();
    endMission(sim, mission);
    expect(mission.outcome).toBe('ended');
    expect(stepMission(sim, mission)).toBe(true);
  });

  it('a player stopped on his home field after flying has landed', () => {
    const sim = new Simulation(aircraftById.spitfire, 'ground');
    sim.step(DT);
    expect(playerState(sim)).toBe('flying'); // not in the first seconds
    sim.clock = 20;
    expect(playerState(sim)).toBe('landed');
  });
});

describe('kill credit', () => {
  it('credits a kill, a shared kill, a damaged enemy, and nothing for an enemy the player never hit', () => {
    const { sim, mission } = flying({ count: 4 });
    const [a, b, c, d] = mission.enemies;
    noteShooter(sim, a, sim); // the player's hit, then it crashes: his kill
    destroy(sim, a);
    noteShooter(sim, b, sim); // the player hit it, another aircraft finished it: shared
    noteShooter(sim, b, d);
    destroy(sim, b);
    noteShooter(sim, c, sim); // the player's hits in it, and it goes home: damaged
    c.pilot.home = true;
    destroy(sim, d); // never hit by the player (a collision, say): no credit
    stepMission(sim, mission);
    const r = missionResults(sim, mission);
    expect([r.kills, r.shared, r.damaged]).toEqual([1, 1, 1]);
    expect(r.enemiesDestroyed).toBe(3);
    expect(r.hitsGiven).toBe(3);
  });

  it('an enemy lost more than CREDIT_TIME after the player\'s last hit is only shared', () => {
    const { sim, mission } = flying({ count: 1 });
    const [a] = mission.enemies;
    noteShooter(sim, a, sim);
    sim.clock += CREDIT_TIME + 1;
    destroy(sim, a);
    stepMission(sim, mission);
    expect(missionResults(sim, mission).shared).toBe(1);
  });

  it('the player\'s rounds that hit an enemy are recorded as his', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const mission = startMission(sim, createMission({ count: 1 }));
    const [enemy] = mission.enemies;
    // The enemy 200 m dead ahead on the gun line (the nose), flying the player's course at his speed, hands off.
    const { body } = sim.plane;
    const nose = new Vector3(1, 0, 0).applyQuaternion(body.quaternion);
    enemy.plane.body.position.copy(body.position).addScaledVector(nose, 200);
    enemy.plane.body.velocity.copy(body.velocity);
    enemy.plane.body.quaternion.copy(body.quaternion);
    enemy.pilot.fly = () => {};
    sim.input.fireMg = true;
    for (let t = 0; t < 1; t += DT) sim.step(DT);
    expect(enemy.hitsBy?.get(sim) ?? 0).toBeGreaterThan(0);
    expect(enemy.lastHitBy).toBe(sim);
  });
});

describe('missions one after another', () => {
  it('three missions in a row leave nothing behind', () => {
    const sim = new Simulation(aircraftById.spitfire, 'ground');
    let previous = [];
    for (const count of [3, 1, 6]) {
      for (let i = 0; i < 120; i += 1) sim.step(DT);
      const mission = startMission(sim, createMission({ count, enemy: 'bf109e4' }));
      expect(sim.others).toHaveLength(count);
      expect(previous.every((c) => c.gone)).toBe(true);
      expect(mission.enemies.some((c) => previous.includes(c))).toBe(false);
      expect(sim.projectiles.live).toHaveLength(0);
      expect(sim.falling).toHaveLength(0);
      expect(sim.crashed).toBe(false);
      expect(sim.hitsBy).toBeNull();
      previous = mission.enemies;
    }
    expect(new Vector3().copy(sim.plane.body.position).y).toBeGreaterThan(500);
  });
});
