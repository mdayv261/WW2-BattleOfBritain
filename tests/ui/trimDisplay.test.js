// The elevator trim display (product owner, D74): an upright ±15° scale graduated every degree, NOSE UP at the top and
// NOSE DOWN at the bottom; left of the flaps on the RAF panels, in place of the push button left of the Bf 109's magneto
// switch, and right of the Bf 110's turn and bank.
import { describe, it, expect } from 'vitest';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { BF109_LAYOUT, bf109Panel } from '../../src/ui/bf109Panel.js';
import { BF110_LAYOUT, bf110Panel } from '../../src/ui/bf110Panel.js';
import { trimDisplay, trimLayout, trimY, TRIM_SCALE, TRIM_WORDS } from '../../src/ui/panelControls.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { Keyboard } from '../../src/input/keyboard.js';

/** A 2D context that accepts every drawing call and records the words written and the paths' points. */
function recordingContext() {
  const texts = [];
  const points = [];
  const ctx = new Proxy({}, {
    get(target, prop) {
      if (prop === 'texts') return texts;
      if (prop === 'points') return points;
      if (prop === 'fillText') return (t, x, y) => texts.push({ t: String(t), x, y });
      if (prop === 'moveTo' || prop === 'lineTo') return (x, y) => points.push({ x, y, fill: target.fillStyle });
      if (prop === 'measureText') return (t) => ({ width: String(t).length * 6 });
      if (prop in target) return target[prop];
      if (String(prop).startsWith('create')) return () => ({ addColorStop() {} });
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
  return ctx;
}

const box = { x: 100, y: 200, w: 50, h: 200 };
const R = 40;

describe('elevator trim display (D74)', () => {
  it('reads ±15° at full trim and 0 at neutral, following the T and G keys', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.input.trim = 0;
    sim.step(1 / 120);
    expect(instrumentReadings(sim).trimDegrees).toBeCloseTo(0, 9);
    const keyboard = new Keyboard({ addEventListener() {} });
    keyboard.down.add('KeyT'); // nose up
    for (let i = 0; i < 120 * 30; i += 1) keyboard.update(sim.input, sim.ac, 1 / 120);
    sim.step(1 / 120);
    expect(instrumentReadings(sim).trimDegrees).toBeCloseTo(TRIM_SCALE, 6);
    keyboard.down.clear();
    keyboard.down.add('KeyG'); // nose down
    for (let i = 0; i < 120 * 60; i += 1) keyboard.update(sim.input, sim.ac, 1 / 120);
    sim.step(1 / 120);
    expect(instrumentReadings(sim).trimDegrees).toBeCloseTo(-TRIM_SCALE, 6);
  });

  it('is graduated every degree from 15 up to 15 down, figures every 5, with its words', () => {
    const g = recordingContext();
    trimDisplay(g, box, R, { trimDegrees: 0 });
    const words = g.texts.map((t) => t.t);
    for (const w of ['ELEVATOR', 'TRIM', 'NOSE', 'UP', 'DOWN']) expect(words.some((t) => t.includes(w)), w).toBe(true);
    expect(words.filter((t) => /^\d+$/.test(t)).sort()).toEqual(['0', '10', '10', '15', '15', '5', '5']);
    const L = trimLayout(box, R);
    const ticks = g.points.filter((p) => p.x === L.spine && p.y > L.top - 0.01 && p.y < L.bottom + 0.01);
    expect(ticks.length).toBeGreaterThanOrEqual(2 * TRIM_SCALE + 1);
    // NOSE UP above the scale, NOSE DOWN below it.
    const up = g.texts.find((t) => t.t.includes('UP'));
    const down = g.texts.find((t) => t.t.includes('DOWN'));
    expect(up.y).toBeLessThan(L.top);
    expect(down.y).toBeGreaterThan(L.bottom);
    expect(TRIM_WORDS).toEqual({ title: 'ELEVATOR TRIM', up: 'NOSE UP', down: 'NOSE DOWN' });
  });

  it('points at the top at full nose up, the middle at neutral and the bottom at full nose down', () => {
    const L = trimLayout(box, R);
    expect(trimY(L, TRIM_SCALE)).toBeCloseTo(L.top, 9);
    expect(trimY(L, 0)).toBeCloseTo((L.top + L.bottom) / 2, 9);
    expect(trimY(L, -TRIM_SCALE)).toBeCloseTo(L.bottom, 9);
    expect(trimY(L, 40)).toBe(trimY(L, TRIM_SCALE)); // held at the end of the scale
    const g = recordingContext();
    trimDisplay(g, box, R, { trimDegrees: 10 });
    const tip = g.points.filter((p) => p.fill === '#ffffff')[0];
    expect(tip.y).toBeCloseTo(trimY(L, 10), 9);
  });

  it('Bf 109: in place of the push button, left of the magneto switch; the button is gone', () => {
    expect(BF109_LAYOUT.button).toBeUndefined();
    expect(BF109_LAYOUT.trim.to[0]).toBeLessThan(BF109_LAYOUT.magneto.from[0]);
    const g = recordingContext();
    bf109Panel(g, 500, 0, 40, instrumentReadings(new Simulation(aircraftById.bf109e4, 'air')));
    expect(g.texts.some((t) => t.t === 'ELEVATOR')).toBe(true);
  });

  it('Bf 110: right of the turn and bank, inside the panel', () => {
    const [tx, ty, , half] = BF110_LAYOUT.dials.turn;
    expect(BF110_LAYOUT.trim.from[0]).toBeGreaterThan(tx + half);
    expect(BF110_LAYOUT.trim.from[1]).toBe(ty - half);
    const g = recordingContext();
    bf110Panel(g, 500, 0, 40, instrumentReadings(new Simulation(aircraftById.bf110c4, 'air')));
    expect(g.texts.some((t) => t.t === TRIM_WORDS.title)).toBe(true);
  });
});
