// Luftwaffe instruments drawn after the product owner's photograph of a Bf 109 E panel (D38): black faces with cream
// luminous markings, each in a black square mounting with a lobe and screw at each corner. Angles are in radians,
// 0 straight up, clockwise.
//   Airspeed (km/h, a scale that opens out between 300 and 700), rev counter (U/min x 100), manifold pressure (ata),
//   the repeater compass (a card strip behind crossed lines), the turn and bank indicator (DREHT above, HÄNGT below,
//   a yellow ball tube), the fine altimeter (one turn per km, a short hand for whole km), the clock, the airscrew pitch
//   indicator (Luftschraubenstellung), and placards.

import { face, needle, LUMINOUS } from './dials.js';

const DEG = Math.PI / 180;
const MOUNT = '#131415';
const SCREW = '#303233';

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

/** The square mounting round a dial: a lobe with a screw at each corner. `size` is half its width. */
export function mount(g, x, y, size) {
  g.fillStyle = MOUNT;
  g.beginPath();
  g.roundRect(x - size * 0.92, y - size * 0.92, 1.84 * size, 1.84 * size, size * 0.3);
  g.fill();
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.fillStyle = MOUNT;
    g.beginPath();
    g.arc(x + sx * size * 0.8, y + sy * size * 0.8, size * 0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = SCREW;
    g.beginPath();
    g.arc(x + sx * size * 0.8, y + sy * size * 0.8, size * 0.09, 0, Math.PI * 2);
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

/** A broad cream hand with a dark hub. */
function hand(g, x, y, r, angle, length = 0.82, width = 0.06) {
  needle(g, x, y, r * length, angle, Math.max(2, r * width), LUMINOUS);
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

// Airspeed scale read from the photographs: the hand rests near six o'clock and 200 km/h is at about eight o'clock;
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
  font(g, r * 0.18, true);
  for (let v = 200; v <= 700; v += 100) g.fillText(String(v), ...at(x, y, lwAirspeedAngle(v), r * 0.6));
  font(g, r * 0.15, true);
  g.fillText('km/h', x, y + r * 0.42);
  hand(g, x, y, r, lwAirspeedAngle(kmh));
}

/** Rev counter, 600-3,000 rpm: 600 at half past seven, 1,800 at twelve, 3,000 at half past four. */
export const lwRpmAngle = (rpm) => (225 + (Math.max(500, Math.min(3100, rpm)) - 600) * 0.1125) * DEG;

export function lwRpm(g, x, y, r, rpm) {
  face(g, x, y, r);
  centred(g);
  for (let v = 600; v <= 3000; v += 100) tick(g, x, y, r, lwRpmAngle(v), 0.95, v % 200 === 0 ? 0.8 : 0.87, v % 200 === 0 ? 2 : 1.2);
  font(g, r * 0.19, true);
  for (const v of [6, 10, 14, 18, 22, 26, 30]) g.fillText(String(v), ...at(x, y, lwRpmAngle(v * 100), r * 0.6));
  font(g, r * 0.17, true);
  g.fillText('U/min', x, y + r * 0.42);
  font(g, r * 0.1);
  g.fillText('x 100', x, y + r * 0.58);
  hand(g, x, y, r, lwRpmAngle(rpm));
}

/** Manifold pressure, 0.6-1.8 ata: 0.6 at half past seven, 1.2 at twelve. */
export const lwAtaAngle = (ata) => (225 + (Math.max(0.55, Math.min(1.85, ata)) - 0.6) * 225) * DEG;

export function lwAta(g, x, y, r, ata) {
  face(g, x, y, r);
  centred(g);
  for (let k = 0; k <= 24; k += 1) {
    tick(g, x, y, r, lwAtaAngle(0.6 + k * 0.05), 0.95, k % 4 === 0 ? 0.8 : k % 2 === 0 ? 0.85 : 0.89, k % 4 === 0 ? 2 : 1);
  }
  font(g, r * 0.18, true);
  for (const v of [0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8]) g.fillText(String(v), ...at(x, y, lwAtaAngle(v), r * 0.62));
  font(g, r * 0.17, true);
  g.fillText('ata', x, y + r * 0.34);
  hand(g, x, y, r, lwAtaAngle(ata));
}

/**
 * Repeater compass: a card strip seen through the face, its figures (tens of degrees, with N, E, S and W at the
 * cardinal points, as the product owner asked) running down to the right as on the photographed instrument, behind a
 * fixed vertical lubber line and a horizontal line. Heading in degrees.
 */
export function lwStripCompass(g, x, y, r, heading) {
  face(g, x, y, r);
  g.save();
  g.beginPath();
  g.arc(x, y, r * 0.95, 0, Math.PI * 2);
  g.clip();
  centred(g);
  const perDeg = (r * 0.62) / 30; // 30 degrees between figures, as photographed (12 9 6 3 across the face)
  const sy = y - r * 0.05;
  for (let d = Math.floor((heading - 70) / 5) * 5; d <= heading + 70; d += 5) {
    const px = x - (d - heading) * perDeg;
    const deg = ((d % 360) + 360) % 360;
    const long = deg % 10 === 0;
    tick(g, px, sy - r * 0.12, 1, 0, 0, long ? r * 0.16 : r * 0.09, long ? 1.6 : 1);
    if (deg % 30 === 0) {
      font(g, r * (deg % 90 === 0 ? 0.24 : 0.2), true);
      g.fillText(deg % 90 === 0 ? 'NESW'[deg / 90] : String(deg / 10), px, sy + r * 0.14);
    }
  }
  g.restore();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = Math.max(1.5, r * 0.04);
  g.beginPath();
  g.moveTo(x, y - r * 0.7);
  g.lineTo(x, y + r * 0.7);
  g.moveTo(x - r * 0.7, y + r * 0.38);
  g.lineTo(x + r * 0.7, y + r * 0.38);
  g.stroke();
}

/**
 * Turn and bank indicator: the turn pointer (a white bar) moves over DREHT, with L and R either side; the ball rolls
 * in a yellow tube above HÄNGT. `turnRate` deg/s (+ right), `sideG` (+ right).
 */
export function lwTurnBank(g, x, y, r, turnRate, sideG) {
  face(g, x, y, r);
  centred(g);
  font(g, r * 0.18, true);
  g.fillText('DREHT', x, y - r * 0.32);
  g.fillText('HÄNGT', x, y + r * 0.52);
  font(g, r * 0.16, true);
  g.fillText('L', x - r * 0.68, y - r * 0.42);
  g.fillText('R', x + r * 0.68, y - r * 0.42);
  // Turn pointer: a broad bar pivoted at the centre, a rate-one turn (3 deg/s) moving it 15 degrees.
  const swing = Math.max(-40, Math.min(40, (turnRate / 3) * 15)) * DEG;
  g.save();
  g.translate(x, y);
  g.rotate(swing);
  g.fillStyle = LUMINOUS;
  g.fillRect(-r * 0.06, -r * 0.82, r * 0.12, r * 0.3);
  g.fillRect(-r * 0.015, -r * 0.52, r * 0.03, r * 0.52);
  g.restore();
  // The ball's tube: a shallow arc sagging in the middle.
  const R = r * 2.2;
  const cy = y + r * 0.24 - R;
  g.strokeStyle = '#d9b623';
  g.lineWidth = r * 0.13;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, cy, R, (90 + 17) * DEG, (90 - 17) * DEG, true);
  g.stroke();
  g.lineCap = 'butt';
  const ball = Math.max(-1, Math.min(1, -sideG / 0.25)) * 14 * DEG;
  g.fillStyle = '#111';
  g.beginPath();
  g.arc(x - Math.sin(ball) * R, cy + Math.cos(ball) * R, r * 0.065, 0, Math.PI * 2);
  g.fill();
}

/**
 * Fine altimeter: the long hand turns once per kilometre (0 at six o'clock, 0.1-0.9 round the face), the short hand
 * once per 10 km, so it points at the whole kilometres on the same figures; the millibar window is at the top.
 */
export function lwFineAltimeter(g, x, y, r, metres, drawWindow) {
  face(g, x, y, r);
  centred(g);
  const angle = (fraction) => Math.PI + fraction * Math.PI * 2;
  for (let m = 0; m < 1000; m += 20) tick(g, x, y, r, angle(m / 1000), 0.95, m % 100 === 0 ? 0.8 : m % 50 === 0 ? 0.86 : 0.9, m % 100 === 0 ? 2 : 1);
  font(g, r * 0.16, true);
  for (let k = 1; k <= 9; k += 1) g.fillText(`0.${k}`, ...at(x, y, angle(k / 10), r * 0.63));
  font(g, r * 0.2, true);
  g.fillText('0', ...at(x, y, angle(0), r * 0.63));
  g.fillText('km', x + r * 0.22, y + r * 0.3);
  if (drawWindow) drawWindow(x, y - r * 0.45);
  const m = Math.max(0, metres);
  hand(g, x, y, r, angle(m / 10000), 0.42, 0.14);
  hand(g, x, y, r, angle((m % 1000) / 1000), 0.84);
}

/** The panel clock, showing the time of day. */
export function lwClock(g, x, y, r, date) {
  face(g, x, y, r);
  centred(g);
  for (let k = 0; k < 60; k += 1) tick(g, x, y, r, k * 6 * DEG, 0.95, k % 5 === 0 ? 0.8 : 0.9, k % 5 === 0 ? 1.8 : 0.8);
  font(g, r * 0.24, true);
  for (const h of [12, 3, 6, 9]) g.fillText(String(h), ...at(x, y, h * 30 * DEG, r * 0.62));
  const s = date.getSeconds();
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  needle(g, x, y, r * 0.5, h * 30 * DEG, Math.max(2, r * 0.09));
  needle(g, x, y, r * 0.78, m * 6 * DEG, Math.max(1.5, r * 0.06));
  needle(g, x, y, r * 0.8, s * 6 * DEG, 1, '#d43a2a');
}

/**
 * Airscrew pitch indicator (Luftschraubenstellung): hour and minute hands like a clock, ten minutes to a degree of
 * blade angle (S32), 12 o'clock at fine pitch. `clock` is { hours, minutes }.
 */
export function lwPitchIndicator(g, x, y, r, clock) {
  face(g, x, y, r);
  centred(g);
  for (let k = 0; k < 60; k += 1) tick(g, x, y, r, k * 6 * DEG, 0.95, k % 5 === 0 ? 0.78 : 0.9, k % 5 === 0 ? 2 : 0.8);
  font(g, r * 0.12);
  g.fillText('Luftschrauben-', x, y + r * 0.3);
  g.fillText('stellung', x, y + r * 0.44);
  needle(g, x, y, r * 0.5, (clock.hours / 12) * Math.PI * 2, Math.max(2, r * 0.09));
  needle(g, x, y, r * 0.85, (clock.minutes / 60) * Math.PI * 2, Math.max(1.5, r * 0.05));
}

/**
 * A placard: a plate with a light border. `lines` are drawn as text; `scribbles` adds rows of grey strokes standing for
 * small print too fine to read on the photograph.
 */
export function placard(g, x, y, w, h, { lines = [], scribbles = 0, plate = '#0c0c0c', ink = '#e9e6dc' } = {}) {
  g.fillStyle = plate;
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.strokeStyle = '#d8d8d2';
  g.lineWidth = 1;
  g.strokeRect(x - w / 2 + 1.5, y - h / 2 + 1.5, w - 3, h - 3);
  centred(g, ink);
  const rows = lines.length + scribbles;
  const step = h / (rows + 1);
  lines.forEach((text, i) => {
    font(g, Math.min(step * 0.75, w / (text.length * 0.62)), true);
    g.fillText(text, x, y - h / 2 + step * (i + 1));
  });
  g.strokeStyle = ink;
  g.globalAlpha = 0.5;
  g.lineWidth = Math.max(1, step * 0.2);
  for (let i = 0; i < scribbles; i += 1) {
    const py = y - h / 2 + step * (lines.length + i + 1);
    g.beginPath();
    g.moveTo(x - w * 0.36, py);
    g.lineTo(x + w * (i % 2 ? 0.2 : 0.36), py);
    g.stroke();
  }
  g.globalAlpha = 1;
}

/**
 * Fuel and oil pressure gauge (kg/cm²): the fuel needle sweeps the left half, the oil needle the right half, each over
 * its own scale with the normal range in green and the low range in red.
 *   fuel, oil: { value, max, low, normal: [from, to] } in kg/cm²
 */
export function pressureGauge(g, x, y, r, fuel, oil) {
  g.fillStyle = '#d9b623';
  g.beginPath();
  g.arc(x, y, r * 1.12, 0, Math.PI * 2);
  g.fill();
  face(g, x, y, r);
  // Each half sweeps 140 degrees from the bottom up: fuel on the left (anticlockwise), oil on the right.
  const sweep = 140 * DEG;
  const angleOf = (side, v, max) => Math.PI - side * (Math.max(0, Math.min(max, v)) / max) * sweep;
  const band = (side, from, to, max, colour) => {
    g.strokeStyle = colour;
    g.lineWidth = r * 0.14;
    g.beginPath();
    const a0 = angleOf(side, from, max) - Math.PI / 2;
    const a1 = angleOf(side, to, max) - Math.PI / 2;
    g.arc(x, y, r * 0.86, Math.min(a0, a1), Math.max(a0, a1));
    g.stroke();
  };
  [[-1, fuel], [1, oil]].forEach(([side, o]) => {
    band(side, 0, o.low, o.max, '#c0392b');
    band(side, o.normal[0], o.normal[1], o.max, '#2f9e4a');
    centred(g);
    for (let k = 0; k <= o.max; k += o.max <= 3 ? 0.5 : 1) {
      tick(g, x, y, r, angleOf(side, k, o.max), 0.97, Number.isInteger(k) ? 0.8 : 0.88, Number.isInteger(k) ? 1.6 : 1);
    }
    font(g, r * 0.2, true);
    for (const k of [0, o.max]) g.fillText(String(k), ...at(x, y, angleOf(side, k, o.max), r * 0.6));
  });
  font(g, r * 0.16, true);
  g.fillText('Kraftst.', x - r * 0.42, y - r * 0.05);
  g.fillText('Öl', x + r * 0.42, y - r * 0.05);
  hand(g, x, y, r, angleOf(-1, fuel.value, fuel.max), 0.78, 0.05);
  hand(g, x, y, r, angleOf(1, oil.value, oil.max), 0.78, 0.05);
}
