// The Bf 109's gun ammunition counter, drawn after the product owner's photograph (D64): a dark plate with the guns'
// EIN/AUS switch on the left, then three counter columns, each with a round window at the top, a vertical scale marked
// 500 with a white tape showing the rounds left, and a plate at its foot that is the gun's light.
// The columns show the left MG 17, the cannon and the right MG 17 (the product owner's choice; not confirmed from a
// source). Each tape shows its gun's share of its own load (product owner, D65): full at 1,000 rounds for an MG 17
// (S16), at 60 for the cannon drum, shortening as rounds are fired; the 500 marking is kept from the photograph. The
// round window above it turns with every round counted, so it spins while the gun fires and stands still otherwise.
// The plates at the foot of the columns are the lights (product owner, D65): white while the gun has rounds, red when it
// is empty. Each tape runs down to just above its plate, without touching it.

const SPIN_PER_ROUND = 0.21; // rad the window turns per round counted (display choice: about 3.5 rad/s for an MG 17)

const EMPTY_RED = '#d8402e'; // the undercarriage lamps' red, for an empty gun's plate

/**
 * A column's state for `rounds` left of `capacity`: { fraction of the tape shown, angle of the window (rad), empty (the
 * red light) }.
 */
export function counterState(rounds, capacity) {
  const left = Math.max(0, Math.min(capacity, rounds));
  return { fraction: capacity > 0 ? left / capacity : 0, angle: (capacity - left) * SPIN_PER_ROUND, empty: left <= 0 };
}

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

const TAPE_CLEAR = 0.06; // column widths left clear between the bottom of a full tape and its plate (D65)

/**
 * The counter's layout for its box { x, y, w, h } (screen pixels, centre and size): the switch's area, and for each of
 * the three columns its frame, round window, tape (top and bottom of the full tape) and plate, all in screen pixels.
 */
export function counterLayout({ x, y, w, h }) {
  const left = x - w / 2;
  const top = y - h / 2;
  const strip = h * 0.16; // the strip along the bottom where the plates sit
  const colW = (w * 0.7) / 3;
  const columns = [0, 1, 2].map((i) => {
    const cx = left + w * 0.28 + i * colW;
    const plate = { x: cx + colW * 0.12, y: top + h - strip * 0.85, w: colW * 0.76, h: strip * 0.6 };
    const fw = colW * 0.92;
    const frame = { x: cx + colW * 0.04, y: top + h * 0.04, w: fw };
    frame.h = plate.y - (fw * TAPE_CLEAR) / 2 - frame.y; // the frame runs down to the plate
    return {
      frame, plate,
      window: { x: frame.x + fw / 2, y: frame.y + fw * 0.42, r: fw * 0.3 },
      tape: { x: frame.x + fw * 0.38, w: fw * 0.42, top: frame.y + fw * 0.85, bottom: plate.y - fw * TAPE_CLEAR },
    };
  });
  return { left, top, switchArea: { x: left, y: top, w: w * 0.27, h: h - strip }, columns };
}

/** One counter column: round window, scale window with the white tape (fraction left, from the bottom), and its plate. */
function column(g, c, { fraction, angle, empty }) {
  const { frame, window: win, tape, plate } = c;
  rect(g, frame.x, frame.y, frame.w, frame.h, FRAME);
  disc(g, win.x, win.y, win.r, '#6c6f70'); // the round window
  g.strokeStyle = WHITE;
  g.lineWidth = Math.max(0.8, frame.w * 0.05);
  for (let k = 0; k < 3; k += 1) {
    const a = (k * 2 * Math.PI) / 3 - Math.PI / 2 + angle;
    g.beginPath();
    g.moveTo(win.x, win.y);
    g.lineTo(win.x + Math.cos(a) * win.r * 0.8, win.y + Math.sin(a) * win.r * 0.8);
    g.stroke();
  }
  const length = tape.bottom - tape.top;
  rect(g, tape.x, tape.top, tape.w, length, '#26292a'); // the scale window
  const left = length * Math.max(0, Math.min(1, fraction));
  rect(g, tape.x + tape.w * 0.14, tape.bottom - left, tape.w * 0.72, left, WHITE);
  g.strokeStyle = '#9b968a';
  g.lineWidth = 0.8;
  for (let k = 1; k < 6; k += 1) {
    const ty = tape.top + (length * k) / 6;
    g.beginPath();
    g.moveTo(tape.x, ty);
    g.lineTo(tape.x + tape.w * 0.3, ty);
    g.stroke();
  }
  g.save();
  g.translate(frame.x + frame.w * 0.2, tape.top + frame.w * 0.35);
  g.rotate(-Math.PI / 2);
  text(g, '500', 0, 0, frame.w * 0.22);
  g.restore();
  rect(g, plate.x, plate.y, plate.w, plate.h, empty ? EMPTY_RED : WHITE); // the plate: the gun's light
}

/**
 * Draws the counter in its box { x, y, w, h } (screen pixels, centre and size). `counters` are counterState()s in the
 * order left MG 17, cannon, right MG 17; missing ones are drawn full and still.
 */
export function ammoCounter(g, box, r, counters = []) {
  const layout = counterLayout(box);
  rect(g, layout.left, layout.top, box.w, box.h, PLATE);
  g.strokeStyle = '#3a3c3e';
  g.lineWidth = 1;
  g.strokeRect(layout.left, layout.top, box.w, box.h);
  const sw = layout.switchArea;
  gunSwitch(g, sw.x, sw.y, sw.w, sw.h);
  layout.columns.forEach((c, i) => column(g, c, counters[i] ?? { fraction: 1, angle: 0, empty: false }));
}
