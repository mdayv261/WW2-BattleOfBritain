// The Bf 109's gun ammunition counter, drawn after the product owner's photograph (D64): a dark plate with the guns'
// EIN/AUS switch on the left, then three counter columns, each with a round window at the top, a vertical scale marked
// 500 with a white tape showing the rounds left, a push button below, and white label plates along the bottom.
// The columns show the left MG 17, the cannon and the right MG 17 (the product owner's choice; not confirmed from a
// source). How the real scale related to the rounds carried is not known: the tape shows the fraction left.

const PLATE = '#1d1e1f';
const FRAME = '#0b0b0b';
const WHITE = '#e9e6dc';

function rect(g, x, y, w, h, colour) {
  g.fillStyle = colour;
  g.fillRect(x, y, w, h);
}

function disc(g, x, y, radius, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

function text(g, s, x, y, size) {
  g.fillStyle = WHITE;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.max(5, Math.round(size))}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText(s, x, y);
}

/** The guns' switch: EIN at the top, AUS at the bottom, the lever up at EIN. */
function gunSwitch(g, x, y, w, h) {
  text(g, 'EIN', x + w / 2, y + h * 0.14, h * 0.13);
  text(g, 'AUS', x + w / 2, y + h * 0.84, h * 0.13);
  rect(g, x + w * 0.3, y + h * 0.28, w * 0.4, h * 0.42, '#3a3530');
  rect(g, x + w * 0.4, y + h * 0.3, w * 0.2, h * 0.2, '#6b6257'); // the lever, up
  disc(g, x + w / 2, y + h * 0.32, w * 0.1, '#8a8072');
}

/** One counter column: round window, scale window with the white tape (fraction left, from the bottom), button. */
function column(g, x, y, w, h, fraction) {
  rect(g, x, y, w, h, FRAME);
  disc(g, x + w / 2, y + w * 0.42, w * 0.3, '#6c6f70'); // the round window
  g.strokeStyle = WHITE;
  g.lineWidth = Math.max(0.8, w * 0.05);
  for (let k = 0; k < 3; k += 1) {
    const a = (k * 2 * Math.PI) / 3 - Math.PI / 2;
    g.beginPath();
    g.moveTo(x + w / 2, y + w * 0.42);
    g.lineTo(x + w / 2 + Math.cos(a) * w * 0.24, y + w * 0.42 + Math.sin(a) * w * 0.24);
    g.stroke();
  }
  const top = y + w * 0.85;
  const bottom = y + h - w * 0.75;
  rect(g, x + w * 0.38, top, w * 0.42, bottom - top, '#26292a'); // the scale window
  const tape = (bottom - top) * Math.max(0, Math.min(1, fraction));
  rect(g, x + w * 0.44, bottom - tape, w * 0.3, tape, WHITE);
  g.strokeStyle = '#9b968a';
  g.lineWidth = 0.8;
  for (let k = 1; k < 6; k += 1) {
    const ty = top + ((bottom - top) * k) / 6;
    g.beginPath();
    g.moveTo(x + w * 0.38, ty);
    g.lineTo(x + w * 0.5, ty);
    g.stroke();
  }
  g.save();
  g.translate(x + w * 0.2, top + w * 0.35);
  g.rotate(-Math.PI / 2);
  text(g, '500', 0, 0, w * 0.22);
  g.restore();
  disc(g, x + w / 2, y + h - w * 0.36, w * 0.24, '#050505'); // the push button
}

/**
 * Draws the counter in its box { x, y, w, h } (screen pixels, centre and size). `counters` are [{ fraction }] in the
 * order left MG 17, cannon, right MG 17; missing ones are drawn full.
 */
export function ammoCounter(g, { x, y, w, h }, r, counters = []) {
  const left = x - w / 2;
  const top = y - h / 2;
  rect(g, left, top, w, h, PLATE);
  g.strokeStyle = '#3a3c3e';
  g.lineWidth = 1;
  g.strokeRect(left, top, w, h);
  const labels = h * 0.16; // the strip of label plates
  gunSwitch(g, left, top, w * 0.27, h - labels);
  const colW = (w * 0.7) / 3;
  for (let i = 0; i < 3; i += 1) {
    const cx = left + w * 0.28 + i * colW;
    column(g, cx + colW * 0.04, top + h * 0.04, colW * 0.92, h - labels - h * 0.06, counters[i]?.fraction ?? 1);
    rect(g, cx + colW * 0.12, top + h - labels * 0.85, colW * 0.76, labels * 0.6, WHITE);
  }
}
