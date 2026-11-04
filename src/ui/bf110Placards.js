// The Bf 110 C panel's lettered placards (D140), white on black with a light border, after the product owner's picture
// (#34): the dive speed placard below the airspeed indicator, the "Achtung Fahrwerk / Achtung Landeklappe" placard
// beside the undercarriage and flap switches, and the "Umschaltwarnung" placard. Their figures are the sourced limits
// (S24: 650 km/h, 250 km/h), not the picture's (product owner, D140).

const PLATE = '#0c0c0c';
const BORDER = '#d8d8d2';
const INK = '#e9e6dc';
const LINE = 1.3; // line spacing, in font heights
const PAD = 0.6; // margin inside the border, in font heights

/** The dive speed placard's lines: the aircraft's limit (S24), km/h. */
export const divePlacardLines = (v) => ['Maximale Sturzflug-', 'Geschwindigkeit', `${v.diveLimit ?? '—'} km/h`];

/**
 * The "Achtung" placard's two sections: the undercarriage and the flaps, each with the limit for flaps and undercarriage
 * down (S24, the speed card's flapLimit, D116).
 */
export function achtungLines(v) {
  const limit = v.pilotCard?.flapLimit ?? '—';
  // Broken shorter (hyphenated, as the picture's "voll-ständig") so the lettering fits 1.5 times larger (D208).
  return {
    gear: ['Achtung Fahrwerk', 'bei Geschwindig-', `keit über ${limit} km/St`, 'nicht betätigen'],
    flaps: ['Achtung', 'Landeklappe muß', 'bei Geschwindig-', `keit über ${limit} km/St`, 'vollständig', 'eingefahren sein'],
  };
}

/**
 * The "Achtung" placard's lettering (product owner, D208): 1.5 times the font it had (0.0504 of the placard's height,
 * where its widest line, "bei Geschwindigkeit über", filled 0.9 of the old 95 px width), with closer lines and
 * margins so its ten lines fit; each section's height in proportion to its lines.
 */
export const ACHTUNG = { font: 1.5 * 0.0504, line: 1.15, pad: 0.3 };
const sectionHeight = (n) => n * ACHTUNG.line + 2 * ACHTUNG.pad; // in font heights

/** Sets `lines` centred in the box { x, y, w, h } at font `px`, `ACHTUNG.line` apart. */
function setLines(g, b, lines, px) {
  setFont(g, px);
  g.fillStyle = INK;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  const top = b.y + (b.h - lines.length * px * ACHTUNG.line) / 2;
  lines.forEach((s, i) => g.fillText(s, b.x + b.w / 2, top + px * ACHTUNG.line * (i + 0.5)));
}

function setFont(g, px) {
  g.font = `bold ${Math.max(4, px)}px "Helvetica Neue", Arial, sans-serif`;
}

/** Lettering width at the current font; an estimate where the canvas cannot measure (the tests' stand-in). */
function widthOf(g, s, px) {
  return g.measureText?.(s)?.width ?? s.length * 0.6 * px;
}

/** The black plate with its light border. */
function plate(g, x, y, w, h) {
  g.fillStyle = PLATE;
  g.fillRect(x, y, w, h);
  g.strokeStyle = BORDER;
  g.lineWidth = 1;
  g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

/**
 * A placard in its box { x, y, w, h } (canvas px), its lines centred, the font as large as fits both ways. A line with a
 * tab ('\t') is set as two words, one each side. Returns the font height.
 */
export function textPlacard(g, b, lines, { border = true } = {}) {
  if (border) plate(g, b.x, b.y, b.w, b.h);
  let px = b.h / (lines.length * LINE + 2 * PAD);
  setFont(g, px);
  const widest = Math.max(...lines.map((s) => widthOf(g, s.replace('\t', '    '), px)));
  if (widest > b.w * 0.9) px *= (b.w * 0.9) / widest;
  setFont(g, px);
  g.fillStyle = INK;
  g.textBaseline = 'middle';
  const top = b.y + (b.h - lines.length * px * LINE) / 2;
  lines.forEach((s, i) => {
    const y = top + px * LINE * (i + 0.5);
    const [left, right] = s.split('\t');
    if (right === undefined) {
      g.textAlign = 'center';
      g.fillText(s, b.x + b.w / 2, y);
    } else {
      g.textAlign = 'left';
      g.fillText(left, b.x + b.w * 0.06, y);
      g.textAlign = 'right';
      g.fillText(right, b.x + b.w * 0.94, y);
    }
  });
  return px;
}

/**
 * The "Achtung" placard in its box: the undercarriage's section above the flaps', a rule between, each section's
 * height in proportion to its lines (D208). Returns the font height.
 */
export function achtungPlacard(g, b, v) {
  const { gear, flaps } = achtungLines(v);
  plate(g, b.x, b.y, b.w, b.h);
  let px = ACHTUNG.font * b.h;
  setFont(g, px);
  const widest = Math.max(...[...gear, ...flaps].map((s) => widthOf(g, s, px)));
  if (widest > b.w * 0.92) px *= (b.w * 0.92) / widest; // only where the canvas can't measure (the tests' stand-in)
  const split = b.h * (sectionHeight(gear.length) / (sectionHeight(gear.length) + sectionHeight(flaps.length)));
  setLines(g, { ...b, h: split }, gear, px);
  setLines(g, { ...b, y: b.y + split, h: b.h - split }, flaps, px);
  g.strokeStyle = BORDER;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(b.x + 3, b.y + split);
  g.lineTo(b.x + b.w - 3, b.y + split);
  g.stroke();
  return px;
}
