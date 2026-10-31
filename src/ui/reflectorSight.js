// The RAF reflector sight, Barr & Stroud GM 2 (D87), drawn square-on as the pilot sees it, after the product owner's
// reference picture (a render, used only as the reference). From the foot up: the mounting block, the BASE ring (the
// target's wingspan, FEET) and the RANGE ring (YARDS) with their knurled thumb wheels and the side bracket, the collar,
// the lamp housing's cone and deep top ring, and the two short brackets at the top ring's rim holding the reflector
// glass by its lower edge in their slots (product owner's photograph of the sight, D87): the glass is wider than the top
// ring, standing out beyond both brackets and well above them. The reticle is seen only on the glass, where the guns'
// line falls (collimated: a small look round moves it within the glass).
// It stands in front of the panel's top centre, on its own canvas above the panel's, and is shown in the cockpit view
// while the pilot looks ahead (the 3D sight shows otherwise, src/render/gunsight.js).

import { Vector3 } from 'three';
import { SPITFIRE_PANEL } from './rafPanel.js';
import { panelRadius } from './instruments.js';
import { roundRect, text } from './panelParts.js';
import { drawReticle } from './reticle.js';

// The sight square-on, in the picture's pixels: x from its axis, y up from its foot.
export const SIGHT = {
  block: { w: 290, h: 150, bevel: 30 },
  base: { w: 240, y: [150, 220] },
  range: { w: 240, y: [220, 290] },
  wheels: { x: 120, w: 26, y: [168, 292] },
  bracket: { x: [-152, -118], y: [150, 362] },
  collar: { w: 228, y: [290, 345] },
  cone: { w: [196, 360], y: [345, 465] },
  top: { w: 380, y: [465, 600] },
  // The glass: its lower edge in the brackets' slots, wider than the top ring and standing well above the brackets (the
  // photograph), big enough for the reticle's ring.
  glass: { w: 460, y: [652, 982] },
  brackets: { x: 164, w: 30, foot: 585, slot: 652, top: 742 },
};
const GLASS_CENTRE = (SIGHT.glass.y[0] + SIGHT.glass.y[1]) / 2;
const FOOT = [946, 410]; // the panel point (its picture pixels) the foot stands on: just above the blind-flying plate

/**
 * Where the sight goes on a screen `width` x `height` (CSS px): its axis on the middle, its foot on the panel just above
 * the blind-flying instruments and its glass centred on the middle of the view (the guns' line looking ahead). Returns
 * { k (screen px per picture px), x (axis), foot (y), glass: { x, y, w, h } }.
 */
export function sightPlacement(width, height) {
  const L = SPITFIRE_PANEL;
  const r = panelRadius(L, width, height);
  const panelTop = height - (L.height * r + 6);
  const foot = panelTop + ((FOOT[1] - 31) / 82) * r;
  const k = (foot - height / 2) / GLASS_CENTRE;
  const x = width / 2;
  const glass = { x: x - (SIGHT.glass.w / 2) * k, y: foot - SIGHT.glass.y[1] * k, w: SIGHT.glass.w * k, h: (SIGHT.glass.y[1] - SIGHT.glass.y[0]) * k };
  return { k, x, foot, glass };
}

/**
 * The guns' line on the screen: the aircraft's nose direction (its body x axis, `quaternion`) from the camera, projected
 * to CSS px, and the reticle ring's radius (px) for `ringMils` at the camera's field of view. null if behind the camera.
 */
export function boresight(camera, quaternion, width, height, ringMils) {
  camera.updateMatrixWorld();
  const dir = new Vector3(1, 0, 0).applyQuaternion(quaternion);
  const p = camera.position.clone().addScaledVector(dir, 1000).project(camera);
  if (p.z > 1 || p.z < -1) return null;
  const perRadian = height / 2 / Math.tan((camera.fov * Math.PI) / 360);
  return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height, ring: perRadian * Math.tan(ringMils / 2000) };
}

/** Whether the 2D sight shows: an RAF aircraft, the cockpit view, looking ahead, the pilot still aboard. */
export const showSight = (sim, rig) => sim.ac.side === 'RAF' && !!sim.ac.sight && rig.inCockpit && !rig.lookingAway && !sim.playerJumper;

// Finish: black anodised, highlights a soft grey.
const BLACK = '#0c0c0c';
const DARK = '#1b1b1b';
const SHEEN = '#4a4a4a';

/** A horizontal gradient across a part of half-width hw at x: the cylinder's light from the upper left. */
function cylinder(g, x, hw, light = SHEEN) {
  const grad = g.createLinearGradient(x - hw, 0, x + hw, 0);
  grad.addColorStop(0, BLACK);
  grad.addColorStop(0.28, light);
  grad.addColorStop(0.45, DARK);
  grad.addColorStop(1, BLACK);
  return grad;
}

