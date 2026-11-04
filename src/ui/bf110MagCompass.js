// The Bf 110 C's magnetic compass on its bracket next to the Heizung placard (product owner's picture #36, D203): a black
// rounded-square case on a light grey bracket, a round black face with a level window showing the compass card, a
// vertical lubber line from the face's top to its foot (no lamp, D204). As on a direct-reading compass seen from behind its card, the
// figures rise to the left: turning right, the card runs from right to left. Shown in true degrees (no magnetic
// variation or deviation is modelled).

import { text } from './panelParts.js';

/**
 * Its parts in shares of the case's half-width: the bracket's margin round the case, the face's radius, the window's
 * half-width and half-height, how many degrees of card either side of the lubber line the window shows; and the
 * face's inner (black) share of its bezel, which the lubber line spans.
 */
// The face's bezel radius: 0.8 of the case's half-width, then 2 mm wider across on the product owner's screen (13.9 of
// #34's pixels, as D176) on the 165 px case (D205).
const FACE_2MM = 13.9 / 2 / 82.5;
export const MAG = { bracket: 0.16, face: 0.8 + FACE_2MM, window: [0.66, 0.2], span: 40, inner: 0.92 };

/** The card's figure for a mark every 30 degrees: N at 0, then tens of degrees (3, 6 ... 33), as #36's 27, 24, 21. */
const figure = (deg) => (deg === 0 ? 'N' : String(deg / 10));

/**
 * The card's marks in the window at `heading` degrees: each { deg, dx, kind }, `dx` the mark's offset from the lubber
 * line as a share of the window's half-width (negative to the left), `kind` 'figure' every 30°, 'long' every 10°,
 * 'short' every 5°. Figures rise to the left.
 */
export function cardMarks(heading) {
  const marks = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const off = ((deg - heading + 540) % 360) - 180; // -180 to 180: the card's angle from the heading
    if (Math.abs(off) > MAG.span) continue;
    marks.push({ deg, dx: -off / MAG.span, kind: deg % 30 === 0 ? 'figure' : deg % 10 === 0 ? 'long' : 'short' });
  }
  return marks;
}

/** Draws the compass in its case of half-width `h` centred at (x, y), on its bracket, reading `heading` degrees. */
export function magCompass(g, x, y, h, heading) {
  bracket(g, x, y, h);
  g.fillStyle = 'rgba(0, 0, 0, 0.35)'; // the case's shadow on the bracket
  roundSquare(g, x + h * 0.05, y + h * 0.07, h);
  g.fillStyle = '#121314'; // the case
  roundSquare(g, x, y, h);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    disc(g, x + sx * h * 0.8, y + sy * h * 0.8, h * 0.06, '#2c2e30'); // its screws
  }
  const r = h * MAG.face;
  disc(g, x, y, r, '#2a2c2e'); // the bezel
  disc(g, x, y, r * MAG.inner, '#08090a'); // the face
  cardWindow(g, x, y, h, heading);
}

/** The light grey bracket behind the case; its top right corner reaches over the panel's edge to the frame (D203). */
function bracket(g, x, y, h) {
  const m = h * (1 + MAG.bracket);
  g.fillStyle = '#9da0a3';
  g.beginPath();
  g.roundRect(x - m, y - m, 2 * m, 2 * m, m * 0.35);
  g.fill();
  g.strokeStyle = '#c4c6c8'; // lit along its top
  g.lineWidth = Math.max(1, h * 0.04);
  g.beginPath();
  g.moveTo(x - m * 0.65, y - m + g.lineWidth / 2);
  g.lineTo(x + m * 0.65, y - m + g.lineWidth / 2);
  g.stroke();
}

/** The level window and the card behind it: the marks and the figures under them; then the lubber line, the face's height (D204). */
function cardWindow(g, x, y, h, heading) {
  const [ww, wh] = [h * MAG.window[0], h * MAG.window[1]];
  g.save();
  g.beginPath();
  g.rect(x - ww, y - wh, 2 * ww, 2 * wh);
  g.clip();
  g.fillStyle = '#1b1c1d';
  g.fillRect(x - ww, y - wh, 2 * ww, 2 * wh);
  g.strokeStyle = '#e9e6dc';
  g.lineCap = 'butt';
  for (const { deg, dx, kind } of cardMarks(heading)) {
    const mx = x + dx * ww;
    const len = kind === 'short' ? 0.25 : 0.45;
    g.lineWidth = Math.max(1, h * (kind === 'short' ? 0.02 : 0.03));
    g.beginPath();
    g.moveTo(mx, y - wh);
    g.lineTo(mx, y - wh + len * wh);
    g.stroke();
    if (kind === 'figure') text(g, figure(deg), mx, y + wh * 0.4, wh * 0.85, '#e9e6dc', { bold: true });
  }
  g.restore();
  g.strokeStyle = '#d9b623'; // the lubber line
  g.lineWidth = Math.max(1, h * 0.02); // thin, so the figure under it still reads
  g.beginPath();
  const reach = h * MAG.face * MAG.inner;
  g.moveTo(x, y - reach);
  g.lineTo(x, y + reach);
  g.stroke();
}

function roundSquare(g, x, y, h) {
  g.beginPath();
  g.roundRect(x - h, y - h, 2 * h, 2 * h, h * 0.3);
  g.fill();
}

function disc(g, x, y, r, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
