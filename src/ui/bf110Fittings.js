// The Bf 110 C panel's plate and fittings (D106), after the product owner's pictures (#31, the panel; #32, the
// cockpit): the light grey-green plate on its traced outline; the ammunition counter
// (three tall windows, a white tape in each dropping as its guns fire: the left MG 17 pair, both MG FF, the right MG 17
// pair); the EIN/AUS undercarriage lights (EIN red with it up, AUS green with it down, as the Bf 109's, D95); the
// Landeklappe and Fahrwerk Ein/Aus switches following the flaps and the undercarriage; the radiator flap switches
// following the radiator; the elevator trim indicator (as the Bf 109's, D95); and, shown only, the red push button, the
// "4 MG / 2 MG" strip, the "00 00" instrument, the magneto switches, placards, the hydraulic pressure gauge, knobs,
// warning lamps and the fuel tank selector at 1.

import { placard } from './luftwaffeDials.js';
import { DEG, at as polar, font, centred, tick, lwFace, lwHand, screw } from './lwStyle.js';
import { lens, text } from './panelParts.js';
import { BLACK, INK, centre, plain, roundKnob } from './bf109Fittings.js';
import { trimIndicator } from './bf109Lower.js';

const PLATE = { top: '#a2adab', foot: '#8f9a98', edge: '#3a4140' };

/** The ammunition counter's columns, left to right: the guns each one counts (product owner, D106). */
export const AMMO_COLUMNS = [['mg17UpperLeft', 'mg17LowerLeft'], ['cannonLeft', 'cannonRight'], ['mg17UpperRight', 'mg17LowerRight']];

/** Each column's rounds left as a fraction of its load (1 full, 0 empty), from the readings' `rounds` by gun. */
export function ammoFractions(v) {
  return AMMO_COLUMNS.map((ids) => {
    const guns = ids.map((id) => v.rounds?.[id]).filter(Boolean);
    const capacity = guns.reduce((s, x) => s + x.capacity, 0);
    return capacity ? guns.reduce((s, x) => s + x.rounds, 0) / capacity : 1;
  });
}

/** Where an Ein/Aus switch's knob stands along its travel (0 at Ein, the top; 1 at Aus, the bottom). */
export const switchPosition = { flaps: (v) => ((v.flapSelected ?? 0) > 0 ? 1 : 0), gear: (v) => (v.gearSelected ? 1 : 0) };

/** Draws the plate and fittings; `at` is the panel's placer (src/ui/bf110Panel.js), `L` its layout. */
export function drawBf110Fittings(g, at, L, v) {
  const s = at.len(30); // one dial radius in pixels
  const B = (name) => at.box(L.boxes[name]);
  outlinePlate(g, at, L.outline);
  ammoCounter(g, B('ammo'), s, ammoFractions(v));
  pushButton(g, ...at.knob(L.knobs.redButton));
  strip(g, B('mgStrip'), s, ['4', 'MG'], ['2', 'MG']);
  counter(g, ...at.dial(L.dials.counter));
  trimIndicator(g, B('trim'), s, v);
  umschalter(g, B('umschalter'));
  for (const k of ['umLeft', 'umRight']) roundKnob(g, ...at.knob(L.knobs[k]));
  gearLights(g, B('lights'), s, v);
  einAus(g, at, L.switches.flaps, switchPosition.flaps(v), s);
  einAus(g, at, L.switches.gear, switchPosition.gear(v), s);
  placard(g, ...centre(B('flapLabel')), { lines: ['Landeklappe'] });
  placard(g, ...centre(B('gearLabel')), { lines: ['Fahrwerk'] });
  magnetos(g, B('magnetos'), s);
  placard(g, ...centre(B('placard')), { lines: ['Achtung Fahrwerk'], scribbles: 5 });
  hydraulic(g, ...at.dial(L.dials.hydraulic));
  for (const k of ['knobLeft', 'knobRight']) roundKnob(g, ...at.knob(L.knobs[k]));
  for (const k of ['lampTempL1', 'lampTempL2', 'lampTempR1', 'lampTempR2']) {
    const [x, y, rad] = at.knob(L.knobs[k]);
    lens(g, x, y, rad, '#7a2016', false);
  }
  radiatorSwitch(g, ...at.dial(L.dials.radiatorLeft), !!v.radiatorOpen, 'Schalter f. Kühlkl.');
  radiatorSwitch(g, ...at.dial(L.dials.radiatorRight), !!v.radiatorOpen, 'Schalter f. Kühlkl.');
  selector(g, ...at.dial(L.dials.selector));
}

