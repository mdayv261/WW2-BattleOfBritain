// The Bf 110 C panel's two lettered placards (D116), white on black with a light border, in one font size: the flap
// placard below the flap lever (the speed limit with the flaps down, the take-off and landing settings) and the pilot's
// speed card below the trim gauge, as narrow as its lettering allows (product owner).

/** The placards' lettering, picture pixels on #31: as large as the flap placard's widest line fits its plate. */
export const PLACARD_FONT = 5.2;
const PLATE = '#0c0c0c';
const BORDER = '#d8d8d2';
const INK = '#e9e6dc';
const LINE = 1.35; // line spacing, in font heights
const PAD = 0.9; // margin inside the border, in font heights

/** The flap placard's lines from the aircraft's data (S24): the speed limit with the flaps down, then the settings. */
export function flapPlacardLines(v) {
  const angle = (fraction) => `${Math.round(fraction * v.flapTravel)}°`;
  return ['Achtung!', 'Max Flap Speed', `${v.pilotCard?.flapLimit ?? '—'} km/hr`, `Take-off ${angle(v.flapTakeoff)}`,
    `Landing ${angle(v.flapLanding)}`];
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

/** The flap placard in its box { x, y, w, h } (canvas px), its lines centred, the font `px` high. */
export function flapPlacard(g, b, lines, px) {
  plate(g, b.x, b.y, b.w, b.h);
  setFont(g, px);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const step = b.h / (lines.length + 1);
  lines.forEach((s, i) => g.fillText(s, b.x + b.w / 2, b.y + step * (i + 1)));
}

/**
 * The speed card (pilotCard(): title, unit, rows of label and value) as a placard, its top centre at (cx, top), the
 * font `px` high: the title and unit centred, each label on the left and its figure on the right, the plate as wide as
 * the lettering and its margins. Returns the plate { x, y, w, h }.
 */
export function speedPlacard(g, cx, top, card, px) {
  if (!card) return null;
  setFont(g, px);
  const pad = px * PAD;
  const rows = card.entries.map(({ label, value }) => widthOf(g, label, px) + px * 1.2 + widthOf(g, value, px));
  const w = Math.max(...rows, widthOf(g, card.title, px), widthOf(g, card.unit, px)) + 2 * pad;
  const lines = 2 + card.entries.length;
  const h = lines * px * LINE + 2 * pad;
  const x = cx - w / 2;
  plate(g, x, top, w, h);
  g.fillStyle = INK;
  g.textBaseline = 'middle';
  const rowY = (i) => top + pad + px * LINE * (i + 0.5);
  g.textAlign = 'center';
  g.fillText(card.title, cx, rowY(0));
  g.fillText(card.unit, cx, rowY(1));
  card.entries.forEach(({ label, value }, i) => {
    g.textAlign = 'left';
    g.fillText(label, x + pad, rowY(i + 2));
    g.textAlign = 'right';
    g.fillText(value, x + w - pad, rowY(i + 2));
  });
  return { x, y: top, w, h };
}
