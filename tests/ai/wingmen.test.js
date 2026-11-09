// The player's wingmen (Phase 7 checkpoint 2, D227): they take the places behind his in his side's formation (a vic, a
// Rotte or a Schwarm), keep them while no enemy is near, go for an enemy attacking him, and come back once it's gone.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { spawnWingmen, flightFormation, FRIENDLY_SKILL } from '../../src/core/wingmen.js';
import { slotPoint } from '../../src/ai/basic.js';
import { fighter } from '../../src/dev/duels.js';

const DT = 1 / 120;

describe('the player\'s wingmen', () => {
  it('fly in their side\'s formation with the player at its head, at the friendly skill', () => {
    expect(flightFormation('RAF', 2)).toBe('vic');
    expect(flightFormation('Luftwaffe', 1)).toBe('rotte');
    expect(flightFormation('Luftwaffe', 3)).toBe('schwarm');
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.skill = 'ace';
    const w = spawnWingmen(sim, 3);
    expect(w).toHaveLength(3);
    for (const c of w) {
      expect(c.ac.id).toBe('bf109e4');
      expect(c.side).toBe('Luftwaffe');
      expect(c.pilot.leader).toBe(sim.player);
      expect(c.pilot.skillKey).toBe(FRIENDLY_SKILL);
    }
  });

  for (const [id, n] of [['spitfire', 2], ['bf109e4', 3]]) {
    it(`${id}: ${n} wingmen keep their places within 100 m for a minute with no enemy near`, () => {
      const sim = new Simulation(aircraftById[id], 'air');
      const w = spawnWingmen(sim, n);
      let worst = 0;
      for (let i = 0; i < 120 * 60; i += 1) {
        sim.step(DT);
        if (i > 120 * 5) for (const c of w) worst = Math.max(worst, slotPoint(sim.player, c.pilot.slot).distanceTo(c.plane.body.position));
      }
      expect(worst).toBeLessThan(100);
      expect(w.every((c) => c.pilot.state === 'patrol')).toBe(true);
    });
  }

  it('go for an enemy attacking the player, and come back to their places once it has gone', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const [wingman] = spawnWingmen(sim, 1);
    // A Bf 109 400 m behind the player, nose on to him and closing.
    const back = sim.plane.body.velocity.clone().normalize().multiplyScalar(-400);
    const at = sim.plane.body.position.clone().add(back);
    const heading = Math.atan2(-back.x, back.z);
    const enemy = fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', at, heading, { speed: 130 });
    enemy.pilot.fly = () => {}; // it just flies on at the player
    for (let i = 0; i < 120 * 2; i += 1) sim.step(DT);
    expect(wingman.pilot.target?.craft).toBe(enemy);
    expect(wingman.pilot.state).not.toBe('patrol');
    enemy.gone = true;
    sim.others = sim.others.filter((c) => c !== enemy);
    for (let i = 0; i < 120 * 8; i += 1) sim.step(DT); // an evasive manoeuvre already begun runs its course (up to 6 s)
    expect(wingman.pilot.state).toBe('patrol');
    expect(new Vector3().copy(wingman.plane.body.position).distanceTo(sim.plane.body.position)).toBeLessThan(3000);
  });
});
