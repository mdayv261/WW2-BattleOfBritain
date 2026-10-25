// Luftwaffe instruments drawn after the product owner's photograph of a Bf 109 panel (D38): black faces with cream
// luminous markings, each in a square mounting with four screws. Angles are in radians, 0 straight up, clockwise.
//   Airspeed (km/h, a scale that opens out between 300 and 700), climb and descent (Steigt/Sinkt, m/s), rev counter
//   (U/min x 100), manifold pressure (ata), the repeater compass with its fixed aircraft, the turn and bank
//   indicator (DREHT above, HÄNGT below), the fine altimeter (one turn per km), the clock, the small ring-coloured
//   engine gauges, the ammeter, the ball compass, knobs and placards.

import { face, needle, LUMINOUS } from './dials.js';

const DEG = Math.PI / 180;
const MOUNT = '#1d1f20';
const SCREW = '#4a4b48';

const at = (x, y, a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];
const font = (g, size, bold = false) => {
  g.font = `${bold ? 'bold ' : ''}${Math.max(6, Math.round(size))}px ui-sans-serif, Helvetica, sans-serif`;
};
const centred = (g, colour = LUMINOUS) => {
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = colour;
  g.strokeStyle = colour;
};

/** The square mounting plate round a dial, with a screw in each corner. `size` is half its width. */
export function mount(g, x, y, size) {
  g.fillStyle = MOUNT;
  g.beginPath();
  g.roundRect(x - size, y - size, 2 * size, 2 * size, size * 0.22);
  g.fill();
  g.fillStyle = SCREW;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.beginPath();
    g.arc(x + sx * size * 0.8, y + sy * size * 0.8, size * 0.08, 0, Math.PI * 2);
    g.fill();
  }
}

/** A tick from radius r1 to r2 (fractions of r) at angle a. */
function tick(g, x, y, r, a, r1, r2, width) {
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(...at(x, y, a, r * r1));
  g.lineTo(...at(x, y, a, r * r2));
  g.stroke();
}

/** A broad cream hand with a short dark tail, as on the photographed instruments. */
function hand(g, x, y, r, angle, length = 0.82, colour = LUMINOUS) {
  needle(g, x, y, r * length, angle, Math.max(2, r * 0.06), colour);
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, r * 0.08, 0, Math.PI * 2);
  g.fill();
}

/** Interpolates an angle (degrees) from a table of [value, angle] pairs. */
function tableAngle(table, v) {
  if (v <= table[0][0]) return table[0][1] * DEG;
  for (let i = 1; i < table.length; i += 1) {
    const [v1, a1] = table[i];
    const [v0, a0] = table[i - 1];
    if (v <= v1) return (a0 + ((v - v0) / (v1 - v0)) * (a1 - a0)) * DEG;
  }
  return table[table.length - 1][1] * DEG;
}

// Airspeed scale read from the photograph: the hand rests at six o'clock and 200 km/h is at about eight o'clock;
// the scale opens out through 300-600 and closes up again to 750.
const AIRSPEED = [[0, 172], [100, 185], [200, 237], [300, 285], [400, 333], [500, 385], [600, 435], [700, 485], [750, 505]];

export const lwAirspeedAngle = (kmh) => tableAngle(AIRSPEED, kmh);

export function lwAirspeed(g, x, y, r, kmh) {
  face(g, x, y, r);
  centred(g);
  for (let v = 100; v <= 750; v += 10) {
    const major = v % 100 === 0;
    tick(g, x, y, r, lwAirspeedAngle(v), 0.95, major ? 0.78 : v % 50 === 0 ? 0.84 : 0.88, major ? 2 : 1);
  }
  font(g, r * 0.2, true);
  for (let v = 200; v <= 700; v += 100) g.fillText(String(v), ...at(x, y, lwAirspeedAngle(v), r * 0.6));
  font(g, r * 0.15, true);
  g.fillText('Km/h', x + r * 0.25, y + r * 0.32);
  hand(g, x, y, r, lwAirspeedAngle(kmh));
}

/** Climb and descent in m/s: 0 at nine o'clock, 5 up at twelve and down at six, 10 either way at three. */
export const lwClimbAngle = (ms) => (-90 + 18 * Math.max(-10, Math.min(10, ms))) * DEG;

