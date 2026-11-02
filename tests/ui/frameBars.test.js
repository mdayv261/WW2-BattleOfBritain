// Welded cockpit frames (D104): every bar's outline is drawn before any bar's band, so no outline crosses a joint; a
// bar's edges are trimmed back at its ends; and the Bf 109's and RAF fighters' bars come in welded order.
import { describe, it, expect } from 'vitest';
import { drawFrames, trimmed } from '../../src/ui/frameBars.js';
import { frameBars } from '../../src/ui/bf109Frame.js';
import { rafFrameBars, RAF_FRAMES } from '../../src/ui/rafFrame.js';
import { placer as bf109Placer } from '../../src/ui/bf109Panel.js';
import { placer as rafPlacer } from '../../src/ui/rafPanel.js';

const STYLE = { band: 'band', lit: 'lit', shade: 'shade', rivet: 'rivet', outline: 'outline' };

/** A canvas that records the colour of each stroke, in order. */
function recorder() {
  const strokes = [];
  return new Proxy({}, {
    get(t, p) {
      if (p === 'strokes') return strokes;
      if (p === 'stroke') return () => strokes.push(t.strokeStyle);
      return p in t ? t[p] : () => {};
    },
    set(t, p, v) {
      t[p] = v;
      return true;
    },
  });
}

describe('welded frames (D104)', () => {
  it('draws every outline before any band, so no outline shows across a joint', () => {
    const g = recorder();
    const bars = [{ pts: [[0, 0], [100, 0]], w: 10, trim: [0, 0] }, { pts: [[50, 0], [50, 100]], w: 10, trim: [5, 0] }];
    drawFrames(g, bars, STYLE);
    const lastOutline = g.strokes.lastIndexOf('outline');
    const firstBand = g.strokes.indexOf('band');
    expect(lastOutline).toBeLessThan(firstBand);
    expect(g.strokes.filter((s) => s === 'outline')).toHaveLength(2);
  });

  it('trims a path\'s ends by distance along it', () => {
    expect(trimmed([[0, 0], [100, 0]], 10, 20)).toEqual([[10, 0], [80, 0]]);
    const bent = trimmed([[0, 0], [100, 0], [100, 100]], 50, 50);
    expect(bent).toEqual([[50, 0], [100, 0], [100, 50]]);
    expect(trimmed([[0, 0], [10, 0]], 6, 6)).toEqual([]);
  });

  it('lists the Bf 109\'s and the RAF fighters\' bars coaming first, joining bars trimmed at their ends', () => {
    const b109 = frameBars(bf109Placer(1000, 300, 45));
    expect(b109.length).toBe(9); // coaming, two sides, hood, two posts, cross bar, two braces
    for (const b of b109.slice(1)) expect(b.trim[0] + b.trim[1]).toBeGreaterThan(0);
    for (const id of ['hurricane', 'spitfire']) {
      const bars = rafFrameBars(rafPlacer(1000, 300, 40), RAF_FRAMES[id]);
      expect(bars[0].trim).toEqual([0, 0]); // the coaming
      for (const b of bars.slice(1)) expect(b.trim[0]).toBeGreaterThan(0);
    }
  });
});
