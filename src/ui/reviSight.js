// The Bf 109 E's Revi C/12C reflector sight (D89), drawn square-on as the pilot sees it from the seat, from behind:
// the clear reflector glass above, the dark sun-filter glass set in its middle, the black housing at their foot with its
// curved dip over the lens, the body with its brown leather crash pad facing the pilot, the sun filter's lever on the
// left, the bead post on the right, the mounting block, the knurled lamp and brightness knob underneath, and the cable
// looping down to its clip on the panel. After the product owner's pictures: the photograph of the reflected reticle
// (#21) for the glasses and the housing round the reticle; the museum photograph from the seat (#16) for the sizes as
// the pilot sees them; the restored panel (#17) and the Revi photographs (#19, #20) for the parts and finish; and the
// page of a German Revi manual (#18, drawn at about 1:2.5) for the parts' names. The reticle (src/ui/reticle.js) is seen
// only on the glass, where the guns' line falls.
// Sizes are in dial radii of the Bf 109's panel, from the guns' line looking ahead (REVI, src/ui/reviParts.js): the sight
// stands in front of the panel's top, between the clock and the manifold pressure gauge. The Bf 110 C carries the
// Revi-110 at the same size on screen (D107, D130): the body shorter, and a round glass as wide as the body in a holder
// frame of the body's width (`revi110`, src/ui/reviParts.js), on its panel above the climb indicator.

import { BF109_PANEL, BF109_AIM } from './bf109Panel.js';
import { panelRadius } from './instruments.js';
import { roundRect } from './panelParts.js';
import { drawReticle } from './reticle.js';
import { REVI } from './reviParts.js';

export { REVI };

/** The Bf 109's sight: its panel, its guns' line (BF109_AIM of the screen, D93), full size, its parts, its cable. */
const BF109_REVI = { panel: BF109_PANEL, aim: BF109_AIM, scale: 1, parts: REVI, cable: true };

/**
 * Where the Revi goes on a screen `width` x `height` (CSS px): on the guns' line looking ahead, `fit.aim` of the way down
 * the screen. `fit` is the aircraft's: { panel, aim, scale (the sight's size in that panel's dial radii), parts, cable };
 * the Bf 109's by default (the Bf 110's is BF110_REVI, src/ui/bf110Panel.js). Returns { r (px per Revi unit), x, y (the
 * guns' line looking ahead), glass: { x, y, w, h } (the clear glass's extent down to the dip), parts, cable }.
 */
export function reviPlacement(width, height, fit = BF109_REVI) {
  const r = panelRadius(fit.panel, width, height) * fit.scale;
  const x = width / 2;
  const y = height * fit.aim;
  const { glass } = fit.parts;
  return {
    r, x, y, parts: fit.parts, cable: fit.cable,
    glass: {
      x: x + ((glass.cx ?? 0) - glass.topHalf) * r, y: y + glass.top * r, w: 2 * glass.topHalf * r,
      h: (glass.dip - glass.top) * r,
    },
  };
}

/** Draws the Revi at its placement `p`; the reticle (at `aim`: { x, y, ring }) on its glass. */
export function drawRevi(g, p, aim) {
  const { r, x, y } = p;
  const X = (u) => x + u * r;
  const Y = (u) => y + u * r;
  const part = ({ x: [x0, x1], y: [y0, y1] }) => [X(x0), Y(y0), (x1 - x0) * r, (y1 - y0) * r];
  const R = p.parts ?? REVI;

  // The cable, behind the body: from the knob down to its clip on the panel (left off on the Bf 110, D107).
  if (p.cable !== false) {
    const c = R.cable.map(([u, v]) => [X(u), Y(v)]);
    g.strokeStyle = '#0d0d0e';
    g.lineWidth = Math.max(2, r * 0.13);
    g.beginPath();
    g.moveTo(...c[0]);
    g.bezierCurveTo(...c[1], ...c[2], ...c[3]);
    g.stroke();
  }

  if (R.round) {
    roundHead(g, p, aim, X, Y, R); // the Revi-110's (D130)
  } else {
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
  }

  // Body, the sun filter's lever and the bead post.
  const body = part(R.body);
  const shade = g.createLinearGradient(body[0], 0, body[0] + body[2], 0);
  shade.addColorStop(0, '#0e0f10');
  shade.addColorStop(0.3, '#2c2e30');
  shade.addColorStop(1, '#141516');
  g.fillStyle = shade;
  roundRect(g, ...body, r * 0.25);
  g.fill();
  g.fillStyle = '#1d1f21';
  roundRect(g, ...part(R.lever), r * 0.1);
  g.fill();
  disc(g, X(R.pivot[0]), Y(R.pivot[1]), r * 0.08, '#6d7073');
  const post = R.post;
  if (post) {
    g.fillStyle = '#121314';
    g.fillRect(X(post.x) - r * 0.12, Y(post.y[1]) - r * 0.18, r * 0.24, r * 0.18);
    g.strokeStyle = '#121314';
    g.lineWidth = Math.max(1, r * 0.05);
    g.beginPath();
    g.moveTo(X(post.x), Y(post.y[1]));
    g.lineTo(X(post.x), Y(post.y[0]));
    g.stroke();
  }

  // Mounting block and the knurled knob below it.
  g.fillStyle = '#1a1b1d';
  roundRect(g, ...part(R.block), r * 0.12);
  g.fill();
  const knob = part(R.knob);
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
  const pad = part(R.pad);
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

/**
 * The Revi-110's head (D130): the round reflector glass with the reticle on it (clipped to the glass) in its thin metal
 * rim, and the holder frame of the body's width: the plate on the body's top and a strap up each side to a pin at the
 * glass's middle, in front of the glass's edge.
 */
function roundHead(g, p, aim, X, Y, R) {
  const { r } = p;
  const { cx, cy, radius } = R.round;
  const { x: [left, right], strap, plate } = R.holder;
  const circle = () => {
    g.beginPath();
    g.arc(X(cx), Y(cy), radius * r, 0, Math.PI * 2);
  };
  g.save();
  circle();
  g.fillStyle = 'rgba(150, 190, 200, 0.12)';
  g.fill();
  g.clip();
  if (aim) drawReticle(g, aim.x, aim.y, aim.ring, 'Revi');
  g.restore();
  // The rim, and its edge catching the light along the top.
  circle();
  g.strokeStyle = '#141516';
  g.lineWidth = Math.max(1.5, r * 0.07);
  g.stroke();
  g.strokeStyle = 'rgba(150, 175, 215, 0.55)';
  g.lineWidth = Math.max(1, r * 0.03);
  g.beginPath();
  g.arc(X(cx), Y(cy), (radius - 0.06) * r, Math.PI * 1.1, Math.PI * 1.9);
  g.stroke();
  // The holder: the plate across the body's top and the side straps, as wide as the body.
  g.fillStyle = '#16171a';
  roundRect(g, X(left), Y(plate[0]), (right - left) * r, (plate[1] - plate[0]) * r, r * 0.05);
  g.fill();
  for (const [x0, x1] of [[left, left + strap], [right - strap, right]]) {
    roundRect(g, X(x0), Y(cy - strap), (x1 - x0) * r, (plate[1] - cy + strap) * r, r * 0.06);
    g.fill();
    disc(g, X((x0 + x1) / 2), Y(cy), r * 0.1, '#5d6064'); // the pin holding the glass
    g.fillStyle = '#16171a';
  }
}

function disc(g, x, y, radius, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}