export function lwClimb(g, x, y, r, ms) {
  face(g, x, y, r);
  centred(g);
  for (let v = -10; v <= 10; v += 1) {
    const major = v % 5 === 0;
    tick(g, x, y, r, lwClimbAngle(v), 0.95, major ? 0.76 : 0.85, major ? 2.5 : 1.2);
  }
  font(g, r * 0.22, true);
  g.fillText('5', ...at(x, y, lwClimbAngle(5), r * 0.6));
  g.fillText('5', ...at(x, y, lwClimbAngle(-5), r * 0.6));
  g.fillText('10', ...at(x, y, lwClimbAngle(10), r * 0.58));
  font(g, r * 0.2, true);
  for (const [word, dy] of [['Steigt', -0.24], ['Sinkt', 0.3]]) {
    g.save();
    g.translate(x - r * 0.05, y + dy * r);
    g.rotate(-12 * DEG);
    g.fillText(word, 0, 0);
    g.restore();
  }
  font(g, r * 0.12);
  g.fillText('m/s', x + r * 0.42, y + r * 0.03);
  hand(g, x, y, r, lwClimbAngle(ms), 0.8);
}

/** Rev counter, 600-3,600 rpm: 600 at about half past seven, 9 degrees per 100 rpm. Red marks at `limits`. */
export const lwRpmAngle = (rpm) => (225 + (Math.max(500, Math.min(3700, rpm)) - 600) * 0.09) * DEG;

export function lwRpm(g, x, y, r, rpm, limits = []) {
  face(g, x, y, r);
  centred(g);
  for (let v = 600; v <= 3600; v += 100) tick(g, x, y, r, lwRpmAngle(v), 0.95, v % 200 === 0 ? 0.82 : 0.88, v % 200 === 0 ? 1.8 : 1);
  g.strokeStyle = '#d43a2a';
  for (const v of limits) tick(g, x, y, r, lwRpmAngle(v), 1.0, 0.8, 3);
  centred(g);
  font(g, r * 0.18, true);
  for (const v of [6, 10, 14, 18, 22, 26, 30, 34]) g.fillText(String(v), ...at(x, y, lwRpmAngle(v * 100), r * 0.62));
  font(g, r * 0.13, true);
  g.fillText('36', ...at(x, y, lwRpmAngle(3600), r * 0.66));
  font(g, r * 0.14);
  g.fillText('U/min', x, y + r * 0.26);
  font(g, r * 0.1);
  g.fillText('x 100', x, y + r * 0.4);
  hand(g, x, y, r, lwRpmAngle(rpm));
}

/** Manifold pressure, 0.6-1.8 ata: 0.6 at half past seven, 1.2 at twelve. Red marks at `limits`. */
export const lwAtaAngle = (ata) => (225 + (Math.max(0.55, Math.min(1.85, ata)) - 0.6) * 225) * DEG;

export function lwAta(g, x, y, r, ata, limits = []) {
  face(g, x, y, r);
  centred(g);
  for (let k = 0; k <= 24; k += 1) {
    const v = 0.6 + k * 0.05;
    tick(g, x, y, r, lwAtaAngle(v), 0.95, k % 4 === 0 ? 0.8 : k % 2 === 0 ? 0.85 : 0.89, k % 4 === 0 ? 2 : 1);
  }
  g.strokeStyle = '#d43a2a';
  for (const v of limits) tick(g, x, y, r, lwAtaAngle(v), 1.0, 0.8, 3);
  centred(g);
  font(g, r * 0.18, true);
  for (const v of [0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8]) g.fillText(String(v), ...at(x, y, lwAtaAngle(v), r * 0.62));
  font(g, r * 0.2, true);
  g.fillText('ata', x + r * 0.05, y + r * 0.3);
  hand(g, x, y, r, lwAtaAngle(ata));
}

/** Repeater compass: the card turns so the heading (degrees) is under the index at the top; the aircraft is fixed. */
export function lwCompass(g, x, y, r, heading) {
  face(g, x, y, r);
  centred(g);
  const card = (d) => (d - heading) * DEG;
  for (let d = 0; d < 360; d += 5) tick(g, x, y, r, card(d), 0.95, d % 30 === 0 ? 0.8 : d % 10 === 0 ? 0.86 : 0.9, d % 30 === 0 ? 1.8 : 1);
  font(g, r * 0.17, true);
  for (let d = 0; d < 360; d += 30) {
    const text = d % 90 === 0 ? 'NOSW'[d / 90] : String(d / 10);
    g.save();
    g.translate(...at(x, y, card(d), r * 0.65));
    g.rotate(card(d));
    g.fillText(text, 0, 0);
    g.restore();
  }
  // Index at the top and the fixed aircraft in the middle.
  g.beginPath();
  g.moveTo(x, y - r * 0.97);
  g.lineTo(x - r * 0.07, y - r * 1.1);
  g.lineTo(x + r * 0.07, y - r * 1.1);
  g.fill();
  g.lineWidth = Math.max(2, r * 0.07);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y - r * 0.32);
  g.lineTo(x, y + r * 0.3);
  g.moveTo(x - r * 0.32, y - r * 0.02);
  g.lineTo(x + r * 0.32, y - r * 0.02);
  g.moveTo(x - r * 0.13, y + r * 0.26);
  g.lineTo(x + r * 0.13, y + r * 0.26);
  g.stroke();
}

