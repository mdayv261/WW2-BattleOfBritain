// The Hurricane and Spitfire panel after the product owner's reference picture (D86): everything inside the arched panel,
// no two dials overlapping, the clock left of the UP/DOWN indicator, the panel kept below the reflector sight; the oil
// pressure, trim gauge, clock, rev counter and bands; the UP/DOWN indicator and the flap lever working.
import { describe, it, expect } from 'vitest';
import { SPITFIRE_PANEL, P, rafPanel } from '../../src/ui/rafPanel.js';
import { trimNeedle, clockAngles, TRIM_SWING, OIL_PRESSURE_RANGE } from '../../src/ui/rafPanelDials.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { C } from '../../src/ui/panelParts.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

const L = SPITFIRE_PANEL;
const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [1568, 771]];

/** Whether a point (dial radii) lies inside the panel's outline. */
function inside([px, py]) {
  let hit = false;
  const pts = L.outline;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** A canvas that records lettering (with its colour) and arcs (with the stroke colour). */
function recorder() {
  const texts = [];
  const arcs = [];
  const ctx = new Proxy({}, {
    get(target, prop) {
      if (prop === 'texts') return texts;
      if (prop === 'arcs') return arcs;
      if (prop === 'fillText') return (t, x, y) => texts.push({ t: String(t), x, y, colour: target.fillStyle });
      if (prop === 'arc') return (...a) => arcs.push({ a, colour: target.strokeStyle });
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

const draw = (v) => {
  const g = recorder();
  rafPanel(g, 1000, 0, 40, v, new Date(2026, 9, 28, 14, 30, 15));
  return g;
};

describe('Spitfire I panel layout (D86)', () => {
  it('puts every dial, box and knob inside the arched panel', () => {
    for (const [name, [x, y, , bezel]] of Object.entries(L.dials)) {
      for (let k = 0; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2;
        expect(inside(P(x + Math.cos(a) * bezel, y + Math.sin(a) * bezel)), name).toBe(true);
      }
    }
    for (const [name, [l, t, r, b]] of Object.entries(L.boxes)) {
      for (const corner of [[l, t], [r, t], [l, b], [r, b]]) expect(inside(P(...corner)), name).toBe(true);
    }
    for (const [name, [x, y]] of Object.entries(L.knobs)) expect(inside(P(x, y)), name).toBe(true);
  });

  it('keeps every dial clear of the others', () => {
    const dials = Object.entries(L.dials);
    for (let i = 0; i < dials.length; i += 1) {
      for (let j = i + 1; j < dials.length; j += 1) {
        const [na, [xa, ya, , ra]] = dials[i];
        const [nb, [xb, yb, , rb]] = dials[j];
        expect(Math.hypot(xa - xb, ya - yb), `${na} / ${nb}`).toBeGreaterThan(ra + rb);
      }
    }
  });

  it('has the clock left of the undercarriage UP/DOWN indicator, as the picture', () => {
    const [cx, , , cr] = L.dials.clock;
    expect(cx + cr).toBeLessThan(L.boxes.gearIndicator[0]);
  });

  it('stays below the reflector sight in the middle of the view on every screen', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      expect(L.height * r, `${w}x${h}`).toBeLessThanOrEqual(0.45 * h + 1e-6);
      expect(L.width * r, `${w}x${h}`).toBeLessThanOrEqual(0.96 * w + 1e-6);
    }
    expect(panelRadius(L, 2560, 1259)).toBeGreaterThan(40); // the airspeed indicator's face radius, px
  });
});

describe('Spitfire I panel instruments (D86)', () => {
  it('reads the Merlin\'s normal 60 lb/sq in oil pressure while it runs, nothing with it stopped (S33)', () => {
    expect(instrumentReadings(new Simulation(aircraftById.spitfire, 'air')).oilPressure).toBeCloseTo(60, 3);
    expect(instrumentReadings(new Simulation(aircraftById.spitfire, 'ground')).oilPressure).toBe(0);
    expect(instrumentReadings(new Simulation(aircraftById.bf109e4, 'air')).oilPressure).toBeNull();
    expect(OIL_PRESSURE_RANGE).toBeGreaterThan(60);
  });

  it('swings the trim gauge\'s needle up for nose-up trim, down for nose down, level at neutral', () => {
    expect(trimNeedle(0)).toBe(-0);
    expect(trimNeedle(15)).toBeCloseTo(-TRIM_SWING * Math.PI / 180, 9);
    expect(trimNeedle(-15)).toBeCloseTo(TRIM_SWING * Math.PI / 180, 9);
    expect(trimNeedle(40)).toBe(trimNeedle(15));
  });

  it('sets the clock\'s hands from the time', () => {
    const a = clockAngles(new Date(2026, 9, 28, 15, 30, 0));
    expect(a.hour).toBeCloseTo((3.5 / 12) * 2 * Math.PI, 9);
    expect(a.minute).toBeCloseTo(Math.PI, 9);
    expect(a.second).toBeCloseTo(0, 9);
  });

  it('draws the picture\'s instruments and placards, with the green and orange bands (D85)', () => {
    const g = draw(instrumentReadings(new Simulation(aircraftById.spitfire, 'air')));
    const words = new Set(g.texts.map((t) => t.t));
    for (const w of ['BOOST', 'PRESS', 'R.P.M.', 'RAD', 'OIL', 'GALLONS  FUEL', 'F.S. GEAR', 'MAGNETO', 'VOLTS', 'NOSE',
      'FLAPS MUST NOT BE', 'OXYGEN REGULATOR MARK VIIIC', 'PULL DOWN FOR NIGHT USE', 'FLOOD LIGHTS', 'DUNLOP', 'M.P.H.']) {
      expect(words.has(w), w).toBe(true);
    }
    expect(g.arcs.some((a) => a.colour === C.green)).toBe(true);
    expect(g.arcs.some((a) => a.colour === C.orange)).toBe(true);
  });

  it('lights UP red with the undercarriage up and DOWN green with it down; the flap lever follows the flaps', () => {
    const colourOf = (g, word, size) => g.texts.filter((t) => t.t === word).map((t) => t.colour);
    const up = draw({ ...instrumentReadings(new Simulation(aircraftById.spitfire, 'air')), gearUp: true, gearDown: false, flaps: 0 });
    expect(colourOf(up, 'UP')).toContain('#ff2e1e');
    expect(colourOf(up, 'DOWN')).not.toContain('#d6e43e');
    const down = draw({ ...instrumentReadings(new Simulation(aircraftById.spitfire, 'air')), gearUp: false, gearDown: true, flaps: 1 });
    expect(colourOf(down, 'DOWN')).toContain('#d6e43e');
    expect(colourOf(down, 'UP')).not.toContain('#ff2e1e');
    // The flap lever's paddle reads DOWN with the flaps down, UP with them up (its own grey lettering).
    expect(colourOf(down, 'DOWN')).toContain('#b4b4b0');
    expect(colourOf(up, 'UP')).toContain('#b4b4b0');
    const moving = draw({ ...instrumentReadings(new Simulation(aircraftById.spitfire, 'air')), gearUp: false, gearDown: false });
    expect(colourOf(moving, 'UP')).not.toContain('#ff2e1e');
    expect(colourOf(moving, 'DOWN')).not.toContain('#d6e43e');
  });
});
