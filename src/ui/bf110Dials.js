// Bf 110 instruments drawn after the product owner's photograph of a Bf 110 cockpit (D39), where they differ from
// the Bf 109's: the airspeed indicator to 900 km/h, the combined horizon (bar, turn pointer above, ball below), the
// blue-faced climb indicator to 30 m/s each way, and the small engine gauges with coloured rings. Angles are in
// radians, 0 straight up, clockwise.

import { face, needle, LUMINOUS } from './dials.js';

const DEG = Math.PI / 180;
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

function tick(g, x, y, r, a, r1, r2, width) {
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(...at(x, y, a, r * r1));
  g.lineTo(...at(x, y, a, r * r2));
  g.stroke();
}

function hand(g, x, y, r, angle, length = 0.82) {
  needle(g, x, y, r * length, angle, Math.max(2, r * 0.06), LUMINOUS);
  g.fillStyle = '#b8241c';
  g.beginPath();
  g.arc(x, y, r * 0.1, 0, Math.PI * 2);
  g.fill();
}

/** Angle (radians) from a table of [value, degrees] pairs, held at the ends. */
function tableAngle(table, v) {
  if (v <= table[0][0]) return table[0][1] * DEG;
  for (let i = 1; i < table.length; i += 1) {
    const [v1, a1] = table[i];
    const [v0, a0] = table[i - 1];
    if (v <= v1) return (a0 + ((v - v0) / (v1 - v0)) * (a1 - a0)) * DEG;
  }
  return table[table.length - 1][1] * DEG;
}

// Airspeed to 900 km/h as photographed: 300 at nine o'clock, 500 at twelve, 700 at about two, 900 at about half past
// four; the low speeds crowded at the bottom.
const AIRSPEED = [[0, 175], [100, 200], [200, 238], [300, 270], [400, 315], [500, 360], [600, 400], [700, 432], [800, 462], [900, 492]];
export const airspeed900Angle = (kmh) => tableAngle(AIRSPEED, kmh);

export function airspeed900(g, x, y, r, kmh) {
  face(g, x, y, r);
  centred(g);
  for (let v = 100; v <= 900; v += 20) tick(g, x, y, r, airspeed900Angle(v), 0.95, v % 100 === 0 ? 0.8 : 0.88, v % 100 === 0 ? 2 : 1);
  font(g, r * 0.2, true);
  for (const v of [100, 300, 500, 700, 900]) g.fillText(String(v), ...at(x, y, airspeed900Angle(v), r * 0.6));
  font(g, r * 0.13, true);
  g.fillText('km/h', x - r * 0.3, y - r * 0.38);
  hand(g, x, y, r, airspeed900Angle(kmh));
}

// Climb and descent to 30 m/s: 0 at nine o'clock, the first 10 m/s opened out, 20 at about twelve and six.
const CLIMB = [[0, 270], [5, 305], [10, 330], [20, 358], [30, 25]];
export const climb30Angle = (ms) => {
  const a = tableAngle(CLIMB, Math.abs(ms));
  return ms >= 0 ? a : Math.PI * 3 - a; // descents mirrored about the horizontal
};

export function climb30(g, x, y, r, ms) {
  face(g, x, y, r);
  g.fillStyle = '#1f2a4a';
  g.beginPath();
  g.arc(x, y, r * 0.97, 0, Math.PI * 2);
  g.fill();
  centred(g);
  for (const s of [1, -1]) {
    for (let v = 0; v <= 30; v += v < 10 ? 1 : 5) tick(g, x, y, r, climb30Angle(s * v), 0.95, v % 5 === 0 ? 0.8 : 0.88, v % 5 === 0 ? 2 : 1);
    font(g, r * 0.19, true);
    for (const v of [5, 10, 20, 30]) g.fillText(String(v), ...at(x, y, climb30Angle(s * v), r * 0.62));
  }
  font(g, r * 0.12);
  g.fillText('steigt', x + r * 0.1, y - r * 0.3);
  g.fillText('sinkt', x + r * 0.1, y + r * 0.3);
  g.fillStyle = '#0a0a0a';
  g.beginPath();
  g.arc(x, y, r * 0.26, 0, Math.PI * 2);
  g.fill();
  hand(g, x, y, r, climb30Angle(ms));
}

/**
 * Combined horizon: a white double bar banking (rad) and moving with pitch (rad) behind a fixed small aircraft, a
 * turn pointer at the top (`turnRate` deg/s, + right) and the slip ball in a white tube at the bottom (`sideG`, + right).
 */
