// The ammunition counter built for the Bf 109 (D64, D65), now on the Bf 110 C's panel (D113): each tape shows its guns'
// share of their load, and the round window above it turns with every round fired, so it spins while the guns fire and
// stands still otherwise.
import { describe, it, expect } from 'vitest';
import { counterState, counterLayout } from '../../src/ui/ammoCounter.js';
import { ammoColumns } from '../../src/ui/bf110Fittings.js';
import { BF110_PANEL } from '../../src/ui/bf110Panel.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

/** Sets some of the Bf 110's guns' rounds left, by gun id. */
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

  it('reads each column from the Bf 110\'s guns: the left MG 17 pair, both MG FF, the right MG 17 pair', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    const full = sim.armament.find((x) => x.id === 'mg17UpperLeft').capacity;
    setRounds(sim, { mg17UpperLeft: full / 2, mg17UpperRight: 0, mg17LowerRight: 0 }); // the cannon stay full
    const c = ammoColumns(instrumentReadings(sim));
    expect(c.map((x) => x.fraction)).toEqual([0.75, 1, 0]);
    expect(c[0].angle).toBeGreaterThan(0);
    expect(c[1].angle).toBe(0);
  });

  it('reads full and still at full load', () => {
    const c = ammoColumns(instrumentReadings(new Simulation(aircraftById.bf110c4, 'air')));
    expect(c.every((x) => x.fraction === 1 && x.angle === 0 && !x.empty)).toBe(true);
  });

  it('keeps the Bf 109 counter\'s shape on the Bf 110 panel (57 x 36.5 on the old Bf 109 layout)', () => {
    const [l, t, r, b] = BF110_PANEL.boxes.ammo;
    expect((r - l) / (b - t)).toBeCloseTo(57 / 36.5, 2);
  });

  it('lights the lamp under a tape red only when its gun is empty', () => {
    expect(counterState(1000, 1000).empty).toBe(false);
    expect(counterState(1, 1000).empty).toBe(false);
    expect(counterState(0, 1000).empty).toBe(true);
    expect(counterState(0, 60).empty).toBe(true);
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    setRounds(sim, { mg17UpperLeft: 12, mg17LowerLeft: 0, cannonLeft: 0, cannonRight: 0 });
    expect(ammoColumns(instrumentReadings(sim)).map((c) => c.empty)).toEqual([false, true, false]);
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
