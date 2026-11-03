// The Bf 110 C's drawn front frame after the product owner's photograph (#32, D117): symmetric about the panel's axis;
// the outer posts leaning out going down and the windscreen's posts leaning in, as photographed; the top bar on every
// screen; the windscreen's opening round the Revi's glass and the guns' line; the grab handles arcs in the top corners
// from the top bar to the outer posts (D119); the outer posts stopping at the panel's top corners (D120); the fuselage frames from there to the foot of the screen
// at 75 degrees (D121); the windscreen's top bar ending at its own posts, with no corner gussets (D122);
// a thin post from each top corner of the windscreen frame to the outer frame's top corner (D123), behind the grab handles (D124);
// the windscreen's top bar raised to touch the handles, with no latch, lever or ledge knobs (D125); side bars from its
// top corners angled down slightly to the outer posts just below the handles (D126, D127).
import { describe, it, expect } from 'vitest';
import { FRAME_110, outerX, fuselageX, innerX, outerPath, windscreenPath, handlePath, cornerPostPath, tubePaths, sideBarPath, frameBars110 } from '../../src/ui/bf110Frame.js';
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
      const [, barFoot] = at.xy([AXIS, FRAME_110.crossBar.y + FRAME_110.inner.width / 2]);
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

  it('joins each top corner of the windscreen frame to the outer frame\'s top corner with a thin post (D123)', () => {
    const { top, crossBar } = FRAME_110;
    for (const side of [-1, 1]) {
      const [[x0, y0], [x1, y1]] = cornerPostPath(side);
      expect([x0, y0]).toEqual(windscreenPath()[side < 0 ? 1 : 2]); // the windscreen frame's top corner
      expect(y0).toBe(crossBar.y);
      // The outer frame's corner: on its middle line, half way round the rounded corner.
      const [cx, cy] = [outerX(side, top.y) - side * top.corner, top.y + top.corner];
      expect(Math.hypot(x1 - cx, y1 - cy)).toBeCloseTo(top.corner, 9);
      expect(side * (x1 - cx)).toBeCloseTo(cy - y1, 9);
      expect(side * (x1 - x0)).toBeGreaterThan(0); // up and out
      expect(y1).toBeLessThan(y0);
      expect(cornerPostPath(-side)[1][0] - AXIS).toBeCloseTo(-(x1 - AXIS), 9); // symmetric
    }
  });

  it('draws the corner posts behind the grab handles (D124)', () => {
    expect(tubePaths()).toEqual([cornerPostPath(-1), cornerPostPath(1), handlePath(-1), handlePath(1)]);
  });

  it('raises the windscreen\'s top bar until its top corners just touch the grab handles (D125)', () => {
    const { inner, handles } = FRAME_110;
    for (const side of [-1, 1]) {
      const corner = windscreenPath()[side < 0 ? 1 : 2];
      const gap = Math.min(...handlePath(side).map(([x, y]) => Math.hypot(x - corner[0], y - corner[1])))
        - (inner.width + handles.width) / 2; // between the rounded corner's edge and the tube's
      expect(gap, `${side}`).toBeGreaterThanOrEqual(0);
      expect(gap, `${side}`).toBeLessThan(1.5);
    }
    expect(FRAME_110.crossBar.y).toBeLessThan(-164); // higher than D117's
  });

  it('joins each windscreen top corner to the outer post with a bar angled up slightly, below the handle (D127)', () => {
    const { sideBars, inner, handles } = FRAME_110;
    for (const side of [-1, 1]) {
      const [[x0, y0], [x1, y1]] = sideBarPath(side);
      expect([x0, y0]).toEqual(windscreenPath()[side < 0 ? 1 : 2]); // at the windscreen's top corner
      expect(y1).toBe(sideBars.y);
      expect(x1).toBeCloseTo(outerX(side, sideBars.y), 9); // on the outer post
      const angle = (Math.atan2(y1 - y0, Math.abs(x1 - x0)) * 180) / Math.PI; // rising going in
      expect(angle).toBeGreaterThan(5);
      expect(angle).toBeLessThan(20);
      // Just below the handle: its edge clear of the tube's by under 1.5 px.
      const seg = ([px, py]) => {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
      };
      const gap = Math.min(...handlePath(side).map(seg)) - (inner.width + handles.width) / 2;
      expect(gap, `${side}`).toBeGreaterThanOrEqual(0);
      expect(gap, `${side}`).toBeLessThan(1.5);
    }
  });

  it('has no canopy latch and lever on the top bar and no knobs on the ledge (D125)', () => {
    expect(FRAME_110.knob).toBeUndefined();
    expect(FRAME_110.ledge.knob).toBeUndefined();
  });

  it('draws the outer frame and the windscreen as whole frames, the side bars and ledge welded to them', () => {
    const at = placer(1000, 500, 40);
    const bars = frameBars110(at);
    expect(bars).toHaveLength(5); // no bar across to the outer posts, no corner gussets (D122); two side bars (D126)
    expect(bars[0].trim).toEqual([0, 0]);
    expect(bars[1].trim).toEqual([0, 0]);
    for (const b of bars.slice(2)) expect(b.trim[0]).toBeGreaterThan(0);
  });

  it('ends the windscreen\'s top bar at its own posts, well inside the outer posts (D122)', () => {
    const { crossBar, posts } = FRAME_110;
    const path = windscreenPath();
    expect(path).toHaveLength(4);
    for (const [side, [x, y]] of [[-1, path[1]], [1, path[2]]]) {
      expect(y).toBe(crossBar.y);
      expect(x).toBeCloseTo(innerX(side, crossBar.y), 9);
      expect(side * (outerX(side, crossBar.y) - x)).toBeGreaterThan(posts.width * 2);
    }
  });

});
