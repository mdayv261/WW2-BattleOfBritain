// The Bf 110 C panel's own gauges after the product owner's picture (#34, D140), in the look of the Luftwaffe dials
// (src/ui/lwStyle.js): the round counter for the two MG FF/M cannon (Durchladen), the outside air thermometer, the coolant
// thermometers in their green rings, the radiator flap switches and the tank selector, and, shown only, the Kurssteuerung
// indicator, the AEG indicator and the correction cards; the Preßluft gauge above the engine gauges. Angles are in
// radians, 0 straight up, clockwise.

import { DEG, at, font, centred, tick, lwFace, lwHand, screw, paint } from './lwStyle.js';
import { lens, text } from './panelParts.js';

const WHITE = '#e9e6dc';
const RING = { green: '#1f5a4a', blue: '#27407a' };

/** A coloured ring round a dial's bezel, as photographed. */
function ring(g, x, y, r, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, r * 1.2, 0, Math.PI * 2);
  g.fill();
}

/** A round mounting flange with screws round its rim (the round counter's, #34). */
function flange(g, x, y, outer) {
  g.fillStyle = '#1b1c1e';
  g.beginPath();
  g.arc(x, y, outer, 0, Math.PI * 2);
  g.fill();
  for (let k = 0; k < 12; k += 1) screw(g, ...at(x, y, (k * 30 + 15) * DEG, outer * 0.86), outer * 0.06);
}

/** Each cannon's counter window: its drum's rounds left (60 down to 0) and whether it is empty. */
export function cannonCounter(v) {
  return ['cannonLeft', 'cannonRight'].map((id) => {
    const gun = v.rounds?.[id];
    const rounds = gun ? Math.max(0, Math.round(gun.rounds)) : 0;
    return { rounds, empty: !gun || rounds === 0 };
  });
}

/**
 * The round counter (Durchladen) for the two MG FF/M cannon (product owner, D140): a red lamp over each cannon's digit
 * window, lit when its drum is empty, the windows counting each drum's rounds left, and two knobs below.
 */
export function roundCounter(g, x, y, face, outer, counts) {
  flange(g, x, y, outer);
  g.fillStyle = '#2a2c2e';
  g.beginPath();
  g.arc(x, y, face, 0, Math.PI * 2);
  g.fill();
  counts.forEach(({ rounds, empty }, i) => {
    const cx = x + (i ? 1 : -1) * face * 0.42;
    lens(g, cx, y - face * 0.5, face * 0.17, empty ? '#e0402c' : '#4a100c', empty);
    g.fillStyle = '#0c0c0c';
    g.fillRect(cx - face * 0.3, y - face * 0.2, face * 0.6, face * 0.32);
    text(g, String(rounds).padStart(2, '0'), cx, y - face * 0.04, face * 0.26, WHITE, { bold: true });
    lens(g, cx, y + face * 0.62, face * 0.13, '#151617', false); // the knobs
  });
  text(g, 'Durchladen', x, y + face * 0.33, face * 0.15, WHITE, { bold: true });
}

/** The outside air thermometer's hand: -40 °C to +40 °C over the top of the face, 0 straight up. */
export const airTempAngle = (c) => Math.max(-40, Math.min(40, c)) * 1.6 * DEG;

/** The outside air thermometer (#34): -40 to +40 °C, its blue ring, reading the air's temperature (D140). */
export function airThermometer(g, x, y, r, celsius) {
  ring(g, x, y, r, RING.blue);
  lwFace(g, x, y, r);
  centred(g);
  for (let c = -40; c <= 40; c += 10) tick(g, x, y, r, airTempAngle(c), 0.95, c % 40 === 0 ? 0.76 : 0.85, c % 40 === 0 ? 2 : 1.2);
  font(g, r * 0.24, true);
  for (const [c, s] of [[-40, '40'], [0, '0'], [40, '40']]) g.fillText(s, ...at(x, y, airTempAngle(c), r * 0.56));
  g.fillText('-', ...at(x, y, -32 * DEG, r * 0.4));
  g.fillText('+', ...at(x, y, 32 * DEG, r * 0.4));
  font(g, r * 0.26, true);
  g.fillText('°C', x, y + r * 0.45);
  lwHand(g, x, y, r, airTempAngle(celsius), { length: 0.82, counterweight: false });
}

/** The coolant thermometer's hand: 30 to 130 °C over 240 degrees, 80 straight up. */
export const coolantAngle = (c) => (Math.max(30, Math.min(130, c)) - 80) * 2.4 * DEG;

/** Each engine's coolant thermometer (#34): 40, 80, 120 °C, in its green ring. */
export function coolantGauge(g, x, y, r, celsius) {
  ring(g, x, y, r, RING.green);
  lwFace(g, x, y, r);
  centred(g);
  for (let c = 30; c <= 130; c += 10) tick(g, x, y, r, coolantAngle(c), 0.95, c % 40 === 0 ? 0.76 : 0.86, c % 40 === 0 ? 2 : 1.1);
  font(g, r * 0.24, true);
  for (const c of [40, 80, 120]) g.fillText(String(c), ...at(x, y, coolantAngle(c), r * 0.56));
  font(g, r * 0.3, true);
  g.fillText('°C', x, y + r * 0.45);
  lwHand(g, x, y, r, coolantAngle(celsius), { length: 0.82 });
}

/**
 * A radiator flap switch (#34): Kühler, its lever over Auf with the radiator open and back with it closed, in its green
 * ring, "Schalter f. Kühlkl." below.
 */
