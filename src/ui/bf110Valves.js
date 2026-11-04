// The Bf 110 C's Fahrwerk and Landeklappe controls (product owner, D199): two push/pull hydraulic valves for each, EIN
// (einfahren, up) above and AUS (ausfahren, down) below, as #34's two buttons. Each has a lettered disc beside a
// two-finger T-grip. Pushing a T in runs the undercarriage or flaps that way; with both pulled out the control is in
// neutral. The leads for this (no approved source) are in D199. Shown only: the keys don't change, and the T that
// matches the way the undercarriage or flaps are moving shows pushed in, popping out once they stop.

import { text } from './panelParts.js';

/** Which valve is pushed in: 'aus' while the undercarriage or flaps run down, 'ein' while they run up, else null. */
export const valve = {
  gear: (v) => (v.gearSelected ? (v.gearDown ? null : 'aus') : v.gearUp ? null : 'ein'),
  flaps: (v) => {
    const gap = (v.flapSelected ?? 0) - (v.flaps ?? 0);
    return gap > 0.005 ? 'aus' : gap < -0.005 ? 'ein' : null;
  },
};

/**
 * The parts' sizes in dial radii: the T's bar (width, height), its shaft's width, the collar's radius where the shaft
 * enters the panel, how far below its collar a pulled-out bar stands (as seen from the pilot's seat), the lettered
 * disc's radius (D198's, kept) and the gap between the disc and the bar.
 */
export const VALVE = { bar: [0.8, 0.24], shaft: 0.15, collar: 0.17, out: 0.25, disc: 0.3, gap: 0.06 };

/**
 * Where one valve's parts stand, in pixels, for a button whose row is at (x, y) on the switch line; `s` is one dial
 * radius in pixels. The disc and T are centred on the line together, and on the row with the T halfway out.
 */
export function valveGeometry(x, y, s, pushed) {
  const [bw, bh] = VALVE.bar;
  const left = x - (s * (2 * VALVE.disc + VALVE.gap + bw)) / 2;
  const tx = left + s * (2 * VALVE.disc + VALVE.gap + bw / 2);
  const collarY = y - (s * VALVE.out) / 2;
  const barY = pushed ? collarY : collarY + s * VALVE.out;
  return {
    disc: [left + s * VALVE.disc, y, s * VALVE.disc],
    collar: [tx, collarY, s * VALVE.collar],
    bar: { x: tx - (s * bw) / 2, y: barY - (s * bh) / 2, w: s * bw, h: s * bh },
    shaft: pushed ? null : { x: tx - (s * VALVE.shaft) / 2, y: collarY, w: s * VALVE.shaft, h: barY - collarY },
    shadow: s * (pushed ? 0.01 : 0.06),
  };
}

/** Draws a control's EIN and AUS valves on its switch line (`slot`: x, EIN y, AUS y), `state` the pushed-in valve. */
export function drawValvePair(g, at, [px, top, bottom], state, s) {
  const [x, y0] = at.xy([px, top]);
  const [, y1] = at.xy([px, bottom]);
  for (const [word, y, kind] of [['EIN', y0, 'ein'], ['AUS', y1, 'aus']]) {
    drawValve(g, valveGeometry(x, y, s, state === kind), word, state === kind);
  }
}

/** One valve: its lettered disc, its collar, then the T (its shadow, shaft and two-finger bar). */
function drawValve(g, p, word, pushed) {
  const [dx, dy, dr] = p.disc;
  disc(g, dx, dy, dr, pushed ? '#f2efe6' : '#a9aba8');
  text(g, word, dx, dy, dr * 0.6, '#1a1a1a', { bold: pushed });
  const [cx, cy, cr] = p.collar;
  disc(g, cx, cy, cr, '#3a3d40');
  disc(g, cx, cy, cr * 0.8, '#0b0c0d');
  const { x, y, w, h } = p.bar;
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; // the T's shadow, down and right
  g.beginPath();
  g.roundRect(x + p.shadow, y + p.shadow, w, h, h / 2);
  g.fill();
  if (p.shaft) {
    g.fillStyle = '#1c1d1f';
    g.fillRect(p.shaft.x, p.shaft.y, p.shaft.w, p.shaft.h);
    g.fillStyle = 'rgba(200, 205, 210, 0.25)'; // lit down its left side
    g.fillRect(p.shaft.x, p.shaft.y, p.shaft.w * 0.25, p.shaft.h);
  }
  g.fillStyle = '#1b1c1e';
  g.beginPath();
  g.roundRect(x, y, w, h, h / 2);
  g.fill();
  g.fillStyle = '#070708'; // a finger's recess either side of the shaft
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(x + w / 2 + side * w * 0.26, y + h * 0.55, w * 0.14, h * 0.24, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(200, 205, 210, 0.45)'; // lit along its top
  g.lineWidth = Math.max(1, h * 0.12);
  g.beginPath();
  g.moveTo(x + h * 0.5, y + h * 0.12);
  g.lineTo(x + w - h * 0.5, y + h * 0.12);
  g.stroke();
}

function disc(g, x, y, r, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
