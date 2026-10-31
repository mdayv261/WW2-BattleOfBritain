// RAF blind-flying instruments in the style of a Spitfire's original instruments (product owner's photograph,
// D32): the artificial horizon with its shaped window and lower bank scale, the climb indicator lettered
// CLIMB and DESCENT, and the two-needle turn and slip indicator (slip needle above, turn needle below).

import { face, caption } from './dials.js';
import { C } from './panelParts.js';

const LUMINOUS = C.mark; // the pale yellow luminous markings of the reference picture (D86)

const GREEN = C.mark; // all the markings pale yellow, as the reference picture (D86)
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
      g.fillStyle = LUMINOUS;
      font(g, r * 0.22, true); // every figure the same size, as the reference picture (D86)
      g.fillText(String(Math.abs(k)), ...at(x, y, a, r * 0.64));
    }
  }
  g.fillStyle = LUMINOUS;
  font(g, r * 0.12, true);
  font(g, r * 0.14, true);
  g.fillText('CLIMB', x + r * 0.1, y - r * 0.3);
  g.fillText('DESCENT', x + r * 0.1, y + r * 0.3);
  font(g, r * 0.065);
  g.fillText('THOUSANDS', x + r * 0.1, y - r * 0.17);
  g.fillText('FEET MIN.', x + r * 0.1, y + r * 0.17);
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
 * Turn and slip indicator, as the reference picture (D86): the slip needle points up over a scale numbered 20 10 5 | 5 10
 * 20, the turn needle down over one numbered 4 3 2 1 | 1 2 3 4 (rate-one marks, a rate one turn being 3 degrees a
 * second); needles with diamond tips, a grey centre, SIDE SLIP above and a large L and R lettered TURN. The lettering,
 * scales and needles are the altimeter's yellow (product owner, D86).
 * `turnRate` in deg/s (+ right), `sideG` (+ right).
 */
export function rafTurnSlip(g, x, y, r, turnRate, sideG, title) {
  face(g, x, y, r);
  const RATE_ONE = 3; // deg/s
  const perRate = 10 * DEG; // turn needle swing per rate
  const perSlip = 2.2 * DEG; // slip needle swing per unit of the slip scale
  centred(g);
  const arc = (from, to, rad) => {
    g.strokeStyle = LUMINOUS;
    g.lineWidth = Math.max(1, r * 0.018);
    g.beginPath();
    g.arc(x, y, rad, from - Math.PI / 2, to - Math.PI / 2);
    g.stroke();
    g.fillStyle = LUMINOUS;
    for (const end of [from, to]) {
      g.beginPath();
      g.arc(...at(x, y, end, rad), r * 0.035, 0, Math.PI * 2);
      g.fill();
    }
  };
  // Upper (slip) scale.
  const slipAt = (k) => k * perSlip;
  arc(slipAt(-20), slipAt(20), r * 0.72);
  for (const k of [-20, -10, -5, 0, 5, 10, 20]) {
    g.strokeStyle = LUMINOUS;
    g.lineWidth = Math.max(1, r * 0.02);
    g.beginPath();
    g.moveTo(...at(x, y, slipAt(k), r * 0.72));
    g.lineTo(...at(x, y, slipAt(k), r * 0.66));
    g.stroke();
    if (k) {
      g.fillStyle = LUMINOUS;
      font(g, r * 0.1, true);
      g.fillText(String(Math.abs(k)), ...at(x, y, slipAt(k), r * 0.82));
    }
  }
  for (let k = -20; k <= 20; k += 2.5) {
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(...at(x, y, slipAt(k), r * 0.72));
    g.lineTo(...at(x, y, slipAt(k), r * 0.76));
    g.stroke();
  }
  // Lower (turn) scale: a right turn swings the lower needle's tip to the right.
  const turnAt = (k) => Math.PI - k * perRate;
  arc(turnAt(4.5), turnAt(-4.5), r * 0.72);
  for (let k = -4; k <= 4; k += 1) {
    g.strokeStyle = LUMINOUS;
    g.lineWidth = Math.max(1, r * 0.02);
    g.beginPath();
    g.moveTo(...at(x, y, turnAt(k), r * 0.72));
    g.lineTo(...at(x, y, turnAt(k), r * 0.65));
    g.stroke();
    if (k) {
      g.fillStyle = LUMINOUS;
      font(g, r * 0.1, true);
      g.fillText(String(Math.abs(k)), ...at(x, y, turnAt(k), r * 0.83));
    }
  }
  // Fixed indices at the top and bottom centre.
  g.fillStyle = LUMINOUS;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(x, y + s * r * 0.66);
    g.lineTo(x - r * 0.04, y + s * r * 0.76);
    g.lineTo(x + r * 0.04, y + s * r * 0.76);
    g.fill();
  }
  // Lettering.
  g.fillStyle = LUMINOUS;
  font(g, r * 0.075, true);
  for (const s of [-1, 1]) {
    g.fillText('SIDE', x + s * r * 0.62, y - r * 0.38);
    g.fillText('SLIP', x + s * r * 0.62, y - r * 0.29);
  }
  g.fillStyle = LUMINOUS;
  font(g, r * 0.2, true);
  g.fillText('L', x - r * 0.62, y);
  g.fillText('R', x + r * 0.62, y);
  for (const s of [-1, 1]) {
    font(g, r * 0.14, true);
    g.fillStyle = LUMINOUS;
    g.fillText('T', x + s * r * 0.62 - r * 0.1, y + r * 0.27);
    font(g, r * 0.08, true);
    g.fillStyle = LUMINOUS;
    g.fillText('URN', x + s * r * 0.62 + r * 0.04, y + r * 0.29);
  }
  // The grey centre and the needles: white bars with yellow diamonds near the tips.
  g.fillStyle = '#3c3c3a';
  g.beginPath();
  g.arc(x, y, r * 0.24, 0, Math.PI * 2);
  g.fill();
  const needle = (angle) => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.fillStyle = LUMINOUS; // yellow, as the lettering (product owner)
    g.fillRect(-r * 0.035, -r * 0.56, r * 0.07, r * 0.42);
    g.fillStyle = LUMINOUS;
    g.beginPath();
    g.moveTo(0, -r * 0.7);
    g.lineTo(-r * 0.055, -r * 0.6);
    g.lineTo(0, -r * 0.5);
    g.lineTo(r * 0.055, -r * 0.6);
    g.closePath();
    g.fill();
    g.fillStyle = '#151515';
    g.beginPath();
    g.moveTo(0, -r * 0.66);
    g.lineTo(-r * 0.025, -r * 0.6);
    g.lineTo(0, -r * 0.54);
    g.lineTo(r * 0.025, -r * 0.6);
    g.closePath();
    g.fill();
    g.restore();
  };
  needle(Math.max(-0.6, Math.min(0.6, (-sideG / 0.25) * 0.3)));
  needle(turnAt(Math.max(-4.5, Math.min(4.5, turnRate / RATE_ONE))));
  if (title) caption(g, x, y, r, title);
}
