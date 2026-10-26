// Bf 110 engine gauges drawn after the product owner's photograph of a Bf 110 cockpit (D39): the small temperature
// gauges with coloured rings and the red rings under the engine instruments. The flying instruments follow the
// reference drawings (src/ui/lwFlightDials.js, D43). Angles are in radians, 0 straight up, clockwise.

import { DEG, at, font, centred, tick, lwFace, lwHand } from './lwStyle.js';

/**
 * A small engine gauge with a coloured ring round its bezel (coolant red, oil yellow, as photographed):
 *   { min, max, labels: [values], ring, value, text }
 */
export function ringGauge(g, x, y, r, o) {
  const sweep = 270 * DEG;
  const angle = (v) => -sweep / 2 + ((Math.max(o.min, Math.min(o.max, v)) - o.min) / (o.max - o.min)) * sweep;
  g.fillStyle = o.ring;
  g.beginPath();
  g.arc(x, y, r * 1.22, 0, Math.PI * 2);
  g.fill();
  lwFace(g, x, y, r);
  centred(g, '#e8d37a');
  const step = (o.max - o.min) / 10;
  for (let k = 0; k <= 10; k += 1) tick(g, x, y, r, angle(o.min + k * step), 0.95, k % 5 === 0 ? 0.76 : 0.86, k % 5 === 0 ? 1.8 : 1);
  font(g, r * 0.26, true);
  for (const v of o.labels) g.fillText(String(v), ...at(x, y, angle(v), r * 0.56));
  font(g, r * 0.2);
  g.fillText(o.text, x, y + r * 0.42);
  lwHand(g, x, y, r, angle(o.value), { length: 0.8, counterweight: false });
}

/** A red ring under a dial (the engine instruments' bezels in the photograph). */
export function redRing(g, x, y, r) {
  g.fillStyle = '#7d1f1a';
  g.beginPath();
  g.arc(x, y, r * 1.2, 0, Math.PI * 2);
  g.fill();
}

