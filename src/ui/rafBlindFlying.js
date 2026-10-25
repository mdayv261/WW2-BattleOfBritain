// RAF blind-flying instruments in the style of a Spitfire's original instruments (product owner's photograph,
// D32): the artificial horizon with its shaped window and lower bank scale, the climb indicator lettered
// CLIMB and DESCENT, and the two-needle turn and slip indicator (slip needle above, turn needle below).

import { face, caption, LUMINOUS } from './dials.js';

const GREEN = '#8fd18a'; // the green luminous markings
const DEG = Math.PI / 180;

const at = (x, y, a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];
const font = (g, size, bold = false) => {
  g.font = `${bold ? 'bold ' : ''}${Math.max(7, Math.round(size))}px ui-sans-serif, Helvetica, sans-serif`;
};
const centred = (g) => {
  g.textAlign = 'center';
  g.textBaseline = 'middle';
};

/**
 * Artificial horizon: a white horizon bar that banks and moves with pitch behind a shaped window (two
 * shoulders and a dome over the centre), and a bank scale round the bottom (marked 6 3 . 3 6, tens of
 * degrees) with a pointer that turns with the bank.
 */
export function rafHorizon(g, x, y, r, bank, pitch, title) {
  face(g, x, y, r);
  const inner = r * 0.82;
  // The window: everything inside the inner circle, less the mask above the shoulders.
  g.save();
  g.beginPath();
  g.arc(x, y, inner, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = '#1b1b19';
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.translate(x, y);
  g.rotate(-bank);
  const shift = Math.max(-r * 0.6, Math.min(r * 0.6, pitch * r * 2.2));
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-r * 0.62, shift);
  g.lineTo(-r * 0.08, shift);
  g.moveTo(r * 0.08, shift);
  g.lineTo(r * 0.62, shift);
  g.stroke();
  g.restore();
  // Mask over the top of the window, with a dome cut out over the centre.
  g.save();
  g.beginPath();
  g.arc(x, y, inner + 1, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = '#121211';
  g.beginPath();
  g.moveTo(x - r, y - r);
  g.lineTo(x + r, y - r);
  g.lineTo(x + r, y - r * 0.32);
  g.quadraticCurveTo(x + r * 0.45, y - r * 0.32, x + r * 0.3, y - r * 0.5);
  g.arc(x, y - r * 0.32, r * 0.34, -Math.PI * 0.12, -Math.PI * 0.88, true);
  g.quadraticCurveTo(x - r * 0.45, y - r * 0.32, x - r, y - r * 0.32);
  g.closePath();
  g.fill();
  g.restore();
  // Fixed centre: the small aircraft's pivot.
  g.fillStyle = LUMINOUS;
  g.beginPath();
  g.arc(x, y, r * 0.04, 0, Math.PI * 2);
  g.fill();
  // Bank scale round the bottom, and its pointer.
  g.strokeStyle = LUMINOUS;
  g.fillStyle = LUMINOUS;
  centred(g);
  font(g, r * 0.15);
  for (const d of [-60, -30, 0, 30, 60]) {
    const a = Math.PI + d * DEG;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(...at(x, y, a, r * 0.95));
    g.lineTo(...at(x, y, a, r * 0.84));
    g.stroke();
    if (d) g.fillText(String(Math.abs(d) / 10), ...at(x, y, a, r * 0.68));
  }
  g.fillStyle = '#e8a050';
  const p = Math.PI - bank; // on the horizon card, so it turns with the bar
  const tip = at(x, y, p, r * 0.8);
  const left = at(x, y, p - 0.07, r * 0.66);
  const right = at(x, y, p + 0.07, r * 0.66);
  g.beginPath();
  g.moveTo(...tip);
  g.lineTo(...left);
  g.lineTo(...right);
  g.fill();
  if (title) caption(g, x, y, r, title);
}

/**
 * Climb indicator, 0 at nine o'clock: climb clockwise above, descent below, to 4,000 ft/min each way. White
 * 0, 2 and 4, smaller green 1 and 3, lettered CLIMB above the centre and DESCENT below. `climb` in ft/min.
 */
export function rafClimb(g, x, y, r, climb, title) {
  face(g, x, y, r);
  const span = Math.PI * 0.85; // from zero to 4,000 ft/min either way
  const angle = (k) => -Math.PI / 2 + (Math.max(-4, Math.min(4, k)) / 4) * span;
  centred(g);
  for (let k = -4; k <= 4; k += 0.5) {
    const a = angle(k);
    const whole = Number.isInteger(k);
    g.strokeStyle = whole && k % 2 === 0 ? LUMINOUS : GREEN;
    g.lineWidth = whole ? 2 : 1;
    g.beginPath();
    g.moveTo(...at(x, y, a, r * 0.95));
    g.lineTo(...at(x, y, a, r * (whole ? 0.8 : 0.87)));
    g.stroke();
    if (whole) {
      const even = k % 2 === 0;
      g.fillStyle = even ? LUMINOUS : GREEN;
      font(g, r * (even ? 0.22 : 0.14), even);
      g.fillText(String(Math.abs(k)), ...at(x, y, a, r * 0.64));
    }
  }
  g.fillStyle = LUMINOUS;
  font(g, r * 0.12, true);
  g.fillText('CLIMB', x + r * 0.08, y - r * 0.17);
  g.fillText('DESCENT', x + r * 0.08, y + r * 0.17);
  font(g, r * 0.07);
  g.fillText('1000 FT/MIN', x + r * 0.08, y + r * 0.42);
  g.save();
  g.translate(x, y);
  g.rotate(angle(climb / 1000));
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, r * 0.12);
  g.lineTo(0, -r * 0.82);
  g.stroke();
  g.restore();
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, r * 0.06, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}

