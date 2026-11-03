// The Bf 110 C's front cockpit frame (D117), drawn square-on with the panel while the pilot looks ahead, after the
// product owner's photograph of a Bf 110 C cockpit (#32, a layout reference only: redrawn in code), starting from the
// Bf 109's drawn frame (src/ui/bf109Frame.js, D90, D103) and its welded bars (src/ui/frameBars.js, D104):
//   the canopy's outer front frame, a wide flat top bar with rounded corners and side posts leaning out going down to
//   the panel's top corners (as the Bf 109's hood sides; product owner, D120), and the fuselage frames, thin sheets from
//   the posts' outside edges there down to the foot of the screen at 70 degrees (product owner, D121, D139), kept
//   behind the panel;
//   the armoured windscreen's frame below the top bar, its top bar between its own posts only (product owner, D122) and
//   its posts leaning in a little going down, with an arched ledge across their feet (its ends lowered a little; product
//   owner, D128), its top bar raised until its top corners
//   just touch the grab handles (product owner, D125); a bar each side from its top corner out and slightly down to the
//   outer post just below the grab handle (product owner, D126, D127); a thin post from each of its top corners
//   to the outer frame's top corner, as thin as the grab handles (product owner, D123); and below it, a lower frame each
//   side from the windscreen frame's lower corner down and out to the outer post, level with the red button
//   (product owner, D134, D135); the dash covers: a padded grey cover each side, after the product owner's photograph
//   of them (#33), its top edge along the windscreen ledge's lower edge (an arc) from the lower frame to the gunsight's
//   body, its
//   front edge straight from the body's foot down to the lower frame's foot on the outer post, lying over the panel's
//   top, stitched along both edges (product owner, D136, D137);
//   a grab handle in each top corner, an arc from the top bar down to the outer post (product owner, D119); no canopy
//   latch or lever on the top bar, and no knobs on the ledge (product owner, D125);
//   and the cockpit's dark sides round the panel, between the posts and the fuselage frames. No covers over the panel's
//   top yet (D119).
// Sizes are in picture pixels of the Bf 110 panel's layout (#31, src/ui/bf110Panel.js), measured on #32 at about 1.12
// times its pixels from the Revi's axis, the windscreen raised to clear the Revi's larger glass. The 3D cockpit frame is
// hidden meanwhile (src/render/testView.js) and shows again when the pilot looks round; the wings and engines stay.

import { drawFrames } from './frameBars.js';
import { AXIS, OUTLINE, LAYOUT, BRACKET, BF109_SCALE } from './bf110Layout.js';
import { REVI_110 } from './bf110Panel.js';

