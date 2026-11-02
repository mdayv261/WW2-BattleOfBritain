// The Bf 110 C's front cockpit frame (D117), drawn square-on with the panel while the pilot looks ahead, after the
// product owner's photograph of a Bf 110 C cockpit (#32, a layout reference only: redrawn in code), starting from the
// Bf 109's drawn frame (src/ui/bf109Frame.js, D90, D103) and its welded bars (src/ui/frameBars.js, D104):
//   the canopy's outer front frame, a wide flat top bar with rounded corners and side posts leaning out going down to
//   the foot of the screen (as the Bf 109's hood sides and fuselage frames), passing behind the panel;
//   the bar across between the outer posts (as the Bf 109's cross bar) with the armoured windscreen's posts below it,
//   leaning in a little going down, a ledge across their feet, and small gussets in the corners;
//   two loop grab handles behind the top bar, and the bracket on it with the red-knobbed handle hanging below;
//   two grey padded crash pads either side of the Revi (as the Bf 109's coaming lip), straight wedges sloping down and
//   out from beside the Revi to the outer posts above the panel's top, as photographed, dark beneath them;
//   and the cockpit's dark sides round the panel, between the outer posts.
// Sizes are in picture pixels of the Bf 110 panel's layout (#31, src/ui/bf110Panel.js), measured on #32 at about 1.12
// times its pixels from the Revi's axis, the windscreen raised to clear the Revi's larger glass. The 3D cockpit frame is
// hidden meanwhile (src/render/testView.js) and shows again when the pilot looks round; the wings and engines stay.

import { drawFrames } from './frameBars.js';
import { AXIS, BF110_PANEL } from './bf110Panel.js';

export const FRAME_110 = {
  // The outer top bar: its middle line's height, half its length to the corners' centres, its width and corner radius.
  top: { y: -244, half: 260, width: 24, corner: 32 },
  // The outer posts: out this many pixels for each pixel down from the top bar's corners (#32: about 0.16); width.
  posts: { slope: 0.16, width: 26 },
  // The bar across between the outer posts, above the Revi's glass.
  crossBar: { y: -164, width: 22 },
  // The armoured windscreen's posts: half apart at the cross bar, in this many pixels for each pixel down, down to `foot`
  // (behind the crash pads); width.
  inner: { half: 207, lean: 0.14, foot: 40, width: 20 },
  // The ledge across the windscreen's foot, behind the Revi, and its two knobs.
  ledge: { y: -10, width: 12, knob: 7 },
  // The gussets in the corners between the cross bar and the outer posts: their legs.
  gussets: { leg: 34, width: 16 },
  // The grab handles behind the top bar: their centres from the axis, radii and tube width.
  handles: { dx: 185, y: -206, rx: 62, ry: 24, width: 9 },
  // The bracket on the top bar and the red-knobbed handle below it, right of the axis.
  knob: { dx: 52, y: -146, r: 8, bracket: [20, 90] },
  // The crash pads: the gap either side of the axis for the Revi's body; their lower edge's height at the inner end and
  // at the outer post (a straight slope, #32: about 0.28 down for each pixel out, clear above the panel's top); their
  // thickness at the inner and outer ends.
  pads: { gap: 58, foot: [20, 88], thick: [52, 64] },
};
const FAR = 4000; // picture pixels: far enough to run off any screen
const INTERIOR = '#2b2e31';
const GREY = { band: '#4c5054', lit: '#7a7f83', shade: '#2c2f31', rivet: '#3a3d40', outline: '#17191a' };
const PANEL_TOP = 57;

/** An outer post's middle line at height y (`side` -1 left, +1 right): out from the top bar's corner going down. */
export const outerX = (side, y) => AXIS + side * (FRAME_110.top.half + FRAME_110.posts.slope * (y - FRAME_110.top.y));
/** A windscreen post's middle line at height y: in from the cross bar going down. */
export const innerX = (side, y) => AXIS + side * (FRAME_110.inner.half - FRAME_110.inner.lean * (y - FRAME_110.crossBar.y));

