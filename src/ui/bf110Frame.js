// The Bf 110 C's front cockpit frame (D117), drawn square-on with the panel while the pilot looks ahead, after the
// product owner's photograph of a Bf 110 C cockpit (#32, a layout reference only: redrawn in code), starting from the
// Bf 109's drawn frame (src/ui/bf109Frame.js, D90, D103) and its welded bars (src/ui/frameBars.js, D104):
//   the canopy's outer front frame, a wide flat top bar with rounded corners and side posts leaning out going down to
//   the panel's top corners (as the Bf 109's hood sides; product owner, D120), then the fuselage frames on down to the
//   foot of the screen at 75 degrees (as the Bf 109's fuselage frames; product owner, D121), kept behind the panel;
//   the bar across between the outer posts (as the Bf 109's cross bar) with the armoured windscreen's posts below it,
//   leaning in a little going down, a ledge across their feet, and small gussets in the corners;
//   a grab handle in each top corner, an arc from the top bar down to the outer post (product owner, D119), and the
//   bracket on the top bar with the red-knobbed handle hanging below;
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
  // The bar across between the outer posts, above the Revi's glass.
  crossBar: { y: -164, width: 22 },
  // The armoured windscreen's posts: half apart at the cross bar, in this many pixels for each pixel down, down to `foot`
  // (the ledge's lower edge); width.
  inner: { half: 207, lean: 0.14, foot: 12, width: 20 },
  // The ledge across the windscreen's foot, behind the Revi, and its two knobs.
  ledge: { y: 6, width: 12, knob: 7 },
  // The gussets in the corners between the cross bar and the outer posts: their legs.
  gussets: { leg: 34, width: 16 },
  // The grab handles in the top corners: arcs round the corner from the top bar, `along` in from the corner, down to the
  // outer post, `down` below the top bar (#32: about 100 and 50 of its pixels); tube width.
  handles: { along: 112, down: 56, width: 9 },
  // The bracket on the top bar and the red-knobbed handle below it, right of the axis.
  knob: { dx: 52, y: -146, r: 8, bracket: [20, 90] },
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
export const innerX = (side, y) => AXIS + side * (FRAME_110.inner.half - FRAME_110.inner.lean * (y - FRAME_110.crossBar.y));

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
 * The front frame on the sight's canvas before the Revi: the grab handles, the bars (kept behind the panel), the
 * ledge's knobs and the red knob. `at` is the panel's placer; `width`, `height` the canvas.
 */
export function drawBf110Frame(g, at, width, height) {
  g.save();
  g.beginPath();
  g.rect(0, 0, width, height);
  panelPath(g, at);
  g.clip('evenodd');
  handles(g, at);
  drawFrames(g, frameBars110(at), GREY, { join: 'round' });
  ledgeKnobs(g, at);
  redKnob(g, at);
  g.restore();
}

/** The grab handles: grey tubes with a lit upper edge, their ends under the bars (drawn first). */
function handles(g, at) {
  const { width } = FRAME_110.handles;
  for (const side of [-1, 1]) {
    const pts = handlePath(side).map((p) => at.xy(p));
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
