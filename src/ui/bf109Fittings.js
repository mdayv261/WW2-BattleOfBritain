// The Bf 109 E panel's plates and upper fittings (D89), after the product owner's picture of a restored panel (#17, #23):
// the upper and lower plates and their hexagon bolts; the placards, lettered where the picture can be read and drawn as
// grey lines where it cannot; the switches, shown as photographed and not working, but for the propeller pitch lever
// (D95). The lower panel's fittings are in src/ui/bf109Lower.js.

import { placard } from './luftwaffeDials.js';
import { screw } from './lwStyle.js';
import { roundRect, text } from './panelParts.js';

const PANEL = { top: '#50555b', foot: '#43474d', edge: '#25282b' };
export const BLACK = '#121314';
export const INK = '#e9e6dc';

/** Draws the plates and the upper plate's fittings; `at` is the panel's placer (src/ui/bf109Panel.js), `L` its layout. */
export function drawBf109Fittings(g, at, L, v) {
  const s = at.len(45); // one dial radius in pixels: the unit for line widths and lettering
  outlinePlate(g, L.upper, at, [PANEL.top, PANEL.foot]);
  outlinePlate(g, L.lower, at, [PANEL.top, PANEL.foot]);
  for (const b of L.bolts) bolt(g, ...at.xy(b), s * 0.17);
  const B = (name) => at.box(L.boxes[name]);

  // Upper panel.
  placardBox(g, B('flapPlacard'), ['Höchstgeschwindigkeit', 'mit voll ausgefahrenen', 'Landeklappen 250 km/h'],
    { table: [['Start', '20°'], ['Landung', '40°']] });
  magneto(g, B('magneto'), s);
  placard(g, ...centre(B('achtung')), { lines: ['Achtung!', 'Vor Anlassen', 'Fahrwerkschalter', 'auf „Ruhe"'] });
  pushButton(g, B('button'), s);
  pitotSwitch(g, B('pitot'), s);
  pitchLever(g, B('pitchLever'), s, v);
  cableHook(g, B('cableHook'), s);
}

export const centre = ({ x, y, w, h }) => [x + w / 2, y + h / 2, w, h];

/** A plate along an outline (picture pixels), shaded from `colours[0]` at its top to `colours[1]` at its foot. */
function outlinePlate(g, points, at, colours) {
  const pts = points.map((p) => at.xy(p));
  const ys = pts.map(([, y]) => y);
  const shade = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  shade.addColorStop(0, colours[0]);
  shade.addColorStop(1, colours[1]);
  g.fillStyle = shade;
  g.strokeStyle = PANEL.edge;
  g.lineWidth = Math.max(1.5, at.len(2.5));
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath();
  g.fill();
  g.stroke();
}

/** A hexagon bolt head. */
function bolt(g, x, y, rad) {
  g.fillStyle = '#7d8084';
  g.beginPath();
  for (let k = 0; k < 6; k += 1) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (k) g.lineTo(px, py);
    else g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = '#3b3d40';
  g.lineWidth = Math.max(1, rad * 0.15);
  g.stroke();
}

/** A plain rounded plate. */
export function plain(g, { x, y, w, h }, s, colour = BLACK) {
  g.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(g, x + s * 0.04, y + s * 0.05, w, h, s * 0.08);
  g.fill();
  g.fillStyle = colour;
  roundRect(g, x, y, w, h, s * 0.08);
  g.fill();
}

/** A placard with lettered lines above and, below a rule, a small two-column table (its right column too fine to read). */
function placardBox(g, b, lines, { table }) {
  const [cx, , w, h] = centre(b);
  placard(g, cx, b.y + h * 0.28, w, h * 0.56, { lines });
  placard(g, cx, b.y + h * 0.78, w, h * 0.44, { lines: [] });
  table.forEach(([word, value], i) => {
    const y = b.y + h * (0.67 + i * 0.2);
    text(g, word, b.x + w * 0.06, y, h * 0.11, INK, { align: 'left' });
    text(g, value, b.x + w * 0.4, y, h * 0.11, INK, { align: 'left' });
  });
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(b.x + w * 0.56, b.y + h * 0.58);
  g.lineTo(b.x + w * 0.56, b.y + h * 0.98);
  g.stroke();
  g.globalAlpha = 0.5;
  g.beginPath();
  g.moveTo(b.x + w * 0.64, b.y + h * 0.7);
  g.lineTo(b.x + w * 0.9, b.y + h * 0.7);
  g.stroke();
  g.globalAlpha = 1;
}

