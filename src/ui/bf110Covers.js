// The Bf 110 C's dash covers (D136-D138) and the panel's top round them (D144, D145), drawn on the sight's canvas
// over the panel's top and under the front frame's bars (src/ui/bf110Frame.js), raised with the frame (D143): two
// padded grey covers either side of the Revi after the product owner's photograph (#33), their inner feet at the Revi's
// brown pad; the panel's top filled up to them and under the Revi; and the panel's top widened on the right to the
// right cover.

import { AXIS, OUTLINE, BRACKET, BF109_SCALE, REVI_110, REVI_RAISE, PX } from './bf110Layout.js';
import {
  FRAME_110, FRAME_SHIFT, TOP_Y, PANEL_TOP, GREY, framePlacer, ledgePath, lowerFramePath, panelPath,
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
 * The panel's top widened on the right to the right cover (D145), in the panel's picture pixels: from the top edge's
 * right end up to the cover's front edge, along it to the cover's foot on the outer post, level from there back to the
 * panel's right shoulder, and up the shoulder to the top edge. Filled in the plate's colour over the dark cockpit side.
 */
export function shoulderPath() {
  const toPanel = ([x, y]) => [x, y + FRAME_SHIFT];
  const [inner, foot] = dashCoverPath(1).slice(-2).map(toPanel);
  const edgeY = (x) => inner[1] + ((foot[1] - inner[1]) * (x - inner[0])) / (foot[0] - inner[0]); // the front edge
  // The right shoulder from the top edge's right end down to the cover's foot's height.
  const start = OUTLINE.findIndex(([x, y], i) => y === PANEL_TOP && OUTLINE[i + 1][1] > PANEL_TOP);
  const shoulder = [OUTLINE[start]];
  for (let i = start + 1; OUTLINE[i - 1][1] < foot[1]; i += 1) {
    const [x0, y0] = OUTLINE[i - 1];
    const [x1, y1] = OUTLINE[i];
    if (y1 < foot[1]) shoulder.push(OUTLINE[i]);
    else shoulder.push([x0 + ((x1 - x0) * (foot[1] - y0)) / (y1 - y0), foot[1]]);
  }
  const [endX] = shoulder[0];
  return [[endX, edgeY(endX)], foot, ...shoulder.reverse()];
}

/**
 * The covers and the panel's top round them, on the sight's canvas before the front frame. `panelAt` is the panel's
 * placer; `width`, `height` the canvas.
 */
export function drawBf110Covers(g, panelAt, width, height) {
  const at = framePlacer(panelAt); // raised with the frame (D143)
  coaming(g, at, panelAt, width, height);
  shoulder(g, panelAt);
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

/** The panel's top widened on the right to the cover (D145): the plate's colour, its new lower edge lined as the plate's. */
function shoulder(g, panelAt) {
  const pts = shoulderPath().map((p) => panelAt.xy(p));
  g.fillStyle = PLATE_TOP;
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath();
  g.fill();
  g.strokeStyle = '#1d1f1d';
  g.lineWidth = Math.max(1.5, panelAt.len(2));
  g.beginPath();
  g.moveTo(...pts[1]);
  g.lineTo(...pts[2]);
  g.stroke();
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
