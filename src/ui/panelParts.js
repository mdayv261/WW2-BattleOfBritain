// Drawing parts for the RAF instrument panel (D86): the colours sampled from the product owner's reference picture,
// and the bezels, mounting screws, knobs, lamp lenses, plates and lettering it is built from (canvas 2D).

export const C = {
  panelTop: '#424242', panelFoot: '#333333', panelEdge: '#1e1e1e', plate: '#3e3e3e', plateEdge: '#222222',
  back: '#959595', face: '#151515', bezel: '#242422', bezelLip: '#4c4c48', bezelShade: '#0d0d0c',
  screw: '#60635f', screwSlot: '#262826', hole: '#8e8e8e', rivet: '#262626',
  mark: '#e6dc96', // the pale yellow of the luminous markings
  white: '#f0f0ec', amber: '#c27f0c', yellowRing: '#f0e01c', red: '#d42a1c', box: '#2c2c2c',
  green: '#2f9e4a', orange: '#e07a26', // the normal and emergency bands (D85)
};

const DEG = Math.PI / 180;

/** A point at angle a (rad, 0 up, clockwise) and distance d from (x, y). */
export const polar = (x, y, a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];

/**
 * An angle (rad) read off a table of [value, degrees] pairs (rising values), by straight lines between them and held
 * at the ends: for the picture's scales that are not evenly spread.
 */
export function tableAngle(table, value) {
  if (value <= table[0][0]) return table[0][1] * DEG;
  for (let i = 1; i < table.length; i += 1) {
    const [v1, a1] = table[i];
    if (value <= v1) {
      const [v0, a0] = table[i - 1];
      return (a0 + ((value - v0) / (v1 - v0)) * (a1 - a0)) * DEG;
    }
  }
  return table[table.length - 1][1] * DEG;
}

/** A rounded rectangle path. */
export function roundRect(g, x, y, w, h, rad) {
  const k = Math.min(rad, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + k, y);
  g.arcTo(x + w, y, x + w, y + h, k);
  g.arcTo(x + w, y + h, x, y + h, k);
  g.arcTo(x, y + h, x, y, k);
  g.arcTo(x, y, x + w, y, k);
  g.closePath();
}

/** Lettering centred at (x, y): `size` the letter height in pixels. */
export function text(g, s, x, y, size, colour = C.white, { bold = false, align = 'center', italic = false } = {}) {
  g.fillStyle = colour;
  g.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${Math.max(4, Math.round(size))}px ui-sans-serif, Helvetica, Arial, sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(s, x, y);
}

/** A slotted mounting screw of radius s. */
export function screw(g, x, y, s, slot = 0.6) {
  const grad = g.createRadialGradient(x - s * 0.3, y - s * 0.3, s * 0.1, x, y, s);
  grad.addColorStop(0, '#8a8d89');
  grad.addColorStop(1, C.screw);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, s, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = C.screwSlot;
  g.lineWidth = Math.max(1, s * 0.25);
  g.beginPath();
  g.moveTo(x - Math.cos(slot) * s * 0.8, y - Math.sin(slot) * s * 0.8);
  g.lineTo(x + Math.cos(slot) * s * 0.8, y + Math.sin(slot) * s * 0.8);
  g.stroke();
}

/** The four mounting screws of a dial, on its diagonals. */
export function dialScrews(g, x, y, outer, s) {
  const d = outer * 0.84;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) screw(g, x + sx * d, y + sy * d, s, 0.4 + sx * 0.3);
}

/**
 * A dial's bezel: a dark ring from the face out to `outer` with a lighter lip, and a coloured ring (the boost and oil
 * temperature gauges' amber and yellow) when given. Fills the face black.
 */
