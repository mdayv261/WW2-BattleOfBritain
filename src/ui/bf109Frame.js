// The Bf 109's front cockpit frame (D90, redrawn in D103), drawn square-on with the panel while the pilot looks ahead,
// as the product owner's museum photograph from the seat shows it (#16, a shape guide only), with square joins: the
// coaming's thin lip arching tight over the top of the panel above the clock and on round it; the front pane's two
// posts rising from it, leaning in a little, to a cross bar just above the Revi and then angling out to the hood's flat
// top frame's square corners; the hood's sides from those corners, leaning out going down, with 45° braces across the
// corners; and the
// side windows' lower frames running diagonally down from the posts' feet to meet the hood's sides, the cockpit's dark
// interior below them round the panel. Sizes are in picture pixels of the restored panel (#17, through the panel's
// placer, src/ui/bf109Panel.js), measured on #16 against its dials; the height above the cross bar is compressed so the
// top frame shows on the screen. The 3D windscreen, nose and wings are hidden meanwhile (src/render/testView.js) and
// show again when the pilot looks round.

import { drawFrames } from './frameBars.js';

export const FRAME = {
  // The coaming's lip: the middle of the band follows an ellipse; its inner edge runs over the upper plate's top above
  // the clock and down to the posts' feet.
  // The lip runs only between the posts' feet (product owner, D103).
  arch: { cx: 583, cy: 343.2, a: 291, b: 129.2, thick: 22, extend: 0 },
  // The posts' feet at the arch's ends, their width, and how far they lean outward for each pixel up.
  // (D103: 20% closer together than #16's and leaning in about 5° going up, at the product owner's request.)
  posts: { feet: [[383, 260.4], [783, 260.4]], width: 24, lean: -0.0875 },
  // The side windows' lower frames (the fuselage's sides): from their feet on the coaming (where the posts stood before
  // D103's narrowing), outward this many pixels for each pixel down, steep enough to run close by the panel's wings to
  // the foot of the screen (product owner, D103); their width.
  // They start at the posts' feet, joining them (product owner, D103).
  sides: { feet: [[383, 260.4], [783, 260.4]], slope: 1.02, width: 32 },
  // The hood's flat top frame: its height and its half-width about the windscreen's centre (the square corners; 20%
  // narrower than #16's at the product owner's request, D103).
  // 20% lower above the coaming than at first (product owner, D103).
  top: { y: -176, half: 464, width: 28 },
  // The hood's sides: from the top frame's corners, outward this many pixels for each pixel down (steeper than #16's, so
  // they still meet the side windows' lower frames where they did).
  hood: { slope: 0.247, width: 28 },
  // The front pane's cross bar between the posts, just above the Revi's glass (lowered with the top frame as far as the
  // glass allows, D103).
  crossBar: { y: -53, width: 22 },
  // The 45° braces across the top corners: from the top frame `half` from the centre down to the hood's side at `y`.
  braces: { half: 320, y: 15, width: 22 }, // at 45° from the lowered top frame
  // The cowling MG 17s' muzzle flashes on the lip's top edge (product owner, D94): symmetric about the windscreen's
  // centre (the fuselage's centre line), well apart, left and right; their size.
  flashes: { x: [423, 743], size: 16 }, // between the posts' feet (D103)
};
/** How long a muzzle flash shows after each shot, s: as the 3D flashes (src/render/projectiles.js). */
export const FLASH_TIME = 0.03;

/** Which cowling MG 17s are flashing now: { left, right }, from the simulation's synchronised guns. */
export function mgFlashes(sim) {
  const out = { left: false, right: false };
  for (const gun of sim.armament ?? []) {
    if (!gun.spec.synchronised || sim.plane.time - gun.lastShot >= FLASH_TIME) continue;
    out[gun.spec.z < 0 ? 'left' : 'right'] = true;
  }
  return out;
}

