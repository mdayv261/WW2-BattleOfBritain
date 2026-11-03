// The Bf 110 C's drawn front frame after the product owner's photograph (#32, D117): symmetric about the panel's axis;
// the outer posts leaning out going down and the windscreen's posts leaning in, as photographed; the top bar on every
// screen; the windscreen's opening round the Revi's glass and the guns' line; the grab handles arcs in the top corners
// from the top bar to the outer posts (D119); the outer posts stopping at the panel's top corners (D120); the fuselage frames from there to the foot of the screen
// at 75 degrees (D121).
import { describe, it, expect } from 'vitest';
import { FRAME_110, outerX, fuselageX, innerX, outerPath, handlePath, frameBars110 } from '../../src/ui/bf110Frame.js';
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

  it('arcs each grab handle round its top corner from the top bar down to the outer post, bowing in (D119)', () => {
    const { top, handles } = FRAME_110;
    for (const side of [-1, 1]) {
      const pts = handlePath(side);
      const [x0, y0] = pts[0];
      const [x1, y1] = pts[pts.length - 1];
      expect(y0).toBeCloseTo(top.y, 9); // on the top bar's middle line
      expect(side * (outerX(side, top.y) - x0)).toBeCloseTo(handles.along, 9);
      expect(y1).toBeCloseTo(top.y + handles.down, 9);
      expect(x1).toBeCloseTo(outerX(side, y1), 9); // on the post's middle line
      // Bowing in: its middle is further from the corner than the chord between its ends.
      const [xm, ym] = pts[pts.length >> 1];
      const chordX = x0 + (x1 - x0) * ((ym - y0) / (y1 - y0));
      expect(side * (chordX - xm)).toBeGreaterThan(0);
      expect(xm - AXIS).toBeCloseTo(-(handlePath(-side)[pts.length >> 1][0] - AXIS), 9); // symmetric
    }
  });

  it('stops the outer posts at the panel\'s top corners, their inner edges on the outline\'s shoulders (D120)', () => {
    const { foot, width } = FRAME_110.posts;
    const path = outerPath();
    for (const [x, y] of [path[1], path[path.length - 2]]) {
      expect(y).toBe(foot);
      expect(x).toBeCloseTo(outerX(Math.sign(x - AXIS), foot), 9);
    }
    const shoulders = L.outline.filter(([, y]) => y === foot);
    expect(shoulders).toHaveLength(2);
    for (const [x] of shoulders) {
      const side = Math.sign(x - AXIS);
      const innerEdge = outerX(side, foot) - (side * width) / 2;
      expect(Math.abs(innerEdge - x), `${side}`).toBeLessThan(width / 2);
    }
  });

  it('runs the fuselage frames from the posts\' feet to the foot of every screen at 75 degrees, leaning out (D121)', () => {
    const { foot } = FRAME_110.posts;
    const path = outerPath();
    for (const [[x0, y0], [x1, y1]] of [[path[1], path[0]], [path[path.length - 2], path[path.length - 1]]]) {
      const side = Math.sign(x0 - AXIS);
      expect(y0).toBe(foot);
      expect(side * (x1 - x0)).toBeGreaterThan(0); // out going down
      expect((Math.atan2(y1 - y0, Math.abs(x1 - x0)) * 180) / Math.PI).toBeCloseTo(75, 9);
      expect(fuselageX(side, y1)).toBeCloseTo(x1, 9);
      for (const [w, h] of SCREENS) {
        const r = panelRadius(L, w, h);
        const at = placer(w / 2, panelTop110(h, r), r);
        expect(at.xy([x1, y1])[1], `${w}x${h}`).toBeGreaterThan(h);
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