export const FRAME_110 = {
  // The outer top bar: its middle line's height, half its length to the corners' centres, its width and corner radius.
  top: { y: -244, half: 260, width: 24, corner: 32 },
  // The outer posts: out this many pixels for each pixel down from the top bar's corners (#32: about 0.16), down to
  // `foot`, where the panel first reaches a post (its left wing, D140; the panel's top corners, product owner, D120),
  // both posts ending there; width.
  posts: { slope: 0.16, foot: null, width: 26 },
  // The fuselage frames: thin sheets from the posts' outside edges at their feet down to the foot of the screen, at this
  // angle from the horizontal (degrees), leaning out going down (product owner, D121; thinner and further out, D139);
  // their thickness.
  fuselage: { angle: 70, width: 6 },
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
const TOP_Y = PANEL_TOP;
const PX_110 = 30; // the Bf 110 layout's picture pixels per dial radius (src/ui/bf110Panel.js)

/**
 * The panel's outermost edge on `side` (-1 left, +1 right) at height y: the furthest of its outline's crossings there,
 * or null where the outline does not reach that height.
 */
export function panelEdgeX(side, y) {
  let best = null;
  OUTLINE.forEach((a, i) => {
    const b = OUTLINE[(i + 1) % OUTLINE.length];
    if (a[1] === b[1] || (a[1] - y) * (b[1] - y) > 0) return;
    const x = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
    if (best === null || side * (x - best) > 0) best = x;
  });
  return best;
}

/** An outer post's middle line at height y (`side` -1 left, +1 right): out from the top bar's corner going down. */
export const outerX = (side, y) => AXIS + side * (FRAME_110.top.half + FRAME_110.posts.slope * (y - FRAME_110.top.y));
/**
 * Where the posts end (D120, D140): the highest point at which the panel's edge reaches either post's inner edge (the
 * left wing on #34's panel; the right side stays inside its post), both posts ending there.
 */
FRAME_110.posts.foot = (() => {
  const reaches = (side, y) => {
    const edge = panelEdgeX(side, y);
    return edge !== null && side * (edge - (outerX(side, y) - (side * FRAME_110.posts.width) / 2)) >= 0;
  };
  for (let y = TOP_Y; y < 2000; y += 0.5) if (reaches(-1, y) || reaches(1, y)) return y;
  return TOP_Y;
})();
/**
 * A fuselage frame's middle line at height y, below the post's foot: from the post's outside edge there, out at its
 * angle going down (D139).
 */
export const fuselageX = (side, y) => {
  const { foot, width } = FRAME_110.posts;
  const start = outerX(side, foot) + (side * width) / 2;
  return start + (side * (y - foot)) / Math.tan((FRAME_110.fuselage.angle * Math.PI) / 180);
};

/** A fuselage frame's line (`side` -1 left, +1 right): from the post's outside edge at its foot to below the screen. */
export const fuselagePath = (side) => {
  const { foot } = FRAME_110.posts;
  return [[fuselageX(side, foot), foot], [fuselageX(side, FAR), FAR]];
};
/** A windscreen post's middle line at height y: in from the cross bar going down. */
export const innerX = (side, y) => {
  const { half, lean, at } = FRAME_110.inner;
  return AXIS + side * (half - lean * (y - at));
};

/**
 * The outer frame's line: up the left post from its foot, round the corner, across the top bar, round, down the right
 * post to its foot. The fuselage frames are thin sheets of their own (D139).
 */
export function outerPath() {
  const { y, corner } = FRAME_110.top;
  const { foot } = FRAME_110.posts;
  const pts = [[outerX(-1, foot), foot]];
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
  pts.push([outerX(1, foot), foot]);
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

/**
 * A lower windscreen frame's line (`side` -1 left, +1 right; D134, D135): from the windscreen frame's lower corner, where
 * its post meets the ledge's end, down and out to the outer post, level with the red button on the panel.
 */
export function lowerFramePath(side) {
  const ledge = ledgePath();
  const y = LAYOUT.knobs.redButton[1];
  return [ledge[side < 0 ? 0 : ledge.length - 1], [outerX(side, y), y]];
}

/**
 * A dash cover's outline (`side` -1 left, +1 right; D136-D138), after the product owner's photograph (#33): its top edge
 * along the windscreen ledge's lower edge, an arc, from the ledge's end (under the windscreen post and the lower frame)
 * in to the gunsight's body; down the body's side (behind it) to its foot on the panel's top; then its front edge
 * straight down and out to the lower frame's foot on the outer post, and back up the lower frame (under it). Points: the
 * top edge, outer to inner, then the foot inner and the foot outer.
 */
export function dashCoverPath(side) {
  const [, foot] = lowerFramePath(side);
  const { y, sag, width } = FRAME_110.ledge;
  const arc = ledgePath();
  const half = AXIS - arc[0][0];
  const radius = (half * half + sag * sag) / (2 * sag);
  const centre = [AXIS, y + radius];
  const k = (radius - width / 2) / radius; // the arc's lower edge, toward its centre
  const lower = arc.map(([px, py]) => [centre[0] + (px - centre[0]) * k, centre[1] + (py - centre[1]) * k]);
  // A little inside the body's side, so the cover runs on behind the Revi.
  const sight = AXIS + side * (Math.abs(REVI_110.body.x[side < 0 ? 0 : 1]) * BF109_SCALE * PX_110 - 3);
  const ours = (side < 0 ? lower : [...lower].reverse()).filter(([px]) => side * (px - sight) > 0);
  const last = ours[ours.length - 1];
  const next = (side < 0 ? lower : [...lower].reverse())[ours.length];
  const t = (sight - last[0]) / (next[0] - last[0]);
  const top = [...ours, [sight, last[1] + (next[1] - last[1]) * t]];
  return [...top, [sight, PANEL_TOP], foot];
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
    ...[-1, 1].map((side) => ({
      pts: P(lowerFramePath(side)), w: w(inner.width), trim: [w(inner.width / 2), w(posts.width / 2)],
    })),
    { pts: P(ledgePath()), w: w(ledge.width),
      trim: [w(inner.width / 2), w(inner.width / 2)] },
  ];
}

/** The panel's outline as a path (canvas px), for keeping the frame behind it. */
function panelPath(g, at) {
  OUTLINE.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
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
  g.lineTo(...at.xy([fuselageX(1, foot), foot]));
  g.lineTo(...at.xy([fuselageX(1, FAR), FAR]));
  g.lineTo(...at.xy([fuselageX(-1, FAR), FAR]));
  g.lineTo(...at.xy([fuselageX(-1, foot), foot]));
  g.lineTo(...at.xy([outerX(-1, foot), foot]));
  g.closePath();
  g.fill();
}

/**
 * The front frame on the sight's canvas before the Revi: the corner posts and grab handles, then the bars, kept behind
 * the panel. `at` is the panel's placer; `width`, `height` the canvas.
 */
export function drawBf110Frame(g, at, width, height) {
  for (const side of [-1, 1]) dashCover(g, at, side); // over the panel's top, under the bars
  g.save();
  g.beginPath();
  g.rect(0, 0, width, height);
  panelPath(g, at);
  g.clip('evenodd');
  handles(g, at);
  sheets(g, at);
  drawFrames(g, frameBars110(at), GREY, { join: 'round' });
  g.restore();
}

/**
 * A dash cover (D136, D137): padded grey, lighter at the back, with its dark outline, and a stitched seam a little inside
 * its top and front edges, as photographed (#33). The bars are drawn over its edge along the lower frame.
 */
function dashCover(g, at, side) {
  g.save();
  // The clock's bracket stands proud of the panel, in front of the cover (D140).
  g.beginPath();
  g.rect(-1e5, -1e5, 2e5, 2e5);
  BRACKET.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  g.closePath();
  g.clip('evenodd');
  const pts = dashCoverPath(side).map((p) => at.xy(p));
  const top = pts.slice(0, -2);
  const [footInner, footOuter] = pts.slice(-2);
  const shade = g.createLinearGradient(0, Math.min(...top.map(([, y]) => y)), 0, footOuter[1]);
  shade.addColorStop(0, GREY.lit);
  shade.addColorStop(1, GREY.band);
  g.fillStyle = shade;
  g.strokeStyle = GREY.outline;
  g.lineWidth = Math.max(1, at.len(2));
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath();
  g.fill();
  g.stroke();
  // The stitching: dashed, light, a few pixels in from the top and front edges.
  const inset = at.len(6);
  g.strokeStyle = 'rgba(205, 208, 210, 0.75)';
  g.lineWidth = Math.max(1, at.len(1.5));
  g.setLineDash?.([at.len(4), at.len(3)]);
  g.beginPath();
  top.forEach(([x, y], i) => (i ? g.lineTo(x, y + inset) : g.moveTo(x, y + inset)));
  const [ex, ey] = [footOuter[0] - footInner[0], footOuter[1] - footInner[1]];
  const n = Math.hypot(ex, ey);
  const [dx, dy] = [(side * ey * inset) / n, (-side * ex * inset) / n]; // inside (above) the front edge
  g.moveTo(footInner[0] + dx, footInner[1] + dy);
  g.lineTo(footOuter[0] + dx, footOuter[1] + dy);
  g.stroke();
  g.setLineDash?.([]);
  g.restore();
}

/** The fuselage frames (D139): thin grey sheets with a dark outline, lit along their inner edge. */
function sheets(g, at) {
  const { width } = FRAME_110.fuselage;
  for (const side of [-1, 1]) {
    const pts = fuselagePath(side).map((p) => at.xy(p));
    for (const [colour, wd] of [[GREY.outline, width + 2], [GREY.band, width]]) {
      g.strokeStyle = colour;
      g.lineWidth = at.len(wd);
      g.lineCap = 'butt';
      g.beginPath();
      g.moveTo(...pts[0]);
      g.lineTo(...pts[1]);
      g.stroke();
    }
    const d = -side * at.len(width * 0.3); // towards the cockpit
    g.strokeStyle = GREY.lit;
    g.lineWidth = Math.max(1, at.len(width * 0.25));
    g.beginPath();
    g.moveTo(pts[0][0] + d, pts[0][1]);
    g.lineTo(pts[1][0] + d, pts[1][1]);
    g.stroke();
  }
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
