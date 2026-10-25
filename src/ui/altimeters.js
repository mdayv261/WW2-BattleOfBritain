// Period altimeters for the Phase 2 instrument panel (canvas 2D): the RAF's three-pointer Mk XIV and the
// Luftwaffe's single-pointer Fl 22316, each drawn after a photograph of the instrument (D32).

import { face, caption, LUMINOUS } from './dials.js';

/**
 * RAF altimeter Mk XIV, after a photograph of the instrument: plain cream numerals 0-9 with 0 at the top,
 * marks every 20 ft (longer every 100 ft), "100 FEET", "1000 FEET", "10000 FEET", "45,000 FT" and a large
 * "ALT", the curved millibar window at the bottom read against an index at six o'clock, and three hands:
 * a long slim one for hundreds (one turn per 1,000 ft) with a dark tail, a broad pointed one for thousands,
 * and a thin dark one with a round tip for tens of thousands.
 */
export function rafAltimeter(g, x, y, r, feet, millibar, title) {
  face(g, x, y, r);
  const turn = (per) => ((feet / per) % 1) * Math.PI * 2;
  const at = (a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];
  g.strokeStyle = LUMINOUS;
  g.fillStyle = LUMINOUS;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < 50; i += 1) {
    const a = (i / 50) * Math.PI * 2;
    const major = i % 5 === 0;
    g.lineWidth = major ? 2.2 : 1;
    g.beginPath();
    g.moveTo(...at(a, r * 0.95));
    g.lineTo(...at(a, r * (major ? 0.8 : 0.87)));
    g.stroke();
  }
  g.font = `${Math.round(r * 0.22)}px ui-sans-serif, Helvetica, sans-serif`;
  for (let n = 0; n < 10; n += 1) g.fillText(String(n), ...at((n / 10) * Math.PI * 2, r * 0.66));
  g.font = `${Math.round(r * 0.085)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('100', x - r * 0.25, y - r * 0.68);
  g.fillText('FEET', x + r * 0.27, y - r * 0.68);
  g.fillText('1000 FEET', x, y - r * 0.42);
  g.fillText('10000 FEET', x, y - r * 0.3);
  g.fillText('45,000 FT', x, y + r * 0.2);
  g.font = `bold ${Math.round(r * 0.19)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('ALT', x, y + r * 0.36);
  // Millibar window: an arc at the bottom, the scale turning behind an index at six o'clock.
  const inner = r * 0.5;
  const outer = r * 0.7;
  const half = 0.55; // rad either side of six o'clock
  g.save();
  g.beginPath();
  g.arc(x, y, outer, Math.PI / 2 - half, Math.PI / 2 + half);
  g.arc(x, y, inner, Math.PI / 2 + half, Math.PI / 2 - half, true);
  g.closePath();
  g.fillStyle = '#0a0a0a';
  g.fill();
  g.clip();
  g.fillStyle = LUMINOUS;
  g.strokeStyle = LUMINOUS;
  g.font = `${Math.round(r * 0.075)}px ui-sans-serif, Helvetica, sans-serif`;
  const perMb = half / 22; // about 44 millibars visible
  for (let mb = Math.ceil((millibar - 30) / 2) * 2; mb <= millibar + 30; mb += 2) {
    // Six o'clock is angle pi in the dial's terms; pressures rise to the right (clockwise from the pilot's
    // view at the bottom, so the angle falls).
    const a = Math.PI - (mb - millibar) * perMb;
    g.lineWidth = mb % 10 === 0 ? 1.2 : 0.7;
    g.beginPath();
    g.moveTo(...at(a, outer));
    g.lineTo(...at(a, outer - (mb % 10 === 0 ? r * 0.07 : r * 0.04)));
    g.stroke();
    if (mb % 20 === 0) g.fillText(String(mb), ...at(a, inner + r * 0.06));
  }
  g.restore();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(...at(Math.PI, outer + r * 0.02));
  g.lineTo(...at(Math.PI, outer + r * 0.1));
  g.stroke();
  // Hands, from the bottom up: tens of thousands (thin, dark, round tip), thousands, hundreds.
  g.save();
  g.translate(x, y);
  g.rotate(turn(100000));
  g.strokeStyle = '#4a4a46';
  g.fillStyle = '#4a4a46';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, -r * 0.55);
  g.stroke();
  g.beginPath();
  g.arc(0, -r * 0.55, r * 0.04, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(-r * 0.09, r * 0.22);
  g.lineTo(r * 0.09, r * 0.22);
  g.fill();
  g.restore();
  g.save();
  g.translate(x, y);
  g.rotate(turn(10000));
  g.fillStyle = LUMINOUS;
  g.beginPath();
  g.moveTo(0, -r * 0.48);
  g.lineTo(r * 0.075, -r * 0.24);
  g.lineTo(r * 0.03, 0);
  g.lineTo(-r * 0.03, 0);
  g.lineTo(-r * 0.075, -r * 0.24);
  g.closePath();
  g.fill();
  g.restore();
  g.save();
  g.translate(x, y);
  g.rotate(turn(1000));
  g.strokeStyle = '#2a2a28';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, r * 0.18);
  g.lineTo(0, 0);
  g.stroke();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -r * 0.08);
  g.lineTo(0, -r * 0.88);
  g.stroke();
  g.restore();
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, r * 0.05, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}

