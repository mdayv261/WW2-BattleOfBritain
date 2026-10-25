// RAF engine instruments for the Phase 2 panel, after photographs of the real ones (D32).
//   Rev counter: large numerals 10-40 (hundreds of rpm), smaller 15, 25 and 35 between, a mark every 100 rpm,
//   and "HUNDREDS OF R.P.M." on the face. The photographed instrument runs to 50 over about 300 degrees; the
//   product owner set the range to 10-40, spread over the same sweep (10 at seven o'clock, 40 at five).

import { face, caption, LUMINOUS } from './dials.js';

const DEG_PER_HUNDRED = 10; // needle travel per 100 rpm: 3,000 rpm over 300 degrees
const TOP = 2500; // rpm at twelve o'clock
const LOW = 1000;
const HIGH = 4000;

/** Needle angle (rad, 0 up, clockwise) for an engine speed in rpm, held at the ends of the scale. */
export function rafRpmAngle(rpm) {
  const v = Math.min(HIGH, Math.max(LOW * 0.95, rpm));
  return (((v - TOP) / 100) * DEG_PER_HUNDRED * Math.PI) / 180;
}

export function rafTachometer(g, x, y, r, rpm, title) {
  face(g, x, y, r);
  const at = (a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];
  g.strokeStyle = LUMINOUS;
  g.fillStyle = LUMINOUS;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let v = LOW; v <= HIGH; v += 100) {
    const a = rafRpmAngle(v);
    const thousand = v % 1000 === 0;
    const half = v % 500 === 0;
    g.lineWidth = thousand ? 2.5 : half ? 1.8 : 1;
    g.beginPath();
    g.moveTo(...at(a, r * 0.95));
    g.lineTo(...at(a, r * (thousand ? 0.8 : half ? 0.84 : 0.88)));
    g.stroke();
    if (thousand) {
      g.font = `${Math.round(r * 0.24)}px ui-sans-serif, Helvetica, sans-serif`;
      g.fillText(String(v / 100), ...at(a, r * 0.64));
    } else if (half) {
      g.font = `${Math.round(r * 0.13)}px ui-sans-serif, Helvetica, sans-serif`;
      g.fillText(String(v / 100), ...at(a, r * 0.68));
    }
  }
  g.font = `${Math.round(r * 0.08)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('HUNDREDS OF', x, y - r * 0.38);
  g.font = `bold ${Math.round(r * 0.2)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('R.P.M.', x, y - r * 0.22);
  g.save();
  g.translate(x, y);
  g.rotate(rafRpmAngle(rpm));
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 2.5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, r * 0.1);
  g.lineTo(0, -r * 0.86);
  g.stroke();
  g.restore();
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, r * 0.07, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}