/**
 * Turn and slip indicator of the period two-needle kind: the slip needle points up over a green scale
 * lettered SIDE SLIP; the turn needle points down over a green scale lettered TURN, marked 2 and 4 each side
 * (rate-one marks between). A large L and R on the face. `turnRate` in deg/s (+ right), `sideG` (+ right).
 */
export function rafTurnSlip(g, x, y, r, turnRate, sideG, title) {
  face(g, x, y, r);
  const RATE_ONE = 3; // deg/s
  const perRate = 11 * DEG; // turn needle swing per rate
  centred(g);
  // Lower (turn) scale: marks for rates 1 to 4 each side, numbered 2 and 4.
  for (let k = -4; k <= 4; k += 1) {
    const a = Math.PI - k * perRate; // a right turn swings the lower needle's tip to the right
    g.strokeStyle = k === 0 ? LUMINOUS : GREEN;
    g.lineWidth = k % 2 === 0 ? 2 : 1.2;
    g.beginPath();
    g.moveTo(...at(x, y, a, r * 0.92));
    g.lineTo(...at(x, y, a, r * (k % 2 === 0 ? 0.8 : 0.85)));
    g.stroke();
    if (k && k % 2 === 0) {
      g.fillStyle = LUMINOUS;
      font(g, r * 0.12);
      g.fillText(String(Math.abs(k)), ...at(x, y, a, r * 0.98 + 2));
    }
  }
  // Upper (slip) scale.
  for (let k = -3; k <= 3; k += 1) {
    const a = k * 10 * DEG;
    g.strokeStyle = k === 0 ? LUMINOUS : GREEN;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(...at(x, y, a, r * 0.92));
    g.lineTo(...at(x, y, a, r * 0.84));
    g.stroke();
  }
  g.fillStyle = GREEN;
  font(g, r * 0.09, true);
  for (const s of [-1, 1]) {
    g.fillText('SIDE', x + s * r * 0.48, y - r * 0.5);
    g.fillText('SLIP', x + s * r * 0.48, y - r * 0.39);
    g.fillText('TURN', x + s * r * 0.56, y + r * 0.5);
  }
  g.fillStyle = LUMINOUS;
  font(g, r * 0.24, true);
  g.fillText('L', x - r * 0.55, y + r * 0.02);
  g.fillText('R', x + r * 0.55, y + r * 0.02);
  // Triangular indices at top and bottom centre.
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(x, y + s * r * 0.8);
    g.lineTo(x - r * 0.05, y + s * r * 0.92);
    g.lineTo(x + r * 0.05, y + s * r * 0.92);
    g.fill();
  }
  // Needles: slip up, turn down.
  const needle = (angle, length) => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.fillStyle = LUMINOUS;
    g.beginPath();
    g.moveTo(-r * 0.03, 0);
    g.lineTo(0, -length);
    g.lineTo(r * 0.03, 0);
    g.closePath();
    g.fill();
    g.restore();
  };
  needle(Math.max(-0.5, Math.min(0.5, -sideG / 0.25 * 0.3)), r * 0.78);
  needle(Math.PI - Math.max(-4.5, Math.min(4.5, turnRate / RATE_ONE)) * perRate, r * 0.78);
  g.fillStyle = '#1b1b19';
  g.beginPath();
  g.arc(x, y, r * 0.16, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}
