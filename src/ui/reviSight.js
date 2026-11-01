// The Bf 109 E's Revi C/12C reflector sight (D89), drawn square-on as the pilot sees it from the seat, from behind:
// the clear reflector glass above, the dark sun-filter glass set in its middle, the black housing at their foot with its
// curved dip over the lens, the body with its brown leather crash pad facing the pilot, the sun filter's lever on the
// left, the bead post on the right, the mounting block, the knurled lamp and brightness knob underneath, and the cable
// looping down to its clip on the panel. After the product owner's pictures: the photograph of the reflected reticle
// (#21) for the glasses and the housing round the reticle; the museum photograph from the seat (#16) for the sizes as
// the pilot sees them; the restored panel (#17) and the Revi photographs (#19, #20) for the parts and finish; and the
// page of a German Revi manual (#18, drawn at about 1:2.5) for the parts' names. The reticle (src/ui/reticle.js) is seen
// only on the glass, where the guns' line falls.
// Sizes are in dial radii of the Bf 109's panel, from the guns' line looking ahead (x to the right, y down), measured on
// #21 against the reticle's ring (0.9 radii at the game's view): the sight stands in front of the panel's top, between
// the clock and the manifold pressure gauge.

import { BF109_PANEL } from './bf109Panel.js';
import { panelRadius } from './instruments.js';
import { roundRect } from './panelParts.js';
import { drawReticle } from './reticle.js';

export const REVI = {
  // The clear glass: its top edge, half its width there and at the housing, the housing's top at the sides and the
  // bottom of the dip in its middle.
  glass: { top: -1.83, topHalf: 2.24, footHalf: 2.08, foot: 0.6, dip: 1.3 },
  filter: { x: [-1.8, 1.73], top: -1.08 }, // the dark glass, down to the housing
  housing: { y: [0.6, 1.7], dipHalf: 1.55 },
  body: { x: [-1.5, 1.35], y: [1.6, 5.6] },
  pad: { x: [-0.77, 1.15], y: [1.75, 5.15] },
  lever: { x: [-1.78, -1.45], y: [2.9, 4.5] },
  post: { x: 1.85, y: [0.05, 0.6] },
  block: { x: [-1.2, 1.1], y: [5.15, 6.4] },
  knob: { x: [-0.75, 0.25], y: [6.45, 7.0] },
  cable: [[-0.25, 7.0], [-0.85, 7.25], [-0.8, 7.75], [-0.35, 7.75]], // to its clip on the panel
};

/**
 * Where the Revi goes on a screen `width` x `height` (CSS px), the panel slid up by `slide` (looking down, D89): placed on
 * the guns' line looking ahead (the middle of the screen, moved up with the panel). Returns { r (px per dial radius),
 * x, y (the guns' line looking ahead), glass: { x, y, w, h } (the clear glass's extent down to the dip) }.
 */
export function reviPlacement(width, height, slide = 0) {
  const r = panelRadius(BF109_PANEL, width, height);
  const x = width / 2;
  const y = height / 2 - slide;
  const { glass } = REVI;
  return {
    r, x, y,
    glass: { x: x - glass.topHalf * r, y: y + glass.top * r, w: 2 * glass.topHalf * r, h: (glass.dip - glass.top) * r },
  };
}

/** Draws the Revi at its placement `p`; the reticle (at `aim`: { x, y, ring }) on its glass. */
export function drawRevi(g, p, aim) {
  const { r, x, y } = p;
  const X = (u) => x + u * r;
  const Y = (u) => y + u * r;
  const part = ({ x: [x0, x1], y: [y0, y1] }) => [X(x0), Y(y0), (x1 - x0) * r, (y1 - y0) * r];

  // The cable, behind the body: from the knob down to its clip on the panel.
  const c = REVI.cable.map(([u, v]) => [X(u), Y(v)]);
  g.strokeStyle = '#0d0d0e';
  g.lineWidth = Math.max(2, r * 0.13);
  g.beginPath();
  g.moveTo(...c[0]);
  g.bezierCurveTo(...c[1], ...c[2], ...c[3]);
  g.stroke();

  glasses(g, p, aim, X, Y);

  // The housing at the glasses' foot, its top dipping over the lens in the middle.
  const { glass, housing } = REVI;
  g.fillStyle = '#0b0b0c';
  g.beginPath();
  g.moveTo(X(-glass.footHalf), Y(glass.foot));
  g.lineTo(X(-housing.dipHalf), Y(glass.foot));
  dip(g, X, Y);
  g.lineTo(X(glass.footHalf), Y(glass.foot));
  g.lineTo(X(glass.footHalf - 0.1), Y(housing.y[1]));
  g.lineTo(X(-glass.footHalf + 0.1), Y(housing.y[1]));
  g.closePath();
  g.fill();

  // Body, the sun filter's lever and the bead post.
  const body = part(REVI.body);
  const shade = g.createLinearGradient(body[0], 0, body[0] + body[2], 0);
  shade.addColorStop(0, '#0e0f10');
  shade.addColorStop(0.3, '#2c2e30');
  shade.addColorStop(1, '#141516');
  g.fillStyle = shade;
  roundRect(g, ...body, r * 0.25);
  g.fill();
  g.fillStyle = '#1d1f21';
  roundRect(g, ...part(REVI.lever), r * 0.1);
  g.fill();
  disc(g, X(-1.62), Y(3.2), r * 0.08, '#6d7073');
  const post = REVI.post;
  g.fillStyle = '#121314';
  g.fillRect(X(post.x) - r * 0.12, Y(post.y[1]) - r * 0.18, r * 0.24, r * 0.18);
  g.strokeStyle = '#121314';
  g.lineWidth = Math.max(1, r * 0.05);
  g.beginPath();
  g.moveTo(X(post.x), Y(post.y[1]));
  g.lineTo(X(post.x), Y(post.y[0]));
  g.stroke();

  // Mounting block and the knurled knob below it.
  g.fillStyle = '#1a1b1d';
  roundRect(g, ...part(REVI.block), r * 0.12);
  g.fill();
  const knob = part(REVI.knob);
  g.fillStyle = '#0b0b0c';
  roundRect(g, ...knob, r * 0.08);
  g.fill();
  g.strokeStyle = '#3c3e40';
  g.lineWidth = Math.max(1, r * 0.04);
  for (let k = 1; k < 8; k += 1) {
    const kx = knob[0] + (knob[2] * k) / 8;
    g.beginPath();
    g.moveTo(kx, knob[1] + r * 0.06);
    g.lineTo(kx, knob[1] + knob[3] - r * 0.06);
    g.stroke();
  }

  // The leather crash pad: brown, worn lighter on its face, darker at the edges.
  const pad = part(REVI.pad);
  const leather = g.createRadialGradient(pad[0] + pad[2] * 0.45, pad[1] + pad[3] * 0.35, r * 0.2, pad[0] + pad[2] / 2, pad[1] + pad[3] / 2, pad[3] * 0.7);
  leather.addColorStop(0, '#8a5a36');
  leather.addColorStop(0.7, '#6a3f22');
  leather.addColorStop(1, '#3e2312');
  g.fillStyle = leather;
  roundRect(g, ...pad, r * 0.32);
  g.fill();
  g.strokeStyle = 'rgba(30, 16, 8, 0.6)';
  g.lineWidth = Math.max(1, r * 0.04);
  roundRect(g, pad[0] + r * 0.12, pad[1] + r * 0.12, pad[2] - r * 0.24, pad[3] - r * 0.24, r * 0.24);
  g.stroke();
}