/** Draws the sight at its placement `p`; the reticle (at `aim`: { x, y, ring }) on its glass. */
export function drawSight(g, p, aim) {
  const { k, x, foot } = p;
  const Y = (u) => foot - u * k; // picture units up from the foot to screen y
  const S = (u) => u * k;
  const rect = (hw, [y0, y1], fill) => {
    g.fillStyle = fill;
    g.fillRect(x - S(hw), Y(y1), S(2 * hw), S(y1 - y0));
  };
  // The glass and its brackets: drawn first so that the top ring stands in front of the brackets' feet.
  glassAndArms(g, p, aim, Y, S);
  // Mounting block with its bevelled foot.
  const b = SIGHT.block;
  g.fillStyle = DARK;
  roundRect(g, x - S(b.w / 2), Y(b.h), S(b.w), S(b.h - b.bevel), S(8));
  g.fill();
  const bevel = g.createLinearGradient(0, Y(b.bevel), 0, Y(0));
  bevel.addColorStop(0, '#2c2c2c');
  bevel.addColorStop(1, '#3c3c3c');
  g.fillStyle = bevel;
  g.beginPath();
  g.moveTo(x - S(b.w / 2), Y(b.bevel));
  g.lineTo(x + S(b.w / 2), Y(b.bevel));
  g.lineTo(x + S(b.w / 2 - 22), Y(0));
  g.lineTo(x - S(b.w / 2 - 22), Y(0));
  g.closePath();
  g.fill();
  for (const sx of [-1, 1]) {
    g.fillStyle = '#050505';
    g.beginPath();
    g.arc(x + sx * S(b.w / 2 - 30), Y(b.h - 34), S(9), 0, Math.PI * 2);
    g.fill();
  }
  // Side bracket (left), behind the rings.
  const br = SIGHT.bracket;
  g.fillStyle = '#161616';
  g.fillRect(x + S(br.x[0]), Y(br.y[1]), S(br.x[1] - br.x[0]), S(br.y[1] - br.y[0]));
  // BASE and RANGE rings, and their thumb wheels.
  scaleRing(g, x, SIGHT.base, Y, S, k, { label: 'BASE', unit: 'FEET', figures: ['100', '80', '60', '40', '30'], below: true });
  scaleRing(g, x, SIGHT.range, Y, S, k, { label: 'RANGE', unit: 'YARDS', figures: ['1.5', '2', '3', '4', '5', '6'], below: false });
  const w = SIGHT.wheels;
  for (const sx of [-1, 1]) {
    const x0 = x + sx * S(w.x) - (sx < 0 ? S(w.w) : 0);
    g.fillStyle = '#121212';
    g.fillRect(x0, Y(w.y[1]), S(w.w), S(w.y[1] - w.y[0]));
    g.strokeStyle = '#3a3a3a';
    g.lineWidth = Math.max(1, S(3));
    for (let u = w.y[0] + 8; u < w.y[1]; u += 13) {
      g.beginPath();
      g.moveTo(x0, Y(u));
      g.lineTo(x0 + S(w.w), Y(u));
      g.stroke();
    }
  }
  // Collar, cone and top ring.
  rect(SIGHT.collar.w / 2, SIGHT.collar.y, cylinder(g, x, S(SIGHT.collar.w / 2), '#5a5a5a'));
  const c = SIGHT.cone;
  g.fillStyle = cylinder(g, x, S(c.w[1] / 2));
  g.beginPath();
  g.moveTo(x - S(c.w[0] / 2), Y(c.y[0]));
  g.lineTo(x - S(c.w[1] / 2), Y(c.y[1]));
  g.lineTo(x + S(c.w[1] / 2), Y(c.y[1]));
  g.lineTo(x + S(c.w[0] / 2), Y(c.y[0]));
  g.closePath();
  g.fill();
  const t = SIGHT.top;
  rect(t.w / 2, t.y, cylinder(g, x, S(t.w / 2)));
  // The top ring's rim and its opening, seen a little from above.
  g.fillStyle = '#2e2e2e';
  g.beginPath();
  g.ellipse(x, Y(t.y[1]), S(t.w / 2), S(14), 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#050505';
  g.beginPath();
  g.ellipse(x, Y(t.y[1]), S(t.w / 2 - 22), S(9), 0, 0, Math.PI * 2);
  g.fill();
}

/** A scale ring seen square-on: its band, the engraved label plates and the figures above or below the ticks. */
function scaleRing(g, x, ring, Y, S, k, { label, unit, figures, below }) {
  const hw = S(ring.w / 2);
  const [y0, y1] = ring.y;
  g.fillStyle = cylinder(g, x, hw, '#3a3a3a');
  g.fillRect(x - hw, Y(y1), 2 * hw, S(y1 - y0));
  g.strokeStyle = '#050505';
  g.lineWidth = Math.max(1, S(3));
  g.strokeRect(x - hw, Y(y1), 2 * hw, S(y1 - y0));
  // RANGE: its figures in the band's upper part, above the label plates; BASE: plates in the band, figures below it.
  const mid = below ? (y0 + y1) / 2 : y0 + 22;
  for (const [word, dx] of [[label, -52], [unit, 52]]) {
    g.strokeStyle = '#9a9a9a';
    g.lineWidth = Math.max(0.5, S(1.5));
    g.strokeRect(x + S(dx - 46), Y(mid + 13), S(92), S(26));
    text(g, word, x + S(dx), Y(mid), S(20), '#e8e8e8');
  }
  // Ticks and figures along the ring's bottom edge (BASE) or near its top (RANGE).
  const edge = below ? y0 + 10 : y1 - 30;
  figures.forEach((f, i) => {
    const fx = x - hw + ((i + 0.5) / figures.length) * 2 * hw;
    g.strokeStyle = '#e8e8e8';
    g.lineWidth = Math.max(1, S(3));
    g.beginPath();
    g.moveTo(fx, Y(edge));
    g.lineTo(fx, Y(edge + (below ? -6 : 6)));
    g.stroke();
    text(g, f, fx, Y(below ? y0 - 14 : y1 - 16), S(17), '#e8e8e8');
  });
  void k;
}

/** The reflector glass, the reticle on it (clipped to it), and the two brackets holding its lower edge. */
function glassAndArms(g, p, aim, Y, S) {
  const { x, glass } = p;
  // Glass: faintly tinted, its cut edges catching the light (the top one most), a soft diagonal reflection.
  g.save();
  roundRect(g, glass.x, glass.y, glass.w, glass.h, S(5));
  g.fillStyle = 'rgba(150, 185, 180, 0.16)';
  g.fill();
  g.clip();
  const sheen = g.createLinearGradient(glass.x, glass.y, glass.x + glass.w, glass.y + glass.h);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.42, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.fillStyle = sheen;
  g.fillRect(glass.x, glass.y, glass.w, glass.h);
  if (aim) drawReticle(g, aim.x, aim.y, aim.ring, 'GM2');
  g.restore();
  g.strokeStyle = 'rgba(200, 225, 220, 0.4)';
  g.lineWidth = Math.max(1, S(2.5));
  roundRect(g, glass.x, glass.y, glass.w, glass.h, S(5));
  g.stroke();
  g.strokeStyle = 'rgba(235, 245, 245, 0.75)';
  g.lineWidth = Math.max(1, S(5));
  g.beginPath();
  g.moveTo(glass.x + S(6), glass.y + S(2));
  g.lineTo(glass.x + glass.w - S(6), glass.y + S(2));
  g.stroke();
  // The brackets: short straight posts at the top ring's rim, a stepped foot, the glass's edge in a slot on the inner
  // face, a small lip at the top.
  const b = SIGHT.brackets;
  for (const sx of [-1, 1]) {
    const px = (u) => x + sx * S(u);
    const fill = (u0, u1, y0, y1, colour) => {
      g.fillStyle = colour;
      g.fillRect(Math.min(px(u0), px(u1)), Y(y1), Math.abs(px(u1) - px(u0)), S(y1 - y0));
    };
    fill(b.x - 6, b.x + b.w + 4, b.foot, b.slot + 18, '#101010'); // the stepped foot
    fill(b.x, b.x + b.w, b.slot + 18, b.top, '#121212'); // the post
    fill(b.x + b.w - 4, b.x + b.w + 10, b.top - 16, b.top, '#121212'); // the lip
    fill(b.x + 7, b.x + 11, b.slot, b.top - 10, '#2c3a38'); // the slot, the glass's edge in it
    g.strokeStyle = '#3e3e3e';
    g.lineWidth = Math.max(1, S(2));
    g.strokeRect(Math.min(px(b.x), px(b.x + b.w)), Y(b.top), S(b.w), S(b.top - b.slot - 18));
  }
}

export class ReflectorSight {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;';
    document.body.appendChild(this.canvas);
  }

  /** Redraws the sight (or clears it) for the frame: `aim` the guns' line on the screen, or null. */
  update(show, aim) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.style.display = show ? 'block' : 'none';
    if (!show) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
    }
    const g = this.canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);
    drawSight(g, sightPlacement(width, height), aim);
  }
}
