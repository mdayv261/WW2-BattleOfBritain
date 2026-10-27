// The Bf 109's ammunition counter (D65): each tape shows its gun's share of its load, and the round window above it
// turns with every round fired, so it spins while the gun fires and stands still otherwise.
import { describe, it, expect } from 'vitest';
import { counterState, counterLayout } from '../../src/ui/ammoCounter.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

/** Sets some of the Bf 109's guns' rounds left, by gun id. */
function setRounds(sim, rounds) {
  for (const gun of sim.armament) if (gun.id in rounds) gun.rounds = rounds[gun.id];
}

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
    setRounds(sim, { mg17Left: 750, mg17Right: 0 }); // the cannon stay full
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
    setRounds(sim, { mg17Left: 12, cannonLeft: 0, cannonRight: 0 });
    expect(instrumentReadings(sim).ammoCounters.map((c) => c.empty)).toEqual([false, true, false]);
  });

  it('runs each full tape down to just above its plate (the light), without touching it', () => {
    for (const box of [{ x: 100, y: 100, w: 78, h: 50 }, { x: 0, y: 0, w: 120, h: 77 }, { x: 50, y: 50, w: 260, h: 166 }]) {
      const { columns } = counterLayout(box);
      for (const c of columns) {
        const gap = c.plate.y - c.tape.bottom;
        expect(gap, `${box.w}: gap`).toBeGreaterThan(0);
        expect(gap, `${box.w}: gap`).toBeLessThanOrEqual(0.1 * c.frame.w);
        expect(c.tape.top, `${box.w}: below the window`).toBeGreaterThan(c.window.y + c.window.r);
        expect(c.frame.y + c.frame.h, `${box.w}: frame reaches the plate`).toBeLessThanOrEqual(c.plate.y);
        expect(c.tape.bottom, `${box.w}: tape inside its frame`).toBeLessThanOrEqual(c.frame.y + c.frame.h);
      }
      // The plates sit side by side, each under its own column.
      for (let i = 1; i < 3; i += 1) expect(columns[i].plate.x).toBeGreaterThan(columns[i - 1].plate.x + columns[i - 1].plate.w);
    }
  });
});