/** The housing's dip, from its left edge to its right, as a curve on the current path. */
function dip(g, X, Y) {
  const { glass, housing } = REVI;
  const depth = 2 * glass.dip - glass.foot; // the control point that takes the curve's middle down to the dip
  g.quadraticCurveTo(X(0), Y(depth), X(housing.dipHalf), Y(glass.foot));
}

/** The clear glass's outline, its top corners rounded, down its sides to the housing and along the dip. */
function glassPath(g, X, Y) {
  const { glass, housing } = REVI;
  const k = 0.18;
  g.beginPath();
  g.moveTo(X(-glass.footHalf), Y(glass.foot));
  g.lineTo(X(-glass.topHalf), Y(glass.top + k));
  g.quadraticCurveTo(X(-glass.topHalf), Y(glass.top), X(-glass.topHalf + k), Y(glass.top));
  g.lineTo(X(glass.topHalf - k), Y(glass.top));
  g.quadraticCurveTo(X(glass.topHalf), Y(glass.top), X(glass.topHalf), Y(glass.top + k));
  g.lineTo(X(glass.footHalf), Y(glass.foot));
  g.lineTo(X(housing.dipHalf), Y(glass.foot));
  g.quadraticCurveTo(X(0), Y(2 * glass.dip - glass.foot), X(-housing.dipHalf), Y(glass.foot));
  g.closePath();
}

/** The clear glass and the dark glass in it, with the reticle on them (clipped to the glass), and the glass's edges. */
function glasses(g, p, aim, X, Y) {
  const { r } = p;
  const { glass, filter } = REVI;
  g.save();
  glassPath(g, X, Y);
  g.fillStyle = 'rgba(150, 190, 200, 0.12)';
  g.fill();
  g.clip();
  // The dark glass: grey, its edges sharp, down behind the housing.
  g.fillStyle = 'rgba(70, 76, 82, 0.42)';
  g.fillRect(X(filter.x[0]), Y(filter.top), (filter.x[1] - filter.x[0]) * r, (glass.dip - filter.top) * r);
  g.strokeStyle = 'rgba(205, 215, 220, 0.35)';
  g.lineWidth = Math.max(1, r * 0.03);
  g.beginPath();
  g.moveTo(X(filter.x[0]), Y(glass.dip));
  g.lineTo(X(filter.x[0]), Y(filter.top));
  g.lineTo(X(filter.x[1]), Y(filter.top));
  g.lineTo(X(filter.x[1]), Y(glass.dip));
  g.stroke();
  if (aim) drawReticle(g, aim.x, aim.y, aim.ring, 'Revi');
  g.restore();
  // The clear glass's cut edges catching the light: the top one bright, the sides fainter.
  g.strokeStyle = 'rgba(150, 175, 215, 0.55)';
  g.lineWidth = Math.max(1.5, r * 0.06);
  g.beginPath();
  g.moveTo(X(-glass.footHalf), Y(glass.foot));
  g.lineTo(X(-glass.topHalf), Y(glass.top + 0.18));
  g.quadraticCurveTo(X(-glass.topHalf), Y(glass.top), X(-glass.topHalf + 0.18), Y(glass.top));
  g.lineTo(X(glass.topHalf - 0.18), Y(glass.top));
  g.quadraticCurveTo(X(glass.topHalf), Y(glass.top), X(glass.topHalf), Y(glass.top + 0.18));
  g.lineTo(X(glass.footHalf), Y(glass.foot));
  g.stroke();
  g.strokeStyle = 'rgba(40, 45, 70, 0.6)';
  g.lineWidth = Math.max(1, r * 0.03);
  g.beginPath();
  g.moveTo(X(-glass.topHalf + 0.18), Y(glass.top + 0.02));
  g.lineTo(X(glass.topHalf - 0.18), Y(glass.top + 0.02));
  g.stroke();
}

function disc(g, x, y, radius, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}
