// The Bf 110 C's drawn front frame after the product owner's photograph (#32, D117): symmetric about the panel's axis;
// the outer posts leaning out going down and the windscreen's posts leaning in, as photographed; the top bar on every
// screen; the windscreen's opening round the Revi's glass and the guns' line; the crash pads straight wedges sloping down
// and out to the outer posts, as photographed, above the panel's top and clear of every dial and plate on it.
import { describe, it, expect } from 'vitest';
import { FRAME_110, outerX, innerX, outerPath, padPath, frameBars110 } from '../../src/ui/bf110Frame.js';
import { AXIS, BF110_PANEL, BF110_REVI, GLASS_ABOVE_110, placer, panelTop110 } from '../../src/ui/bf110Panel.js';
import { reviPlacement } from '../../src/ui/reviSight.js';
import { panelRadius } from '../../src/ui/instruments.js';

const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [2560, 1203]];
const L = BF110_PANEL;
const GUNS_LINE = 57 - GLASS_ABOVE_110 * 30; // picture y of the guns' line

describe('Bf 110 C front frame (D117)', () => {
  it('is symmetric about the axis, the outer posts leaning out going down and the windscreen posts in', () => {
    for (const y of [-200, -100, 0, 200]) {
      expect(outerX(1, y) - AXIS).toBeCloseTo(AXIS - outerX(-1, y), 9);
      expect(innerX(1, y) - AXIS).toBeCloseTo(AXIS - innerX(-1, y), 9);
    }
    expect(outerX(1, 100)).toBeGreaterThan(outerX(1, -100));
    expect(innerX(1, 0)).toBeLessThan(innerX(1, FRAME_110.crossBar.y));
    const path = outerPath();
    const mirrored = path.map(([x, y]) => [2 * AXIS - x, y]).reverse();
    path.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(mirrored[i][0], 6);
      expect(y).toBeCloseTo(mirrored[i][1], 6);
    });
  });

  it('shows the top bar on every screen, the windscreen round the Revi\'s glass and the guns\' line', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const at = placer(w / 2, panelTop110(h, r), r);
      const [, topY] = at.xy([AXIS, FRAME_110.top.y - FRAME_110.top.width / 2]);
      expect(topY, `${w}x${h}`).toBeGreaterThan(0);
      const { glass, y } = reviPlacement(w, h, BF110_REVI);
      const [, barFoot] = at.xy([AXIS, FRAME_110.crossBar.y + FRAME_110.crossBar.width / 2]);
      expect(barFoot, `${w}x${h}: cross bar above the glass`).toBeLessThan(glass.y);
      const [left] = at.xy([innerX(-1, GUNS_LINE) + FRAME_110.inner.width / 2, 0]);
      const [right] = at.xy([innerX(1, GUNS_LINE) - FRAME_110.inner.width / 2, 0]);
      expect(left, `${w}x${h}`).toBeLessThan(glass.x);
      expect(right, `${w}x${h}`).toBeGreaterThan(glass.x + glass.w);
      expect(y).toBeGreaterThan(barFoot);
    }
  });

  it('makes the crash pads straight wedges sloping down and out to the outer posts, as #32, above the panel\'s top', () => {
    for (const side of [-1, 1]) {
      const [lowIn, lowOut, upOut, upIn] = padPath(side);
      expect(padPath(side)).toHaveLength(4);
      const slope = (a, b) => (b[1] - a[1]) / Math.abs(b[0] - a[0]);
      expect(slope(lowIn, lowOut)).toBeGreaterThan(0.2); // #32: about 0.28
      expect(slope(lowIn, lowOut)).toBeLessThan(0.35);
      expect(slope(upIn, upOut)).toBeGreaterThan(0);
      expect(lowOut[1] - upOut[1]).toBeGreaterThan(lowIn[1] - upIn[1]); // thickening outward, as #32
      expect(Math.abs(lowOut[0] - outerX(side, lowOut[1]))).toBeLessThan(FRAME_110.posts.width / 2); // under the post
      // The lower edge passes above every corner of the panel's outline it crosses.
      for (const [x, y] of L.outline) {
        const f = (x - lowIn[0]) / (lowOut[0] - lowIn[0]);
        if (f >= 0 && f <= 1) expect(lowIn[1] + f * (lowOut[1] - lowIn[1]), `${side} ${x}`).toBeLessThan(y);
      }
    }
  });

  it('lays the crash pads beside the Revi, clear of every dial and plate', () => {
    const inside = (px, py, poly) => {
      let hit = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const things = [
      ...Object.entries(L.dials).map(([n, [x, y, , o]]) => [n, [x - o, y - o, x + o, y + o]]),
      ...Object.entries(L.boxes),
    ];
    for (const side of [-1, 1]) {
      const pad = padPath(side);
      expect(Math.min(...pad.map(([x]) => side * (x - AXIS)))).toBeGreaterThanOrEqual(FRAME_110.pads.gap - 1e-9);
      for (const [name, [l, t, r, b]] of things) {
        for (const [cx, cy] of [[l, t], [r, t], [l, b], [r, b], [(l + r) / 2, t]]) expect(inside(cx, cy, pad), `${side} ${name}`).toBe(false);
      }
    }
  });

  it('welds every bar: each bar after the one it ends on, trimmed at that end', () => {
    const at = placer(1000, 500, 40);
    const bars = frameBars110(at);
    expect(bars[0].trim).toEqual([0, 0]); // the outer frame first
    for (const b of bars.slice(1)) expect(b.trim[0]).toBeGreaterThan(0);
  });
});