/** The plate along its outline, shaded from its top to its foot. */
function outlinePlate(g, at, outline) {
  const pts = outline.map((p) => at.xy(p));
  const ys = pts.map(([, y]) => y);
  const shade = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  shade.addColorStop(0, PLATE.top);
  shade.addColorStop(1, PLATE.foot);
  g.fillStyle = shade;
  g.strokeStyle = PLATE.edge;
  g.lineWidth = Math.max(1.5, at.len(2));
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath();
  g.fill();
  g.stroke();
}

/**
 * The ammunition counter (as #32): a black box with three tall windows, a white tape in each standing as high as its
 * guns' rounds left, a knob under each window and a red strip along the foot.
 */
function ammoCounter(g, b, s, fractions) {
  plain(g, b, s);
  const X = (f) => b.x + b.w * f;
  const Y = (f) => b.y + b.h * f;
  fractions.forEach((f, i) => {
    const x0 = X(0.12 + i * 0.28);
    const w = b.w * 0.18;
    const [top, foot] = [Y(0.08), Y(0.62)];
    g.fillStyle = '#060606';
    g.fillRect(x0, top, w, foot - top);
    const fill = Math.max(0, Math.min(1, f)) * (foot - top);
    g.fillStyle = '#e8e6dc';
    g.fillRect(x0 + w * 0.3, foot - fill, w * 0.4, fill);
    roundKnob(g, x0 + w / 2, Y(0.72), w * 0.36);
  });
  g.fillStyle = '#b8332a';
  g.fillRect(X(0.08), Y(0.84), b.w * 0.84, b.h * 0.1);
}

/** The red push button in its ring. */
function pushButton(g, x, y, rad) {
  g.fillStyle = '#cfcfc8';
  g.beginPath();
  g.arc(x, y, rad * 1.15, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#c4312a';
  g.beginPath();
  g.arc(x, y, rad * 0.9, 0, Math.PI * 2);
  g.fill();
}

/** A black strip with a narrow window, and figure-and-word labels at its ends ("4 MG", "2 MG"). */
function strip(g, b, s, left, right) {
  plain(g, b, s);
  const inset = b.w * 0.16;
  g.fillStyle = '#1d1f20';
  g.fillRect(b.x + inset, b.y + b.h * 0.25, b.w - 2 * inset, b.h * 0.5);
  g.fillStyle = '#d8d6cc';
  g.fillRect(b.x + b.w / 2 - b.w * 0.015, b.y + b.h * 0.3, b.w * 0.03, b.h * 0.4);
  for (const [label, fx] of [[left, 0.08], [right, 0.92]]) {
    text(g, label[0], b.x + b.w * fx, b.y + b.h * 0.32, b.h * 0.34, INK, { bold: true });
    text(g, label[1], b.x + b.w * fx, b.y + b.h * 0.7, b.h * 0.3, INK, { bold: true });
  }
}

/** The "00 00" instrument (not identified, shown only): two pairs of figures in windows and two knobs below. */
function counter(g, x, y, face, outer) {
  squareMount(g, x, y, outer);
  lwFace(g, x, y, face);
  for (const dx of [-0.38, 0.38]) {
    g.fillStyle = '#0a0a0a';
    g.fillRect(x + dx * face - face * 0.3, y - face * 0.2, face * 0.6, face * 0.36);
    text(g, '00', x + dx * face, y - face * 0.02, face * 0.32, INK, { bold: true });
  }
  for (const dx of [-0.25, 0.25]) roundKnob(g, x + dx * face, y + face * 0.58, face * 0.16);
}

/** A square black mounting with a screw in each corner. */
function squareMount(g, x, y, half) {
  g.fillStyle = '#16181a';
  g.beginPath();
  g.roundRect(x - half, y - half, 2 * half, 2 * half, half * 0.3);
  g.fill();
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) screw(g, x + sx * half * 0.78, y + sy * half * 0.78, half * 0.1);
}

/** The "Umschalterstellung links / rechts" placard strip. */
function umschalter(g, b) {
  placard(g, ...centre(b), { lines: ['Umschalterstellung'] });
  text(g, 'links', b.x + b.w * 0.18, b.y + b.h * 0.78, b.h * 0.28, INK, { align: 'center' });
  text(g, 'rechts', b.x + b.w * 0.82, b.y + b.h * 0.78, b.h * 0.28, INK, { align: 'center' });
}

/** Which undercarriage lights glow: the EIN pair red with it fully up, the AUS pair green with it down (D95, D106). */
export const gearLightState = (v) => ({ ein: !!v.gearUp, aus: !!v.gearDown });

