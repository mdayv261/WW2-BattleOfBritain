// The Bf 110 C's drawn front frame after the product owner's photograph (#32, D117): symmetric about the panel's axis;
// the outer posts leaning out going down and the windscreen's posts leaning in, as photographed; the top bar on every
// screen; the windscreen's opening round the Revi's glass and the guns' line; the grab handles arcs in the top corners
// from the top bar to the outer posts (D119); the outer posts stopping at the panel's top corners (D120); the fuselage
// frames, thin sheets from the posts' outside edges to the foot of the screen at 70 degrees (D121, D139); the
// windscreen's top bar ending at its own posts, with no corner gussets (D122); a thin post from each top corner of the
// windscreen frame to the outer frame's top corner (D123), behind the grab handles (D124); the windscreen's top bar
// raised to touch the handles, with no latch, lever or ledge knobs (D125); side bars from its top corners angled down
// slightly to the outer posts just below the handles (D126, D127); the ledge an arc (D128); the lower frames from the
// windscreen's lower corners to the outer posts, level with the red button (D134, D135); the dash covers as
// photographed: the top along the ledge's lower edge, a straight front edge to the posts (D136-D138).
import { describe, it, expect } from 'vitest';
import {
  FRAME_110, outerX, fuselageX, fuselagePath, innerX, outerPath, windscreenPath, handlePath, cornerPostPath, tubePaths,
  sideBarPath, ledgePath, lowerFramePath, frameBars110, panelEdgeX, FRAME_SHIFT, framePlacer,
} from '../../src/ui/bf110Frame.js';
import { BRACKET } from '../../src/ui/bf110Layout.js';
import { dashCoverPath, coamingPath } from '../../src/ui/bf110Covers.js';
import {
  AXIS, BF110_PANEL, BF110_REVI, GLASS_ABOVE_110, BF109_SCALE, REVI_110, placer, panelTop110,
} from '../../src/ui/bf110Panel.js';
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

  it('raises the frame so the guns\' line falls in the middle of the windscreen on every screen; panel and Revi stay (D143)', () => {
    const { crossBar, inner, ledge } = FRAME_110;
    expect(FRAME_SHIFT).toBeLessThan(0); // up
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const at = framePlacer(placer(w / 2, panelTop110(h, r), r));
      const [, top] = at.xy([AXIS, crossBar.y + inner.width / 2]);
      const [, bottom] = at.xy([AXIS, ledge.y - ledge.width / 2]);
      const { y } = reviPlacement(w, h, BF110_REVI);
      expect(y, `${w}x${h}`).toBeCloseTo((top + bottom) / 2, 6);
    }
  });

  it('shows the top bar on every screen, the windscreen round the Revi\'s glass and the guns\' line', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const at = framePlacer(placer(w / 2, panelTop110(h, r), r));
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

  it('stops both outer posts where the panel\'s left side first reaches the left post (D120, D140, D146)', () => {
    const { foot, width } = FRAME_110.posts;
    const path = outerPath();
    for (const [x, y] of [path[0], path[path.length - 1]]) {
      expect(y).toBe(foot);
      expect(x).toBeCloseTo(outerX(Math.sign(x - AXIS), foot), 9);
    }
    // The post's inner edge outside the panel's edge level with it (the frame raised FRAME_SHIFT over the panel, D143).
    const gap = (side, y) => side * (outerX(side, y) - (side * width) / 2 - panelEdgeX(side, y + FRAME_SHIFT));
    expect(gap(-1, foot)).toBeLessThanOrEqual(0); // the left post meets the panel's left side there
    expect(gap(-1, foot - 1)).toBeGreaterThan(0); // and not above it
    // The right side inside its post, touching it only at its corner under the right cover (D146).
    for (let y = 57 - FRAME_SHIFT; y <= foot; y += 1) expect(gap(1, y), `right ${y}`).toBeGreaterThan(-0.2);
  });

  it('runs the fuselage frames as thin sheets from the posts\' outside edges to the screen\'s foot at 70 degrees (D139)', () => {
    const { foot, width } = FRAME_110.posts;
    const { angle, width: sheet } = FRAME_110.fuselage;
    expect(sheet).toBeLessThan(width / 3); // a thin sheet
    expect(angle).toBeLessThan(75); // angled out more than D121's
    for (const side of [-1, 1]) {
      const [[x0, y0], [x1, y1]] = fuselagePath(side);
      expect(y0).toBe(foot);
      expect(x0).toBeCloseTo(outerX(side, foot) + (side * width) / 2, 9); // the post's outside edge
      expect(side * (x1 - x0)).toBeGreaterThan(0); // out going down
      expect((Math.atan2(y1 - y0, Math.abs(x1 - x0)) * 180) / Math.PI).toBeCloseTo(angle, 9);
      expect(fuselageX(side, y1)).toBeCloseTo(x1, 9);
      for (const [w, h] of SCREENS) {
        const r = panelRadius(L, w, h);
        const at = framePlacer(placer(w / 2, panelTop110(h, r), r));
        expect(at.xy([x1, y1])[1], `${w}x${h}`).toBeGreaterThan(h);
      }
    }
    // No longer part of the outer frame's line: it ends at the posts' feet.
    const path = outerPath();
    expect(path[0][1]).toBe(foot);
    expect(path[path.length - 1][1]).toBe(foot);
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

  it('arches the ledge: its middle where it was, its ends a little lower on the windscreen posts (D128)', () => {
    const { ledge } = FRAME_110;
    const pts = ledgePath();
    const mid = pts[pts.length >> 1];
    expect(mid[0]).toBeCloseTo(AXIS, 9);
    expect(mid[1]).toBeCloseTo(ledge.y, 9); // D117's height
    expect(ledge.sag).toBeGreaterThan(0);
    expect(ledge.sag).toBeLessThanOrEqual(20); // a small amount
    for (const [side, [x, y]] of [[-1, pts[0]], [1, pts[pts.length - 1]]]) {
      expect(y).toBeCloseTo(ledge.y + ledge.sag, 9);
      expect(x).toBeCloseTo(innerX(side, y), 9); // on the post's middle line
    }
    // An arc: every point the same distance from one centre below, falling away from the middle both ways.
    const half = AXIS - pts[0][0];
    const radius = (half ** 2 + ledge.sag ** 2) / (2 * ledge.sag);
    for (const [x, y] of pts) expect(Math.hypot(x - AXIS, y - (ledge.y + radius))).toBeCloseTo(radius, 6);
    for (let i = 1; i <= pts.length >> 1; i += 1) expect(pts[i][1]).toBeLessThan(pts[i - 1][1]);
    // The windscreen's posts reach down to the ledge's ends.
    const path = windscreenPath();
    expect(path[0][1]).toBeCloseTo(ledge.y + ledge.sag + ledge.width / 2, 9);
  });

  it('runs each lower frame from the windscreen\'s lower corner to the outer post, level with the red button (D135)', () => {
    const [, buttonY] = L.knobs.redButton;
    const ledge = ledgePath();
    for (const side of [-1, 1]) {
      const [[x0, y0], [x1, y1]] = lowerFramePath(side);
      expect([x0, y0]).toEqual(ledge[side < 0 ? 0 : ledge.length - 1]); // the windscreen's lower corner
      expect(x0).toBeCloseTo(innerX(side, y0), 9); // on its post's middle line
      expect(y1).toBe(buttonY); // level with the red button
      expect(x1).toBeCloseTo(outerX(side, y1), 9); // on the outer post's middle line
      expect(side * (x1 - x0)).toBeGreaterThan(0); // out going down
      // Clear above the panel (raised FRAME_SHIFT over it, D143): its lower edge above the panel's outline wherever it
      // crosses over it, but where it passes behind the clock's bracket (D140) and where the panel's right corner meets
      // the right cover's foot under its end (D146).
      for (const [px, py] of L.outline) {
        if (BRACKET.some(([bx, by]) => bx === px && by === py)) continue;
        if (side > 0 && Math.abs(px - x1) < FRAME_110.posts.width) continue;
        const f = (px - x0) / (x1 - x0);
        if (f > 0 && f < 1) expect(y0 + FRAME_SHIFT + f * (y1 - y0) + FRAME_110.inner.width / 2, `${side} ${px}`).toBeLessThan(py);
      }
    }
  });

  it('shapes each dash cover as photographed: its top along the ledge\'s lower edge, a straight front edge (D137, D138)', () => {
    const PX = 30;
    const { ledge } = FRAME_110;
    const arc = ledgePath();
    const half = AXIS - arc[0][0];
    const radius = (half ** 2 + ledge.sag ** 2) / (2 * ledge.sag);
    const centre = [AXIS, ledge.y + radius];
    for (const side of [-1, 1]) {
      const pts = dashCoverPath(side);
      const top = pts.slice(0, -2);
      const [footInner, footOuter] = pts.slice(-2);
      // The top edge: on the ledge's lower edge, an arc, rising from the ledge's end in to the gunsight.
      for (const [x, y] of top) { // within 0.05 px (the last point interpolated between the arc's samples)
        expect(Math.hypot(x - centre[0], y - centre[1])).toBeCloseTo(radius - ledge.width / 2, 1);
      }
      expect(top[0][1]).toBeGreaterThan(top[top.length - 1][1]);
      expect(Math.abs(top[0][0] - arc[side < 0 ? 0 : arc.length - 1][0])).toBeLessThan(1); // from the ledge's end
      const bodySide = AXIS + REVI_110.body.x[side < 0 ? 0 : 1] * BF109_SCALE * PX;
      const inner = top[top.length - 1];
      expect(side * (bodySide - inner[0])).toBeGreaterThan(0); // just inside the gunsight body's side
      expect(side * (bodySide - inner[0])).toBeLessThan(5);
      // At the brown pad's lower corner (D144): on every screen, level with the Revi's body's foot.
      expect(footInner[0]).toBe(inner[0]);
      for (const [w, h] of SCREENS) {
        const r = panelRadius(L, w, h);
        const at = framePlacer(placer(w / 2, panelTop110(h, r), r));
        const p = reviPlacement(w, h, BF110_REVI);
        expect(at.xy(footInner)[1], `${w}x${h}`).toBeCloseTo(p.y + REVI_110.body.y[1] * p.r, 6);
      } // down to its foot on the panel's top
      const [, foot] = lowerFramePath(side);
      expect(footOuter).toEqual(foot); // the front edge to the lower frame's foot on the outer post
      // Mirror images about the axis.
      const mirror = dashCoverPath(-side);
      expect(mirror).toHaveLength(pts.length);
      mirror.forEach(([x, y], i) => {
        expect(x - AXIS).toBeCloseTo(-(pts[i][0] - AXIS), 9);
        expect(y).toBeCloseTo(pts[i][1], 9);
      });
    }
  });

  it('fills the panel\'s top up to the covers and under the Revi in the plate\'s colour (D144)', () => {
    const path = coamingPath();
    const [lInner, lOuter] = dashCoverPath(-1).slice(-2);
    const [rInner, rOuter] = dashCoverPath(1).slice(-2);
    expect(path.slice(0, 4)).toEqual([lOuter, lInner, rInner, rOuter]); // along the covers' front edges and the pad's foot
    const top = 57 - FRAME_SHIFT; // the panel's top edge in the frame's picture
    expect(path.slice(4)).toEqual([[rInner[0], top], [lInner[0], top]]); // down to the panel's top under the Revi
    expect(lInner[1]).toBeLessThan(top); // the pad's foot above the panel's top: a strip to fill
  });

  it('carries the panel\'s top level to the right cover, along its front edge to the post, then down (D146)', () => {
    const toPanel = ([x, y]) => [x, y + FRAME_SHIFT];
    const [inner, foot] = dashCoverPath(1).slice(-2).map(toPanel);
    const onEdge = ([x, y]) => (x - inner[0]) * (foot[1] - inner[1]) - (y - inner[1]) * (foot[0] - inner[0]);
    const O = L.outline;
    const i = O.findIndex(([x, y]) => y === 57 && x > AXIS); // the top edge's right end
    const [a, b, c] = [O[i], O[i + 1], O[i + 2]];
    expect(O[i - 1][1]).toBe(57); // the top edge runs level to it
    expect(Math.abs(onEdge(a)) / Math.hypot(foot[0] - inner[0], foot[1] - inner[1])).toBeLessThan(0.1); // on the cover's edge
    expect(Math.abs(onEdge(b)) / Math.hypot(foot[0] - inner[0], foot[1] - inner[1])).toBeLessThan(0.1); // along it
    const postInner = outerX(1, b[1] - FRAME_SHIFT) - FRAME_110.posts.width / 2;
    expect(Math.abs(b[0] - postInner)).toBeLessThan(0.2); // to the right post's inner edge
    expect(c[1]).toBeGreaterThan(b[1]); // then down
    expect(c[0]).toBeGreaterThan(b[0]); // angling out
    for (let y = b[1]; y <= c[1]; y += 2) { // inside the post below the corner
      const x = b[0] + ((c[0] - b[0]) * (y - b[1])) / (c[1] - b[1]);
      expect(x, `${y}`).toBeLessThan(outerX(1, y - FRAME_SHIFT) - FRAME_110.posts.width / 2 + 0.2);
    }
  });

  it('has no canopy latch and lever on the top bar and no knobs on the ledge (D125)', () => {
    expect(FRAME_110.knob).toBeUndefined();
    expect(FRAME_110.ledge.knob).toBeUndefined();
  });

  it('draws the outer frame and the windscreen as whole frames, the side bars and ledge welded to them', () => {
    const at = placer(1000, 500, 40);
    const bars = frameBars110(at);
    // No bar across to the outer posts, no corner gussets (D122); two side bars (D126), two lower frames (D134).
    expect(bars).toHaveLength(7);
    expect(bars[0].trim).toEqual([0, 0]);
    expect(bars[1].trim).toEqual([0, 0]);
    for (const b of bars.slice(2)) expect(b.trim[0]).toBeGreaterThan(0);
    for (const b of bars.slice(2, 6)) expect(b.trim[1]).toBeGreaterThan(0); // welded to the outer posts too
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
