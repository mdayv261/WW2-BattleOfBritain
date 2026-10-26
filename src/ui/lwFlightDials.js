// Luftwaffe flying instruments drawn to match the product owner's reference drawings (D43):
//   Fahrtmesser Fl. 22231 (airspeed), Fein-Grobhöhenmesser Fl. 22320 (altimeter), Variometer Fl. 22383 (climb and
//   descent), Wendezeiger Fl. 22402 (turn and bank), Führertochterkompass "Patin" Fl. 23338 (repeater compass) and
//   Wendehorizont Fl. 22427 (artificial horizon). Scales are read from the drawings. Angles: radians, 0 up, clockwise.

import { DEG, INK, at, font, centred, tick, tableAngle, lwFace, lwHand, screw } from './lwStyle.js';

// Airspeed scale read from the drawing: 200 km/h at about eight o'clock, 400 just left of twelve, 600 at a quarter
// to three, 700 at about four; the low speeds crowd toward six o'clock.
const AIRSPEED = [[0, 180], [100, 205], [200, 245], [300, 301], [400, 347], [500, 400], [600, 445], [700, 491], [750, 505]];
export const lwAirspeedAngle = (kmh) => tableAngle(AIRSPEED, kmh);

/** Fahrtmesser Fl. 22231: 100-750 km/h. */
export function lwAirspeed(g, x, y, r, kmh) {
  lwFace(g, x, y, r);
  centred(g);
  for (let v = 100; v <= 750; v += 10) {
    const major = v % 100 === 0;
    const mid = v % 50 === 0;
    tick(g, x, y, r, lwAirspeedAngle(v), 0.95, major ? 0.76 : mid ? 0.83 : 0.88, major ? Math.max(2, r * 0.05) : 1.2);
  }
  font(g, r * 0.19);
  for (let v = 200; v <= 700; v += 100) g.fillText(String(v), ...at(x, y, lwAirspeedAngle(v), r * 0.6));
  font(g, r * 0.17);
  g.fillText('km/h', x + r * 0.05, y + r * 0.42);
  lwHand(g, x, y, r, lwAirspeedAngle(kmh));
}

/**
 * Fein-Grobhöhenmesser Fl. 22320: the hand turns once per kilometre (0.1-0.9 round the face, 0 at six o'clock behind
 * the kilometre counter), the whole kilometres show in the counter below the centre, and the millibar setting in the
 * window at the top (drawn by `drawWindow(x, y)`).
 */
export function lwFineAltimeter(g, x, y, r, metres, drawWindow) {
  lwFace(g, x, y, r);
  centred(g);
  const angle = (fraction) => Math.PI + fraction * Math.PI * 2;
  for (let m = 0; m < 1000; m += 20) {
    const major = m % 100 === 0;
    tick(g, x, y, r, angle(m / 1000), 0.95, major ? 0.8 : m % 50 === 0 ? 0.86 : 0.9, major ? Math.max(2, r * 0.045) : 1);
  }
  font(g, r * 0.19);
  for (let k = 1; k <= 9; k += 1) if (k !== 5) g.fillText(`0.${k}`, ...at(x, y, angle(k / 10), r * 0.64));
  if (drawWindow) drawWindow(x, y - r * 0.68);
  // Kilometre counter: two white figures in a black window, "km" above it.
  const m = Math.max(0, metres);
  const km = Math.min(99, Math.floor(m / 1000));
  font(g, r * 0.24, true);
  g.fillText('km', x + r * 0.08, y + r * 0.3);
  g.fillStyle = '#0c0c0c';
  g.beginPath();
  g.roundRect(x - r * 0.2, y + r * 0.42, r * 0.44, r * 0.3, r * 0.05);
  g.fill();
  centred(g);
  font(g, r * 0.26);
  g.fillText(String(Math.floor(km / 10)), x - r * 0.07, y + r * 0.57);
  g.fillText(String(km % 10), x + r * 0.13, y + r * 0.57);
  lwHand(g, x, y, r, angle((m % 1000) / 1000));
}

/** Variometer Fl. 22383: 0 at nine o'clock, climb up and descent down to 15 m/s, about 9.4 degrees per m/s. */
export const lwVarioAngle = (ms) => (270 + 9.4 * Math.max(-15, Math.min(15, ms))) * DEG;

