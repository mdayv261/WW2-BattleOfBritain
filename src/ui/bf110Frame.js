// The Bf 110 C's front cockpit frame (D117), drawn square-on with the panel while the pilot looks ahead, after the
// product owner's photograph of a Bf 110 C cockpit (#32, a layout reference only: redrawn in code), starting from the
// Bf 109's drawn frame (src/ui/bf109Frame.js, D90, D103) and its welded bars (src/ui/frameBars.js, D104):
//   the canopy's outer front frame, a wide flat top bar with rounded corners and side posts leaning out going down to
//   the panel's top corners (as the Bf 109's hood sides; product owner, D120), then the fuselage frames on down to the
//   foot of the screen at 75 degrees (as the Bf 109's fuselage frames; product owner, D121), kept behind the panel;
//   the armoured windscreen's frame below the top bar, its top bar between its own posts only (product owner, D122) and
//   its posts leaning in a little going down, with an arched ledge across their feet (its ends lowered a little; product
//   owner, D128), its top bar raised until its top corners
//   just touch the grab handles (product owner, D125); a bar each side from its top corner out and slightly down to the
//   outer post just below the grab handle (product owner, D126, D127); a thin post from each of its top corners
//   to the outer frame's top corner, as thin as the grab handles (product owner, D123); and below it, a lower frame each
//   side from the panel's top edge, above the red button on the left (mirrored on the right), up to the windscreen
//   frame's lower corner (product owner, D134);
//   a grab handle in each top corner, an arc from the top bar down to the outer post (product owner, D119); no canopy
//   latch or lever on the top bar, and no knobs on the ledge (product owner, D125);
//   and the cockpit's dark sides round the panel, between the posts and the fuselage frames. No covers over the panel's
//   top yet (D119).
// Sizes are in picture pixels of the Bf 110 panel's layout (#31, src/ui/bf110Panel.js), measured on #32 at about 1.12
// times its pixels from the Revi's axis, the windscreen raised to clear the Revi's larger glass. The 3D cockpit frame is
// hidden meanwhile (src/render/testView.js) and shows again when the pilot looks round; the wings and engines stay.

import { drawFrames } from './frameBars.js';
import { AXIS, BF110_PANEL } from './bf110Panel.js';

export const FRAME_110 = {
  // The outer top bar: its middle line's height, half its length to the corners' centres, its width and corner radius.
  top: { y: -244, half: 260, width: 24, corner: 32 },
  // The outer posts: out this many pixels for each pixel down from the top bar's corners (#32: about 0.16), down to
  // `foot`, the panel's top corners (its outline's shoulders at y 167; product owner, D120); width.
  posts: { slope: 0.16, foot: 167, width: 26 },
  // The fuselage frames: from the posts' feet down to the foot of the screen, at this angle from the horizontal (degrees),
  // leaning out going down (product owner, D121); as wide as the posts.
  fuselage: { angle: 75 },
  // The windscreen's top bar, above the Revi's glass, between the windscreen's posts only (D122), raised from -164 until
  // its top corners just touch the grab handles (D125).
  crossBar: { y: -181 },
  // The armoured windscreen's posts: `half` apart at height `at`, in this many pixels for each pixel down, from the top
  // bar down to the ledge's ends; the width of its posts and top bar.
  inner: { half: 207, at: -164, lean: 0.14, width: 20 },
  // The bars each side from the windscreen's top corner out and slightly down to the outer post: their middle line's
  // height at the outer post, just below the grab handles' feet (about 13 degrees; the tubes clear by under 1 px; D126,
  // D127). As wide as the windscreen's posts.
  sideBars: { y: -166 },
  // The ledge across the windscreen's foot, behind the Revi: an arc, its middle line at `y` in the middle and `sag` lower
  // at its ends on the posts (D128); width.
  ledge: { y: 6, sag: 12, width: 12 },
  // The grab handles in the top corners: arcs round the corner from the top bar, `along` in from the corner, down to the
  // outer post, `down` below the top bar (#32: about 100 and 50 of its pixels); tube width.
  handles: { along: 112, down: 56, width: 9 },
};
const FAR = 4000; // picture pixels: far enough to run off any screen
const INTERIOR = '#2b2e31';
const GREY = { band: '#4c5054', lit: '#7a7f83', shade: '#2c2f31', rivet: '#3a3d40', outline: '#17191a' };
const PANEL_TOP = 57;

