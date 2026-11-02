// The Bf 109's instruments and Revi on the Bf 110 C panel (D107): the airspeed indicator, altimeter, turn and bank and
// strip compass at the Bf 109's size on screen, with its red bezels and setting knobs; the "L ... R" instrument gone; the
// Revi with its body 20% shorter standing on the panel above the turn and bank, clear of everything on it, its glass
// round the guns' line at BF110_AIM.
import { describe, it, expect } from 'vitest';
import {
  BF110_PANEL, BF110_REVI, BF110_AIM, BF109_SCALE, GLASS_ABOVE_110, REVI_110, AXIS, bf110Panel, placer,
} from '../../src/ui/bf110Panel.js';
import { BF109_PANEL, BF109_PX } from '../../src/ui/bf109Panel.js';
import { REVI, shortRevi } from '../../src/ui/reviParts.js';
import { reviPlacement, drawRevi } from '../../src/ui/reviSight.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

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
  it('takes 20% off the body\'s height; the glasses are unchanged and the Bf 109\'s Revi too', () => {
    const height = (p) => p.y[1] - p.y[0];
    expect(height(REVI_110.body)).toBeCloseTo(0.8 * height(REVI.body), 9);
    expect(REVI_110.glass).toEqual(REVI.glass);
    expect(REVI_110.housing).toEqual(REVI.housing);
    expect(REVI_110.knob.y[1]).toBeCloseTo(REVI.knob.y[1] - 0.2 * height(REVI.body), 9); // moved up by the height cut
    expect(REVI_110.pad.y[1]).toBeLessThanOrEqual(REVI_110.body.y[1]);
    expect(REVI_110.lever.y[1]).toBeLessThanOrEqual(REVI_110.body.y[1]);
    expect(REVI.body.y).toEqual([1.6, 5.6]);
    expect(shortRevi(REVI, 1)).toEqual(REVI);
  });

  it('stands its knob just above the climb indicator (D108) on every screen, the guns\' line at BF110_AIM inside the glass', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const p = reviPlacement(w, h, BF110_REVI);
      expect(p.y).toBeCloseTo(BF110_AIM * h, 6);
      expect(p.glass.y).toBeLessThan(p.y);
      expect(p.glass.y + p.glass.h).toBeGreaterThan(p.y);
      const panelTop = h - (L.height * r + 6) + 3; // as InstrumentPanel draws it
      const [climbX, climbY, , climbOuter] = L.dials.climb;
      expect(climbX).toBe(AXIS); // under the Revi in the middle
      const mountTop = panelTop + ((climbY - climbOuter - TOP) / PX) * r;
      const knobFoot = p.y + REVI_110.knob.y[1] * p.r;
      expect(knobFoot, `${w}x${h}`).toBeLessThan(mountTop);
      expect(mountTop - knobFoot, `${w}x${h}`).toBeLessThan(r);
    }
    expect(BF110_AIM).toBeGreaterThan(0.35);
    expect(BF110_AIM).toBeLessThan(0.5);
  });

  it('keeps the body, lever, block and knob clear of every dial and plate on the panel', () => {
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
    for (const part of ['body', 'lever', 'block', 'knob']) {
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