/**
 * Turn and bank indicator: the turn pointer (a white bar) swings over DREHT in the upper half, with L and R either
 * side; the ball rolls in a curved tube over HÄNGT in the lower half. `turnRate` deg/s (+ right), `sideG` (+ right).
 */
export function lwTurnBank(g, x, y, r, turnRate, sideG) {
  face(g, x, y, r);
  centred(g);
  font(g, r * 0.2, true);
  g.fillText('DREHT', x, y - r * 0.38);
  g.fillText('HÄNGT', x, y + r * 0.55);
  font(g, r * 0.22, true);
  g.fillText('L', x - r * 0.7, y - r * 0.38);
  g.fillText('R', x + r * 0.7, y - r * 0.38);
  // Turn pointer: a broad bar pivoted below the window, a rate-one turn (3 deg/s) moving it 15 degrees.
  const swing = Math.max(-40, Math.min(40, (turnRate / 3) * 15)) * DEG;
  g.save();
  g.translate(x, y + r * 0.1);
  g.rotate(swing);
  g.fillStyle = LUMINOUS;
  g.fillRect(-r * 0.05, -r * 0.88, r * 0.1, r * 0.3);
  g.restore();
  // The ball's tube: an arc sagging in the middle.
  const cy = y - r * 0.55;
  const rad = r * 0.85;
  g.strokeStyle = '#8f7a55';
  g.lineWidth = r * 0.14;
  g.beginPath();
  g.arc(x, cy, rad, (90 + 25) * DEG, (90 - 25) * DEG, true);
  g.stroke();
  const ball = Math.max(-1, Math.min(1, -sideG / 0.25)) * 22 * DEG;
  g.fillStyle = '#121212';
  g.beginPath();
  g.arc(x - Math.sin(ball) * rad, cy + Math.cos(ball) * rad, r * 0.07, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 1;
  for (const s of [-1, 1]) tick(g, x, cy, 1, s * 7 * DEG + Math.PI, rad - r * 0.09, rad + r * 0.09, 1);
}

/** Fine altimeter: one turn per kilometre, 0 at six o'clock, with the millibar window at the top. */
export function lwFineAltimeter(g, x, y, r, metres, drawWindow) {
  face(g, x, y, r);
  centred(g);
  const angle = (m) => Math.PI + (m / 1000) * Math.PI * 2;
  for (let m = 0; m < 1000; m += 20) tick(g, x, y, r, angle(m), 0.95, m % 100 === 0 ? 0.8 : m % 50 === 0 ? 0.86 : 0.9, m % 100 === 0 ? 2 : 1);
  font(g, r * 0.17, true);
  for (let k = 1; k <= 9; k += 1) g.fillText(`0.${k}`, ...at(x, y, angle(k * 100), r * 0.62));
  font(g, r * 0.22, true);
  g.fillText('0', ...at(x, y, angle(0), r * 0.62));
  g.fillText('km', x, y + r * 0.3);
  if (drawWindow) drawWindow(x, y - r * 0.42);
  hand(g, x, y, r, angle(((metres % 1000) + 1000) % 1000));
}

/** The panel clock, showing the time of day. */
export function lwClock(g, x, y, r, date) {
  face(g, x, y, r);
  centred(g);
  for (let k = 0; k < 60; k += 1) tick(g, x, y, r, k * 6 * DEG, 0.95, k % 5 === 0 ? 0.82 : 0.9, k % 5 === 0 ? 1.8 : 0.8);
  font(g, r * 0.2, true);
  for (let h = 1; h <= 12; h += 1) g.fillText(String(h), ...at(x, y, h * 30 * DEG, r * 0.66));
  const s = date.getSeconds();
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  needle(g, x, y, r * 0.5, h * 30 * DEG, Math.max(2, r * 0.08));
  needle(g, x, y, r * 0.78, m * 6 * DEG, Math.max(1.5, r * 0.05));
  needle(g, x, y, r * 0.8, s * 6 * DEG, 1, '#d43a2a');
}

/**
 * A small engine gauge with a coloured ring round its bezel (fuel yellow, oil brown, coolant green):
 *   { min, max, labels: [values], ring, bands: [{ from, to, colour }], value, text, sweep (degrees, default 270) }
 */
export function ringGauge(g, x, y, r, o) {
  const sweep = (o.sweep ?? 270) * DEG;
  const angle = (v) => -sweep / 2 + ((Math.max(o.min, Math.min(o.max, v)) - o.min) / (o.max - o.min)) * sweep;
  g.fillStyle = o.ring;
  g.beginPath();
  g.arc(x, y, r * 1.12, 0, Math.PI * 2);
  g.fill();
  face(g, x, y, r);
  for (const b of o.bands ?? []) {
    g.strokeStyle = b.colour;
    g.lineWidth = r * 0.12;
    g.beginPath();
    g.arc(x, y, r * 0.9, angle(b.from) - Math.PI / 2, angle(b.to) - Math.PI / 2);
    g.stroke();
  }
  centred(g);
  const step = (o.max - o.min) / 10;
  for (let k = 0; k <= 10; k += 1) tick(g, x, y, r, angle(o.min + k * step), 0.95, k % 5 === 0 ? 0.78 : 0.86, k % 5 === 0 ? 1.8 : 1);
  font(g, r * 0.24, true);
  for (const v of o.labels) g.fillText(String(v), ...at(x, y, angle(v), r * 0.58));
  font(g, r * 0.18);
  g.fillText(o.text, x, y + r * 0.38);
  hand(g, x, y, r, angle(o.value), 0.8);
}

/** Ammeter: 30-0-30 amperes over the top half. */
export function ammeter(g, x, y, r, amps) {
  face(g, x, y, r);
  centred(g);
  const angle = (a) => (Math.max(-30, Math.min(30, a)) / 30) * 60 * DEG;
  for (let a = -30; a <= 30; a += 5) tick(g, x, y, r, angle(a), 0.92, a % 15 === 0 ? 0.76 : 0.84, a % 15 === 0 ? 1.8 : 1);
  font(g, r * 0.22, true);
  g.fillText('30', ...at(x, y, angle(-30), r * 0.55));
  g.fillText('30', ...at(x, y, angle(30), r * 0.55));
  font(g, r * 0.3, true);
  g.fillText('A', x, y + r * 0.2);
  needle(g, x, y + r * 0.35, r * 1.0, angle(amps), 1.5);
}

/** Ball compass: the card's figures pass a lubber line through a dark dome. */
export function ballCompass(g, x, y, r, heading) {
  g.fillStyle = '#060606';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.beginPath();
  g.arc(x, y, r * 0.92, 0, Math.PI * 2);
  g.clip();
  centred(g);
  font(g, r * 0.32, true);
  const perDeg = r / 40;
  for (let d = Math.floor((heading - 60) / 30) * 30; d <= heading + 60; d += 30) {
    const deg = ((d % 360) + 360) % 360;
    const text = deg % 90 === 0 ? 'NOSW'[deg / 90] : String(deg / 10);
    g.fillText(text, x + (d - heading) * perDeg, y);
  }
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.12)';
  g.beginPath();
  g.ellipse(x - r * 0.3, y - r * 0.45, r * 0.35, r * 0.18, -0.4, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#d43a2a';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x, y - r * 0.4);
  g.lineTo(x, y + r * 0.4);
  g.stroke();
}

/** A round control knob with lettering above it (light dimmer, selector switches). */
export function knob(g, x, y, r, words = []) {
  face(g, x, y, r);
  centred(g);
  font(g, r * 0.26, true);
  words.forEach(([text, dx]) => g.fillText(text, x + dx * r, y - r * 0.55));
  g.fillStyle = '#2b2b29';
  g.beginPath();
  g.arc(x, y + r * 0.15, r * 0.45, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#5a5a56';
  g.fillRect(x - r * 0.08, y - r * 0.25, r * 0.16, r * 0.7);
}

/** A placard: light lettering on a dark plate (or `colour` for the plate). */
export function placard(g, x, y, w, h, lines, colour = '#0c0c0c') {
  g.fillStyle = colour;
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.strokeStyle = '#8a8a84';
  g.lineWidth = 1;
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  centred(g, '#e9e6dc');
  const size = h / (lines.length + 0.8);
  lines.forEach((text, i) => {
    font(g, size * 0.8, i === 0);
    g.fillText(text, x, y - h / 2 + size * (i + 0.9));
  });
}
