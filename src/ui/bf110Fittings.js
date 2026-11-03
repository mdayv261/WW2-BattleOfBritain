// The Bf 110 C panel's plate and fittings (D106, D140), after the product owner's picture of the panel (#34): the dark
// grey plate on its outline (the clock mounted directly in it, its bracket gone, D156); the round "Fahrgestell Anzeige"
// undercarriage lights (D157; EIN red with it up, AUS green with it down, as the Bf 109's, D95); the Fahrwerk and Landeklappe Ein/Aus switches following the
// undercarriage and the flaps (their upright T levers, D114); the placards (src/ui/bf110Placards.js); and, shown only,
// the airscrew lever box (Automatik / Hand, größer / kleiner), the Umschaltwarnung lamps and the tank lamps
// (Behälter vorn / hinten). The boxes along the top and the course box are in src/ui/bf110Boxes.js.

import { text, lens } from './panelParts.js';
import { BLACK, INK, plain } from './bf109Fittings.js';
import { achtungPlacard, divePlacardLines, textPlacard } from './bf110Placards.js';
import { drawBf110Boxes } from './bf110Boxes.js';

const PLATE = { top: '#4d524c', foot: '#3c403b', edge: '#1d1f1d' };

/** Where an Ein/Aus switch's knob stands along its travel (0 at Ein, the top; 1 at Aus, the bottom). */
export const switchPosition = { flaps: (v) => ((v.flapSelected ?? 0) > 0 ? 1 : 0), gear: (v) => (v.gearSelected ? 1 : 0) };

/** Which undercarriage lights glow: the EIN pair red with it fully up, the AUS pair green with it down (D95, D106). */
export const gearLightState = (v) => ({ ein: !!v.gearUp, aus: !!v.gearDown });

/** Draws the plate and fittings; `at` is the panel's placer (src/ui/bf110Panel.js), `L` its layout. */
export function drawBf110Fittings(g, at, L, v) {
  const s = at.len(30); // one dial radius in pixels
  const B = (name) => at.box(L.boxes[name]);
  outlinePlate(g, at, L.outline);
  drawBf110Boxes(g, at, L, s);
  gearLights(g, B('gearLights'), s, v);
  leverBox(g, B('levers'), s);
  einAus(g, at, L.switches.gear, switchPosition.gear(v), s);
  einAus(g, at, L.switches.flaps, switchPosition.flaps(v), s);
  achtungPlacard(g, B('achtung'), v);
  textPlacard(g, B('fahrwerkLabel'), ['Fahrwerk']);
  textPlacard(g, B('klappeLabel'), ['Landeklappe']);
  textPlacard(g, B('dive'), divePlacardLines(v));
  textPlacard(g, B('umschalt'), ['Umschaltwarnung', 'links\trechts']);
  for (const k of ['umschaltLeft', 'umschaltRight']) lens(g, ...at.knob(L.knobs[k]), '#3a3c3e', false);
  tankLamps(g, at, L, s);
}

/** The plate along its outline, shaded from its top to its foot. */
function outlinePlate(g, at, outline) {
  const pts = outline.map((p) => at.xy(p));
  const ys = pts.map(([, y]) => y);
  const shade = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  shade.addColorStop(0, PLATE.top);
  shade.addColorStop(1, PLATE.foot);
  g.fillStyle = shade;
  g.strokeStyle = PLATE.edge;
  g.lineWidth = Math.max(1.5, at.len(2));
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.closePath();
  g.fill();
  g.stroke();
}

/**
 * Where the undercarriage lights' four lamps stand in their round housing (D157), as fractions of its radius from its
 * centre: an EIN lamp for each leg above, an AUS lamp for each below; and their radius.
 */
export const GEAR_LAMPS = {
  radius: 0.2,
  lamps: [[-0.44, -0.3, 'ein'], [0.44, -0.3, 'ein'], [-0.44, 0.36, 'aus'], [0.44, 0.36, 'aus']],
};

/**
 * The "Fahrgestell Anzeige" lights in a round housing (product owner, D157) filling its box: a dark disc with a lit rim
 * and four screws, Fahrgestell over the lamps and Anzeige between the rows; the EIN lamps red with the undercarriage up,
 * the AUS lamps green with it down (D95, D106).
 */
