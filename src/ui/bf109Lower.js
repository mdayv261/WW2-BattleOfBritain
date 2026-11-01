// The Bf 109 E lower panel's fittings (D89), after the product owner's picture of a restored panel (#17): the lighting
// dimmer, a cover plate, the circuit breakers, the coolant placard, the fuel reserve warning lamp, the box below the
// left lever, the arrow placard, the emergency pull and hand pump placards, the two ball levers, and the Fahrwerk
// selector (Ein / Ruhe / Aus, probably the hand pump's valve: its handle rests at Ruhe, D93). The left ball lever swings
// with the flaps (the product owner's choice, D93: the real flaps were set by a handwheel); the rest are shown as
// photographed and not working. Two items could not be
// identified (the four-lamp box marked SKK404-2 and the narrow Ein/Aus strip at the bottom right): they are drawn as
// photographed, lamps unlit.

import { placard } from './luftwaffeDials.js';
import { screw } from './lwStyle.js';
import { roundRect, text } from './panelParts.js';
import { BLACK, INK, centre, plain, roundKnob } from './bf109Fittings.js';

const DULL_RED = '#5a1a14';

/** Where the Fahrwerk selector's handle rests (D93): at Ruhe, as the Achtung placard asks before starting. */
export const SELECTOR_REST = 'Ruhe';
// The left ball lever's angle out from straight down (degrees, to the left): as photographed with the flaps up, swinging
// in with the flaps down (D93).
const FLAP_LEVER = { up: 39, down: 20 };
// The handle's direction for each position (rad from pointing left, + down): the labels stand on an arc to its left.
const SELECTOR_ANGLE = { Ein: -0.75, Ruhe: 0, Aus: 0.75 };
/** The product owner's English labels beside the selector's up and down positions (D92). */
export const SELECTOR_LABELS = { Ein: 'UP', Aus: 'DN' };

/** Draws the lower panel's fittings; `at` is the panel's placer (src/ui/bf109Panel.js), `L` its layout. */
export function drawBf109Lower(g, at, L, v) {
  const s = at.len(45); // one dial radius in pixels
  const B = (name) => at.box(L.boxes[name]);
  dimmer(g, ...at.dial(L.dials.dimmer), s);
  plain(g, B('blank'), s, '#4a4e54');
  breakers(g, B('breakers'), s);
  coolantPlacard(g, B('coolantPlacard'));
  placard(g, ...centre(B('reserve')), { lines: ['Reststand', 'warnlampe'] });
  reserveLamp(g, B('reserveLamp'), s);
  lampBox(g, B('lampBox'), s);
  fuelCock(g, B('fuelCock'), s);
  const [kx, ky, kr] = at.knob(L.knobs.primer);
  roundKnob(g, kx, ky, kr);
  arrowPlacard(g, B('arrowPlacard'), s);
  gearSelector(g, B('gearSelector'), SELECTOR_REST);
  placard(g, ...centre(B('emergency')), { lines: ['Notzug', 'für Fahrwerk'] });
  pull(g, B('emergency').x + B('emergency').w / 2, B('emergency').y - s * 0.12, s * 0.12);
  placard(g, ...centre(B('handPump')), { lines: ['Handpumpe'] });
  plain(g, B('pumpSlot'), s, '#2a2d30');
  strip(g, B('strip'), s);
  handle(g, at, flapLever(L.levers.left, v.flapSelected ?? 0));
  handle(g, at, L.levers.right);
}