/** The EIN/AUS undercarriage lights: an EIN lamp for each leg above, an AUS lamp for each below. */
function gearLights(g, b, s, v) {
  plain(g, b, s);
  const lit = gearLightState(v);
  for (const [fx, fy, word, colour, dark, on] of [[0.3, 0.3, 'EIN', '#e0402c', '#4a1610', lit.ein], [0.72, 0.3, 'EIN', '#e0402c', '#4a1610', lit.ein],
    [0.3, 0.72, 'AUS', '#3fcf4a', '#14401a', lit.aus], [0.72, 0.72, 'AUS', '#3fcf4a', '#14401a', lit.aus]]) {
    const x = b.x + b.w * fx;
    const y = b.y + b.h * fy;
    lens(g, x, y, b.w * 0.17, on ? colour : dark, on);
    text(g, word, x, y, b.w * 0.12, on ? '#1a1a1a' : INK, { bold: true });
  }
}

/** An Ein/Aus switch: a slot with Ein at the top and Aus at the bottom, a lever and a white knob at `position` (0-1). */
function einAus(g, at, [px, top, bottom], position, s) {
  const [x, y0] = at.xy([px, top]);
  const [, y1] = at.xy([px, bottom]);
  g.fillStyle = BLACK;
  g.fillRect(x - s * 0.1, y0, s * 0.2, y1 - y0);
  const ky = y0 + (y1 - y0) * position;
  g.fillStyle = '#16181a';
  g.fillRect(x - s * 0.55, ky - s * 0.09, s * 0.55, s * 0.18);
  for (const [word, wy, on] of [['Ein', y0, position === 0], ['Aus', y1, position === 1]]) {
    g.fillStyle = on ? '#f2efe6' : '#bfbcb2';
    g.beginPath();
    g.arc(x + s * 0.02, wy, s * 0.3, 0, Math.PI * 2);
    g.fill();
    text(g, word, x + s * 0.02, wy, s * 0.2, '#1a1a1a', { bold: on });
  }
  roundKnob(g, x - s * 0.55, ky, s * 0.14);
}

/** The magneto switches for both engines: two black switch boxes, each a lever at M1+2 and the settings beside it. */
function magnetos(g, b, s) {
  for (const k of [0, 1]) {
    const bx = { x: b.x + (b.w / 2) * k, y: b.y, w: b.w / 2 - s * 0.06, h: b.h };
    plain(g, bx, s);
    ['M1+2', 'M2', 'M1', '0'].forEach((t, i) => text(g, t, bx.x + bx.w * 0.62, bx.y + bx.h * (0.2 + i * 0.2), s * 0.16, INK, { bold: true }));
    g.fillStyle = '#d0cec6';
    g.fillRect(bx.x + bx.w * 0.18, bx.y + bx.h * 0.16, bx.w * 0.16, bx.h * 0.1);
  }
}

/** The hydraulic pressure gauge (shown only), with Fahrwerk and Landeklappen on either side. */
function hydraulic(g, x, y, face, outer) {
  squareMount(g, x, y, outer);
  lwFace(g, x, y, face);
  centred(g);
  for (let k = 0; k <= 10; k += 1) tick(g, x, y, face, (-120 + k * 24) * DEG, 0.95, k % 5 ? 0.86 : 0.76, 1);
  font(g, face * 0.24, true);
  for (const [v, k] of [['0', 0], ['60', 5], ['120', 10]]) g.fillText(v, ...polar(x, y, (-120 + k * 24) * DEG, face * 0.58));
  lwHand(g, x, y, face, -120 * DEG, { counterweight: false });
  text(g, 'Fahrwerk', x - outer * 1.6, y, face * 0.22, INK, { bold: true });
  text(g, 'Landeklappen', x + outer * 1.9, y, face * 0.22, INK, { bold: true });
}

/** A radiator flap switch: a dial marked Auf and Zu, its pointer at Auf with the radiator open, Zu with it closed. */
function radiatorSwitch(g, x, y, face, outer, open, label) {
  squareMount(g, x, y, outer);
  lwFace(g, x, y, face);
  centred(g);
  font(g, face * 0.26, true);
  g.fillText('Zu', x - face * 0.5, y - face * 0.45);
  g.fillText('Auf', x + face * 0.5, y - face * 0.45);
  lwHand(g, x, y, face, (open ? 40 : -40) * DEG, { counterweight: false });
  text(g, label, x, y + outer * 1.25, face * 0.26, INK, { bold: true });
}

/** The fuel tank selector (shown only, at 1): 1 VL, 2 VR, 3 HL and 0 round a pointer knob, Umschalter below. */
function selector(g, x, y, face, outer) {
  squareMount(g, x, y, outer);
  lwFace(g, x, y, face);
  centred(g);
  font(g, face * 0.22, true);
  for (const [t, a] of [['1 VL', -50], ['2 VR', 0], ['3 HL', 50], ['0', -100]]) g.fillText(t, ...polar(x, y, a * DEG, face * 0.62));
  lwHand(g, x, y, face, -50 * DEG, { counterweight: false, length: 0.5 });
  text(g, 'Umschalter', x, y + outer * 1.25, face * 0.26, INK, { bold: true });
}