/** An outer post's middle line at height y (`side` -1 left, +1 right): out from the top bar's corner going down. */
export const outerX = (side, y) => AXIS + side * (FRAME_110.top.half + FRAME_110.posts.slope * (y - FRAME_110.top.y));
/** A fuselage frame's middle line at height y, below the post's foot: out at its angle going down. */
export const fuselageX = (side, y) => {
  const { foot } = FRAME_110.posts;
  return outerX(side, foot) + (side * (y - foot)) / Math.tan((FRAME_110.fuselage.angle * Math.PI) / 180);
};
/** A windscreen post's middle line at height y: in from the cross bar going down. */
export const innerX = (side, y) => {
  const { half, lean, at } = FRAME_110.inner;
  return AXIS + side * (half - lean * (y - at));
};

/**
 * The outer frame's line: up the left fuselage frame from the foot of the screen to the post's foot, up the post, round
 * the corner, across the top bar, round, down the right post and on down its fuselage frame.
 */
export function outerPath() {
  const { y, corner } = FRAME_110.top;
  const { foot } = FRAME_110.posts;
  const pts = [[fuselageX(-1, FAR), FAR], [outerX(-1, foot), foot]];
  for (const side of [-1, 1]) {
    // A rounded corner: from the post, `corner` below the top bar, round to the bar, `corner` in from the corner.
    const cx = outerX(side, y) - side * corner;
    const arc = [];
    for (let k = 0; k <= 8; k += 1) {
      const a = (k / 8) * (Math.PI / 2);
      arc.push([cx + side * corner * Math.cos(a), y + corner - corner * Math.sin(a)]);
    }
    if (side < 0) pts.push(...arc);
    else pts.push(...arc.reverse());
  }
  pts.push([outerX(1, foot), foot], [fuselageX(1, FAR), FAR]);
  return pts;
}

/**
 * A grab handle's line (`side` -1 left, +1 right): a quarter ellipse round the frame's top corner, bowing in from it,
 * from the top bar's middle line `along` in from the corner down to the outer post's, `down` below the bar.
 */
export function handlePath(side) {
  const { along, down } = FRAME_110.handles;
  const { y: cy, half } = FRAME_110.top;
  const pts = [];
  for (let k = 0; k <= 16; k += 1) {
    const a = (k / 16) * (Math.PI / 2);
    const y = cy + down * Math.sin(a);
    // Sheared with the post's lean so its foot lands on the post's middle line.
    pts.push([AXIS + side * (half - along * Math.cos(a) + FRAME_110.posts.slope * (y - cy)), y]);
  }
  return pts;
}

/**
 * The armoured windscreen's frame line: up its left post from the ledge, across its top bar, down its right post. The
 * top bar ends at the windscreen's posts, not at the outer posts (D122).
 */
export function windscreenPath() {
  const { crossBar: { y }, ledge } = FRAME_110;
  const foot = ledge.y + ledge.sag + ledge.width / 2; // the ledge's lower edge at its ends
  return [[innerX(-1, foot), foot], [innerX(-1, y), y], [innerX(1, y), y], [innerX(1, foot), foot]];
}

/**
 * A thin corner post's line (`side` -1 left, +1 right): from the windscreen frame's top corner to the outer frame's top
 * corner, ending on the outer frame's middle line where it rounds the corner (D123).
 */
export function cornerPostPath(side) {
  const { y, corner } = FRAME_110.top;
  const k = Math.SQRT1_2; // half way round the rounded corner
  const outer = [outerX(side, y) - side * corner * (1 - k), y + corner * (1 - k)];
  return [[innerX(side, FRAME_110.crossBar.y), FRAME_110.crossBar.y], outer];
}

/**
 * A side bar's line (`side` -1 left, +1 right): from the windscreen's top corner out and slightly down to the outer post,
 * just below the grab handle (D126, D127).
 */
export function sideBarPath(side) {
  const { crossBar, sideBars } = FRAME_110;
  return [[innerX(side, crossBar.y), crossBar.y], [outerX(side, sideBars.y), sideBars.y]];
}

/**
 * The ledge's line: a circular arc across the windscreen's feet, its middle at the ledge's height on the axis, its ends
 * `sag` lower on the windscreen posts' middle lines (D128).
 */
export function ledgePath() {
  const { y, sag } = FRAME_110.ledge;
  const half = innerX(1, y + sag) - AXIS; // half the chord
  const radius = (half * half + sag * sag) / (2 * sag);
  const reach = Math.asin(half / radius);
  const pts = [];
  for (let k = -16; k <= 16; k += 1) {
    const a = (k / 16) * reach;
    pts.push([AXIS + radius * Math.sin(a), y + radius * (1 - Math.cos(a))]);
  }
  return pts;
}

