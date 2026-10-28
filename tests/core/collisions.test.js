// Mid-air collisions (D82): aircraft flown into each other both break up, losing the part they were struck on; a near
// miss isn't a collision; a fast pass through a thin wing is caught; the player's flight ends; formations never touch;
// the check is cheap.
import { describe, it, expect } from 'vitest';
import { Vector3, Quaternion } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createPilot } from '../../src/ai/pilots.js';
import { collide, partStruck } from '../../src/core/collisions.js';
import { bomberScenario } from '../../src/core/scenarios.js';

const DT = 1 / 120;

/** An aircraft pose for `collide`: at `at`, on heading `heading` (rad), moved `step` (Vector3) since the last step. */
function pose(id, at, heading, step) {
  const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2 - heading);
  return {
    ac: aircraftById[id],
    body: { position: at.clone(), quaternion },
    previous: { position: at.clone().sub(step), quaternion: quaternion.clone() },
  };
}

/** An AI aircraft flying straight on `heading` at `at`, steered by nobody (it holds its course). */
function straight(sim, id, at, heading, label) {
  const ac = aircraftById[id];
  const craft = new Craft(ac, {
    start: { altitude: at.y, speed: 110, heading, throttle: levelThrottle(ac, at.y, 110, 1), rpm: 1, x: at.x, z: at.z },
    pilot: createPilot({ role: 'bomber', seed: 1 }), side: 'Luftwaffe', seed: 2, label,
  });
  sim.others.push(craft);
  return craft;
}

describe('mid-air collisions', () => {
  it('two aircraft flown into each other head-on both break up, each told who hit it', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.body.position.x += 100000; // the player out of the way
    const p = new Vector3(0, 1500, 0);
    const a = straight(sim, 'bf109e4', p.clone().add(new Vector3(0, 0, 600)), 0, 'Bf 109 #A'); // heading north
    const b = straight(sim, 'hurricane', p.clone().add(new Vector3(0, 0, -600)), Math.PI, 'Hurricane #B'); // south
    for (let i = 0; i < 120 * 10 && !(a.plane.damage.failed && b.plane.damage.failed); i += 1) sim.step(DT);
    expect(a.plane.damage.failed.cause).toBe('Mid-air collision with Hurricane #B');
    expect(b.plane.damage.failed.cause).toBe('Mid-air collision with Bf 109 #A');
    sim.step(DT);
    expect(sim.others).toHaveLength(0); // both now wrecks
    expect(sim.falling.length).toBeGreaterThanOrEqual(2);
  });

  it('a near miss 30 m apart is not a collision', () => {
    const a = pose('spitfire', new Vector3(0, 1000, 0), 0, new Vector3(0, 0, -2));
    const b = pose('bf109e4', new Vector3(30, 1000, 0), Math.PI, new Vector3(0, 0, 2));
    expect(collide(a, b)).toBeNull();
  });

  it('a fast pass through a wing tip is caught, though the wing is thinner than a step\'s travel', () => {
    // Side by side, only the wing tips overlapping: the Bf 109's left tip drops through the Spitfire's right tip at
    // 300 m/s, 2.5 m in one step, from above it to below it.
    const spit = pose('spitfire', new Vector3(0, 1000, 0), 0, new Vector3(0, 0, 0));
    const apart = aircraftById.spitfire.geometry.span / 2 + aircraftById.bf109e4.geometry.span / 2 - 0.5;
    const beside = new Vector3(0, 0, apart).applyQuaternion(spit.body.quaternion).add(spit.body.position);
    const bf = pose('bf109e4', beside.add(new Vector3(0, -1.25, 0)), 0, new Vector3(0, -2.5, 0));
    const hit = collide(spit, bf);
    expect(hit).not.toBeNull();
    expect(partStruck(hit.zoneA)).toEqual(['wingRight']);
    expect(partStruck(hit.zoneB)).toEqual(['wingLeft']);
    // The same pass a few metres further out misses.
    const clear = pose('bf109e4', bf.body.position.clone().add(new Vector3(3, 0, 0)), 0, new Vector3(0, -2.5, 0));
    expect(collide(spit, clear)).toBeNull();
  });

  it('the player flying into an AI aircraft ends his flight; the AI is destroyed and reported', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const p = sim.plane.body.position;
    const other = straight(sim, 'bf110c4', p.clone().add(new Vector3(0, 0, -700)), Math.PI, 'Bf 110 C-4 #1');
    for (let i = 0; i < 120 * 10 && !sim.crashed; i += 1) sim.step(DT);
    expect(sim.crashCause).toBe('Mid-air collision with Bf 110 C-4 #1');
    sim.step(DT);
    expect(sim.others).not.toContain(other);
    expect(sim.notice.text).toBe('Bf 110 C-4 #1 destroyed: Mid-air collision with you');
  });

  it('aircraft in formation never touch, and twelve aircraft check cheaply', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    bomberScenario(sim);
    sim.plane.body.position.x += 100000;
    const t0 = performance.now();
    for (let i = 0; i < 120 * 30; i += 1) sim.step(DT);
    expect(sim.others).toHaveLength(5);
    expect(sim.others.every((c) => !c.plane.damage.failed)).toBe(true);
    expect((performance.now() - t0) / 30).toBeLessThan(100); // ms per simulated second
  });
});
