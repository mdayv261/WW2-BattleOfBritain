// The pilot's speed card (D91): a white card on the panel giving the stalling speeds with the flaps up and down, the
// take-off speed, the best rate-of-climb speed and the final approach speed, as the airspeed indicator reads them, in
// the side's units. RAF: left of the GM 2 sight; Bf 109: right of the manifold pressure gauge. The figures are aircraft
// data (`pilotCard` in src/aircraft/*.js): the period sources' where found, the product owner's otherwise.

import { UNIT } from '../core/constants.js';

const INK = '#141414';
const PAPER = '#eceae2';

/**
 * The card's lines for an aircraft (null without a card): { title, unit, entries: [{ label, value }] }, the values whole
 * figures in mph (RAF) or km/h (Luftwaffe). The Luftwaffe labels give the flap angles from the aircraft's data.
 */
export function pilotCard(ac, raf) {
  const c = ac.pilotCard;
  if (!c) return null;
  const read = (ms) => Math.round(ms / (raf ? UNIT.MPH : UNIT.KMH));
  const travel = Math.round(ac.controls.flapTravel / UNIT.DEG);
  const takeoffFlap = Math.round((ac.controls.flapTravel * ac.controls.flapTakeoff) / UNIT.DEG);
  const labels = raf
    ? ['Stall, flaps up', 'Stall, flaps down', 'Take-off', 'Best ROC', 'Final approach']
    : ['Stall, no flap', `Stall, flap ${travel}°`, `Take-off, flap ${takeoffFlap}°`, 'Best ROC', 'Final approach'];
  const values = [c.stallClean, c.stallFlaps, c.takeoff, c.climb, c.approach].map(read);
  return {
    title: 'SPEEDS',
    unit: raf ? 'M.P.H. I.A.S.' : 'km/h',
    entries: labels.map((label, i) => ({ label, value: String(values[i]) })),
  };
}

/** Draws the card in the box { x, y, w, h } (canvas px, top left). `card` is pilotCard(). */
export function speedCard(g, { x, y, w, h }, card) {
  if (!card) return;
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x + w * 0.04, y + w * 0.05, w, h);
  g.fillStyle = PAPER;
  g.fillRect(x, y, w, h);
  g.strokeStyle = INK;
  g.lineWidth = Math.max(1, w * 0.02);
  g.strokeRect(x + w * 0.05, y + w * 0.05, w * 0.9, h - w * 0.1);
  // Rows: the title and the unit, then each entry's label and value.
  const rows = 2 + card.entries.length * 2;
  const step = (h - w * 0.2) / rows;
  let row = 0;
  const line = (text, bold, scale = 1) => {
    const cy = y + w * 0.1 + step * (row + 0.5);
    row += 1;
    fit(g, text, x + w / 2, cy, w * 0.82, step * 0.78 * scale, bold);
  };
  line(card.title, true);
  line(card.unit, false, 0.8);
  for (const { label, value } of card.entries) {
    line(label, false, 0.85);
    line(value, true);
  }
}

/** Lettering centred at (cx, cy), as large as fits `width` up to `size` px. */
function fit(g, text, cx, cy, width, size, bold) {
  const font = (px) => `${bold ? 'bold ' : ''}${Math.max(4, px)}px ui-sans-serif, Helvetica, Arial, sans-serif`;
  g.font = font(size);
  const measured = g.measureText?.(text)?.width ?? 0;
  const px = measured > width ? (size * width) / measured : size;
  g.font = font(px);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, cx, cy);
}
