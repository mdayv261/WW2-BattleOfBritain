// RAF rev counter, drawn after the product owner's reference picture of a Spitfire I panel (D86): 1,000 to 5,000 rpm,
// figures 10-50 (hundreds of rpm) large every thousand and smaller every five hundred, a mark every 100 rpm, 10 at
// about seven o'clock, 30 at the top and 50 at five; "R.P.M." on the face, pale yellow luminous markings and a long
// cream needle. The picture's scale is not evenly spread: wider round the top than at the ends (read off it, as the
// table below). It replaces the 10-40 face of D32.

import { caption } from './dials.js';
import { C, tableAngle, polar, text } from './panelParts.js';

/** The scale, read off the picture: [rpm, degrees from twelve o'clock, clockwise]. */
export const RPM_SCALE = [[1000, -158], [1500, -132], [2000, -94], [2500, -47], [3000, 0], [3500, 47], [4000, 94],
  [4500, 132], [5000, 158]];

/** Needle angle (rad, 0 up, clockwise) for an engine speed in rpm, held at the ends of the scale. */
export const rafRpmAngle = (rpm) => tableAngle(RPM_SCALE, rpm);

export function rafTachometer(g, x, y, r, rpm, title) {
  g.fillStyle = C.face;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = C.mark;
  for (let v = 1000; v <= 5000; v += 100) {
    const a = rafRpmAngle(v);
    const thousand = v % 1000 === 0;
    const half = v % 500 === 0;
    g.lineWidth = Math.max(1, r * (thousand ? 0.04 : half ? 0.03 : 0.015));
    g.beginPath();
    g.moveTo(...polar(x, y, a, r * 0.95));
    g.lineTo(...polar(x, y, a, r * (thousand || half ? 0.78 : 0.87)));
    g.stroke();
    if (thousand) text(g, String(v / 100), ...polar(x, y, a, r * 0.6), r * 0.22, C.mark);
    else if (half) text(g, String(v / 100), ...polar(x, y, a, r * 0.64), r * 0.12, C.mark);
  }
  text(g, 'HUNDREDS', x, y - r * 0.32, r * 0.06, C.mark);
  text(g, 'R.P.M.', x, y - r * 0.18, r * 0.2, C.mark, { bold: true });
  g.save();
  g.translate(x, y);
  g.rotate(rafRpmAngle(rpm));
  g.fillStyle = '#f4ecd2';
  g.beginPath();
  g.moveTo(-r * 0.035, r * 0.1);
  g.lineTo(-r * 0.025, -r * 0.8);
  g.lineTo(0, -r * 0.88);
  g.lineTo(r * 0.025, -r * 0.8);
  g.lineTo(r * 0.035, r * 0.1);
  g.closePath();
  g.fill();
  g.restore();
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, r * 0.06, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}
