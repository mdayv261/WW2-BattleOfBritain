// The look shared by the Luftwaffe instruments, after the product owner's reference drawings of the period
// instruments (D43): a dark grey square mounting with rounded corners and a domed screw at each corner (a tab with a
// screw, or the setting knob, below some instruments); a thick black bezel; a charcoal face with white markings; a
// pale yellow hand with a dark counterweight sector at the hub. Angles are in radians, 0 straight up, clockwise.

export const DEG = Math.PI / 180;
export const INK = '#f1f1ec'; // white markings
export const HAND = '#ece59c'; // pale yellow hands
const MOUNT = '#2a2c2e';

export const at = (x, y, a, d) => [x + Math.sin(a) * d, y - Math.cos(a) * d];

export const font = (g, size, bold = false) => {
  g.font = `${bold ? 'bold ' : ''}${Math.max(6, Math.round(size))}px "Helvetica Neue", Arial, sans-serif`;
};

export const centred = (g, colour = INK) => {
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = colour;
  g.strokeStyle = colour;
};

/** A tick from radius r1 to r2 (fractions of r) at angle a. */
export function tick(g, x, y, r, a, r1, r2, width) {
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(...at(x, y, a, r * r1));
  g.lineTo(...at(x, y, a, r * r2));
  g.stroke();
}

/** Interpolates an angle (degrees in the table, radians returned) from [value, degrees] pairs, held at the ends. */
export function tableAngle(table, v) {
  if (v <= table[0][0]) return table[0][1] * DEG;
  for (let i = 1; i < table.length; i += 1) {
    const [v1, a1] = table[i];
    const [v0, a0] = table[i - 1];
    if (v <= v1) return (a0 + ((v - v0) / (v1 - v0)) * (a1 - a0)) * DEG;
  }
  return table[table.length - 1][1] * DEG;
}

/** A domed screw head. */
export function screw(g, x, y, radius) {
  const shade = g.createRadialGradient(x - radius * 0.35, y - radius * 0.35, radius * 0.1, x, y, radius);
  shade.addColorStop(0, '#e2e3e3');
  shade.addColorStop(1, '#727578');
  g.fillStyle = shade;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

/**
 * The square mounting round a dial, `size` its half-width, with a domed screw at each corner. `tab`: 'screw' adds a tab
 * below with a small screw, 'knob' the altimeter's setting knob.
 */
export function mount(g, x, y, size, tab = null) {
  g.fillStyle = MOUNT;
  if (tab) {
    g.beginPath();
    g.moveTo(x - size * 0.42, y + size * 0.8);
    g.lineTo(x + size * 0.42, y + size * 0.8);
    g.lineTo(x + size * 0.28, y + size * 1.2);
    g.lineTo(x - size * 0.28, y + size * 1.2);
    g.closePath();
    g.fill();
  }
  g.beginPath();
  g.roundRect(x - size, y - size, 2 * size, 2 * size, size * 0.32);
  g.fill();
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) screw(g, x + sx * size * 0.76, y + sy * size * 0.76, size * 0.13);
  if (tab === 'screw') screw(g, x, y + size * 1.06, size * 0.07);
  if (tab === 'knob') {
    g.fillStyle = '#1b1c1d';
    g.beginPath();
    g.arc(x, y + size * 1.12, size * 0.2, 0, Math.PI * 2);
    g.fill();
    screw(g, x, y + size * 1.12, size * 0.07);
  }
}

/** The bezel and face: a thick black ring with a fine grey edge round a charcoal face. */
export function lwFace(g, x, y, r) {
  g.fillStyle = '#121314';
  g.beginPath();
  g.arc(x, y, r * 1.12, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#55585b';
  g.lineWidth = Math.max(1, r * 0.02);
  g.beginPath();
  g.arc(x, y, r * 1.03, 0, Math.PI * 2);
  g.stroke();
  const shade = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
  shade.addColorStop(0, '#4a4d50');
  shade.addColorStop(1, '#2b2d2f');
  g.fillStyle = shade;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

/**
 * The hand: a thin pale yellow pointer from the hub, with a dark counterweight sector on the hub opposite it and a
 * grey hub button. `length` is a fraction of r.
 */
export function lwHand(g, x, y, r, angle, { length = 0.84, colour = HAND, counterweight = true } = {}) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  if (counterweight) {
    g.fillStyle = '#18191a';
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, r * 0.32, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = colour;
  g.lineWidth = Math.max(1.5, r * 0.045);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -r * 0.08);
  g.lineTo(0, -r * length);
  g.stroke();
  g.restore();
  g.fillStyle = '#8f9295';
  g.beginPath();
  g.arc(x, y, r * 0.07, 0, Math.PI * 2);
  g.fill();
}