export function lwVario(g, x, y, r, ms) {
  lwFace(g, x, y, r);
  centred(g);
  // The black block at three o'clock carrying "m/s", and the black centre.
  g.fillStyle = '#121314';
  g.fillRect(x, y - r * 0.12, r * 0.98, r * 0.24);
  g.beginPath();
  g.arc(x, y, r * 0.3, 0, Math.PI * 2);
  g.fill();
  centred(g);
  for (let v = -15; v <= 15; v += 1) {
    const major = v % 5 === 0;
    tick(g, x, y, r, lwVarioAngle(v), 0.95, major ? 0.76 : 0.87, major ? Math.max(2, r * 0.05) : 1.2);
  }
  font(g, r * 0.22);
  for (const v of [5, 10, 15, -5, -10, -15]) g.fillText(String(Math.abs(v)), ...at(x, y, lwVarioAngle(v), r * 0.62));
  font(g, r * 0.15);
  g.fillText('m/s', x + r * 0.66, y);
  // The curved double arrow beside the zero.
  g.lineWidth = Math.max(1, r * 0.02);
  g.beginPath();
  g.arc(x, y, r * 0.44, (180 + 32) * DEG, (180 - 32) * DEG, true);
  g.stroke();
  for (const s of [-1, 1]) {
    const [tx, ty] = [x - Math.cos(32 * DEG) * r * 0.44, y + s * Math.sin(32 * DEG) * r * 0.44];
    g.beginPath();
    g.moveTo(tx + r * 0.06, ty);
    g.lineTo(tx, ty);
    g.lineTo(tx, ty - s * r * 0.06);
    g.stroke();
  }
  lwHand(g, x, y, r, lwVarioAngle(ms), { counterweight: false });
}

/**
 * Wendezeiger Fl. 22402: a long needle pivoted near the bottom, its white flag moving over DREHT under a fixed index
 * (a rate-one turn of 3 deg/s moves it 10 degrees); the ball in a white tube above HÄNGT. `turnRate` deg/s (+ right),
 * `sideG` (+ right).
 */
export function lwTurnBank(g, x, y, r, turnRate, sideG) {
  lwFace(g, x, y, r);
  centred(g);
  font(g, r * 0.2);
  g.fillText('DREHT', x, y - r * 0.5);
  g.fillText('HÄNGT', x, y + r * 0.5);
  for (const s of [-1, 1]) {
    g.save();
    g.translate(...at(x, y, s * 58 * DEG, r * 0.74));
    g.rotate(s * 40 * DEG);
    font(g, r * 0.22);
    g.fillText(s < 0 ? 'L' : 'R', 0, 0);
    g.restore();
    screw(g, ...at(x, y, s * 47 * DEG, r * 0.6), r * 0.045);
    screw(g, ...at(x, y, s * 138 * DEG, r * 0.66), r * 0.045);
  }
  // The fixed index above the window, and the line across the foot of the face.
  g.fillStyle = INK;
  g.fillRect(x - r * 0.07, y - r * 0.84, r * 0.14, r * 0.11);
  g.strokeStyle = '#6b6e71';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - r * 0.62, y + r * 0.8);
  g.lineTo(x + r * 0.62, y + r * 0.8);
  g.stroke();
  // The ball tube: a broad white band sagging a little in the middle, with a cage round the ball.
  const R = r * 3;
  const cy = y + r * 0.25 - R;
  g.strokeStyle = INK;
  g.lineWidth = r * 0.16;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, cy, R, (90 + 9.5) * DEG, (90 - 9.5) * DEG, true);
  g.stroke();
  g.lineCap = 'butt';
  const ball = Math.max(-1, Math.min(1, -sideG / 0.25)) * 8 * DEG;
  const [bx, by] = [x - Math.sin(ball) * R, cy + Math.cos(ball) * R];
  g.fillStyle = '#5b5e61';
  g.beginPath();
  g.arc(bx, by, r * 0.07, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#8a8d90';
  g.lineWidth = 1;
  g.strokeRect(x - r * 0.1, y + r * 0.25 - r * 0.1, r * 0.2, r * 0.2);
  // The turn needle, pivoted near the bottom of the face, with its flag at the top.
  const swing = Math.max(-30, Math.min(30, (turnRate / 3) * 10)) * DEG;
  g.save();
  g.translate(x, y + r * 0.9);
  g.rotate(swing);
  g.fillStyle = INK;
  g.fillRect(-r * 0.015, -r * 1.58, r * 0.03, r * 1.58);
  g.fillRect(-r * 0.06, -r * 1.58, r * 0.12, r * 0.2);
  g.restore();
  screw(g, x, y + r * 0.9, r * 0.04);
}

/**
 * Führertochterkompass "Patin" Fl. 23338: a card ring turning so the heading (degrees) is under the index at the top,
 * figures every 30 degrees and the cardinal points (N, E, S, W as the product owner asked, D41); the white aircraft and
 * its index bars are fixed on the darker centre.
 */