export function bezel(g, x, y, face, outer, ring = null) {
  const grad = g.createRadialGradient(x, y - outer * 0.2, face, x, y, outer);
  grad.addColorStop(0, C.bezelLip);
  grad.addColorStop(0.35, C.bezel);
  grad.addColorStop(1, C.bezelShade);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, outer, 0, Math.PI * 2);
  g.fill();
  if (ring) {
    g.strokeStyle = ring;
    g.lineWidth = (outer - face) * 0.75;
    g.beginPath();
    g.arc(x, y, face + (outer - face) * 0.45, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = C.face;
  g.beginPath();
  g.arc(x, y, face, 0, Math.PI * 2);
  g.fill();
}

/** A round knob: dark, with a highlight and a knurled edge. */
export function knob(g, x, y, rad, colour = '#121212') {
  g.fillStyle = '#060606';
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
  const grad = g.createRadialGradient(x - rad * 0.35, y - rad * 0.35, rad * 0.1, x, y, rad * 0.9);
  grad.addColorStop(0, '#4a4a4a');
  grad.addColorStop(1, colour);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, rad * 0.88, 0, Math.PI * 2);
  g.fill();
}

/** A lamp lens of `colour`, glowing when lit. */
export function lens(g, x, y, rad, colour, lit) {
  g.fillStyle = '#0a0a0a';
  g.beginPath();
  g.arc(x, y, rad * 1.15, 0, Math.PI * 2);
  g.fill();
  const grad = g.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad);
  grad.addColorStop(0, lit ? '#fff2e0' : colour);
  grad.addColorStop(0.35, colour);
  grad.addColorStop(1, lit ? colour : '#1a0604');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
}

/** A plate: a dark rounded rectangle with a mounting screw in each corner (when `screws`). */
export function plate(g, { x, y, w, h }, s, { colour = C.box, rad = s, screws = true, inset = 1.6 } = {}) {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(g, x + s * 0.3, y + s * 0.4, w, h, rad);
  g.fill();
  g.fillStyle = colour;
  roundRect(g, x, y, w, h, rad);
  g.fill();
  if (!screws) return;
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    screw(g, x + (sx ? w - s * inset : s * inset), y + (sy ? h - s * inset : s * inset), s * 0.75);
  }
}

/** A dial needle from the centre at angle a: a tapered bar with a short tail, in `colour`. */
export function pointer(g, x, y, a, length, width, colour = C.mark, tail = 0.15) {
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(-width / 2, length * tail);
  g.lineTo(-width * 0.35, -length * 0.85);
  g.lineTo(0, -length);
  g.lineTo(width * 0.35, -length * 0.85);
  g.lineTo(width / 2, length * tail);
  g.closePath();
  g.fill();
  g.restore();
  g.fillStyle = '#2a2a28';
  g.beginPath();
  g.arc(x, y, width * 0.9, 0, Math.PI * 2);
  g.fill();
}

/**
 * Ticks and figures over a scale read through `angle(value)` (rad): `ticks` [{ every, from, to, len, width }] and
 * `figures` [{ values, size, radius, label }], drawn in `colour` inside a dial of face radius f.
 */
export function scaleMarks(g, x, y, f, angle, { ticks = [], figures = [], colour = C.mark }) {
  g.strokeStyle = colour;
  for (const t of ticks) {
    g.lineWidth = Math.max(1, f * t.width);
    for (let v = t.from; v <= t.to + 1e-9; v += t.every) {
      const a = angle(v);
      g.beginPath();
      g.moveTo(...polar(x, y, a, f * 0.95));
      g.lineTo(...polar(x, y, a, f * (0.95 - t.len)));
      g.stroke();
    }
  }
  for (const fig of figures) {
    for (const value of fig.values) {
      const s = fig.label ? fig.label(value) : String(value);
      text(g, s, ...polar(x, y, angle(value), f * fig.radius), f * fig.size, fig.colour ?? colour, { bold: fig.bold });
    }
  }
}

/** A coloured band along a scale from value `from` to `to`, just inside the ticks. */
export function band(g, x, y, f, angle, from, to, colour) {
  g.strokeStyle = colour;
  g.lineWidth = f * 0.07;
  g.beginPath();
  g.arc(x, y, f * 0.9, angle(from) - Math.PI / 2, angle(to) - Math.PI / 2, angle(to) < angle(from));
  g.stroke();
}