function gearLights(g, b, s, v) {
  const r = Math.min(b.w, b.h) / 2;
  const [x, y] = [b.x + b.w / 2, b.y + b.h / 2];
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath();
  g.arc(x + r * 0.04, y + r * 0.05, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = BLACK;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#55585b';
  g.lineWidth = Math.max(1, r * 0.04);
  g.beginPath();
  g.arc(x, y, r * 0.94, 0, Math.PI * 2);
  g.stroke();
  for (const a of [45, 135, 225, 315]) {
    const t = (a * Math.PI) / 180;
    lens(g, x + Math.cos(t) * r * 0.8, y + Math.sin(t) * r * 0.8, r * 0.05, '#7d8084', false); // the screws
  }
  const lit = gearLightState(v);
  text(g, 'Fahrgestell', x, y - r * 0.66, r * 0.15, INK);
  text(g, 'Anzeige', x, y + r * 0.03, r * 0.12, INK); // clear of the lamps either side
  const look = { ein: ['EIN', '#e0402c', '#4a1610'], aus: ['AUS', '#3fcf4a', '#14401a'] };
  for (const [fx, fy, kind] of GEAR_LAMPS.lamps) {
    const [word, colour, dark] = look[kind];
    const on = lit[kind];
    lens(g, x + fx * r, y + fy * r, GEAR_LAMPS.radius * r, on ? colour : dark, on);
    text(g, word, x + fx * r, y + fy * r, r * 0.13, on ? '#1a1a1a' : INK, { bold: true });
  }
}

/**
 * The airscrew lever box (shown only; the pitch is set from the keyboard and read on the pitch indicators, D109): the
 * Automatik and Hand plates over two rocker switches, and below them a lever for each engine, größer / kleiner Drehzahl.
 */
function leverBox(g, b, s) {
  plain(g, b, s, '#1a1b1d');
  const plateAt = (y, word) => {
    plain(g, { x: b.x + b.w * 0.25, y: b.y + b.h * y, w: b.w * 0.5, h: b.h * 0.07 }, s, '#5b5f5d');
    text(g, word, b.x + b.w / 2, b.y + b.h * (y + 0.035), b.h * 0.035, INK, { bold: true });
  };
  plateAt(0.06, 'Automatik');
  plateAt(0.3, 'Hand');
  for (const fx of [0.35, 0.65]) {
    const x = b.x + b.w * fx;
    g.fillStyle = '#0b0b0c';
    g.fillRect(x - b.w * 0.08, b.y + b.h * 0.15, b.w * 0.16, b.h * 0.13); // the rocker switches
    text(g, 'größer', x, b.y + b.h * 0.47, b.h * 0.03, INK);
    text(g, 'kleiner', x, b.y + b.h * 0.8, b.h * 0.03, INK);
    g.fillStyle = '#0d0e0f';
    g.fillRect(x - b.w * 0.03, b.y + b.h * 0.5, b.w * 0.06, b.h * 0.27); // the lever's slot
    g.fillStyle = '#2b2d2f';
    g.beginPath();
    g.arc(x, b.y + b.h * 0.6, b.w * 0.07, 0, Math.PI * 2); // its knob, at the middle of its travel
    g.fill();
  }
  text(g, 'Drehzahl', b.x + b.w / 2, b.y + b.h * 0.88, b.h * 0.03, INK);
}

/**
 * An Ein/Aus switch: a slot with Ein at the top and Aus at the bottom, and a lever at `position` (0-1): an upright T, its
 * stem rising from the slot behind the Ein and Aus discs, its bar across the top (product owner, D114).
 */
function einAus(g, at, [px, top, bottom], position, s) {
  const [x, y0] = at.xy([px, top]);
  const [, y1] = at.xy([px, bottom]);
  g.fillStyle = BLACK;
  g.fillRect(x - s * 0.1, y0, s * 0.2, y1 - y0);
  tBar(g, x, y0 + (y1 - y0) * position, s);
  for (const [word, wy, on] of [['EIN', y0, position === 0], ['AUS', y1, position === 1]]) {
    g.fillStyle = on ? '#f2efe6' : '#a9aba8';
    g.beginPath();
    g.arc(x, wy, s * 0.3, 0, Math.PI * 2);
    g.fill();
    text(g, word, x, wy, s * 0.18, '#1a1a1a', { bold: on });
  }
}

/** The lever's T: a black stem rising T_STEM from its foot at (x, y) to a bar across its top, the bar lit along its top. */
export const T_STEM = 0.45; // dial radii: the bar clears the Ein and Aus discs (0.3)
export function tBar(g, x, y, s) {
  const top = y - s * T_STEM;
  const w = s * 0.55;
  const h = s * 0.14;
  g.fillStyle = '#0e0f10';
  g.fillRect(x - s * 0.05, top, s * 0.1, y - top);
  g.beginPath();
  g.roundRect(x - w / 2, top - h / 2, w, h, h / 2);
  g.fill();
  g.strokeStyle = 'rgba(200, 205, 210, 0.45)';
  g.lineWidth = Math.max(1, h * 0.18);
  g.beginPath();
  g.moveTo(x - w / 2 + h * 0.5, top - h * 0.22);
  g.lineTo(x + w / 2 - h * 0.5, top - h * 0.22);
  g.stroke();
}

/** The tank lamps either side of the fuel gauge (shown only, dark): Behälter vorn / hinten, links and rechts. */
function tankLamps(g, at, L, s) {
  for (const [front, rear, side] of [['tankLeftFront', 'tankLeftRear', 'links'], ['tankRightFront', 'tankRightRear', 'rechts']]) {
    const [x, y0, rad] = at.knob(L.knobs[front]);
    const [, y1] = at.knob(L.knobs[rear]);
    for (const y of [y0, y1]) lens(g, x, y, rad, '#7a1a12', false);
    const mid = (y0 + y1) / 2;
    text(g, 'vorn', x, y0 - rad * 1.6, s * 0.12, INK);
    text(g, 'Behälter', x, mid - s * 0.08, s * 0.12, INK);
    text(g, side, x, mid + s * 0.08, s * 0.12, INK);
    text(g, 'hinten', x, y1 + rad * 1.6, s * 0.12, INK);
  }
}