/** The outer frame's line: up the left post, round the corner, across the top bar, round, down the right post. */
export function outerPath() {
  const { y, corner } = FRAME_110.top;
  const pts = [[outerX(-1, FAR), FAR]];
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
  pts.push([outerX(1, FAR), FAR]);
  return pts;
}

/**
 * A crash pad's outline (`side` -1 left, +1 right): a straight wedge, its lower edge from the Revi's gap down and out to
 * the outer post, then its upper edge back, the pad thickening outward as photographed. Points: lower inner, lower outer, upper outer,
 * upper inner.
 */
export function padPath(side) {
  const { gap, foot, thick } = FRAME_110.pads;
  const atPost = (y) => [outerX(side, y) - side * FRAME_110.posts.width * 0.4, y]; // tucked under the post
  const x = AXIS + side * gap;
  return [[x, foot[0]], atPost(foot[1]), atPost(foot[1] - thick[1]), [x, foot[0] - thick[0]]];
}

/** The welded bars in canvas px, each after the bar it ends on (D104). `at` is the panel's placer. */
export function frameBars110(at) {
  const w = (px) => at.len(px);
  const P = (pts) => pts.map((p) => at.xy(p));
  const { top, posts, crossBar, inner, ledge, gussets } = FRAME_110;
  const out = [{ pts: P(outerPath()), w: w(top.width), trim: [0, 0] }];
  out.push({ pts: P([[outerX(-1, crossBar.y), crossBar.y], [outerX(1, crossBar.y), crossBar.y]]), w: w(crossBar.width),
    trim: [w(posts.width / 2), w(posts.width / 2)] });
  for (const side of [-1, 1]) {
    out.push({ pts: P([[innerX(side, crossBar.y), crossBar.y], [innerX(side, inner.foot), inner.foot]]), w: w(inner.width),
      trim: [w(crossBar.width / 2), 0] });
    // The gusset across the corner under the cross bar, from the bar to the outer post.
    const x0 = outerX(side, crossBar.y) - side * (posts.width / 2 + gussets.leg);
    const y1 = crossBar.y + crossBar.width / 2 + gussets.leg;
    out.push({ pts: P([[x0, crossBar.y], [outerX(side, y1), y1]]), w: w(gussets.width),
      trim: [w(crossBar.width / 2), w(posts.width / 2)] });
  }
  out.push({ pts: P([[innerX(-1, ledge.y), ledge.y], [innerX(1, ledge.y), ledge.y]]), w: w(ledge.width),
    trim: [w(inner.width / 2), w(inner.width / 2)] });
  return out;
}

/** The panel's outline as a path (canvas px), for keeping the frame behind it. */
function panelPath(g, at) {
  BF110_PANEL.outline.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  g.closePath();
}

/**
 * The cockpit's dark sides round the panel, between the outer posts from the panel's top down: on the panel's canvas
 * before its plate. `at` is the panel's placer.
 */
export function drawBf110Interior(g, at) {
  const y0 = PANEL_TOP - 3;
  g.fillStyle = INTERIOR;
  g.beginPath();
  g.moveTo(...at.xy([outerX(-1, y0), y0]));
  g.lineTo(...at.xy([outerX(1, y0), y0]));
  g.lineTo(...at.xy([outerX(1, FAR), FAR]));
  g.lineTo(...at.xy([outerX(-1, FAR), FAR]));
  g.closePath();
  g.fill();
}

/**
 * The front frame on the sight's canvas before the Revi: the bars (kept behind the panel), the grab handles, the red
 * knob, then the crash pads over the panel's top. `at` is the panel's placer; `width`, `height` the canvas.
 */
export function drawBf110Frame(g, at, width, height) {
  g.save();
  g.beginPath();
  g.rect(0, 0, width, height);
  panelPath(g, at);
  g.clip('evenodd');
  handles(g, at);
  drawFrames(g, frameBars110(at), GREY, { join: 'round' });
  underPads(g, at);
  ledgeKnobs(g, at);
  redKnob(g, at);
  g.restore();
  for (const side of [-1, 1]) crashPad(g, at, side);
}

