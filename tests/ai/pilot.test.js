// The AI pilot's hands (Phase 6, D79): it flies the same flight model through the same controls as the player, never
// moving them past their travel or faster than its skill's hand can; it flies to a point, keeps a formation slot, and
// pursues and shoots an enemy with lead.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { attitude } from '../../src/core/autopilot.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createHands, fly } from '../../src/ai/pilot.js';
import { slotPoint } from '../../src/ai/basic.js';
import { createPilot } from '../../src/ai/pilots.js';
import { SKILLS } from '../../src/ai/skill.js';
import { roundFlight } from '../../src/ai/gunnery.js';
import { flightTable } from '../../src/weapons/ballistics.js';
import { ballistics } from '../../src/aircraft/ammunition.js';
import { bomberScenario } from '../../src/core/scenarios.js';

const DT = 1 / 120;

/** An AI craft of type `id` in level flight in `sim`, `ahead` m ahead of the player and `up` m above, on `heading`. */
function aiCraft(sim, id, { ahead = 0, side = 0, up = 0, heading = 0, role = 'fighter', skill = 'regular', craftSide } = {}) {
  const ac = aircraftById[id];
  const p = sim.plane.body.position;
  const altitude = p.y + up;
  const pilot = createPilot({ role, skill, seed: 3 });
  const craft = new Craft(ac, {
    start: { altitude, speed: 110, heading, throttle: levelThrottle(ac, altitude, 110, 1), rpm: 1, x: p.x + side, z: p.z - ahead },
    pilot, side: craftSide ?? (sim.ac.side === 'RAF' ? 'Luftwaffe' : 'RAF'), skill, seed: 5,
  });
  sim.others.push(craft);
  return craft;
}

/** The player's hand on the stick: holds the wings level against any roll (D84). */
function holdWingsLevel(sim) {
  const { bank } = attitude(sim.plane);
  sim.input.roll = Math.max(-1, Math.min(1, -3 * bank - sim.plane.body.angularVelocity.x));
}

describe('the AI pilot\'s hands', () => {
  for (const id of ['hurricane', 'spitfire', 'bf109e4', 'bf110c4']) {
    it(`${id}: flies to a point 2 km off to the side within 60 s`, () => {
      const sim = new Simulation(aircraftById[id], 'air');
      const craft = { plane: sim.plane, input: sim.input };
      const hands = createHands(SKILLS.regular);
      const point = sim.plane.body.position.clone().add(new Vector3(2000, 200, 0));
      let best = Infinity;
      for (let t = 0; t < 60 && best > 50; t += DT) {
        fly(craft, hands, { direction: point.clone().sub(sim.plane.body.position).normalize(), gMax: 4, speed: 110 }, DT);
        sim.step(DT);
        best = Math.min(best, point.distanceTo(sim.plane.body.position));
      }
      expect(best).toBeLessThan(50);
    });
  }

  it('keeps every control within its travel and moves it no faster than the skill\'s hand', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    const ai = aiCraft(sim, 'spitfire', { ahead: -1500, skill: 'novice' });
    const limit = (2 * DT) / SKILLS.novice.stickTime + 1e-9;
    let last = { ...ai.input };
    for (let i = 0; i < 120 * 30; i += 1) {
      sim.step(DT);
      for (const k of ['pitch', 'roll', 'yaw']) {
        expect(Math.abs(ai.input[k])).toBeLessThanOrEqual(1);
        expect(Math.abs(ai.input[k] - last[k])).toBeLessThanOrEqual(limit);
      }
      expect(ai.input.throttle).toBeGreaterThanOrEqual(0);
      expect(ai.input.throttle).toBeLessThanOrEqual(1);
      last = { ...ai.input };
    }
  });

  it('a Spitfire pursuing a Bf 109 flying straight closes within its firing range and hits it', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air'); // the player's Bf 109 flies straight, hands off
    // Throttled back to cruise from the full-power start, the pilot holding the wings level (D84: rigged for full power).
    sim.input.throttle = levelThrottle(sim.ac, 1500, 110, 1);
    const ai = aiCraft(sim, 'spitfire', { ahead: -1500, up: 200, skill: 'ace' });
    let closest = Infinity;
    for (let i = 0; i < 120 * 120 && sim.plane.damage.hits === 0; i += 1) {
      holdWingsLevel(sim);
      sim.step(DT);
      closest = Math.min(closest, ai.plane.body.position.distanceTo(sim.plane.body.position));
    }
    expect(closest).toBeLessThan(SKILLS.ace.fireRange + 20);
    expect(sim.plane.damage.hits).toBeGreaterThan(0);
  });

  it('aims ahead by its rounds\' time of flight, read from the same ballistics', () => {
    const [row] = flightTable(ballistics.mk7, [300]);
    const f = roundFlight('mk7', 300);
    expect(f.time).toBeCloseTo(row.time, 3);
    expect(f.drop).toBeCloseTo(row.drop, 3);
  });

  it('a Kette keeps its slots within 30 m for a minute', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    bomberScenario(sim);
    sim.plane.body.position.x += 50000; // the player far away: the escorts stay in place
    const kette = sim.others.filter((c) => c.ac.id === 'he111h');
    let worst = 0;
    for (let i = 0; i < 120 * 60; i += 1) {
      sim.step(DT);
      if (i > 120 * 5) {
        for (const c of kette.slice(1)) worst = Math.max(worst, slotPoint(kette[0], c.pilot.slot).distanceTo(c.plane.body.position));
      }
    }
    expect(worst).toBeLessThan(30);
  });
});