/**
 * Luftwaffe altimeter, after the Fl 22316 "Höhe km": a single hand making one turn per 6 km, with 0 at the
 * bottom and 3 at the top, marks every 100 m (longer every 500 m), the white millibar window under the 3
 * and "Höhe km" in the lower half. Altitude in metres; the setting window shows `millibar`.
 */
export function luftwaffeAltimeter(g, x, y, r, metres, millibar, title, withWindow = true) {
  face(g, x, y, r);
  const angle = (m) => Math.PI + (m / 6000) * Math.PI * 2; // 0 km at six o'clock, clockwise
  g.strokeStyle = LUMINOUS;
  g.fillStyle = LUMINOUS;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let m = 0; m < 6000; m += 100) {
    const a = angle(m);
    const len = m % 1000 === 0 ? 0.2 : m % 500 === 0 ? 0.14 : 0.07;
    g.lineWidth = m % 1000 === 0 ? 2.5 : 1;
    g.beginPath();
    g.moveTo(x + Math.sin(a) * r * 0.95, y - Math.cos(a) * r * 0.95);
    g.lineTo(x + Math.sin(a) * r * (0.95 - len), y - Math.cos(a) * r * (0.95 - len));
    g.stroke();
  }
  g.font = `bold ${Math.round(r * 0.26)}px ui-sans-serif, Helvetica, sans-serif`;
  for (let k = 0; k < 6; k += 1) {
    const a = angle(k * 1000);
    g.fillText(String(k), x + Math.sin(a) * r * 0.63, y - Math.cos(a) * r * 0.63);
  }
  if (withWindow) millibarWindow(g, x, y - r * 0.3, r, millibar);
  g.font = `bold ${Math.round(r * 0.17)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('Höhe', x, y + r * 0.32);
  g.font = `bold ${Math.round(r * 0.13)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('km', x, y + r * 0.48);
  // The hand: cream pointer with a broad dark tail.
  g.save();
  g.translate(x, y);
  g.rotate(angle(metres % 6000));
  g.fillStyle = '#1c1c1a';
  g.beginPath();
  g.moveTo(-r * 0.05, 0);
  g.lineTo(-r * 0.12, r * 0.28);
  g.lineTo(r * 0.12, r * 0.28);
  g.lineTo(r * 0.05, 0);
  g.fill();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -r * 0.05);
  g.lineTo(0, -r * 0.85);
  g.stroke();
  g.restore();
  g.fillStyle = '#1c1c1a';
  g.beginPath();
  g.arc(x, y, r * 0.06, 0, Math.PI * 2);
  g.fill();
  if (title) caption(g, x, y, r, title);
}

/** Millibar window: a white scale sliding behind an index, centred at (x, wy), sized for a dial of radius r. */
export function millibarWindow(g, x, wy, r, millibar) {
  const ww = r * 0.6;
  const wh = r * 0.2;
  g.save();
  g.beginPath();
  g.rect(x - ww / 2, wy - wh / 2, ww, wh);
  g.clip();
  g.fillStyle = '#e9e4d4';
  g.fillRect(x - ww / 2, wy - wh / 2, ww, wh);
  g.strokeStyle = '#111';
  g.fillStyle = '#111';
  g.font = `${Math.round(r * 0.09)}px ui-sans-serif, Helvetica, sans-serif`;
  const perMb = ww / 60;
  for (let mb = Math.ceil((millibar - 35) / 5) * 5; mb <= millibar + 35; mb += 5) {
    const px = x - (mb - millibar) * perMb; // pressures rise to the left, as on the instrument
    g.lineWidth = mb % 50 === 0 ? 1.5 : 0.8;
    g.beginPath();
    g.moveTo(px, wy - wh / 2);
    g.lineTo(px, wy - wh / 2 + (mb % 10 === 0 ? wh * 0.45 : wh * 0.28));
    g.stroke();
    if (mb % 50 === 0) g.fillText(String(mb), px, wy + wh * 0.22);
  }
  g.restore();
  g.strokeStyle = LUMINOUS;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x, wy - wh / 2 - r * 0.06);
  g.lineTo(x, wy - wh / 2 + wh * 0.3);
  g.stroke();
  g.fillStyle = LUMINOUS;
  g.font = `${Math.round(r * 0.08)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('Millibar', x, wy + wh * 0.85);
}