/** The dark beneath the crash pads, down to the panel's top (the clip keeps the panel clear). */
function underPads(g, at) {
  const [left, right] = [padPath(-1), padPath(1)];
  g.fillStyle = INTERIOR;
  g.beginPath();
  [[outerX(-1, FAR), FAR], left[1], left[0], right[0], right[1], [outerX(1, FAR), FAR]]
    .forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  g.closePath();
  g.fill();
}

/** The two loop grab handles behind the top bar: grey tubes with a lit upper edge. */
function handles(g, at) {
  const { dx, y, rx, ry, width } = FRAME_110.handles;
  for (const side of [-1, 1]) {
    const [cx, cy] = at.xy([AXIS + side * dx, y]);
    for (const [colour, wd, off] of [[GREY.outline, width + 2, 0], [GREY.band, width, 0], [GREY.lit, width * 0.25, -width * 0.3]]) {
      g.strokeStyle = colour;
      g.lineWidth = at.len(wd);
      g.beginPath();
      g.ellipse(cx, cy + at.len(off), at.len(rx), at.len(ry), 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

/** The ledge's two small knobs at the windscreen posts' feet. */
function ledgeKnobs(g, at) {
  const { y, knob } = FRAME_110.ledge;
  for (const side of [-1, 1]) {
    const [x, ky] = at.xy([innerX(side, y) - side * 16, y - 6]);
    g.fillStyle = '#5c6165';
    g.beginPath();
    g.arc(x, ky, at.len(knob), 0, Math.PI * 2);
    g.fill();
  }
}

/** The bracket on the top bar and the red-knobbed handle hanging from it. */
function redKnob(g, at) {
  const { dx, y, r, bracket } = FRAME_110.knob;
  const top = FRAME_110.top.y;
  const [bx0, by0] = at.xy([AXIS + bracket[0], top - 10]);
  const [bx1, by1] = at.xy([AXIS + bracket[1], top + 18]);
  g.fillStyle = '#7d8286';
  g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  const [kx, ky] = at.xy([AXIS + dx, y]);
  g.strokeStyle = '#b3201b';
  g.lineWidth = at.len(4);
  g.beginPath();
  g.moveTo(kx, by1);
  g.lineTo(kx, ky);
  g.stroke();
  const shade = g.createRadialGradient(kx - at.len(r * 0.3), ky - at.len(r * 0.3), 0, kx, ky, at.len(r));
  shade.addColorStop(0, '#ff6b5e');
  shade.addColorStop(1, '#a3140f');
  g.fillStyle = shade;
  g.beginPath();
  g.arc(kx, ky, at.len(r), 0, Math.PI * 2);
  g.fill();
}

/** A crash pad: padded grey, lighter along its top, a stitched seam inside its upper edge. */
function crashPad(g, at, side) {
  const pts = padPath(side).map((p) => at.xy(p));
  const ys = pts.map(([, y]) => y);
  const shade = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  shade.addColorStop(0, '#80868a');
  shade.addColorStop(1, '#55595d');
  g.fillStyle = shade;
  g.strokeStyle = GREY.outline;
  g.lineWidth = Math.max(1, at.len(2));
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath();
  g.fill();
  g.stroke();
  // The seam: a dashed line a little inside the upper edge.
  const [, , upOut, upIn] = pts;
  g.strokeStyle = 'rgba(30, 32, 34, 0.7)';
  g.lineWidth = Math.max(1, at.len(1.2));
  g.setLineDash?.([at.len(4), at.len(3)]);
  g.beginPath();
  g.moveTo(upOut[0], upOut[1] + at.len(7));
  g.lineTo(upIn[0], upIn[1] + at.len(7));
  g.stroke();
  g.setLineDash?.([]);
}