/** The magneto switch: a lever in a slot at M1+2, marked M1+2, M2 and M1. */
function magneto(g, b, s) {
  plain(g, b, s);
  g.fillStyle = '#050505';
  g.fillRect(b.x + b.w * 0.18, b.y + b.h * 0.12, b.w * 0.14, b.h * 0.76);
  ['M1+2', 'M2', 'M1'].forEach((t, i) => text(g, `-${t}`, b.x + b.w * 0.38, b.y + b.h * (0.2 + i * 0.3), s * 0.2, INK, { bold: true, align: 'left' }));
  g.fillStyle = '#9a9c9e';
  g.fillRect(b.x + b.w * 0.14, b.y + b.h * 0.17, b.w * 0.22, b.h * 0.06);
}

/** The red push button on its diamond plate. */
function pushButton(g, b, s) {
  const [cx, cy] = centre(b);
  g.fillStyle = BLACK;
  g.beginPath();
  g.moveTo(cx, b.y);
  g.lineTo(b.x + b.w, cy);
  g.lineTo(cx, b.y + b.h);
  g.lineTo(b.x, cy);
  g.closePath();
  g.fill();
  screw(g, cx, b.y + b.h * 0.12, s * 0.07);
  screw(g, cx, b.y + b.h * 0.88, s * 0.07);
  g.fillStyle = '#c8392e';
  g.beginPath();
  g.arc(cx, cy, b.w * 0.36, 0, Math.PI * 2);
  g.fill();
}

/** The pitot heater switch: a small toggle on a black plate with its label strip, Staurohr. */
function pitotSwitch(g, b, s) {
  plain(g, { x: b.x, y: b.y, w: b.w, h: b.h * 0.62 }, s);
  g.fillStyle = '#2e3033';
  g.fillRect(b.x + b.w * 0.42, b.y + b.h * 0.12, b.w * 0.16, b.h * 0.34);
  placard(g, b.x + b.w / 2, b.y + b.h * 0.84, b.w * 0.8, b.h * 0.3, { lines: ['Staurohr'], plate: '#d8d6cc', ink: '#1a1a1a' });
}

/** Where the propeller pitch lever's knob stands in its slot (fraction of the lever's height): top at fine, bottom at coarse. */
export const pitchKnob = (v) => 0.16 + 0.5 * Math.max(0, Math.min(1, v.pitchFraction ?? 0));

/**
 * The propeller pitch lever (the product owner, D95; as first drawn in D38): a red knob in a slot, at the top with the
 * blades at the fine stop and the bottom at the coarse stop, moving with the blade angle; lettered Fine and Coarse.
 */
function pitchLever(g, b, s, v) {
  plain(g, b, s);
  g.fillStyle = '#050505';
  g.fillRect(b.x + b.w * 0.14, b.y + b.h * 0.08, b.w * 0.16, b.h * 0.66);
  text(g, 'Fine', b.x + b.w * 0.4, b.y + b.h * 0.16, s * 0.15, INK, { bold: true, align: 'left' });
  text(g, 'Coarse', b.x + b.w * 0.4, b.y + b.h * 0.66, s * 0.15, INK, { bold: true, align: 'left' });
  g.fillStyle = '#c8392e';
  g.beginPath();
  g.arc(b.x + b.w * 0.22, b.y + b.h * pitchKnob(v), b.w * 0.18, 0, Math.PI * 2);
  g.fill();
}

/** The clip on the panel that holds the Revi's cable (the cable itself is drawn with the sight). */
function cableHook(g, b, s) {
  plain(g, b, s, '#16171a');
  screw(g, b.x + b.w * 0.5, b.y + b.h * 0.5, s * 0.06);
}

/** A large round black knob with a highlight. */
export function roundKnob(g, x, y, rad) {
  const shade = g.createRadialGradient(x - rad * 0.35, y - rad * 0.35, rad * 0.1, x, y, rad);
  shade.addColorStop(0, '#55585c');
  shade.addColorStop(1, '#151618');
  g.fillStyle = shade;
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
}