/** The lighting dimmer: a round black plate with Hell and Aus on arrowed arcs and a pointer knob. */
function dimmer(g, x, y, face, outer, s) {
  g.fillStyle = BLACK;
  roundRect(g, x - outer, y - outer, outer * 2, outer * 2, outer * 0.25);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = Math.max(1, s * 0.03);
  for (const side of [-1, 1]) {
    g.beginPath();
    g.arc(x, y, face * 0.8, Math.PI / 2 + side * 0.4, Math.PI / 2 + side * 2.2, side < 0);
    g.stroke();
  }
  text(g, 'Hell', x - face * 0.42, y - face * 0.62, face * 0.3, INK, { bold: true });
  text(g, 'Aus', x + face * 0.45, y - face * 0.62, face * 0.3, INK, { bold: true });
  roundKnob(g, x, y + face * 0.05, face * 0.38);
  g.strokeStyle = '#d8d4c4';
  g.lineWidth = Math.max(2, face * 0.12);
  g.beginPath();
  g.moveTo(x - face * 0.08, y - face * 0.1);
  g.lineTo(x + face * 0.12, y + face * 0.2);
  g.stroke();
}

/** The circuit breakers: two red-ringed EIN buttons above two black AUS buttons, a small lever between. */
function breakers(g, b, s) {
  plain(g, b, s);
  for (const [fx, fy, word, ring] of [[0.3, 0.32, 'EIN', '#a8352a'], [0.7, 0.32, 'EIN', '#a8352a'], [0.3, 0.66, 'AUS', '#2a2c2f'], [0.7, 0.66, 'AUS', '#2a2c2f']]) {
    const x = b.x + b.w * fx;
    const y = b.y + b.h * fy;
    g.fillStyle = ring;
    g.beginPath();
    g.arc(x, y, b.w * 0.17, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#0a0a0a';
    g.beginPath();
    g.arc(x, y, b.w * 0.13, 0, Math.PI * 2);
    g.fill();
    text(g, word, x, y, b.w * 0.09, INK, { bold: true });
  }
  g.strokeStyle = '#1c1d1f';
  g.lineWidth = Math.max(2, s * 0.08);
  g.beginPath();
  g.moveTo(b.x + b.w * 0.5, b.y + b.h * 0.78);
  g.lineTo(b.x + b.w * 0.62, b.y + b.h * 0.92);
  g.stroke();
}

/** The coolant placard: Kühlstoff and Temp. with their figures too fine to read. */
function coolantPlacard(g, b) {
  placard(g, ...centre(b), { lines: [] });
  text(g, 'Kühlstoff', b.x + b.w * 0.05, b.y + b.h * 0.3, b.h * 0.26, INK, { align: 'left' });
  text(g, 'Temp.', b.x + b.w * 0.12, b.y + b.h * 0.72, b.h * 0.26, INK, { align: 'left' });
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.globalAlpha = 0.55;
  for (const fx of [0.5, 0.68, 0.86]) {
    for (const fy of [0.3, 0.72]) {
      g.beginPath();
      g.moveTo(b.x + b.w * (fx - 0.05), b.y + b.h * fy);
      g.lineTo(b.x + b.w * (fx + 0.05), b.y + b.h * fy);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
}

/** The fuel reserve warning lamp: a red triangular lens on its plate (unlit: fuel use is not modelled yet). */
function reserveLamp(g, b, s) {
  const [cx, cy] = centre(b);
  g.fillStyle = '#26292c';
  roundRect(g, b.x, b.y, b.w, b.h, b.h * 0.5);
  g.fill();
  screw(g, b.x + b.w * 0.16, cy, s * 0.06);
  screw(g, b.x + b.w * 0.84, cy, s * 0.06);
  g.fillStyle = '#0c0c0c';
  g.beginPath();
  g.arc(cx, cy, b.h * 0.42, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#9c2a1e';
  g.beginPath();
  g.moveTo(cx, cy - b.h * 0.3);
  g.lineTo(cx + b.h * 0.27, cy + b.h * 0.2);
  g.lineTo(cx - b.h * 0.27, cy + b.h * 0.2);
  g.closePath();
  g.fill();
}

/** The four-lamp box marked SKK404-2 (not identified): an Ein/Aus toggle, four unlit red lamps and five knobs. */
function lampBox(g, b, s) {
  plain(g, b, s);
  const X = (f) => b.x + b.w * f;
  const Y = (f) => b.y + b.h * f;
  g.fillStyle = '#1e2022';
  roundRect(g, X(0.29), Y(0.03), b.w * 0.68, b.h * 0.5, s * 0.06);
  g.fill();
  for (const [fx, fy] of [[0.45, 0.19], [0.66, 0.19], [0.4, 0.45], [0.71, 0.45]]) {
    g.fillStyle = DULL_RED;
    g.beginPath();
    g.arc(X(fx), Y(fy), b.w * 0.045, 0, Math.PI * 2);
    g.fill();
  }
  text(g, 'Ein', X(0.16), Y(0.45), s * 0.2, INK);
  text(g, 'Aus', X(0.16), Y(0.86), s * 0.2, INK);
  roundKnob(g, X(0.16), Y(0.64), b.w * 0.07);
  for (const [fx, fy] of [[0.45, 0.65], [0.65, 0.65], [0.36, 0.85], [0.75, 0.85]]) roundKnob(g, X(fx), Y(fy), b.w * 0.05);
  text(g, 'SKK404-2', X(0.62), Y(0.95), s * 0.13, INK);
}

/** The box below the left lever, marked Aus and Betrieb, with its handle and a knob (shown only). */
function fuelCock(g, b, s) {
  plain(g, b, s, '#3a3e43');
  text(g, 'Aus', b.x + b.w * 0.24, b.y + b.h * 0.36, s * 0.2, INK);
  text(g, 'Betrieb', b.x + b.w * 0.74, b.y + b.h * 0.36, s * 0.2, INK);
  g.fillStyle = '#16171a';
  g.save();
  g.translate(b.x + b.w * 0.5, b.y + b.h * 0.42);
  g.rotate(-0.25);
  roundRect(g, -b.w * 0.07, -b.h * 0.24, b.w * 0.14, b.h * 0.56, b.w * 0.07);
  g.fill();
  g.restore();
  roundKnob(g, b.x + b.w * 0.24, b.y + b.h * 0.85, b.w * 0.09);
}

/** The placard with a white arrow pointing left through a small symbol (shown only). */
function arrowPlacard(g, b, s) {
  plain(g, b, s);
  const y = b.y + b.h / 2;
  g.strokeStyle = INK;
  g.fillStyle = INK;
  g.lineWidth = Math.max(1.5, b.h * 0.18);
  g.beginPath();
  g.moveTo(b.x + b.w * 0.2, y);
  g.lineTo(b.x + b.w * 0.88, y);
  g.stroke();
  g.beginPath();
  g.moveTo(b.x + b.w * 0.12, y);
  g.lineTo(b.x + b.w * 0.24, y - b.h * 0.3);
  g.lineTo(b.x + b.w * 0.24, y + b.h * 0.3);
  g.closePath();
  g.fill();
  g.fillStyle = BLACK;
  g.beginPath();
  g.arc(b.x + b.w * 0.5, y, b.h * 0.32, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = Math.max(1, b.h * 0.1);
  g.beginPath();
  g.arc(b.x + b.w * 0.5, y, b.h * 0.22, 0, Math.PI * 2);
  g.stroke();
}

/**
 * The undercarriage selector: its placard (Fahrwerk; Ein, Ruhe and Aus down its left, with UP and DN beside Ein and Aus,
 * the product owner's labels, D92; small print too fine to read) and the handle through the round window, turned to
 * `position`. Sizes are in the placard's height, measured from its left and right edges.
 */
function gearSelector(g, b, position) {
  placard(g, ...centre(b), { lines: [] });
  const u = b.h;
  const left = (f) => b.x + f * u;
  const right = (f) => b.x + b.w - f * u;
  const Y = (f) => b.y + b.h * f;
  text(g, 'Fahrwerk', right(0.49), Y(0.15), u * 0.17, INK, { bold: true });
  const words = { Ein: 0.15, Ruhe: 0.5, Aus: 0.85 };
  for (const [word, fy] of Object.entries(words)) {
    text(g, word, left(0.14), Y(fy), u * 0.15, INK, { align: 'left' });
    if (SELECTOR_LABELS[word]) text(g, SELECTOR_LABELS[word], left(0.66), Y(fy), u * 0.15, INK, { bold: true, align: 'left' });
  }
  // The window, and the arc of the handle's travel round it.
  const [cx, cy] = [right(0.84), Y(0.5)];
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(cx + u * 0.18, cy, u * 0.45, Math.PI * 0.72, Math.PI * 1.28);
  g.stroke();
  g.globalAlpha = 0.5;
  for (const fy of [0.66, 0.78, 0.9]) {
    g.beginPath();
    g.moveTo(right(0.6), Y(fy));
    g.lineTo(right(0.11), Y(fy));
    g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = '#5e5a4a';
  g.beginPath();
  g.arc(cx, cy, u * 0.27, 0, Math.PI * 2);
  g.fill();
  const a = SELECTOR_ANGLE[position];
  const reach = u * 0.56;
  const [hx, hy] = [cx - Math.cos(a) * reach, cy + Math.sin(a) * reach];
  g.strokeStyle = '#1a1b1d';
  g.lineWidth = Math.max(3, u * 0.16);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(hx, hy);
  g.stroke();
  g.lineCap = 'butt';
  roundKnob(g, hx, hy, u * 0.13);
  roundKnob(g, cx, cy, u * 0.16);
}

/** A small pull knob. */
function pull(g, x, y, rad) {
  roundKnob(g, x, y, rad);
}

/** The narrow Ein/Aus strip (not identified): a ladder of green bars under a red one in a framed window. */
function strip(g, b, s) {
  plain(g, b, s, '#2a2d30');
  const w = { x: b.x + b.w * 0.2, y: b.y + b.h * 0.12, w: b.w * 0.6, h: b.h * 0.76 };
  g.fillStyle = '#1a1714';
  g.fillRect(w.x, w.y, w.w, w.h);
  g.fillStyle = '#8a2a20';
  g.fillRect(w.x, w.y, w.w, w.h * 0.08);
  g.strokeStyle = '#5f7a52';
  g.lineWidth = 1;
  for (let k = 1; k < 12; k += 1) {
    const y = w.y + w.h * (0.1 + k * 0.075);
    g.beginPath();
    g.moveTo(w.x + w.w * 0.15, y);
    g.lineTo(w.x + w.w * 0.85, y);
    g.stroke();
  }
  text(g, 'Ein', b.x + b.w / 2, b.y + b.h * 0.2, b.w * 0.24, INK);
  text(g, 'Aus', b.x + b.w / 2, b.y + b.h * 0.84, b.w * 0.24, INK);
}

/**
 * The left ball lever swung for a flap setting `f` (0 up to 1 fully down): the same pivot and length, its knob turned
 * from the photographed angle in towards straight down (picture pixels, as the layout's levers).
 */
export function flapLever([x0, y0, x1, y1, knob], f) {
  const length = Math.hypot(x1 - x0, y1 - y0);
  const a = ((FLAP_LEVER.up + (FLAP_LEVER.down - FLAP_LEVER.up) * Math.max(0, Math.min(1, f))) * Math.PI) / 180;
  return [x0, y0, x0 - Math.sin(a) * length, y0 + Math.cos(a) * length, knob];
}

/** A lever from its pivot (x0, y0) to a black ball knob (x1, y1) of radius `knob` (picture pixels). */
function handle(g, at, [x0, y0, x1, y1, knob]) {
  const [ax, ay] = at.xy([x0, y0]);
  const [bx, by] = at.xy([x1, y1]);
  g.strokeStyle = '#141517';
  g.lineWidth = Math.max(2, at.len(9));
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.stroke();
  g.lineCap = 'butt';
  roundKnob(g, bx, by, at.len(knob));
}
