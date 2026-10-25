// RAF airspeed indicator, after a photograph of the instrument (D32): a single long needle that goes round
// twice. The outer ring is the first turn, 60 to 240 mph (numbered 6 to 24, 16 at the top); the inner ring
// the second, 240 to 400 mph (numbered 26 to 40, 36 at the top). Both rings share one scale of about
// 1.8 degrees per mph.

import { face, caption, LUMINOUS } from './dials.js';

const DEG_PER_MPH = 1.8;
const TOP = 160; // mph at twelve o'clock on the first turn (and 360 on the second)
const SLOWEST = 50; // mph: below this the needle rests on its stop

/** Needle angle (rad, 0 up, clockwise) for an airspeed in mph. */
export function rafAirspeedAngle(mph) {
  return ((Math.max(mph, SLOWEST) - TOP) * DEG_PER_MPH * Math.PI) / 180;
}

export function rafAirspeed(g, x, y, r, mph, title) {
  face(g, x, y, r);
  const at = (a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];
  g.strokeStyle = LUMINOUS;
  g.fillStyle = LUMINOUS;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // Outer ring: 60-240 mph, a mark every 10 mph, numbered every 20.
  g.font = `${Math.round(r * 0.2)}px ui-sans-serif, Helvetica, sans-serif`;
  for (let v = 60; v <= 240; v += 10) {
    const a = rafAirspeedAngle(v);
    const major = v % 20 === 0;
    g.lineWidth = major ? 2 : 1.2;
    g.beginPath();
    g.moveTo(...at(a, r * 0.95));
    g.lineTo(...at(a, r * (major ? 0.83 : 0.88)));
    g.stroke();
    if (major) g.fillText(String(v / 10), ...at(a, r * 0.71));
  }
  // Inner ring: 240-400 mph on a circle of its own, numbered inside it.
  const ring = r * 0.55;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x, y, ring, rafAirspeedAngle(240) - Math.PI / 2, rafAirspeedAngle(400) - Math.PI / 2);
  g.stroke();
  g.font = `${Math.round(r * 0.14)}px ui-sans-serif, Helvetica, sans-serif`;
  for (let v = 240; v <= 400; v += 10) {
    const a = rafAirspeedAngle(v);
    const major = v % 20 === 0;
    g.lineWidth = major ? 1.6 : 1;
    g.beginPath();
    g.moveTo(...at(a, ring));
    g.lineTo(...at(a, ring - r * (major ? 0.08 : 0.05)));
    g.stroke();
    if (major && v > 240) g.fillText(String(v / 10), ...at(a, ring - r * 0.17));
  }
  g.font = `bold ${Math.round(r * 0.13)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('M.P.H.', x, y + r * 0.2);
  // The needle: long and slim, with a short dark tail.
  g.save();
  g.translate(x, y);
  g.rotate(rafAirspeedAngle(mph));
  g.strokeStyle = '#2a2a28';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, r * 0.15);
  g.lineTo(0, 0);
  g.stroke();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 2.5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -r * 0.05);
  g.lineTo(0, -r * 0.9);
  g.stroke();
  g.restore();
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, r * 0.05, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}
