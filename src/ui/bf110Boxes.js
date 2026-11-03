// The Bf 110 C panel's boxes and buttons after the product owner's picture (#34, D140), all shown only (normal
// operation, no function): the red Kurssteuerung emergency button; the SKK 404-2 switch block standing for the four MG 17
// (product owner: the only fitting for them), its lamps dark; the 2 MG / 4 MG switch; the Kurs strip; the Heizung placard
// and its knob; the Siemens course box under the compass; the two-bar window above the altimeter; and the recess the
// manifold pressure gauges stand in.

import { text, lens } from './panelParts.js';
import { INK, plain, roundKnob } from './bf109Fittings.js';
import { screw } from './lwStyle.js';

const DARK = '#151618';

/** Draws the boxes and buttons; `at` is the panel's placer, `L` its layout, `s` one dial radius in pixels. */
export function drawBf110Boxes(g, at, L, s) {
  const B = (name) => at.box(L.boxes[name]);
  recess(g, B('ataBox'), s);
  redButton(g, ...at.knob(L.knobs.redButton));
  skkBlock(g, B('skk'), s);
  mgSwitch(g, B('mgSwitch'), s);
  kursStrip(g, B('kurs'), s);
  heizung(g, B('heizung'), at.knob(L.knobs.heizungKnob), s);
  courseBox(g, B('course'), s);
  twoBars(g, B('window'), s);
}

/** A plate's corner screws, inset `k` of a dial radius. */
function corners({ x, y, w, h }, s, g, k = 0.12) {
  for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) screw(g, x + k * s + fx * (w - 2 * k * s), y + k * s + fy * (h - 2 * k * s), s * 0.06);
}

