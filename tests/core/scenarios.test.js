// Many aircraft and the scenario keys (Phase 6, D79): each key puts the right aircraft of the right side in the sky, 8
// changes every AI pilot's skill, 0 clears them, there are never more than 12 aircraft; AI rounds hit the player; a
// broken-up AI aircraft falls as a wreck; twelve aircraft run well within real time.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createPilot } from '../../src/ai/basic.js';
import { nextFighterScenario, bomberScenario, cycleSkill, clearAI, MAX_AI } from '../../src/core/scenarios.js';

const DT = 1 / 120;
const kinds = (sim) => sim.others.map((c) => `${c.ac.id}:${c.side}`);

describe('scenario keys', () => {
  it('6 brings Luftwaffe fighters in turn against an RAF player', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const counts = [1, 2, 4, 2].map(() => {
      nextFighterScenario(sim);
      return sim.others.length;
    });
    expect(counts).toEqual([1, 2, 4, 2]);
    expect(kinds(sim)).toEqual(['bf110c4:Luftwaffe', 'bf110c4:Luftwaffe']);
    nextFighterScenario(sim); // and round again
    expect(kinds(sim)).toEqual(['bf109e4:Luftwaffe']);
  });

  it('6 brings RAF fighters against a Luftwaffe player, ahead, higher and coming towards him', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    nextFighterScenario(sim);
    nextFighterScenario(sim);
    expect(kinds(sim)).toEqual(['hurricane:RAF', 'hurricane:RAF', 'hurricane:RAF']);
    const [lead] = sim.others;
    const rel = lead.plane.body.position.clone().sub(sim.plane.body.position);
    expect(rel.length()).toBeGreaterThan(2000);
    expect(rel.y).toBeGreaterThan(400);
    expect(lead.plane.body.velocity.dot(rel)).toBeLessThan(0); // flying towards the player
  });

  it('7: an He 111 Kette with a Rotte of Bf 109 escorts behind and above it (RAF player)', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    bomberScenario(sim);
    expect(kinds(sim)).toEqual(['he111h:Luftwaffe', 'he111h:Luftwaffe', 'he111h:Luftwaffe', 'bf109e4:Luftwaffe', 'bf109e4:Luftwaffe']);
    const [kette, , , escort] = sim.others;
    expect(escort.pilot.role).toBe('escort');
    expect(escort.pilot.leader).toBe(kette);
    expect(escort.plane.body.position.y - kette.plane.body.position.y).toBeCloseTo(500, -1);
    expect(escort.plane.body.position.distanceTo(kette.plane.body.position)).toBeGreaterThan(1500);
  });

  it('7: Hurricanes attacking a friendly Kette (Luftwaffe player)', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    bomberScenario(sim);
    expect(kinds(sim)).toEqual(['he111h:Luftwaffe', 'he111h:Luftwaffe', 'he111h:Luftwaffe', 'hurricane:RAF', 'hurricane:RAF', 'hurricane:RAF']);
  });

  it('8 changes every AI pilot\'s skill; 0 clears them; never more than 12 aircraft', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    nextFighterScenario(sim);
    expect(sim.skill).toBe('regular');
    cycleSkill(sim);
    expect(sim.skill).toBe('ace');
    expect(sim.others.every((c) => c.pilot.skillKey === 'ace')).toBe(true);
    cycleSkill(sim);
    expect(sim.skill).toBe('novice');
    clearAI(sim);
    expect(sim.others).toHaveLength(0);
    for (let i = 0; i < 6; i += 1) {
      nextFighterScenario(sim);
      expect(sim.others.length).toBeLessThanOrEqual(MAX_AI);
    }
    expect(MAX_AI + 1).toBe(12);
  });
});

/** An AI fighter of type `id`, `behind` m behind the player and on his heading. */
function chaser(sim, id, behind) {
  const ac = aircraftById[id];
  const p = sim.plane.body.position;
  const craft = new Craft(ac, {
    start: { altitude: p.y, speed: 110, heading: 0, throttle: levelThrottle(ac, p.y, 110, 1), rpm: 1, x: p.x, z: p.z + behind },
    pilot: createPilot({ role: 'fighter', skill: 'ace', seed: 9 }), side: sim.ac.side === 'RAF' ? 'Luftwaffe' : 'RAF', seed: 4,
  });
  sim.others.push(craft);
  return craft;
}

describe('many aircraft', () => {
  it('an AI fighter\'s rounds hit the player', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    chaser(sim, 'bf109e4', 800);
    for (let i = 0; i < 120 * 90 && sim.plane.damage.hits === 0; i += 1) sim.step(DT);
    expect(sim.plane.damage.hits).toBeGreaterThan(0);
  });

  it('an AI aircraft that breaks up falls as a wreck, reported by name', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    nextFighterScenario(sim);
    const [c] = sim.others;
    c.plane.damage.failed = { cause: 'The tail broke away', parts: ['tail'] };
    sim.step(DT);
    expect(sim.others).toHaveLength(0);
    expect(sim.falling.length).toBe(2);
    expect(sim.notice.text).toBe(`${c.label} destroyed: The tail broke away`);
  });

  it('twelve aircraft, all flying and fighting, run in well under real time', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    bomberScenario(sim); // 5
    for (let i = 0; i < 6; i += 1) chaser(sim, i % 2 ? 'bf109e4' : 'bf110c4', 1500 + 200 * i);
    expect(sim.others).toHaveLength(11);
    const t0 = performance.now();
    for (let i = 0; i < 120 * 10; i += 1) sim.step(DT);
    const msPerSecond = (performance.now() - t0) / 10;
    expect(msPerSecond).toBeLessThan(100); // in the browser this budget is shared with drawing: measured there too
  });
});
