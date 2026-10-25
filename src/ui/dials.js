// Drawing pieces for the Phase 2 instrument panel (canvas 2D): round dials with scales and needles, the
// artificial horizon, a compass card, the turn-and-slip indicator and indicator lamps. Period faces and
// layouts come with the 3D cockpits in Phase 7.

const FACE = '#141414';
const RIM = '#3a3a36';
const INK = '#ece8dc';
const NEEDLE = '#f4f0e2';

/** Dial background with a title. */
export function face(g, x, y, r, title) {
  g.fillStyle = RIM;
  g.beginPath();
  g.arc(x, y, r + 3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = FACE;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}

/** Title under a dial. */
export function caption(g, x, y, r, title) {
  g.fillStyle = INK;
  g.font = `${Math.max(9, Math.round(r * 0.2))}px ui-sans-serif, Helvetica, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(title, x, y + r + 11);
}

/** A needle from the centre at `angle` (rad, 0 = straight up, clockwise positive). */
export function needle(g, x, y, length, angle, width = 3, colour = NEEDLE) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.strokeStyle = colour;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, length * 0.15);
  g.lineTo(0, -length);
  g.stroke();
  g.restore();
}

/**
 * A round scale from `min` to `max` over the arc from `start` to `end` (rad, 0 up, clockwise), with
 * major ticks labelled every `major` and minor ticks every `minor`. Returns the value-to-angle function.
 */
export function scale(g, x, y, r, { min, max, start, end, major, minor, label = (v) => String(v) }) {
  const angle = (v) => start + ((Math.min(Math.max(v, min), max) - min) / (max - min)) * (end - start);
  g.strokeStyle = INK;
  g.fillStyle = INK;
  g.font = `${Math.round(r * 0.17)}px ui-sans-serif, Helvetica, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const tick = (v, len, width) => {
    const a = angle(v);
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92);
    g.lineTo(x + Math.sin(a) * r * (0.92 - len), y - Math.cos(a) * r * (0.92 - len));
    g.stroke();
  };
  for (let v = min; v <= max + 1e-9; v += minor) tick(v, 0.08, 1);
  for (let v = min; v <= max + 1e-9; v += major) {
    tick(v, 0.16, 2);
    const a = angle(v);
    g.fillText(label(v), x + Math.sin(a) * r * 0.62, y - Math.cos(a) * r * 0.62);
  }
  return angle;
}

/** Artificial horizon: sky and ground split by a bar that banks and moves with pitch (rad). */
export function horizon(g, x, y, r, bank, pitch, title) {
  face(g, x, y, r);
  g.save();
  g.beginPath();
  g.arc(x, y, r * 0.95, 0, Math.PI * 2);
  g.clip();
  g.translate(x, y);
  g.rotate(-bank);
  const shift = Math.max(-r, Math.min(r, pitch * r * 2.2));
  g.fillStyle = '#3d6f9c';
  g.fillRect(-2 * r, -2 * r + shift, 4 * r, 2 * r);
  g.fillStyle = '#6b4a2b';
  g.fillRect(-2 * r, shift, 4 * r, 2 * r);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-r, shift);
  g.lineTo(r, shift);
  g.stroke();
  g.restore();
  g.strokeStyle = '#e8b030';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - r * 0.5, y);
  g.lineTo(x - r * 0.15, y);
  g.lineTo(x, y + r * 0.1);
  g.lineTo(x + r * 0.15, y);
  g.lineTo(x + r * 0.5, y);
  g.stroke();
  if (title) caption(g, x, y, r, title);
}

/** Compass card turning under a fixed lubber line; heading in degrees. */
export function compassCard(g, x, y, r, heading, title) {
  face(g, x, y, r);
  g.save();
  g.translate(x, y);
  g.rotate((-heading * Math.PI) / 180);
  g.fillStyle = INK;
  g.strokeStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.round(r * 0.2)}px ui-sans-serif, Helvetica, sans-serif`;
  for (let d = 0; d < 360; d += 10) {
    const a = (d * Math.PI) / 180;
    const len = d % 30 === 0 ? 0.14 : 0.07;
    g.lineWidth = d % 30 === 0 ? 2 : 1;
    g.beginPath();
    g.moveTo(Math.sin(a) * r * 0.9, -Math.cos(a) * r * 0.9);
    g.lineTo(Math.sin(a) * r * (0.9 - len), -Math.cos(a) * r * (0.9 - len));
    g.stroke();
    if (d % 90 === 0) g.fillText('NESW'[d / 90], Math.sin(a) * r * 0.6, -Math.cos(a) * r * 0.6);
    else if (d % 30 === 0) g.fillText(String(d / 10), Math.sin(a) * r * 0.62, -Math.cos(a) * r * 0.62);
  }
  g.restore();
  g.fillStyle = '#e8b030';
  g.beginPath();
  g.moveTo(x, y - r * 0.98);
  g.lineTo(x - r * 0.08, y - r * 0.8);
  g.lineTo(x + r * 0.08, y - r * 0.8);
  g.fill();
  if (title) caption(g, x, y, r, title);
}

/** Turn needle (rate of turn, full scale at `fullRate`) and slip ball (sideways g, + right). */
export function turnAndSlip(g, x, y, r, turnRate, fullRate, sideG, title) {
  face(g, x, y, r, title);
  const a = Math.max(-1, Math.min(1, turnRate / fullRate)) * 0.8;
  needle(g, x, y - r * 0.05, r * 0.8, a, 4);
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  const ty = y + r * 0.62;
  g.strokeRect(x - r * 0.5, ty - r * 0.09, r, r * 0.18);
  const ball = Math.max(-1, Math.min(1, -sideG / 0.25));
  g.fillStyle = INK;
  g.beginPath();
  g.arc(x + ball * r * 0.4, ty, r * 0.08, 0, Math.PI * 2);
  g.fill();
}

/** A round lamp: lit colour or dark. */
export function lamp(g, x, y, r, colour, lit, text) {
  g.fillStyle = lit ? colour : '#2a2a28';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  if (text) label(g, x, y + r * 2, r * 3.2, text);
}

/** Small caption. */
export function label(g, x, y, r, text) {
  g.fillStyle = INK;
  g.font = `${Math.round(r * 0.16)}px ui-sans-serif, Helvetica, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, x, y);
}
