// The undercarriage and flap displays shared by the panels (D44, D47): not period instruments, but the product owner's
// choice for every aircraft because they are clearer.
//   Undercarriage: the UP/DOWN lever knob on the left, showing the selected position, and three lamps in a row along the
//   bottom (left, right and tail wheel), green with the undercarriage down and locked, red with it up and locked, dark
//   while it moves.
//   Flaps: the upright position indicator, up (0°) at the top and fully down at the bottom, with the take-off and
//   landing settings marked.

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

/** The undercarriage display on its plate. `box` is { x, y, w, h } in canvas pixels; r the panel's dial radius. */
export function undercarriageDisplay(g, box, r, v, title) {
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
  g.fillText('UP', sx + w * 0.12, top + h * 0.02);
  g.fillText('DOWN', sx + w * 0.12, bottom - h * 0.02);
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
