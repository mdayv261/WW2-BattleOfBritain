// Luftwaffe engine and other instruments in the look of the product owner's reference drawings (D43, src/ui/lwStyle.js):
// the rev counter (U/min x 100), manifold pressure (ata), the Bf 109 E's strip repeater compass, the clock, the airscrew
// pitch indicator (Luftschraubenstellung), the fuel and oil pressure gauge, and placards. The flying instruments are
// in src/ui/lwFlightDials.js. Angles are in radians, 0 straight up, clockwise.

import { DEG, INK, at, font, centred, tick, lwFace, lwHand } from './lwStyle.js';

export { mount } from './lwStyle.js';
export { lwAirspeed, lwAirspeedAngle, lwFineAltimeter, lwTurnBank } from './lwFlightDials.js';

/** Rev counter, 600-3,000 rpm: 600 at half past seven, 1,800 at twelve, 3,000 at half past four. */
export const lwRpmAngle = (rpm) => (225 + (Math.max(500, Math.min(3100, rpm)) - 600) * 0.1125) * DEG;

export function lwRpm(g, x, y, r, rpm) {
  lwFace(g, x, y, r);
  centred(g);
  for (let v = 600; v <= 3000; v += 100) tick(g, x, y, r, lwRpmAngle(v), 0.95, v % 200 === 0 ? 0.8 : 0.87, v % 200 === 0 ? 2 : 1.2);
  font(g, r * 0.19);
  for (const v of [6, 10, 14, 18, 22, 26, 30]) g.fillText(String(v), ...at(x, y, lwRpmAngle(v * 100), r * 0.6));
  font(g, r * 0.17, true);
  g.fillText('U/min', x, y + r * 0.42);
  font(g, r * 0.1);
  g.fillText('x 100', x, y + r * 0.58);
  lwHand(g, x, y, r, lwRpmAngle(rpm));
}

/** Manifold pressure, 0.6-1.8 ata: 0.6 at half past seven, 1.2 at twelve. */
export const lwAtaAngle = (ata) => (225 + (Math.max(0.55, Math.min(1.85, ata)) - 0.6) * 225) * DEG;

export function lwAta(g, x, y, r, ata) {
  lwFace(g, x, y, r);
  centred(g);
  for (let k = 0; k <= 24; k += 1) {
    tick(g, x, y, r, lwAtaAngle(0.6 + k * 0.05), 0.95, k % 4 === 0 ? 0.8 : k % 2 === 0 ? 0.85 : 0.89, k % 4 === 0 ? 2 : 1);
  }
  font(g, r * 0.18);
  for (const v of [0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8]) g.fillText(String(v), ...at(x, y, lwAtaAngle(v), r * 0.62));
  font(g, r * 0.17, true);
  g.fillText('ata', x, y + r * 0.34);
  lwHand(g, x, y, r, lwAtaAngle(ata));
}

/**
 * Repeater compass: a card strip seen through the face, its figures (tens of degrees, with N, E, S and W at the
 * cardinal points, as the product owner asked) running down to the right as on the photographed instrument, behind a
 * fixed vertical lubber line and a horizontal line. Heading in degrees.
 */
export function lwStripCompass(g, x, y, r, heading) {
  lwFace(g, x, y, r);
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
  g.strokeStyle = INK;
  g.lineWidth = Math.max(1.5, r * 0.04);
  g.beginPath();
  g.moveTo(x, y - r * 0.7);
  g.lineTo(x, y + r * 0.7);
  g.moveTo(x - r * 0.7, y + r * 0.38);
  g.lineTo(x + r * 0.7, y + r * 0.38);
  g.stroke();
}

/** The panel clock, showing the time of day. */
export function lwClock(g, x, y, r, date) {
  lwFace(g, x, y, r);
  centred(g);
  for (let k = 0; k < 60; k += 1) tick(g, x, y, r, k * 6 * DEG, 0.95, k % 5 === 0 ? 0.8 : 0.9, k % 5 === 0 ? 1.8 : 0.8);
  font(g, r * 0.24, true);
  for (const h of [12, 3, 6, 9]) g.fillText(String(h), ...at(x, y, h * 30 * DEG, r * 0.62));
  const s = date.getSeconds();
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  lwHand(g, x, y, r, h * 30 * DEG, { length: 0.5, counterweight: false });
  lwHand(g, x, y, r, m * 6 * DEG, { length: 0.8, counterweight: false });
  lwHand(g, x, y, r, s * 6 * DEG, { length: 0.82, colour: '#d43a2a', counterweight: false });
}

/**
 * Airscrew pitch indicator (Luftschraubenstellung): hour and minute hands like a clock, ten minutes to a degree of
 * blade angle (S32), 12 o'clock at fine pitch. `clock` is { hours, minutes }.
 */
export function lwPitchIndicator(g, x, y, r, clock) {
  lwFace(g, x, y, r);
  centred(g);
  for (let k = 0; k < 60; k += 1) tick(g, x, y, r, k * 6 * DEG, 0.95, k % 5 === 0 ? 0.78 : 0.9, k % 5 === 0 ? 2 : 0.8);
  font(g, r * 0.12);
  g.fillText('Luftschrauben-', x, y + r * 0.3);
  g.fillText('stellung', x, y + r * 0.44);
  lwHand(g, x, y, r, (clock.hours / 12) * Math.PI * 2, { length: 0.5, counterweight: false });
  lwHand(g, x, y, r, (clock.minutes / 60) * Math.PI * 2, { length: 0.85, counterweight: false });
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
  lwFace(g, x, y, r);
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
  lwHand(g, x, y, r, angleOf(-1, fuel.value, fuel.max), { length: 0.78, counterweight: false });
  lwHand(g, x, y, r, angleOf(1, oil.value, oil.max), { length: 0.78, counterweight: false });
}
