// Bailing out (D80): each type's crew; AI crews abandon aircraft that are lost or badly damaged, one man after another,
// and the aircraft flies on without them; a dead pilot doesn't jump; men still aboard when it hits the ground are lost.
// The player bails out automatically when the aircraft is lost, or by holding the key for a second; the flight ends with
// him under his parachute.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createPilot } from '../../src/ai/basic.js';
import { doomed, badlyDamaged, HOLD_TO_BAIL } from '../../src/core/bailout.js';

const DT = 1 / 120;
const run = (sim, t) => { for (let s = 0; s < t; s += DT) sim.step(DT); };

/** An AI aircraft of type `id` 1 km ahead of the player and 300 m above, flying away from him. */
function aiCraft(sim, id) {
  const ac = aircraftById[id];
  const p = sim.plane.body.position;
  const craft = new Craft(ac, {
    start: { altitude: p.y + 300, speed: 100, heading: 0, throttle: levelThrottle(ac, p.y + 300, 100, 1), rpm: 1, x: p.x + 3000, z: p.z - 1000 },
    pilot: createPilot({ role: 'bomber', seed: 2 }), side: 'Luftwaffe', seed: 3, label: `${ac.name} #1`,
  });
  sim.others.push(craft);
  return craft;
}

describe('crews', () => {
  it('one pilot in each fighter, two in the Bf 110, five in the He 111', () => {
    expect(['hurricane', 'spitfire', 'bf109e4', 'bf110c4', 'he111h'].map((id) => aircraftById[id].crew.length)).toEqual([1, 1, 1, 2, 5]);
  });
});

describe('AI crews bailing out', () => {
  it('a Bf 109 pilot whose engine has seized bails out, and his aircraft flies on without him', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const c = aiCraft(sim, 'bf109e4');
    c.plane.engines[0].heat.seized = true;
    expect(badlyDamaged(c.plane)).toBe(true);
    run(sim, 6);
    expect(c.abandoned).toBe(true);
    expect(sim.jumpers).toHaveLength(1);
    expect(sim.jumpers[0].side).toBe('Luftwaffe');
    expect(sim.notice.text).toBe(`${c.label}: pilot bailed out`);
    expect(sim.others).toContain(c); // still flying, pilotless
  });

  it('an He 111 on fire puts out its five men one after another', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const c = aiCraft(sim, 'he111h');
    c.plane.damage.fire = { kind: 'fuel fire', time: 0, zone: 'wingInnerLeft' };
    expect(doomed(c.plane)).toBe(true);
    const counts = [];
    for (let t = 0; t < 16; t += 2) {
      run(sim, 2);
      counts.push(sim.jumpers.length);
    }
    expect(counts[counts.length - 1]).toBe(5);
    expect(counts[1]).toBeLessThan(5); // not all at once
    expect(sim.notice.text).toBe(`${c.label}: 5 crew bailed out`);
  });

  it('a dead pilot does not jump; a Bf 110 whose pilot is dead puts out only its gunner', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const c = aiCraft(sim, 'bf110c4');
    c.plane.damage.pilot = 0;
    c.plane.damage.failed = { cause: 'The pilot was killed', pilotKilled: true, parts: [] };
    c.plane.damage.fire = { kind: 'engine fire', time: 0, zone: 'engineLeft' };
    run(sim, 10);
    expect(sim.jumpers).toHaveLength(1); // the gunner
  });

  it('those still aboard when the aircraft hits the ground are lost', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const c = aiCraft(sim, 'he111h');
    c.plane.body.position.y = sim.world.terrain.surfaceAt(c.plane.body.position.x, c.plane.body.position.z).height + 40;
    c.plane.body.velocity.y = -40;
    c.plane.damage.fire = { kind: 'fuel fire', time: 0, zone: 'cockpit' };
    run(sim, 15);
    expect(sim.others).not.toContain(c);
    expect(sim.jumpers.length).toBeLessThan(5);
  });
});

describe('the player bailing out', () => {
  it('bails out automatically when his aircraft is on fire; the flight ends with him under his parachute', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    sim.plane.damage.fire = { kind: 'fuel fire', time: 0, zone: 'cockpit' };
    run(sim, 1);
    expect(sim.notice.text).toBe('Bailing out!');
    expect(sim.crashed).toBe(false); // still getting out
    run(sim, 4);
    expect(sim.crashed).toBe(true);
    expect(sim.crashCause).toBe('You bailed out');
    expect(sim.playerJumper).not.toBeNull();
    for (let t = 0; t < 600 && !sim.playerJumper.landedAt; t += 1) run(sim, 1);
    expect(['Landed by parachute', 'Came down in the Channel']).toContain(sim.crashCause);
  });

  it('holding the key for a second bails out; a short tap does not', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.input.bailOut = true;
    run(sim, HOLD_TO_BAIL * 0.5);
    sim.input.bailOut = false;
    run(sim, 6);
    expect(sim.bailout).toBeNull();
    sim.input.bailOut = true;
    run(sim, HOLD_TO_BAIL + 0.1);
    sim.input.bailOut = false;
    run(sim, 5);
    expect(sim.playerJumper).not.toBeNull();
  });

  it('from a broken-up aircraft he gets out of the falling wreck', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.damage.failed = { cause: 'The right wing broke', parts: ['wingRight'] };
    run(sim, 3);
    expect(sim.wreck).not.toBeNull();
    expect(sim.playerJumper).not.toBeNull();
  });
});