/** A muzzle flash's point on the lip's top edge (picture pixels): `side` -1 left, +1 right. */
export function flashPoint(side) {
  const { cx, a, thick } = FRAME.arch;
  const x = FRAME.flashes.x[side < 0 ? 0 : 1];
  return archPoint(2 * Math.PI - Math.acos((x - cx) / (a + thick / 2)), -thick / 2);
}
const FAR = 4000; // picture pixels: far enough to run off any screen
const INTERIOR = '#2b2e31';
const CENTRE = 583; // the windscreen's centre, the fuselage's centre line
// All the frames in the coaming's style, dark grey (product owner, D103): the band, a lit edge, a shaded edge, rivets.
const GREY = { band: '#4c5054', lit: '#7a7f83', shade: '#2c2f31', rivet: '#3a3d40', outline: '#17191a' };

/** The hood's side's x at height y (`side` -1 left, +1 right), from the top frame's corner outward going down. */
export const hoodX = (side, y) => CENTRE + side * (FRAME.top.half + FRAME.hood.slope * (y - FRAME.top.y));

/** Where a side window's lower frame meets the hood's side (`side` -1 left, +1 right): the window's bottom corner. */
export function windowCorner(side) {
  const [fx, fy] = FRAME.sides.feet[side < 0 ? 0 : 1];
  // fx + side·s·(y − fy) = CENTRE + side·(half + h·(y − top)), solved for y.
  const { slope: s } = FRAME.sides;
  const { slope: h } = FRAME.hood;
  const y = (side * (CENTRE - fx) + FRAME.top.half - h * FRAME.top.y + s * fy) / (s - h);
  return [sideX(side, y), y];
}

/**
 * The arch's end angles (rad, canvas ellipse angles: 0 to the right, increasing clockwise), where its inner edge meets
 * the side windows' lower frames' feet.
 */
export function archAngles() {
  const { cx, a, thick } = FRAME.arch;
  const t = Math.acos((FRAME.sides.feet[1][0] - cx) / (a - thick / 2));
  return [Math.PI + t, 2 * Math.PI - t];
}

/** The lip's end angles, carried on past the posts' feet round the panel (D103). */
export function coamingAngles() {
  const [t0, t1] = archAngles();
  const more = (t1 - t0) * FRAME.arch.extend;
  return [t0 - more, t1 + more];
}

/**
 * A post's line (picture pixels): from its foot on the coaming up to the cross bar, leaning in, then angling out to the
 * top frame's corner (product owner, D103).
 */
export function postPath(side) {
  const { y } = FRAME.crossBar;
  return [FRAME.posts.feet[side < 0 ? 0 : 1], [postX(side, y), y], [CENTRE + side * FRAME.top.half, FRAME.top.y]];
}

/** A point on the arch at angle t (picture pixels): on its middle line, or `inset` pixels inside it (its inner edge). */
export const archPoint = (t, inset = 0) => [
  FRAME.arch.cx + (FRAME.arch.a - inset) * Math.cos(t), FRAME.arch.cy + (FRAME.arch.b - inset) * Math.sin(t),
];

/** The side window's lower frame's line from its foot (`side` -1 left, +1 right) at picture height y. */
export const sideX = (side, y) => FRAME.sides.feet[side < 0 ? 0 : 1][0] + side * FRAME.sides.slope * (y - FRAME.sides.feet[0][1]);
/** A post's middle line (`side` -1 left, +1 right) at picture height y (above its foot). */
export const postX = (side, y) => FRAME.posts.feet[side < 0 ? 0 : 1][0] + side * FRAME.posts.lean * (FRAME.posts.feet[0][1] - y);

/**
 * The cockpit's interior round the panel, below the coaming's lip and between the side frames: drawn on the panel's
 * canvas before its plates. `at` is the panel's placer.
 */
