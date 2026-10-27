// The undercarriage and flap displays shared by the panels (D44, D47): not period instruments, but the product owner's
// choice for every aircraft because they are clearer.
//   Undercarriage: the UP/DOWN lever knob on the left, showing the selected position, and three lamps in a row along the
//   bottom (left, right and tail wheel), green with the undercarriage down and locked, red with it up and locked, dark
//   while it moves.
//   Flaps: the upright position indicator, up (0°) at the top and fully down at the bottom, with the take-off and
//   landing settings marked.
//   Elevator trim (product owner, D74): an upright scale from 15° nose up at the top to 15° nose down at the bottom,
//   graduated every degree, 0 at neutral, with a pointer at the present setting.

import { lamp, label, flapIndicatorVertical } from './dials.js';

/** The undercarriage lamps: 'green' down and locked, 'red' up and locked, 'off' while it moves. */
export function gearLampState(v) {
  if (v.gearDown) return 'green';
  return v.gearUp ? 'red' : 'off';
}

function plate(g, { x, y, w, h }, r) {
  g.fillStyle = '#121314';
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = '#8a8270';
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.beginPath();
    g.arc(x + sx * (w / 2 - r * 0.12), y + sy * (h / 2 - r * 0.12), r * 0.05, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * The undercarriage display on its plate. `box` is { x, y, w, h } in canvas pixels; r the panel's dial radius; `up` and
 * `down` the lever's position words (the Luftwaffe panels: OBEN and UNTEN, D66).
 */
export function undercarriageDisplay(g, box, r, v, title, { up = 'UP', down = 'DOWN' } = {}) {
  const { x, y, w, h } = box;
  plate(g, box, r);
  label(g, x + w * 0.12, y - h * 0.36, r * 0.7, title);
  // Lever: a slot on the left, the knob at UP or DOWN.
  const sx = x - w * 0.3;
  const top = y - h * 0.22;
  const bottom = y + h * 0.16;
  g.fillStyle = '#050505';
  g.fillRect(sx - w * 0.05, top, w * 0.1, bottom - top);
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.max(6, Math.round(r * 0.17))}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText(up, sx + w * 0.12, top + h * 0.02);
  g.fillText(down, sx + w * 0.12, bottom - h * 0.02);
  g.fillStyle = '#d8382c';
  g.beginPath();
  g.arc(sx, v.gearSelected ? bottom : top, r * 0.17, 0, Math.PI * 2);
  g.fill();
  // Three lamps along the base.
  const state = gearLampState(v);
  const colour = { green: '#3fbf4a', red: '#d8402e', off: '#2a2a28' }[state];
  for (const k of [-1, 0, 1]) lamp(g, x + k * w * 0.28, y + h * 0.36, r * 0.12, colour, state !== 'off');
}

/** The flap position display on its plate. */
export function flapDisplay(g, box, r, v, title) {
  const { x, y, w, h } = box;
  plate(g, box, r);
  label(g, x, y - h * 0.4, r * 0.8, title);
  flapIndicatorVertical(g, x + w * 0.14, y + h * 0.08, h * 0.64, v, {
    up: '0°', down: `${Math.round(v.flapTravel)}°`, takeoff: 'TAKEOFF', landing: 'LANDING',
  });
}

/** The elevator trim scale's reach each way, degrees: a display scale for the full trim range (D74), not a measured angle. */
export const TRIM_SCALE = 15;

/** The words on the trim display (product owner, D74). */
export const TRIM_WORDS = { title: 'ELEVATOR TRIM', up: 'NOSE UP', down: 'NOSE DOWN' };

/**
 * Where the trim display's parts go in its plate `box` ({ x, y, w, h }) for a dial radius r: the font size, the words
 * on each line (split onto lines where the plate is narrow), the scale's spine and its top (+15) and bottom (-15).
 */
export function trimLayout({ x, y, w, h }, r) {
  const narrow = w < r * 1.6;
  const lines = (text) => (narrow ? text.split(' ') : [text]);
  const font = Math.max(5, Math.min(r * 0.17, w * (narrow ? 0.15 : 0.11)));
  const line = font * 1.25;
  const head = [...lines(TRIM_WORDS.title), ...lines(TRIM_WORDS.up)];
  const foot = lines(TRIM_WORDS.down);
  const top = y - h / 2 + line * (head.length + 0.6);
  const bottom = y + h / 2 - line * (foot.length + 0.4);
  return { font, line, title: lines(TRIM_WORDS.title), up: lines(TRIM_WORDS.up), down: foot, spine: x + w * 0.08, top, bottom };
}

/** The height on the scale (canvas y) of a trim setting in degrees, + nose up (at the top). */
export function trimY(layout, degrees) {
  const f = (TRIM_SCALE - Math.max(-TRIM_SCALE, Math.min(TRIM_SCALE, degrees))) / (2 * TRIM_SCALE);
  return layout.top + f * (layout.bottom - layout.top);
}

/** The elevator trim display on its plate; v.trimDegrees is the present setting (+ nose up). */
export function trimDisplay(g, box, r, v) {
  const { x, y, w, h } = box;
  plate(g, box, r);
  const L = trimLayout(box, r);
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.round(L.font)}px ui-sans-serif, Helvetica, sans-serif`;
  let ty = y - h / 2 + L.line * 0.8;
  for (const t of L.title) {
    g.fillText(t, x, ty);
    ty += L.line;
  }
  g.fillStyle = '#9fd38a';
  for (const t of L.up) {
    g.fillText(t, x, ty);
    ty += L.line;
  }
  g.fillStyle = '#e8c46a';
  L.down.forEach((t, i) => g.fillText(t, x, y + h / 2 - L.line * (L.down.length - i - 0.3)));
  // The scale: a spine, a tick every degree, longer ones with figures every 5°, a bold 0.
  g.strokeStyle = '#e9e6dc';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(L.spine, L.top);
  g.lineTo(L.spine, L.bottom);
  g.stroke();
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'right';
  for (let d = -TRIM_SCALE; d <= TRIM_SCALE; d += 1) {
    const ty2 = trimY(L, d);
    const major = d % 5 === 0;
    g.lineWidth = d === 0 ? 2 : 1;
    g.beginPath();
    g.moveTo(L.spine, ty2);
    g.lineTo(L.spine - w * (d === 0 ? 0.3 : major ? 0.22 : 0.11), ty2);
    g.stroke();
    if (major) {
      g.font = `${d === 0 ? 'bold ' : ''}${Math.round(L.font * (d === 0 ? 1.05 : 0.85))}px ui-sans-serif, Helvetica, sans-serif`;
      g.fillText(String(Math.abs(d)), L.spine - w * 0.34, ty2);
    }
  }
  // The pointer, on the right of the spine.
  const py = trimY(L, v.trimDegrees ?? 0);
  const s = Math.min(w * 0.14, r * 0.16);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(L.spine + 1, py);
  g.lineTo(L.spine + 1 + s * 1.8, py - s);
  g.lineTo(L.spine + 1 + s * 1.8, py + s);
  g.closePath();
  g.fill();
}
