// The Bf 110 C panel's boxes and buttons after the product owner's picture (#34, D140), all shown only (normal
// operation, no function): the red Kurssteuerung emergency button; the SKK 404-2 switch block standing for the four MG 17
// (product owner: the only fitting for them), drawn after photographs of a replica (D196), each of its four red lamps
// lit when its MG 17 is out of rounds (product owner, D195); the 2 MG / 4 MG switch; the Kurs strip; the Heizung placard
// and its knob; the Siemens course box under the compass; and the two-bar window above the altimeter. (The manifold
// pressure gauges' recess is gone: plate round them, D171.)

import { text, lens } from './panelParts.js';
import { INK, plain, roundKnob } from './bf109Fittings.js';
import { screw } from './lwStyle.js';

const DARK = '#151618';

/** Draws the boxes and buttons; `at` is the panel's placer, `L` its layout, `s` one dial radius in pixels, `v` the readings. */
export function drawBf110Boxes(g, at, L, s, v = {}) {
  const B = (name) => at.box(L.boxes[name]);
  redButton(g, ...at.knob(L.knobs.redButton));
  skkBlock(g, B('skk'), s, mgLamps(v));
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

/**
 * The SKK 404-2 block after the product owner's photographs of a replica (D196), in fractions of the block measured on
 * the square-on view: its raised lamp plate, the lamps, the Ein/Aus toggle, the four ringed push-buttons, the mounting
 * holes and the lettering. The lamps, one for each MG 17 (the upper guns on the upper row, the lower guns on the lower,
 * left guns left), each lit when its gun has no rounds left (product owner, D195).
 */
export const SKK_LAMPS = [
  ['mg17UpperLeft', 0.481, 0.164], ['mg17UpperRight', 0.671, 0.164], ['mg17LowerLeft', 0.424, 0.403], ['mg17LowerRight', 0.729, 0.403],
];
export const SKK = {
  lampPlate: [0.295, 0.015, 0.852, 0.545], // left, top, right, bottom
  plateScrews: [[0.343, 0.24], [0.81, 0.24]],
  lamp: 0.078, // a lens's radius, in the block's height
  toggle: [0.179, 0.604, 0.11], // x, y, ring radius
  buttons: [[0.357, 0.836], [0.481, 0.679], [0.662, 0.679], [0.786, 0.836]],
  button: 0.105, // a push-button's outer radius, in the block's height
  holes: [[0.08, 0.11], [0.93, 0.11], [0.08, 0.88], [0.93, 0.88]],
};
export const mgLamps = (v) => SKK_LAMPS.map(([id]) => {
  const gun = v.rounds?.[id];
  return { id, lit: !!gun && gun.rounds <= 0 };
});

const SKK_GREY = '#232527';

/** A lens in its black rim: lit, a bright red; dark, a deep red. The round counter's lenses too (D197). */
export function skkLamp(g, x, y, r, lit) {
  g.fillStyle = '#0b0b0c';
  g.beginPath();
  g.arc(x, y, r * 1.12, 0, Math.PI * 2);
  g.fill();
  lens(g, x, y, r, lit ? '#e0402c' : '#6e1612', lit);
}

/** A push-button: a black domed collar, its black button with a white ring on its face. The round counter's too (D197). */
export function skkButton(g, x, y, r) {
  const collar = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  collar.addColorStop(0, '#4a4c4e');
  collar.addColorStop(1, '#070708');
  g.fillStyle = collar;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0d0d0e';
  g.beginPath();
  g.arc(x, y, r * 0.58, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#e9e6dc';
  g.lineWidth = Math.max(0.6, r * 0.09);
  g.beginPath();
  g.arc(x, y, r * 0.3, 0, Math.PI * 2);
  g.stroke();
}

/** The Ein/Aus toggle: a black ring and its silver lever, up at Ein (the guns' circuit on). */
function skkToggle(g, x, y, r) {
  g.fillStyle = '#0b0b0c';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2c2e30';
  g.beginPath();
  g.arc(x, y, r * 0.6, 0, Math.PI * 2);
  g.fill();
  // The lever in worn bare metal, light grey (its finish worn off with use: product owner, D196), shaded on its right
  // and lit along its left edge, its rounded tip past the ring.
  g.lineCap = 'round';
  g.strokeStyle = '#7d8084';
  g.lineWidth = r * 0.5;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - r * 0.9);
  g.stroke();
  g.strokeStyle = '#b4b7ba';
  g.lineWidth = r * 0.34;
  g.beginPath();
  g.moveTo(x - r * 0.06, y);
  g.lineTo(x - r * 0.06, y - r * 0.9);
  g.stroke();
  g.strokeStyle = '#eceef0';
  g.lineWidth = r * 0.1;
  g.beginPath();
  g.moveTo(x - r * 0.12, y - r * 0.15);
  g.lineTo(x - r * 0.12, y - r * 0.9);
  g.stroke();
  g.lineCap = 'butt';
}

/** The SKK 404-2 switch block (for the MG 17s), as the replica photographed (D196). */
function skkBlock(g, b, s, lamps) {
  const X = (f) => b.x + b.w * f;
  const Y = (f) => b.y + b.h * f;
  plain(g, b, s, SKK_GREY);
  for (const [fx, fy] of SKK.holes) screw(g, X(fx), Y(fy), b.h * 0.03);
  // The raised lamp plate, its shadow below and to the right.
  const [l, t, r, bt] = SKK.lampPlate;
  const plate = { x: X(l), y: Y(t), w: b.w * (r - l), h: b.h * (bt - t) };
  plain(g, plate, s * 0.5, '#2b2d30');
  g.strokeStyle = '#45484b'; // its edge catching the light
  g.lineWidth = Math.max(0.6, b.h * 0.012);
  g.stroke();
  for (const [fx, fy] of SKK.plateScrews) screw(g, X(fx), Y(fy), b.h * 0.03);
  SKK_LAMPS.forEach(([, fx, fy], i) => skkLamp(g, X(fx), Y(fy), b.h * SKK.lamp, lamps[i].lit));
  const [tx, ty, tr] = SKK.toggle;
  text(g, 'Ein', X(tx), Y(0.433), b.h * 0.09, INK, { bold: true });
  text(g, 'Aus', X(tx), Y(0.82), b.h * 0.09, INK, { bold: true });
  skkToggle(g, X(tx), Y(ty), b.h * tr);
  for (const [fx, fy] of SKK.buttons) skkButton(g, X(fx), Y(fy), b.h * SKK.button);
  text(g, 'Gerät-Nr. 102-84', X(0.219), Y(0.955), b.h * 0.055, INK, { bold: true });
  text(g, 'SKK 404-2', X(0.557), Y(0.95), b.h * 0.075, INK, { bold: true });
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
  greenKnob(g, kx, ky, kr);
}

/** A green knob, lit from its upper left: the Heizung knob's, and the pitch levers' (D189). */
export const GREEN_KNOB = ['#4f8f86', '#0f2f2c'];
export function greenKnob(g, x, y, r) {
  const shade = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  shade.addColorStop(0, GREEN_KNOB[0]);
  shade.addColorStop(1, GREEN_KNOB[1]);
  g.fillStyle = shade;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
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
