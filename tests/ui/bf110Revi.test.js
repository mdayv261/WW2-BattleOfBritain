// The Bf 109's instruments and the Revi-110 on the Bf 110 C panel (D107, D130): the airspeed indicator, altimeter, turn
// and bank and strip compass at the Bf 109's size on screen, with its red bezels and setting knobs; the "L ... R"
// instrument gone; the Revi-110, its body cut to its pad, its foot on the panel's top above the climb indicator, clear of
// everything on it, its round glass (as wide as the body, in a holder of the body's width) round the guns' line at
// BF110_AIM.
import { describe, it, expect } from 'vitest';
import {
  BF110_PANEL, BF110_REVI, BF110_AIM, BF109_SCALE, GLASS_ABOVE_110, REVI_110, AXIS, bf110Panel, placer, panelTop110,
} from '../../src/ui/bf110Panel.js';
import { BF109_PANEL, BF109_PX } from '../../src/ui/bf109Panel.js';
import { REVI, shortRevi } from '../../src/ui/reviParts.js';
import { reviPlacement, drawRevi } from '../../src/ui/reviSight.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { FOV } from '../../src/render/cameras.js';

const L = BF110_PANEL;
const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [2560, 1203]];
const PX = 30; // the Bf 110 layout's picture pixels per dial radius
const TOP = 57;

/** A canvas that records lettering, the colours filled and the curves drawn. */
function recorder() {
  const log = { texts: [], fills: [], curves: 0 };
  return new Proxy({}, {
    get: (t, p) => {
      if (p === 'log') return log;
      if (p === 'fillText') return (s) => log.texts.push(String(s));
      if (p === 'fill') return () => log.fills.push(t.fillStyle);
      if (p === 'bezierCurveTo') return () => { log.curves += 1; };
      if (p in t) return t[p];
      return String(p).startsWith('create') ? () => ({ addColorStop() {} }) : () => {};
    },
    set: (t, p, v) => { t[p] = v; return true; },
  });
}

describe('the Bf 109\'s instruments on the Bf 110 panel (D107)', () => {
  const pairs = [['airspeed', 'airspeed'], ['altimeter', 'altimeter'], ['turn', 'turn'], ['stripCompass', 'compass']];

  it('draws them at the Bf 109\'s size on every screen: faces and mountings in pixels as on its panel', () => {
    for (const [w, h] of SCREENS) {
      const r110 = panelRadius(L, w, h);
      const r109 = panelRadius(BF109_PANEL, w, h);
      expect(r110 * BF109_SCALE, `${w}x${h}`).toBeCloseTo(r109, 6);
      const at = placer(0, 0, r110);
      for (const [ours, theirs] of pairs) {
        const [, , face, outer] = at.dial(L.dials[ours]);
        const [, , face109, outer109] = BF109_PANEL.dials[theirs];
        expect(face, ours).toBeCloseTo((face109 / BF109_PX) * r109, 6);
        expect(outer, ours).toBeCloseTo((outer109 / BF109_PX) * r109, 6);
      }
    }
  });

  it('gives the airspeed indicator and altimeter the Bf 109\'s red bezels and setting knobs; the homing instrument is gone', () => {
    const g = recorder();
    bf110Panel(g, 1000, 0, 40, instrumentReadings(new Simulation(aircraftById.bf110c4, 'air')));
    expect(g.log.fills.filter((c) => c === '#8a3a2c')).toHaveLength(2); // two red bezels
    expect(g.log.fills.filter((c) => c === '#0c0c0c').length).toBeGreaterThanOrEqual(2); // their knurled knobs
    expect(L.knobs.setAltimeter[1]).toBeGreaterThan(L.dials.altimeter[1] + L.dials.altimeter[2]); // below the face
    for (const w of ['km/h', 'DREH', 'HÄNGT', 'N']) expect(g.log.texts.some((t) => t.includes(w)), w).toBe(true);
    expect(L.dials.lr).toBeUndefined();
    expect(L.boxes.courseStrip).toBeUndefined();
    expect(L.boxes.recess).toBeUndefined();
  });
});

