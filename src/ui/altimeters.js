// Period altimeters for the Phase 2 instrument panel (canvas 2D): the RAF's three-pointer altimeter and the
// Luftwaffe's single-pointer Fl 22316, each drawn after a photograph of the instrument (D32).

import { face, needle, caption, RIM, LUMINOUS } from './dials.js';

/**
 * Altimeter in the period style (after a wartime three-pointer altimeter): large numerals 0-9 round the
 * dial, fine marks every fiftieth of a turn, a long thin hand making one turn per `perTurn`, a short broad
 * hand one turn per ten of those, a small inner ring for the third hand (one turn per a hundred), and the
 * pressure-setting window at the bottom.
 *   labels: { hundreds, thousands, name } printed on the face; window: text in the setting window (or null);
 *   inner: false leaves out the inner ring and its hand
 */
export function periodAltimeter(g, x, y, r, value, perTurn, { labels, window: windowText, inner = true }, title) {
  face(g, x, y, r);
  g.strokeStyle = LUMINOUS;
  g.fillStyle = LUMINOUS;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < 50; i += 1) {
    const a = (i / 50) * Math.PI * 2;
    const major = i % 5 === 0;
    g.lineWidth = major ? 2 : 1;
    g.beginPath();
    g.moveTo(x + Math.sin(a) * r * 0.95, y - Math.cos(a) * r * 0.95);
    g.lineTo(x + Math.sin(a) * r * (major ? 0.82 : 0.88), y - Math.cos(a) * r * (major ? 0.82 : 0.88));
    g.stroke();
  }
  g.font = `bold ${Math.round(r * 0.24)}px ui-sans-serif, Helvetica, sans-serif`;
  for (let n = 0; n < 10; n += 1) {
    const a = (n / 10) * Math.PI * 2;
    g.fillText(String(n), x + Math.sin(a) * r * 0.66, y - Math.cos(a) * r * 0.66);
  }
  g.font = `${Math.round(r * 0.09)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText(labels.hundreds, x - r * 0.3, y - r * 0.68);
  g.fillText(labels.thousands, x, y - r * 0.44);
  g.font = `${Math.round(r * 0.12)}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText(labels.name, x, y - r * 0.32);
  const turn = (per) => ((value / per) % 1) * Math.PI * 2;
  if (inner) {
    // Inner ring for tens of thousands, with its small hand.
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x, y, r * 0.22, 0, Math.PI * 2);
    g.stroke();
    g.font = `${Math.round(r * 0.08)}px ui-sans-serif, Helvetica, sans-serif`;
    for (const [n, a] of [['0', 0], ['10', Math.PI / 2], ['20', Math.PI], ['30', -Math.PI / 2]]) {
      g.fillText(n, x + Math.sin(a) * r * 0.15, y - Math.cos(a) * r * 0.15);
    }
    needle(g, x, y, r * 0.2, turn(perTurn * 100), 2, LUMINOUS);
  }
  if (windowText) {
    // Pressure-setting window.
    const ww = r * 0.42;
    const wh = r * 0.17;
    g.fillStyle = '#050505';
    g.fillRect(x - ww / 2, y + r * 0.42, ww, wh);
    g.strokeStyle = RIM;
    g.strokeRect(x - ww / 2, y + r * 0.42, ww, wh);
    g.fillStyle = LUMINOUS;
    g.font = `${Math.round(r * 0.13)}px ui-monospace, Menlo, monospace`;
    g.fillText(windowText, x, y + r * 0.42 + wh / 2 + 1);
  }
  // Hands: the broad diamond for thousands, then the long thin hundreds on top.
  g.save();
  g.translate(x, y);
  g.rotate(turn(perTurn * 10));
  g.fillStyle = LUMINOUS;
  g.beginPath();
  g.moveTo(0, -r * 0.5);
  g.lineTo(r * 0.07, -r * 0.3);
  g.lineTo(0, -r * 0.08);
  g.lineTo(-r * 0.07, -r * 0.3);
  g.closePath();
  g.fill();
  g.restore();
  needle(g, x, y, r * 0.86, turn(perTurn), 2.2, LUMINOUS);
  g.fillStyle = '#222';
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
export function luftwaffeAltimeter(g, x, y, r, metres, millibar, title) {
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
  // Millibar window: a white scale sliding behind an index under the 3.
  const ww = r * 0.6;
  const wh = r * 0.2;
  const wy = y - r * 0.3;
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
