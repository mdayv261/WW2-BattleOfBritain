// The Bf 110 C panel's plate and fittings (D106, D140), after the product owner's picture of the panel (#34): the dark
// grey plate on its outline (the clock mounted directly in it, its bracket gone, D156); the round "Fahrgestell Anzeige"
// undercarriage lights (D157; EIN red with it up, AUS green with it down, as the Bf 109's, D95); the Fahrwerk and Landeklappe
// push/pull valves (src/ui/bf110Valves.js, D199); the placards (src/ui/bf110Placards.js); and, shown only,
// the airscrew lever box (Automatik / Hand, größer / kleiner), the Umschaltwarnung lamps and the tank lamps
// (Behälter vorn / hinten). The boxes along the top and the course box are in src/ui/bf110Boxes.js.

import { text, lens } from './panelParts.js';
import { BLACK, INK, plain } from './bf109Fittings.js';
import { mount } from './lwStyle.js';
import { achtungPlacard, divePlacardLines, textPlacard } from './bf110Placards.js';
import { drawBf110Boxes, greenKnob } from './bf110Boxes.js';
import { valve, drawValvePair } from './bf110Valves.js';

const PLATE = { top: '#4d524c', foot: '#3c403b', edge: '#1d1f1d' };

/** Which undercarriage lights glow: the EIN pair red with it fully up, the AUS pair green with it down (D95, D106). */
export const gearLightState = (v) => ({ ein: !!v.gearUp, aus: !!v.gearDown });

/** Draws the plate and fittings; `at` is the panel's placer (src/ui/bf110Panel.js), `L` its layout. */
export function drawBf110Fittings(g, at, L, v) {
  const s = at.len(30); // one dial radius in pixels
  const B = (name) => at.box(L.boxes[name]);
  outlinePlate(g, at, L.outline);
  drawBf110Boxes(g, at, L, s, v);
  gearLights(g, B('gearLights'), s, v);
  leverBox(g, B('levers'), s, v);
  drawValvePair(g, at, L.switches.gear, valve.gear(v), s);
  drawValvePair(g, at, L.switches.flaps, valve.flaps(v), s);
  achtungPlacard(g, B('achtung'), v);
  textPlacard(g, B('fahrwerkLabel'), ['Fahrwerk']);
  textPlacard(g, B('gearLabel'), ['Fahrwerk']); // under the lever box, at its right edge (D211)
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
export const GEAR_HOUSING = 0.9; // the round housing's diameter as a share of its square mounting's width (D162)
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
  const [x, y] = [b.x + b.w / 2, b.y + b.h / 2];
  mount(g, x, y, Math.min(b.w, b.h) / 2); // the turn and slip indicator's black mounting (D162)
  const r = (GEAR_HOUSING * Math.min(b.w, b.h)) / 2;
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
 * Where each pitch control switch's white knob stands (D188): at its Automatik end (the top, under the Automatik
 * plate) with the automatic pitch on, at its Hand end (the foot, over the Hand plate) without; as a share of the lever
 * box's height. Its diameter: 10 screen px on the product owner's 2560 × 1259 screen, in dial radii.
 */
export const pitchKnobY = (automatik) => (automatik ? 0.175 : 0.255);
export const PITCH_KNOB = 10 / 40.37; // dial radii: 10 px where a dial radius is 40.37 px (2560 × 1259)
/** The pitch levers' knobs' diameter (D190): 25 screen px on the product owner's 2560 × 1259 screen, in dial radii. */
export const LEVER_KNOB = 25 / 40.37;
/**
 * Where a pitch lever's knob stands along its slot (D191), as a share of the lever box's height: at the slot's top
 * (größer Drehzahl) at the fine stop, at its foot (kleiner) at the coarse stop, `fraction` 0 to 1.
 */
// The 25 px knob clear of the größer and kleiner labels (LEVER_LABELS) in the box 10 mm shorter (D209; was 0.54 to 0.73
// with größer at 0.47).
export const LEVER_TRAVEL = [0.535, 0.715];
export const LEVER_LABELS = { groesser: 0.45, kleiner: 0.8, size: 0.03 }; // shares of the box's height
export const leverKnobY = (fraction) => {
  const f = Math.max(0, Math.min(1, fraction ?? 0));
  return LEVER_TRAVEL[0] + (LEVER_TRAVEL[1] - LEVER_TRAVEL[0]) * f;
};

/**
 * The airscrew lever box: the Automatik and Hand plates over two rocker switches for the pitch control, their white
 * knobs at Automatik or Hand as the switch is set (Shift+P, D188); below them a lever for each engine, größer / kleiner
 * Drehzahl, its knob following that engine's blade angle (D191; the pitch is set with E / D, or by the Automatik).
 */
function leverBox(g, b, s, v) {
  plain(g, b, s, '#1a1b1d');
  const plateAt = (y, word) => {
    plain(g, { x: b.x + b.w * 0.25, y: b.y + b.h * y, w: b.w * 0.5, h: b.h * 0.07 }, s, '#5b5f5d');
    text(g, word, b.x + b.w / 2, b.y + b.h * (y + 0.035), b.h * 0.035, INK, { bold: true });
  };
  plateAt(0.06, 'Automatik');
  plateAt(0.3, 'Hand');
  [0.35, 0.65].forEach((fx, engine) => {
    const x = b.x + b.w * fx;
    g.fillStyle = '#0b0b0c';
    g.fillRect(x - b.w * 0.08, b.y + b.h * 0.15, b.w * 0.16, b.h * 0.13); // the rocker switches
    g.fillStyle = '#f2efe6'; // the switch's white knob, at Automatik or Hand (D188)
    g.beginPath();
    g.arc(x, b.y + b.h * pitchKnobY(!!v.pitchAutomatik), (PITCH_KNOB * s) / 2, 0, Math.PI * 2);
    g.fill();
    text(g, 'größer', x, b.y + b.h * LEVER_LABELS.groesser, b.h * LEVER_LABELS.size, INK);
    text(g, 'kleiner', x, b.y + b.h * LEVER_LABELS.kleiner, b.h * LEVER_LABELS.size, INK);
    g.fillStyle = '#0d0e0f';
    g.fillRect(x - b.w * 0.03, b.y + b.h * 0.5, b.w * 0.06, b.h * 0.27); // the lever's slot
    // Its knob, the Heizung knob's green (D189), following its engine's blade angle (left lever left engine, D191).
    greenKnob(g, x, b.y + b.h * leverKnobY(v.engines?.[engine]?.pitchFraction), (LEVER_KNOB * s) / 2);
  });
  text(g, 'Drehzahl', b.x + b.w / 2, b.y + b.h * 0.88, b.h * 0.03, INK);
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
