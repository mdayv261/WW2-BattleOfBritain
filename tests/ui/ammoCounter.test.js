// The Bf 109's ammunition counter (D65): each tape shows its gun's share of its load, and the round window above it
// turns with every round fired, so it spins while the gun fires and stands still otherwise.
import { describe, it, expect } from 'vitest';
import { counterState } from '../../src/ui/ammoCounter.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

describe('ammunition counter', () => {
  it('shows a full tape and a still window at full load', () => {
    expect(counterState(1000, 1000)).toEqual({ fraction: 1, angle: 0, empty: false });
  });

  it('shortens the tape in proportion to the rounds fired, and empties it', () => {
    expect(counterState(500, 1000).fraction).toBe(0.5);
    expect(counterState(30, 60).fraction).toBe(0.5); // the cannon's drum on the same tape
    expect(counterState(0, 1000).fraction).toBe(0);
  });

  it('turns the window with every round fired, and not otherwise', () => {
    const a = counterState(990, 1000).angle;
    const b = counterState(980, 1000).angle;
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(counterState(980, 1000).angle).toBe(b); // no rounds fired: no turn
  });

  it('spins visibly while an MG 17 fires (1,000 rounds/min) without spinning so fast it blurs', () => {
    const perSecond = counterState(1000 - 1000 / 60, 1000).angle; // rad in one second of firing
    expect(perSecond).toBeGreaterThan(1);
    expect(perSecond).toBeLessThan(10);
  });

  it('reads each column from the simulation\'s guns, in the order left MG 17, cannon, right MG 17', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.guns = { mg17Left: { rounds: 750, capacity: 1000 }, cannon: { rounds: 60, capacity: 60 }, mg17Right: { rounds: 0, capacity: 1000 } };
    const v = instrumentReadings(sim);
    expect(v.ammoCounters.map((c) => c.fraction)).toEqual([0.75, 1, 0]);
    expect(v.ammoCounters[0].angle).toBeGreaterThan(0);
    expect(v.ammoCounters[1].angle).toBe(0);
  });

  it('reads full and still before the guns exist', () => {
    const v = instrumentReadings(new Simulation(aircraftById.bf109e4, 'air'));
    expect(v.ammoCounters.every((c) => c.fraction === 1 && c.angle === 0)).toBe(true);
  });

  it('lights the lamp under a tape red only when its gun is empty', () => {
    expect(counterState(1000, 1000).empty).toBe(false);
    expect(counterState(1, 1000).empty).toBe(false);
    expect(counterState(0, 1000).empty).toBe(true);
    expect(counterState(0, 60).empty).toBe(true);
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.guns = { mg17Left: { rounds: 12, capacity: 1000 }, cannon: { rounds: 0, capacity: 60 }, mg17Right: { rounds: 1000, capacity: 1000 } };
    expect(instrumentReadings(sim).ammoCounters.map((c) => c.empty)).toEqual([false, true, false]);
  });
});