export function combinedHorizon(g, x, y, r, bank, pitch, turnRate, sideG) {
  face(g, x, y, r);
  g.save();
  g.beginPath();
  g.arc(x, y, r * 0.95, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = '#20283a';
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.translate(x, y);
  g.rotate(-bank);
  const shift = Math.max(-r * 0.5, Math.min(r * 0.5, pitch * r * 2));
  g.fillStyle = '#e8e2cf';
  g.fillRect(-r * 0.7, shift - r * 0.05, r * 1.4, r * 0.05);
  g.fillRect(-r * 0.62, shift + r * 0.06, r * 1.24, r * 0.05);
  g.restore();
  centred(g);
  // The fixed small aircraft.
  g.lineWidth = Math.max(2, r * 0.05);
  g.beginPath();
  g.moveTo(x - r * 0.35, y);
  g.lineTo(x - r * 0.08, y);
  g.lineTo(x, y + r * 0.06);
  g.lineTo(x + r * 0.08, y);
  g.lineTo(x + r * 0.35, y);
  g.stroke();
  // Turn pointer over the top, a rate-one turn (3 deg/s) moving it 12 degrees.
  const swing = Math.max(-36, Math.min(36, (turnRate / 3) * 12)) * DEG;
  g.save();
  g.translate(x, y);
  g.rotate(swing);
  g.fillRect(-r * 0.04, -r * 0.92, r * 0.08, r * 0.24);
  g.restore();
  for (const s of [-1, 1]) {
    g.font = `bold ${Math.max(6, Math.round(r * 0.16))}px ui-sans-serif, Helvetica, sans-serif`;
    g.fillText(s < 0 ? 'L' : 'R', ...at(x, y, s * 38 * DEG, r * 0.72));
  }
  // Ball tube at the bottom.
  const ty = y + r * 0.62;
  g.fillStyle = '#e8e2cf';
  g.beginPath();
  g.roundRect(x - r * 0.42, ty - r * 0.08, r * 0.84, r * 0.16, r * 0.08);
  g.fill();
  const ball = Math.max(-1, Math.min(1, -sideG / 0.25)) * r * 0.32;
  g.fillStyle = '#b8241c';
  g.beginPath();
  g.arc(x + ball, ty, r * 0.07, 0, Math.PI * 2);
  g.fill();
}

/**
 * A small engine gauge with a coloured ring round its bezel (coolant red, oil yellow, as photographed):
 *   { min, max, labels: [values], ring, value, text }
 */
export function ringGauge(g, x, y, r, o) {
  const sweep = 270 * DEG;
  const angle = (v) => -sweep / 2 + ((Math.max(o.min, Math.min(o.max, v)) - o.min) / (o.max - o.min)) * sweep;
  g.fillStyle = o.ring;
  g.beginPath();
  g.arc(x, y, r * 1.14, 0, Math.PI * 2);
  g.fill();
  face(g, x, y, r);
  centred(g, '#e8d37a');
  const step = (o.max - o.min) / 10;
  for (let k = 0; k <= 10; k += 1) tick(g, x, y, r, angle(o.min + k * step), 0.95, k % 5 === 0 ? 0.76 : 0.86, k % 5 === 0 ? 1.8 : 1);
  font(g, r * 0.26, true);
  for (const v of o.labels) g.fillText(String(v), ...at(x, y, angle(v), r * 0.56));
  font(g, r * 0.2);
  g.fillText(o.text, x, y + r * 0.42);
  hand(g, x, y, r, angle(o.value), 0.8);
}

/** A red ring under a dial (the engine instruments' bezels in the photograph). */
export function redRing(g, x, y, r) {
  g.fillStyle = '#7d1f1a';
  g.beginPath();
  g.arc(x, y, r * 1.1, 0, Math.PI * 2);
  g.fill();
}

/** Repeater compass: the card turns so the heading (degrees) is under the index at the top; the small aircraft is fixed. */
export function repeaterCompass(g, x, y, r, heading) {
  face(g, x, y, r);
  centred(g);
  const card = (d) => (d - heading) * DEG;
  for (let d = 0; d < 360; d += 5) tick(g, x, y, r, card(d), 0.95, d % 30 === 0 ? 0.8 : d % 10 === 0 ? 0.86 : 0.9, d % 30 === 0 ? 1.8 : 1);
  font(g, r * 0.17, true);
  for (let d = 0; d < 360; d += 30) {
    const text = d % 90 === 0 ? 'NOSW'[d / 90] : String(d / 10);
    g.save();
    g.translate(...at(x, y, card(d), r * 0.64));
    g.rotate(card(d));
    g.fillText(text, 0, 0);
    g.restore();
  }
  g.beginPath();
  g.moveTo(x, y - r * 0.97);
  g.lineTo(x - r * 0.07, y - r * 1.1);
  g.lineTo(x + r * 0.07, y - r * 1.1);
  g.fill();
  g.lineWidth = Math.max(2, r * 0.07);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y - r * 0.3);
  g.lineTo(x, y + r * 0.28);
  g.moveTo(x - r * 0.34, y);
  g.lineTo(x + r * 0.34, y);
  g.moveTo(x - r * 0.12, y + r * 0.24);
  g.lineTo(x + r * 0.12, y + r * 0.24);
  g.stroke();
  g.lineCap = 'butt';
}
