// Drawing pieces for the Phase 2 instrument panel (canvas 2D), in the style of 1940 instruments: black faces
// with white markings, round dials with scales and needles, the black artificial horizon, the heading drum
// of the directional gyro and period compasses, the turn-and-slip indicator and indicator lamps. The exact
// period faces and panel layouts come with the 3D cockpits in Phase 7.

const FACE = '#141414';
export const RIM = '#3a3a36';
export const LUMINOUS = '#efe4c2'; // the cream of luminous paint
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

/**
 * Artificial horizon in the 1940 style: an all-black face, a white horizon bar that banks and moves with
 * pitch (rad), a fixed white miniature aircraft, and bank marks round the top.
 */
export function horizon(g, x, y, r, bank, pitch, title) {
  face(g, x, y, r);
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  for (const deg of [-60, -30, 0, 30, 60]) {
    const a = (deg * Math.PI) / 180;
    g.beginPath();
    g.moveTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92);
    g.lineTo(x + Math.sin(a) * r * 0.8, y - Math.cos(a) * r * 0.8);
    g.stroke();
  }
  g.save();
  g.beginPath();
  g.arc(x, y, r * 0.78, 0, Math.PI * 2);
  g.clip();
  g.translate(x, y);
  g.rotate(-bank);
  const shift = Math.max(-r * 0.7, Math.min(r * 0.7, pitch * r * 2.2));
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-r, shift);
  g.lineTo(r, shift);
  g.stroke();
  // Bank pointer on the horizon card.
  g.fillStyle = INK;
  g.beginPath();
  g.moveTo(0, -r * 0.76);
  g.lineTo(-r * 0.06, -r * 0.64);
  g.lineTo(r * 0.06, -r * 0.64);
  g.fill();
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(x - r * 0.45, y);
  g.lineTo(x - r * 0.12, y);
  g.moveTo(x + r * 0.12, y);
  g.lineTo(x + r * 0.45, y);
  g.stroke();
  g.beginPath();
  g.arc(x, y, r * 0.05, 0, Math.PI * 2);
  g.stroke();
  if (title) caption(g, x, y, r, title);
}

/**
 * Heading drum seen through a window in the face, as on the 1940 directional gyro and the period magnetic
 * compasses: the scale slides past a fixed vertical lubber line. Heading in degrees.
 */
export function headingDrum(g, x, y, r, heading, title) {
  face(g, x, y, r);
  const w = r * 1.5;
  const h = r * 0.55;
  g.save();
  g.beginPath();
  g.rect(x - w / 2, y - h / 2, w, h);
  g.clip();
  g.fillStyle = '#0a0a0a';
  g.fillRect(x - w / 2, y - h / 2, w, h);
  const perDeg = w / 70; // about 70 degrees of scale visible
  g.strokeStyle = INK;
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.round(r * 0.2)}px ui-sans-serif, Helvetica, sans-serif`;
  const first = Math.floor((heading - 40) / 5) * 5;
  for (let d = first; d <= heading + 40; d += 5) {
    const px = x + (d - heading) * perDeg;
    const deg = ((d % 360) + 360) % 360;
    const major = deg % 10 === 0;
    g.lineWidth = major ? 1.5 : 1;
    g.beginPath();
    g.moveTo(px, y + h / 2);
    g.lineTo(px, y + h / 2 - (major ? h * 0.3 : h * 0.18));
    g.stroke();
    if (deg % 30 === 0) {
      const text = deg % 90 === 0 ? 'NESW'[deg / 90] : String(deg / 10);
      g.fillText(text, px, y - h * 0.12);
    }
  }
  g.restore();
  g.strokeStyle = RIM;
  g.lineWidth = 2;
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x, y - h / 2 - 3);
  g.lineTo(x, y + h / 2 + 3);
  g.stroke();
  if (title) caption(g, x, y, r, title);
}

/**
 * Turn and slip indicator: the turn needle stands at 0 at twelve o'clock and swings left or right over
 * marks for rate 1, 2 and 3 turns (a rate-one turn is 3 degrees a second); the slip ball sits in its tube
 * below (sideways g, + right).
 */
export function turnAndSlip(g, x, y, r, turnRate, sideG, title) {
  face(g, x, y, r);
  const RATE_ONE = 3; // deg/s
  const perRate = (24 * Math.PI) / 180; // needle swing per rate
  const pivot = y;
  g.strokeStyle = INK;
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.round(r * 0.17)}px ui-sans-serif, Helvetica, sans-serif`;
  const reach = r * 0.95 - (pivot - y); // marks on a circle round the pivot, inside the face
  for (let k = -3; k <= 3; k += 1) {
    const a = k * perRate;
    const at = (d) => [x + Math.sin(a) * d, pivot - Math.cos(a) * d];
    g.lineWidth = k === 0 ? 3 : 2;
    g.beginPath();
    g.moveTo(...at(reach));
    g.lineTo(...at(reach - r * 0.14));
    g.stroke();
    g.fillText(String(Math.abs(k)), ...at(reach - r * 0.28));
  }
  g.font = `${Math.round(r * 0.15)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('L', x - r * 0.55, y + r * 0.3);
  g.fillText('R', x + r * 0.55, y + r * 0.3);
  const a = Math.max(-3.5, Math.min(3.5, turnRate / RATE_ONE)) * perRate;
  needle(g, x, pivot, r * 0.85, a, 3.5);
  const ty = y + r * 0.6;
  g.lineWidth = 1.5;
  g.strokeRect(x - r * 0.45, ty - r * 0.08, r * 0.9, r * 0.16);
  const ball = Math.max(-1, Math.min(1, -sideG / 0.25));
  g.beginPath();
  g.arc(x + ball * r * 0.36, ty, r * 0.07, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
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
