// The Bf 110 C's dash covers (D136-D138) and the panel's top round them (D144), drawn on the sight's canvas
// over the panel's top and under the front frame's bars (src/ui/bf110Frame.js), raised with the frame (D143): two
// padded grey covers either side of the Revi after the product owner's photograph (#33), their inner feet at the Revi's
// brown pad; and the panel's top filled up to them and under the Revi. (The panel's right corner reaches the right cover
// itself, D146.)

import { AXIS, BRACKET, BF109_SCALE, REVI_110, REVI_RAISE, PX } from './bf110Layout.js';
import {
  FRAME_110, TOP_Y, GREY, framePlacer, ledgePath, lowerFramePath, panelPath,
} from './bf110Frame.js';

const PLATE_TOP = '#4d524c'; // the panel's plate at its top (src/ui/bf110Fittings.js)

/**
 * A dash cover's outline (`side` -1 left, +1 right; D136-D138), after the product owner's photograph (#33): its top edge
 * along the windscreen ledge's lower edge, an arc, from the ledge's end (under the windscreen post and the lower frame)
 * in to the gunsight's body; down the body's side (behind it) to the brown pad's lower corner (D144); then its front edge
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
  const sight = AXIS + side * (Math.abs(REVI_110.body.x[side < 0 ? 0 : 1]) * BF109_SCALE * PX - 3);
  const ours = (side < 0 ? lower : [...lower].reverse()).filter(([px]) => side * (px - sight) > 0);
  const last = ours[ours.length - 1];
  const next = (side < 0 ? lower : [...lower].reverse())[ours.length];
  const t = (sight - last[0]) / (next[0] - last[0]);
  const top = [...ours, [sight, last[1] + (next[1] - last[1]) * t]];
  return [...top, [sight, PAD_FOOT_Y], foot]; // its inner foot at the Revi's brown pad's lower corner (D144)
}

/** The Revi's brown pad's foot in the frame's picture pixels: REVI_RAISE above the panel's top (D141, D144). */
const PAD_FOOT_Y = TOP_Y - REVI_RAISE * PX;

/**
 * The panel's top uncovered by raising the dash covers' inner feet to the pad (D144): from each cover's outer foot along
 * its front edge to the pad, across under the Revi, and back along where the front edges ran down to the panel's top
 * (D143). Filled in the plate's colour where it lies outside the panel's outline, so the panel's top reaches up to the
 * covers and the Revi.
 */
export function coamingPath() {
  const [left, right] = [dashCoverPath(-1), dashCoverPath(1)];
  const feet = (pts) => pts.slice(-2); // the inner foot, the outer foot
  const [[lInner, lOuter], [rInner, rOuter]] = [feet(left), feet(right)];
  return [lOuter, lInner, rInner, rOuter, [rInner[0], TOP_Y], [lInner[0], TOP_Y]];
}

/**
 * The covers and the panel's top round them, on the sight's canvas before the front frame. `panelAt` is the panel's
 * placer; `width`, `height` the canvas.
 */
export function drawBf110Covers(g, panelAt, width, height) {
  const at = framePlacer(panelAt); // raised with the frame (D143)
  coaming(g, at, panelAt, width, height);
  for (const side of [-1, 1]) dashCover(g, at, panelAt, side); // over the panel's top, under the bars
}

/** The panel's top up to the covers and the Revi (D144): the plate's colour, kept outside the panel's outline. */
function coaming(g, at, panelAt, width, height) {
  g.save();
  g.beginPath();
  g.rect(0, 0, width, height);
  panelPath(g, panelAt);
  g.clip('evenodd');
  g.fillStyle = PLATE_TOP;
  g.beginPath();
  coamingPath().forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  g.closePath();
  g.fill();
  g.restore();
}

/**
 * A dash cover (D136, D137): padded grey, lighter at the back, with its dark outline, and a stitched seam a little inside
 * its top and front edges, as photographed (#33). The bars are drawn over its edge along the lower frame.
 */
function dashCover(g, at, panelAt, side) {
  g.save();
  // The clock's bracket stands proud of the panel, in front of the cover (D140).
  g.beginPath();
  g.rect(-1e5, -1e5, 2e5, 2e5);
  BRACKET.forEach((p, i) => (i ? g.lineTo(...panelAt.xy(p)) : g.moveTo(...panelAt.xy(p))));
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