describe('the Bf 110\'s Revi (D107)', () => {
  it('takes 20% off the body\'s height, then cuts the body to its brown pad (D131); the Bf 109\'s Revi is unchanged', () => {
    const height = (p) => p.y[1] - p.y[0];
    const width = (p) => p.x[1] - p.x[0];
    const short = shortRevi(REVI, 0.8);
    expect(height(short.body)).toBeCloseTo(0.8 * height(REVI.body), 9);
    expect(REVI_110.body).toEqual(REVI_110.pad); // the body the pad's size
    expect(height(REVI_110.body)).toBeCloseTo(height(short.pad), 9);
    expect(width(REVI_110.body)).toBeCloseTo(width(REVI.pad), 9);
    // Everything below the body raised by the same lift as the pad.
    const lift = short.pad.y[0] - REVI_110.pad.y[0];
    expect(REVI_110.block).toBeNull(); // no mounting block or knob (D132)
    expect(REVI_110.knob).toBeNull();
    expect(lift).toBeGreaterThan(0);
    expect(REVI_110.lever).toBeNull(); // no sun filter lever beside the body (D133)
    expect(REVI_110.pivot).toBeNull();
    expect(REVI.body.y).toEqual([1.6, 5.6]);
    expect(shortRevi(REVI, 1)).toEqual(REVI);
  });

  it('is the Revi-110: a round glass as wide as the body, in a holder of the body\'s width, the reticle in its middle', () => {
    const [left, right] = REVI_110.body.x;
    const { cx, cy, radius } = REVI_110.round;
    expect(2 * radius).toBeCloseTo(right - left, 9); // as wide as the body (D130)
    expect(cx).toBeCloseTo((left + right) / 2, 9); // centred over it
    expect([cx, cy]).toEqual([0, 0]); // its middle on the guns' line: the reticle in the middle (D131)
    expect(cy + radius).toBeCloseTo(REVI_110.holder.plate[0], 9); // standing on the holder's plate (D131)
    expect(REVI_110.holder.x).toEqual([left, right]); // the holder as wide as the body
    expect(REVI_110.holder.plate[1]).toBe(REVI_110.body.y[0]); // on the body's top
    for (const k of ['housing', 'filter', 'post']) expect(REVI_110[k], k).toBeNull();
    // Placed round its glass: a square about the circle.
    const p = reviPlacement(1920, 1080, BF110_REVI);
    expect(p.glass.w).toBeCloseTo(2 * radius * p.r, 9);
    expect(p.glass.h).toBeCloseTo(2 * radius * p.r, 9);
    expect(p.glass.x).toBeCloseTo(p.x + (cx - radius) * p.r, 9);
    expect(p.glass.y).toBeCloseTo(p.y - radius * p.r, 9);
    // The Bf 109's keeps its wide glass, housing and bead post.
    expect(REVI.round).toBeUndefined();
    expect(REVI.housing).toBeDefined();
  });

  it('shows the whole reticle ring inside the round glass looking ahead, on every screen (D131)', () => {
    for (const [w, h] of SCREENS) {
      const p = reviPlacement(w, h, BF110_REVI);
      const perRadian = h / 2 / Math.tan((FOV.cockpit * Math.PI) / 360);
      const ring = perRadian * Math.tan(aircraftById.bf110c4.sight.ringMils / 2000);
      expect(ring, `${w}x${h}`).toBeLessThan(REVI_110.round.radius * p.r);
    }
  });

  it('draws the Revi-110\'s round glass at the body\'s width, the Bf 109\'s without it', () => {
    const arcs = (fit) => {
      const radii = [];
      const g = new Proxy({}, {
        get: (t, k) => (k === 'arc' ? (x, y, rad) => radii.push(rad) : k in t ? t[k]
          : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}),
        set: (t, k, v) => { t[k] = v; return true; },
      });
      const p = reviPlacement(1920, 1080, fit);
      drawRevi(g, p, null);
      return { radii, r: p.r };
    };
    const { radii, r } = arcs(BF110_REVI);
    expect(radii.some((x) => Math.abs(x - REVI_110.round.radius * r) < 1e-9)).toBe(true);
    const b = arcs(undefined);
    expect(b.radii.some((x) => x > r)).toBe(false); // no large round glass on the Bf 109's
  });

  it('stands its body\'s foot on the panel\'s top on every screen (D133), the guns\' line inside the glass', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const p = reviPlacement(w, h, BF110_REVI);
      expect(p.y).toBeCloseTo(BF110_AIM * h, 6);
      expect(p.glass.y).toBeLessThan(p.y);
      expect(p.glass.y + p.glass.h).toBeGreaterThan(p.y);
      const panelTop = panelTop110(h, r); // as InstrumentPanel draws it
      expect(L.dials.climb[0]).toBe(AXIS); // above the climb indicator, in the middle
      expect(p.y + REVI_110.body.y[1] * p.r, `${w}x${h}`).toBeCloseTo(panelTop, 6);
    }
    expect(BF110_AIM).toBeGreaterThan(0.35);
    expect(BF110_AIM).toBeLessThan(0.5);
  });

  it('keeps the body clear of every dial and plate on the panel', () => {
    // The Revi's parts in the layout's picture pixels: the guns' line GLASS_ABOVE_110 radii above the panel's top.
    const toPicture = ({ x: [x0, x1], y: [y0, y1] }) => {
      const u = BF109_SCALE * PX;
      const top = TOP - GLASS_ABOVE_110 * PX;
      return [AXIS + x0 * u, top + y0 * u, AXIS + x1 * u, top + y1 * u];
    };
    const overlap = ([al, at, ar, ab], [bl, bt, br, bb]) => al < br && bl < ar && at < bb && bt < ab;
    const things = [
      ...Object.entries(L.dials).map(([n, [x, y, , o]]) => [n, [x - o, y - o, x + o, y + o]]),
      ...Object.entries(L.boxes),
    ];
    for (const part of ['body']) {
      for (const [name, square] of things) expect(overlap(toPicture(REVI_110[part]), square), `${part} / ${name}`).toBe(false);
    }
  });

  it('draws without its cable on the Bf 110, with it on the Bf 109', () => {
    const g110 = recorder();
    drawRevi(g110, reviPlacement(1920, 1080, BF110_REVI), null);
    expect(g110.log.curves).toBe(0);
    const g109 = recorder();
    drawRevi(g109, reviPlacement(1920, 1080), null);
    expect(g109.log.curves).toBe(1);
  });
});