export function radiatorSwitch(g, x, y, face, outer, open) {
  ring(g, x, y, face, RING.green);
  lwFace(g, x, y, face);
  centred(g);
  for (let k = -3; k <= 3; k += 1) tick(g, x, y, face, k * 30 * DEG, 0.95, 0.8, 1.6);
  font(g, face * 0.24, true);
  g.fillText('Kühler', x, y - face * 0.38);
  g.fillText('Auf', x - face * 0.3, y + face * 0.4);
  lever(g, x, y, face, (open ? -135 : -60) * DEG);
  text(g, 'Schalter f. Kühlkl.', x, y + outer * 1.12, face * 0.22, WHITE, { bold: true });
}

/** The tank selector (#34, shown at 1, D105): 0, 1 VL, 2, HL 3, HR 4 round its lever, Umschalter below. */
export function tankSelector(g, x, y, face, outer) {
  lwFace(g, x, y, face);
  centred(g);
  font(g, face * 0.2, true);
  for (const [s, a] of [['0', -100], ['1', -45], ['VL', -60], ['2', 0], ['HL 3', 55], ['HR 4', 90]]) {
    g.fillText(s, ...at(x, y, a * DEG, face * (s.length > 1 ? 0.6 : 0.75)));
  }
  lever(g, x, y, face, -45 * DEG);
  text(g, 'Umschalter', x, y + outer * 1.12, face * 0.24, WHITE, { bold: true });
}

/** A black lever from the hub along `angle`, rounded, lit along one edge. */
function lever(g, x, y, r, angle) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = '#0d0e0f';
  g.beginPath();
  g.roundRect(-r * 0.14, -r * 0.88, r * 0.28, r * 1.1, r * 0.14);
  g.fill();
  g.fillStyle = 'rgba(200, 205, 210, 0.35)';
  g.fillRect(-r * 0.08, -r * 0.8, r * 0.05, r * 0.9);
  g.restore();
}

/** The Kurssteuerung (course steering) indicator, shown only: its arc and arrows, SIEMENS, the label below. */
export function autopilotIndicator(g, x, y, face) {
  lwFace(g, x, y, face);
  g.strokeStyle = paint.ink;
  g.lineWidth = Math.max(1, face * 0.04);
  g.beginPath();
  g.arc(x, y + face * 0.2, face * 0.62, -150 * DEG, -30 * DEG);
  g.stroke();
  centred(g);
  font(g, face * 0.16, true);
  g.fillText('SIEMENS', x, y - face * 0.12);
  g.fillText('Kurssteuerung', x, y + face * 0.55);
  font(g, face * 0.2, true);
  g.fillText('1', x, y - face * 0.55);
  g.fillText('0', x - face * 0.72, y + face * 0.1);
  g.fillStyle = '#0b0b0c';
  g.fillRect(x - face * 0.1, y + face * 0.12, face * 0.85, face * 0.18); // the switch lever
}

/** The AEG indicator, shown only: its marks down the left, L and R, its needle upright. */
export function aegIndicator(g, x, y, face) {
  lwFace(g, x, y, face);
  centred(g);
  for (const k of [-2, -1, 0, 1, 2]) tick(g, x, y, face, (-90 + k * 25) * DEG, 0.9, 0.78, 2);
  font(g, face * 0.24, true);
  g.fillText('L', x + face * 0.05, y + face * 0.32);
  g.fillText('R', x + face * 0.62, y + face * 0.32);
  font(g, face * 0.13, true);
  g.fillText('AEG', x, y + face * 0.72);
  g.fillStyle = paint.ink;
  g.fillRect(x + face * 0.3, y + face * 0.1, face * 0.1, face * 0.32);
}

/**
 * The Preßluft (compressed air) gauge's reading, kg/cm²: 0 with the engines stopped, 150 with either running, rising
 * as it starts (product owner, D142; no figure was found).
 */
export const PRESSLUFT_RUNNING = 150;
export const pressluftReading = (v) => PRESSLUFT_RUNNING * (v.enginesRunning ?? 0);

/** The Preßluft gauge: 0 to 250 kg/cm², its hand at `value`, Preßluft below. */
export const pressluftAngle = (p) => (-135 + (Math.max(0, Math.min(250, p)) / 250) * 270) * DEG;
export function pressluftGauge(g, x, y, face, outer, value) {
  lwFace(g, x, y, face);
  const angle = pressluftAngle;
  centred(g);
  for (let p = 0; p <= 250; p += 25) tick(g, x, y, face, angle(p), 0.95, p % 50 === 0 ? 0.78 : 0.87, p % 50 === 0 ? 1.8 : 1);
  font(g, face * 0.2, true);
  for (const p of [50, 100, 150, 200, 250]) g.fillText(String(p), ...at(x, y, angle(p), face * 0.58));
  font(g, face * 0.14);
  g.fillText('kg/cm²', x, y + face * 0.3);
  lwHand(g, x, y, face, angle(value), { counterweight: false });
  text(g, 'Preßluft', x, y + outer * 1.12, face * 0.26, WHITE, { bold: true });
}

/** A correction card lying over a dial's top, shown only: a white-edged dark band arched over the dial, its words. */
export function correctionCard(g, b, words) {
  const cx = b.x + b.w / 2;
  g.strokeStyle = WHITE;
  g.fillStyle = '#26282a';
  g.lineWidth = Math.max(1, b.h * 0.08);
  g.beginPath();
  g.moveTo(b.x, b.y + b.h);
  g.quadraticCurveTo(cx, b.y - b.h * 0.6, b.x + b.w, b.y + b.h);
  g.lineTo(b.x + b.w * 0.9, b.y + b.h);
  g.quadraticCurveTo(cx, b.y + b.h * 0.1, b.x + b.w * 0.1, b.y + b.h);
  g.closePath();
  g.fill();
  g.stroke();
  text(g, words, cx, b.y + b.h * 0.38, b.w * 0.07, WHITE, { bold: true }); // along the band's top
}