/** The red Kurssteuerung emergency release (Ziehen, Not-Auslösung) in its dark housing. */
function redButton(g, x, y, rad) {
  g.fillStyle = '#101112';
  g.beginPath();
  g.arc(x + rad * 0.35, y, rad * 1.15, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#d8d8d2';
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#c1271c';
  g.beginPath();
  g.arc(x, y, rad * 0.9, 0, Math.PI * 2);
  g.fill();
  text(g, 'Kurssteuerung', x, y - rad * 0.45, rad * 0.2, '#f2efe6', { bold: true });
  text(g, 'Ziehen', x, y - rad * 0.1, rad * 0.2, '#f2efe6');
  text(g, 'Not-', x, y + rad * 0.25, rad * 0.2, '#f2efe6');
  text(g, 'Auslösung', x, y + rad * 0.5, rad * 0.2, '#f2efe6');
}

/** The SKK 404-2 switch block (for the MG 17s): its Ein/Aus toggle, four red lamps (dark) and four knobs. */
function skkBlock(g, b, s) {
  plain(g, b, s, DARK);
  corners(b, s, g);
  const tx = b.x + b.w * 0.2;
  text(g, 'Ein', tx, b.y + b.h * 0.3, b.h * 0.1, INK, { bold: true });
  text(g, 'Aus', tx, b.y + b.h * 0.72, b.h * 0.1, INK, { bold: true });
  g.fillStyle = '#9a9c9a';
  g.fillRect(tx - b.w * 0.015, b.y + b.h * 0.4, b.w * 0.03, b.h * 0.18); // the toggle
  plain(g, { x: b.x + b.w * 0.36, y: b.y + b.h * 0.1, w: b.w * 0.56, h: b.h * 0.42 }, s, '#202224');
  for (const [fx, fy] of [[0.5, 0.2], [0.74, 0.2], [0.44, 0.42], [0.8, 0.42]]) lens(g, b.x + b.w * fx, b.y + b.h * fy, b.h * 0.07, '#5a1410', false);
  for (const [fx, fy] of [[0.48, 0.68], [0.66, 0.68], [0.4, 0.84], [0.74, 0.84]]) roundKnob(g, b.x + b.w * fx, b.y + b.h * fy, b.h * 0.07);
  text(g, 'Gerät-Nr. 102-84', b.x + b.w * 0.2, b.y + b.h * 0.94, b.h * 0.055, INK);
  text(g, 'SKK 404-2', b.x + b.w * 0.72, b.y + b.h * 0.95, b.h * 0.07, INK, { bold: true });
}

/** The 2 MG / 4 MG switch: a slide plate between its two white-edged labels. */
function mgSwitch(g, b, s) {
  const label = (x, w, word) => {
    g.strokeStyle = '#e9e6dc';
    g.lineWidth = 1;
    g.strokeRect(x, b.y + b.h * 0.1, w, b.h * 0.8);
    text(g, word.split(' ')[0], x + w / 2, b.y + b.h * 0.33, b.h * 0.28, INK, { bold: true });
    text(g, word.split(' ')[1], x + w / 2, b.y + b.h * 0.68, b.h * 0.28, INK, { bold: true });
  };
  label(b.x, b.w * 0.13, '2 MG');
  label(b.x + b.w * 0.87, b.w * 0.13, '4 MG');
  const plate = { x: b.x + b.w * 0.15, y: b.y + b.h * 0.08, w: b.w * 0.7, h: b.h * 0.84 };
  plain(g, plate, s, DARK);
  g.fillStyle = '#060607';
  g.fillRect(plate.x + plate.w * 0.38, plate.y + plate.h * 0.4, plate.w * 0.24, plate.h * 0.22);
  g.fillStyle = '#d8d8d2';
  g.beginPath();
  g.arc(plate.x + plate.w * 0.57, plate.y + plate.h * 0.52, plate.h * 0.08, 0, Math.PI * 2);
  g.fill();
}

/** The Kurs strip: three white bars in a dark window, Kurs below. */
function kursStrip(g, b, s) {
  plain(g, b, s, DARK);
  g.fillStyle = '#050505';
  g.fillRect(b.x + b.w * 0.1, b.y + b.h * 0.15, b.w * 0.8, b.h * 0.5);
  g.fillStyle = '#e4e4de';
  for (const [fx, top] of [[0.3, 0.38], [0.5, 0.22], [0.7, 0.42]]) g.fillRect(b.x + b.w * (fx - 0.015), b.y + b.h * top, b.w * 0.03, b.h * (0.62 - top));
  g.fillRect(b.x + b.w * 0.15, b.y + b.h * 0.62, b.w * 0.7, b.h * 0.04);
  text(g, 'Kurs', b.x + b.w / 2, b.y + b.h * 0.82, b.h * 0.15, INK, { bold: true });
}

/** The Heizung (heating) placard, its top left corner cut, and the green knob at its foot. */
function heizung(g, b, [kx, ky, kr], s) {
  g.fillStyle = '#121314';
  g.strokeStyle = '#e9e6dc';
  g.lineWidth = Math.max(1, s * 0.04);
  g.beginPath();
  g.moveTo(b.x + b.w * 0.12, b.y);
  g.lineTo(b.x + b.w, b.y);
  g.lineTo(b.x + b.w, b.y + b.h);
  g.lineTo(b.x, b.y + b.h);
  g.lineTo(b.x, b.y + b.h * 0.45);
  g.closePath();
  g.fill();
  g.stroke();
  text(g, 'Heizung', b.x + b.w * 0.55, b.y + b.h * 0.17, b.h * 0.16, INK, { bold: true });
  text(g, 'ziehen', b.x + b.w * 0.22, b.y + b.h * 0.4, b.h * 0.12, INK, { bold: true });
  text(g, 'auf', b.x + b.w * 0.22, b.y + b.h * 0.55, b.h * 0.12, INK, { bold: true });
  text(g, 'drücken', b.x + b.w * 0.78, b.y + b.h * 0.4, b.h * 0.12, INK, { bold: true });
  text(g, 'zu', b.x + b.w * 0.78, b.y + b.h * 0.55, b.h * 0.12, INK, { bold: true });
  const shade = g.createRadialGradient(kx - kr * 0.35, ky - kr * 0.35, kr * 0.1, kx, ky, kr);
  shade.addColorStop(0, '#4f8f86');
  shade.addColorStop(1, '#0f2f2c');
  g.fillStyle = shade;
  g.beginPath();
  g.arc(kx, ky, kr, 0, Math.PI * 2);
  g.fill();
}

/**
 * The Siemens course box under the compass: two course cards (3 and N, their arrows) behind a window, the bubble
 * tube below it and the note "Bei eingedrücktem Knopf Kurssteuerung ausgekuppelt".
 */
function courseBox(g, b, s) {
  plain(g, b, s, '#1c1d1f');
  corners(b, s, g);
  const win = { x: b.x + b.w * 0.2, y: b.y + b.h * 0.25, w: b.w * 0.6, h: b.h * 0.3 };
  g.fillStyle = '#060607';
  g.fillRect(win.x, win.y, win.w, win.h);
  g.strokeStyle = '#e9e6dc';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(win.x + win.w / 2, win.y);
  g.lineTo(win.x + win.w / 2, win.y + win.h);
  g.moveTo(win.x + win.w * 0.04, win.y + win.h / 2);
  g.lineTo(win.x + win.w * 0.96, win.y + win.h / 2);
  for (let k = 1; k < 16; k += 1) {
    const x = win.x + (win.w * k) / 16;
    g.moveTo(x, win.y + win.h * 0.42);
    g.lineTo(x, win.y + win.h * (k % 2 ? 0.5 : 0.58));
  }
  g.stroke();
  for (const [fx, word] of [[0.25, '3'], [0.75, 'N']]) {
    text(g, word, win.x + win.w * fx, win.y + win.h * 0.18, win.h * 0.22, INK, { bold: true });
    text(g, word, win.x + win.w * fx, win.y + win.h * 0.84, win.h * 0.22, INK, { bold: true });
  }
  // The bubble tube: a white curved tube with a dark band in its middle.
  g.strokeStyle = '#e8e8e2';
  g.lineWidth = b.h * 0.05;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(b.x + b.w * 0.25, b.y + b.h * 0.63);
  g.quadraticCurveTo(b.x + b.w * 0.5, b.y + b.h * 0.72, b.x + b.w * 0.75, b.y + b.h * 0.63);
  g.stroke();
  g.lineCap = 'butt';
  g.fillStyle = '#2a2b2c';
  g.fillRect(b.x + b.w * 0.45, b.y + b.h * 0.63, b.w * 0.1, b.h * 0.07);
  text(g, 'SIEMENS-LGW', b.x + b.w / 2, b.y + b.h * 0.79, b.h * 0.035, INK);
  text(g, 'Bei eingedrücktem Knopf', b.x + b.w / 2, b.y + b.h * 0.86, b.h * 0.03, INK);
  text(g, 'Kurssteuerung ausgekuppelt', b.x + b.w / 2, b.y + b.h * 0.9, b.h * 0.03, INK);
  roundKnob(g, b.x + b.w * 0.12, b.y + b.h * 0.86, b.h * 0.06);
  roundKnob(g, b.x + b.w * 0.88, b.y + b.h * 0.86, b.h * 0.05);
}

/** The small window above the altimeter: two white bars. */
function twoBars(g, b, s) {
  plain(g, b, s, DARK);
  g.fillStyle = '#e8e8e2';
  g.fillRect(b.x + b.w * 0.22, b.y + b.h * 0.2, b.w * 0.56, b.h * 0.22);
  g.fillRect(b.x + b.w * 0.15, b.y + b.h * 0.58, b.w * 0.7, b.h * 0.2);
}

/** The recess the manifold pressure gauges stand in: darker than the plate, its top edge in shadow. */
function recess(g, b, s) {
  plain(g, b, s, '#2c2f2c');
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  g.fillRect(b.x, b.y, b.w, b.h * 0.06);
}