/** The panel's top edge (picture y) at picture x: the highest crossing of its outline there. */
export function panelEdgeY(x) {
  const O = BF110_PANEL.outline;
  let top = Infinity;
  O.forEach((a, i) => {
    const b = O[(i + 1) % O.length];
    if (a[0] === b[0] || (a[0] - x) * (b[0] - x) > 0) return;
    top = Math.min(top, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]));
  });
  return top;
}

/**
 * A lower windscreen frame's line (`side` -1 left, +1 right; D134): from the panel's top edge in line with the red button
 * on the left (its mirror image about the axis on the right) up to the windscreen frame's lower corner, where its post
 * meets the ledge's end. It starts a little inside the panel's edge along its own line, behind the panel, so it rises
 * from the edge itself.
 */
export function lowerFramePath(side) {
  const left = BF110_PANEL.knobs.redButton[0];
  const x = side < 0 ? left : 2 * AXIS - left;
  const start = [x, panelEdgeY(x)];
  const ledge = ledgePath();
  const corner = ledge[side < 0 ? 0 : ledge.length - 1];
  const [dx, dy] = [start[0] - corner[0], start[1] - corner[1]];
  const k = 1 + FRAME_110.inner.width / Math.hypot(dx, dy); // on behind the panel's edge
  return [[corner[0] + dx * k, corner[1] + dy * k], corner];
}

/** The welded bars in canvas px, each after the bar it ends on (D104). `at` is the panel's placer. */
export function frameBars110(at) {
  const w = (px) => at.len(px);
  const P = (pts) => pts.map((p) => at.xy(p));
  const { top, posts, inner, ledge } = FRAME_110;
  return [
    { pts: P(outerPath()), w: w(top.width), trim: [0, 0] },
    { pts: P(windscreenPath()), w: w(inner.width), trim: [0, 0] },
    ...[-1, 1].map((side) => ({
      pts: P(sideBarPath(side)), w: w(inner.width), trim: [w(inner.width / 2), w(posts.width / 2)],
    })),
    ...[-1, 1].map((side) => ({ pts: P(lowerFramePath(side)), w: w(inner.width), trim: [0, w(inner.width / 2)] })),
    { pts: P(ledgePath()), w: w(ledge.width),
      trim: [w(inner.width / 2), w(inner.width / 2)] },
  ];
}

/** The panel's outline as a path (canvas px), for keeping the frame behind it. */
function panelPath(g, at) {
  BF110_PANEL.outline.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  g.closePath();
}

/**
 * The cockpit's dark sides round the panel, between the posts and the fuselage frames from the panel's top down: on the
 * panel's canvas before its plate. `at` is the panel's placer.
 */
export function drawBf110Interior(g, at) {
  const y0 = PANEL_TOP - 3;
  const { foot } = FRAME_110.posts;
  g.fillStyle = INTERIOR;
  g.beginPath();
  g.moveTo(...at.xy([outerX(-1, y0), y0]));
  g.lineTo(...at.xy([outerX(1, y0), y0]));
  g.lineTo(...at.xy([outerX(1, foot), foot]));
  g.lineTo(...at.xy([fuselageX(1, FAR), FAR]));
  g.lineTo(...at.xy([fuselageX(-1, FAR), FAR]));
  g.lineTo(...at.xy([outerX(-1, foot), foot]));
  g.closePath();
  g.fill();
}

/**
 * The front frame on the sight's canvas before the Revi: the corner posts and grab handles, then the bars, kept behind
 * the panel. `at` is the panel's placer; `width`, `height` the canvas.
 */
export function drawBf110Frame(g, at, width, height) {
  g.save();
  g.beginPath();
  g.rect(0, 0, width, height);
  panelPath(g, at);
  g.clip('evenodd');
  handles(g, at);
  drawFrames(g, frameBars110(at), GREY, { join: 'round' });
  g.restore();
}

/** The thin tubes in drawing order: the corner posts first, behind the grab handles (product owner, D124). */
export const tubePaths = () => [cornerPostPath(-1), cornerPostPath(1), handlePath(-1), handlePath(1)];

/**
 * The thin corner posts and the grab handles (as thin as the handles, D123): grey tubes with a lit upper edge, the
 * posts behind the handles, their ends under the bars (drawn first).
 */
function handles(g, at) {
  const { width } = FRAME_110.handles;
  for (const path of tubePaths()) {
    const pts = path.map((p) => at.xy(p));
    for (const [colour, wd, off] of [[GREY.outline, width + 2, 0], [GREY.band, width, 0], [GREY.lit, width * 0.25, -width * 0.3]]) {
      g.strokeStyle = colour;
      g.lineWidth = at.len(wd);
      g.lineCap = 'round';
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y + at.len(off)) : g.moveTo(x, y + at.len(off))));
      g.stroke();
    }
  }
}