export function drawInterior(g, at) {
  const [t0, t1] = archAngles();
  const y0 = FRAME.sides.feet[0][1];
  g.fillStyle = INTERIOR;
  g.beginPath();
  for (let k = 0; k <= 24; k += 1) {
    const p = at.xy(archPoint(t0 + ((t1 - t0) * k) / 24, FRAME.arch.thick / 2)); // along the lip's inner edge
    if (k) g.lineTo(...p);
    else g.moveTo(...p);
  }
  g.lineTo(...at.xy([sideX(1, y0 + FAR), y0 + FAR]));
  g.lineTo(...at.xy([sideX(-1, y0 + FAR), y0 + FAR]));
  g.closePath();
  g.fill();
}

/**
 * The frame's bars in canvas px, in welded drawing order (D104): each bar after the one it ends on, its edges trimmed
 * back by half that bar's width. `at` is the panel's placer.
 */
export function frameBars(at) {
  const w = (px) => at.len(px);
  const P = (pts) => pts.map((p) => at.xy(p));
  const { top, posts, sides, crossBar, braces, arch } = FRAME;
  const [t0, t1] = coamingAngles();
  const lip = [];
  for (let k = 0; k <= 32; k += 1) lip.push(archPoint(t0 + ((t1 - t0) * k) / 32));
  const out = [{ pts: P(lip), w: w(arch.thick), trim: [0, 0] }];
  for (const side of [-1, 1]) {
    // The side window's lower frame (the fuselage's side), from its foot on the coaming to the foot of the screen.
    out.push({ pts: P([sides.feet[side < 0 ? 0 : 1], [sideX(side, FAR), FAR]]), w: w(sides.width), trim: [w(arch.thick), 0] });
  }
  // The hood: up the left side from the window's corner, across the top frame, down the right side.
  const hood = [windowCorner(-1), [CENTRE - top.half, top.y], [CENTRE + top.half, top.y], windowCorner(1)];
  out.push({ pts: P(hood), w: w(top.width), trim: [w(sides.width / 2), w(sides.width / 2)] });
  for (const side of [-1, 1]) {
    // The post: up from its foot on the coaming to the cross bar, then out to the top frame's corner.
    out.push({ pts: P(postPath(side)), w: w(posts.width), trim: [w(arch.thick), w(top.width / 2)] });
  }
  out.push({ pts: P([[postX(-1, crossBar.y), crossBar.y], [postX(1, crossBar.y), crossBar.y]]), w: w(crossBar.width),
    trim: [w(posts.width / 2), w(posts.width / 2)] });
  // The corner braces, over the posts where they cross (product owner, D103).
  for (const side of [-1, 1]) {
    out.push({ pts: P([[CENTRE + side * braces.half, top.y], [hoodX(side, braces.y), braces.y]]), w: w(braces.width),
      trim: [w(top.width / 2), w(top.width / 2)] });
  }
  return out;
}

/**
 * The hood's front frame, the posts, the cross bar, the side windows' lower frames and the coaming's lip, on
 * the sight's canvas before the Revi, all with square joins (D103), and the MG 17s' muzzle flashes on the lip
 * (`flashes`: { left, right }, D94). `at` is the panel's placer.
 */
export function drawFrontFrame(g, at, flashes = { left: false, right: false }) {
  drawFrames(g, frameBars(at), GREY, { join: 'miter' });
  for (const [side, on] of [[-1, flashes.left], [1, flashes.right]]) {
    if (on) muzzleFlash(g, ...at.xy(flashPoint(side)), at.len(FRAME.flashes.size));
  }
}

/** A muzzle flash: a short yellow-orange star with a soft glow, at (x, y) of radius `size` (canvas px). */
function muzzleFlash(g, x, y, size) {
  const glow = g.createRadialGradient(x, y, 0, x, y, size * 1.6);
  glow.addColorStop(0, 'rgba(255, 245, 200, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 190, 80, 0.75)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(x, y, size * 1.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff1c4';
  g.beginPath();
  for (let k = 0; k < 12; k += 1) {
    const a = (k / 12) * Math.PI * 2;
    const r = k % 2 ? size * 0.35 : size;
    if (k) g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}