export function lwPatinCompass(g, x, y, r, heading) {
  lwFace(g, x, y, r);
  g.fillStyle = '#5b5e61';
  g.beginPath();
  g.arc(x, y, r * 0.98, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#3a3c3f';
  g.beginPath();
  g.arc(x, y, r * 0.66, 0, Math.PI * 2);
  g.fill();
  centred(g);
  const card = (d) => (d - heading) * DEG;
  for (let d = 0; d < 360; d += 5) tick(g, x, y, r, card(d), 0.7, d % 10 === 0 ? 0.8 : 0.75, d % 30 === 0 ? 2 : 1.2);
  for (let d = 0; d < 360; d += 30) {
    const cardinal = d % 90 === 0;
    g.save();
    g.translate(...at(x, y, card(d), r * 0.89));
    g.rotate(card(d));
    font(g, r * (cardinal ? 0.2 : 0.15));
    g.fillText(cardinal ? 'NESW'[d / 90] : String(d / 10), 0, 0);
    g.restore();
  }
  // Fixed index bars at the top and bottom, and the two small squares either side of the top.
  g.fillStyle = INK;
  g.fillRect(x - r * 0.04, y - r * 0.66, r * 0.08, r * 0.2);
  g.fillRect(x - r * 0.008, y + r * 0.46, r * 0.016, r * 0.2);
  for (const s of [-1, 1]) g.fillRect(...at(x, y, s * 26 * DEG, r * 0.6).map((c) => c - r * 0.025), r * 0.05, r * 0.05);
  // The aircraft: fuselage, wings and tailplane.
  g.beginPath();
  g.ellipse(x, y - r * 0.02, r * 0.06, r * 0.36, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.roundRect(x - r * 0.36, y - r * 0.12, r * 0.72, r * 0.11, r * 0.05);
  g.fill();
  g.beginPath();
  g.roundRect(x - r * 0.16, y + r * 0.22, r * 0.32, r * 0.07, r * 0.03);
  g.fill();
  for (const s of [-1, 1]) screw(g, x + s * r * 0.2, y + r * 0.12, r * 0.025);
}

/**
 * Wendehorizont Fl. 22427: a white horizon bar that banks (rad) and moves with pitch (rad) across a window with
 * straight sides, behind the fixed small aircraft; a scalloped black bezel with screws round the glass.
 */
export function lwHorizon(g, x, y, r, bank, pitch) {
  // Scalloped bezel.
  g.fillStyle = '#121314';
  g.beginPath();
  for (let k = 0; k <= 240; k += 1) {
    const a = (k / 240) * Math.PI * 2;
    const rr = r * (1.14 + 0.04 * Math.cos(a * 12));
    if (k) g.lineTo(...at(x, y, a, rr));
    else g.moveTo(...at(x, y, a, rr));
  }
  g.fill();
  g.fillStyle = '#26282a';
  g.beginPath();
  g.arc(x, y, r * 1.0, 0, Math.PI * 2);
  g.fill();
  for (let k = 0; k < 8; k += 1) screw(g, ...at(x, y, (k * 45 + 22.5) * DEG, r * 0.92), r * 0.035);
  // The window: the glass circle with straight sides.
  g.save();
  g.beginPath();
  g.arc(x, y, r * 0.84, 0, Math.PI * 2);
  g.clip();
  g.beginPath();
  g.rect(x - r * 0.68, y - r, r * 1.36, r * 2);
  g.clip();
  const shade = g.createLinearGradient(x, y - r * 0.84, x, y + r * 0.84);
  shade.addColorStop(0, '#5c5f62');
  shade.addColorStop(1, '#1c1e20');
  g.fillStyle = shade;
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.translate(x, y);
  g.rotate(-bank);
  const shift = Math.max(-r * 0.6, Math.min(r * 0.6, pitch * r * 2));
  g.fillStyle = INK;
  g.fillRect(-r * 0.8, shift - r * 0.025, r * 1.6, r * 0.05);
  g.restore();
  // The fixed small aircraft.
  g.fillStyle = INK;
  g.beginPath();
  g.arc(x, y - r * 0.01, r * 0.05, Math.PI, 0);
  g.fill();
  g.fillRect(x - r * 0.28, y, r * 0.56, r * 0.018);
  centred(g);
  font(g, r * 0.11);
  g.fillText('L', x - r * 0.76, y + r * 0.1);
  g.fillText('R', x + r * 0.76, y + r * 0.1);
}
