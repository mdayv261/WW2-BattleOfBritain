// Bf 110 C instrument panel (D106), redrawn in code after the product owner's picture of a Bf 110 C panel (#31), with
// details from their picture of the cockpit (#32). The pictures are layout references only: nothing of them is copied
// into the game. Positions and sizes are measured on #31 in its pixels (PX to a dial radius) from the climb indicator's
// column (AXIS: the Revi stands above it in the middle of the screen) and the panel's top edge. The flying instruments
// stand an even gap apart, the right-hand section moved out to make room (product owner, D111).
//   Top: the ammunition counter (three tall windows, as #32, in place of #31's box of lamps and knobs: product owner),
//   a red push button, the Revi standing on the panel in the middle (in place of the "L ... R" instrument and the strip
//   under it, D107), the Spitfire's elevator trim gauge (product owner, D110: not original to the Bf 110; where #31 has
//   a pasted photograph) and the clock.
//   The flying instruments as the product owner arranged them (D108), each row's bottoms aligned: in the upper row the
//   repeater compass (Patin), turn and bank and climb indicator (under the Revi); in the lower row the strip compass,
//   the artificial horizon (the Patin compass's size), the airspeed indicator and the fine altimeter. The "00 00"
//   instrument, the "4 MG / 2 MG" strip and the "Umschalterstellung" strip are gone.
//   The airspeed indicator, altimeter, turn and bank and strip compass are the Bf 109's exactly, at its size on screen,
//   red bezels and setting knobs included (product owner, D107); the strip compass has no recess.
//   Right, a column per engine (left engine on the left): the airscrew pitch indicator (the Bf 109's, in place of the
//   fuel and oil pressure gauge: product owner, D109), the rev counter (to 3,600 rpm, as photographed), the manifold
//   pressure gauge in its red ring.
//   Bottom centre: each engine's coolant thermometer (the Bf 109's, D115) either side of the fuel contents gauge, four warning
//   lamps; under them the radiator flap switches either side of the fuel tank selector.
//   Left: the EIN/AUS undercarriage lights, the Landeklappe (flap) and Fahrwerk (undercarriage) switches, the magneto
//   switches, placards, the hydraulic pressure gauge and two knobs.
// Working: the flying and engine instruments, the clock, the ammunition counter, the flap and undercarriage switches
// and lights, the radiator switches, the trim gauge and the fuel gauge (the tank the selector chooses, full: fuel
// use is not modelled). The rest shows normal operation. The dials carry radium luminous paint, but for the fuel gauge
// (D105).

import { drawBf110Fittings } from './bf110Fittings.js';
import {
  mount, lwRpm, lwAta, lwClock, lwThermometer, lwPitchIndicator, lwFuelGauge, lwStripCompass, RPM_110,
} from './luftwaffeDials.js';
import { lwAirspeed, lwFineAltimeter, lwVario, lwHorizon, lwPatinCompass, lwTurnBank } from './lwFlightDials.js';
import { luminous } from './lwStyle.js';
import { redRing } from './bf110Dials.js';
import { millibarWindow } from './altimeters.js';
import { BF109_PANEL, BF109_PX, redBezel, settingKnob } from './bf109Panel.js';
import { REVI, shortRevi } from './reviParts.js';
import { SPITFIRE_PANEL } from './rafPanel.js';
import { rafTrimGauge } from './rafPanelDials.js';
import { bezel, dialScrews } from './panelParts.js';
import { PLACARD_FONT, speedPlacard } from './bf110Placards.js';

const PX = 30; // picture pixels per dial radius: the big dials' faces
const TOP = 57; // the panel's top edge
const FOOT = 475; // its lowest point
const HEIGHT = (FOOT - TOP) / PX + 0.1; // the panel's height in dial radii
const SHARE = 0.45; // the share of the screen's height it takes: as the RAF panel

/**
 * The Bf 109's dial radius in the Bf 110's (D107): the two panels fill their shares of the screen's height (every
 * screen tested is limited by its height), so the Bf 109's instruments and Revi are drawn at their own size on screen.
 */
export const BF109_SCALE = (BF109_PANEL.screenShare / BF109_PANEL.height) / (SHARE / HEIGHT);
const FROM_109 = (BF109_SCALE * PX) / BF109_PX; // the Bf 109's picture pixels to the Bf 110's

/** A Bf 109 instrument (its BF109_PANEL entry `name`) at (x, y) on the Bf 110's picture, its size as on the Bf 109. */
function as109(name, x, y) {
  const [, , face, outer] = BF109_PANEL.dials[name];
  return [x, y, face * FROM_109, outer * FROM_109];
}

/** The Bf 109's setting knob `knob` below its dial `dial`, under the same dial standing at (x, y) on the Bf 110's. */
function knob109(knob, dial, x, y) {
  const [, ky, rad] = BF109_PANEL.knobs[knob];
  return [x, y + (ky - BF109_PANEL.dials[dial][1]) * FROM_109, rad * FROM_109];
}

/**
 * Flying instruments standing in a row on a common foot (picture y), left to right from `left` with `gap` between their
 * mountings: `entries` are [name, [face, mounting half-width]]. Returns their dial entries by name (D108). Each row's
 * gaps are one even amount: GAP in the upper row (widened from 3 px, D111), LOWER_GAP in the lower (D112).
 */
const GAP = 10;
const LOWER_GAP = 15;
function row(foot, left, entries, gap = GAP) {
  const out = {};
  let x = left;
  for (const [name, [face, outer]] of entries) {
    out[name] = [x + outer, foot - outer, face, outer];
    x += 2 * outer + gap;
  }
  return out;
}
const size = (entry) => entry.slice(2);
const PATIN = [250, 185, 40, 47]; // the repeater compass, unmoved
const UPPER_FOOT = PATIN[1] + PATIN[3];
const LOWER_FOOT = 334;
const UPPER = row(UPPER_FOOT, PATIN[0] + PATIN[3] + GAP, [['turn', size(as109('turn', 0, 0))], ['climb', [28, 33]]]);
/**
 * The panel's middle line on #31's pixels: the climb indicator's column, under the Revi in the middle of the screen
 * (D108, D111; it was the turn and bank's at 428 on #31).
 */
export const AXIS = UPPER.climb[0];
const LOWER_LEFT = PATIN[0] - PATIN[3]; // the strip compass's left edge under the Patin compass's (D111; 194 before)
/**
 * How far the panel's right-hand section (its clock and trim gauge) stands out from #31's (D111): the lower row's three
 * gaps widened from 3 to 10 px and its start moved from 194 to LOWER_LEFT. The engine gauges stand by the edge (D112).
 */
const WIDEN = 3 * (10 - 3) + (LOWER_LEFT - 194);
const LOWER = row(LOWER_FOOT, LOWER_LEFT, [
  ['stripCompass', size(as109('compass', 0, 0))], ['horizon', size(PATIN)], ['airspeed', size(as109('airspeed', 0, 0))],
  ['altimeter', size(as109('altimeter', 0, 0))],
], LOWER_GAP);

/** The Revi on the Bf 110 (D107): the Bf 109's, its body 20% shorter, standing on the panel above the climb indicator. */
export const REVI_110 = shortRevi(REVI, 0.8);
// The knob's foot on #31: above the climb indicator's mounting (D108; the guns' line kept where the product owner
// approved it, D107). The panel is drawn 3 px below its canvas's top.
const KNOB_FOOT = 144;
/** The guns' line above the panel's top, in dial radii: the Revi's knob's foot below it, at its size. */
export const GLASS_ABOVE_110 = REVI_110.knob.y[1] * BF109_SCALE - (KNOB_FOOT - TOP) / PX;
/**
 * Where the guns' line stands looking ahead in the Bf 110's cockpit, as a fraction of the screen's height from its top:
 * GLASS_ABOVE_110 above the panel, which stands on the screen's foot (D107). The camera's picture is shifted to match
 * (`CameraRig.aim`, as the Bf 109's, D93).
 */
export const BF110_AIM = 1 - (SHARE * (HEIGHT + GLASS_ABOVE_110)) / HEIGHT;

/** A picture point in dial radii from the axis at the panel's top. */
export const P = (px, py) => [(px - AXIS) / PX, (py - TOP) / PX];

// The panel's outline traced on #31: the raised top section, the right section, the bottom centre extension, the gap
// beside it, the left wing.
// The left shoulder traced on #31, from the top edge's left end down to the left wing.
const LEFT_SHOULDER = [[263, 57], [240, 64], [223, 80], [210, 97], [202, 120], [193, 128], [177, 133], [157, 140], [147, 150], [130, 167]];
const CLOCK_X = 583 + WIDEN; // the clock's column (its 12 o'clock), moved out with the right-hand side
const SIDE_ANGLE = 75 * (Math.PI / 180); // the right-hand side's slope from the horizontal, as on #31 (D112)
const SIDE_FOOT = 350; // where the right-hand side meets the rounded corner above the section's bottom edge (360)
/**
 * The right shoulder: the left one mirrored, the top edge ending over the clock's 12 o'clock (product owner, D112), then
 * the right-hand side leaning out at SIDE_ANGLE down to the bottom edge, which is lengthened to meet it.
 */
const SHOULDER = LEFT_SHOULDER.map(([x, y]) => [CLOCK_X + (LEFT_SHOULDER[0][0] - x), y]);
const [SIDE_X, SIDE_Y] = SHOULDER[SHOULDER.length - 1];
const SIDE_X_FOOT = SIDE_X + (SIDE_FOOT - SIDE_Y) / Math.tan(SIDE_ANGLE);
const RIGHT = [...SHOULDER, [SIDE_X_FOOT, SIDE_FOOT], [SIDE_X_FOOT - 11, 360]];
const OUTLINE = [
  LEFT_SHOULDER[0], ...RIGHT,
  [548, 360], [544, 400], [538, 455], [528, 472], [338, 475], [326, 462], [312, 420], [302, 384], [292, 370], [205, 370],
  [188, 384], [180, 420], [176, 452], [166, 462], [66, 462], [57, 448], [60, 380], [63, 333], [70, 280], [83, 250],
  [93, 227], [110, 200], ...LEFT_SHOULDER.slice(1).reverse(),
];

/** Dial entries moved out WIDEN with the right-hand section (D111). */
function right(dials) {
  return Object.fromEntries(Object.entries(dials).map(([name, [x, ...rest]]) => [name, [x + WIDEN, ...rest]]));
}

const EDGE_MARGIN = 8; // picture px between the right-hand gauges' mountings and the panel's edge (D112)

/** The panel's right-hand edge (picture x) at height y, along the right shoulder and side. */
function edgeAt(y) {
  for (let i = 1; i < RIGHT.length; i += 1) {
    const [x0, y0] = RIGHT[i - 1];
    const [x1, y1] = RIGHT[i];
    if (y >= y0 && y <= y1) return y1 === y0 ? Math.max(x0, x1) : x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
  }
  return RIGHT[RIGHT.length - 1][0];
}

/**
 * An engine pair (`name`Left and `name`Right, as photographed on #31) moved right together until the right one's
 * mounting comes EDGE_MARGIN inside the edge at its top corner, the nearer one since the side leans out (D112).
 */
function toEdge(name, left, right) {
  const [rx, ry, , ro] = right;
  const shift = edgeAt(ry - ro) - EDGE_MARGIN - (rx + ro);
  const moved = ([x, ...rest]) => [x + shift, ...rest];
  return { [`${name}Left`]: moved(left), [`${name}Right`]: moved(right) };
}

/**
 * Everything on the panel, in picture pixels: the outline; dials [x, y, face radius, mounting half-width]; boxes
 * [left, top, right, bottom]; knobs and lamps [x, y, radius]; switches [x, top, bottom] (the knob's travel).
 */
export const BF110_PANEL = {
  width: (2 * Math.max(...OUTLINE.map(([x]) => Math.abs(x - AXIS)))) / PX + 0.2,
  height: HEIGHT,
  screenShare: SHARE,
  ownBackground: true,
  outline: OUTLINE,
  dials: {
    compass: PATIN, ...UPPER, ...LOWER,
    // The right-hand side, moved out WIDEN with its section of the outline (D111).
    ...right({
      clock: [583, 112, 20, 24], trim: [510, 112, 20, 24], // the Spitfire's trim gauge at the clock's size (D110)
    }),
    // Each engine pair moved out close to the sloping right-hand edge (product owner, D112).
    ...toEdge('pitch', [585, 175, 20, 24], [643, 175, 20, 24]), // the clock's size (product owner, D116)
    ...toEdge('rpm', [589, 243, 29, 33], [660, 243, 29, 33]),
    ...toEdge('ata', [602, 318, 28, 32], [673, 318, 28, 32]),
    // Each engine's coolant thermometer, the Bf 109's at its size, either side of the fuel gauge at the same size (D115).
    tempLeft: as109('coolTemp', 347, 381), fuel: as109('fuel', 428, 381), tempRight: as109('coolTemp', 509, 381),
    radiatorLeft: [365, 438, 18, 22], selector: [428, 438, 18, 22], radiatorRight: [491, 438, 18, 22],
    hydraulic: [118, 395, 18, 22],
  },
  boxes: {
    ammo: [260, 60, 367, 128.5], // the Bf 109's counter, at its shape (D113), clear of the Revi (D107)
    lights: [145, 152, 190, 196], flapLabel: [100, 228, 152, 240], gearLabel: [86, 345, 146, 357],
    magnetos: [86, 256, 148, 333], // the light box trimmed for the T levers (D114); the flap placard widened (D116)
    placard: [150, 258, 198, 312],
    // The space for the pilot's speed card below the trim gauge, its top level with the climb indicator's: drawn centred
    // under the trim gauge, as wide as its lettering (D116).
    speedCard: [480, UPPER.climb[1] - UPPER.climb[3], 600, 246],
  },
  knobs: {
    redButton: [231, 108, 11],
    setAltimeter: knob109('setAltimeter', 'altimeter', ...LOWER.altimeter),
    setAirspeed: knob109('setAirspeed', 'airspeed', ...LOWER.airspeed),
    lampTempL1: [386, 368, 6], lampTempL2: [386, 396, 6], lampTempR1: [470, 368, 6], lampTempR2: [470, 396, 6],
    knobLeft: [77, 434, 17], knobRight: [136, 434, 17],
  },
  switches: { flaps: [168, 213, 245], gear: [163, 330, 362] },
};

/** The Bf 110's Revi for reviPlacement (src/ui/reviSight.js): on its guns' line, at the Bf 109's size, no cable (D107). */
export const BF110_REVI = { panel: BF110_PANEL, aim: BF110_AIM, scale: BF109_SCALE, parts: REVI_110, cable: false };

/** A layout entry in canvas pixels, given the axis at the panel's top (x0, y0) and dial radius r. */
export function placer(x0, y0, r) {
  const xy = ([px, py]) => {
    const [dx, dy] = P(px, py);
    return [x0 + dx * r, y0 + dy * r];
  };
  const len = (px) => (px / PX) * r;
  const dial = ([px, py, face, outer]) => [...xy([px, py]), len(face), len(outer)];
  const box = ([l, t, rt, b]) => {
    const [ax, ay] = xy([l, t]);
    const [bx, by] = xy([rt, b]);
    return { x: ax, y: ay, w: bx - ax, h: by - ay };
  };
  const knob = ([px, py, rad]) => [...xy([px, py]), len(rad)];
  return { xy, len, dial, box, knob };
}

/** The dials drawn by the fittings (src/ui/bf110Fittings.js), not given a mounting here. */
const FITTED = ['trim', 'hydraulic', 'radiatorLeft', 'radiatorRight', 'selector'];

/** The Bf 109's instruments with its red bezels (D107). */
const RED_BEZELS = ['altimeter', 'airspeed'];

/** Draws the panel with the axis at its top at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf110Panel(g, x0, y0, r, v, now = new Date()) {
  const L = BF110_PANEL;
  const at = placer(x0, y0, r);
  drawBf110Fittings(g, at, L, v);
  for (const [name, entry] of Object.entries(L.dials)) {
    if (FITTED.includes(name)) continue;
    const [x, y, , outer] = at.dial(entry);
    if (RED_BEZELS.includes(name)) redBezel(g, x, y, outer);
    else mount(g, x, y, outer);
  }
  for (const name of ['setAltimeter', 'setAirspeed']) settingKnob(g, ...at.knob(L.knobs[name]));
  // The Spitfire's trim gauge in its RAF bezel with four screws, as on its panel, at the clock's size (D110).
  const [tx, ty, tf, to] = at.dial(L.dials.trim);
  bezel(g, tx, ty, tf, to);
  dialScrews(g, tx, ty, to, (to * 8) / SPITFIRE_PANEL.dials.trim[3]); // screws in proportion, as the Spitfire's
  rafTrimGauge(g, tx, ty, tf, v);
  // The pilot's speed card, centred under the trim gauge at the top of its space, level with the climb indicator (D116).
  speedPlacard(g, tx, at.box(L.boxes.speedCard).y, v.pilotCard, at.len(PLACARD_FONT));
  const dial = (name) => at.dial(L.dials[name]).slice(0, 3);
  luminous(() => {
    lwClock(g, ...dial('clock'), now);
    lwPatinCompass(g, ...dial('compass'), v.heading);
    lwTurnBank(g, ...dial('turn'), v.turnRate, v.sideG);
    lwVario(g, ...dial('climb'), v.climb);
    lwStripCompass(g, ...dial('stripCompass'), v.heading);
    const [ax, ay, ar] = dial('altimeter');
    lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
    lwHorizon(g, ...dial('horizon'), v.bank, v.pitch);
    lwAirspeed(g, ...dial('airspeed'), v.airspeed);
  });
  ['Left', 'Right'].forEach((side, i) => {
    const e = v.engines[i] ?? v.engines[0];
    const [rx, ry, rr] = dial(`rpm${side}`);
    const [mx, my, mr] = dial(`ata${side}`);
    redRing(g, mx, my, mr);
    luminous(() => {
      if (e.pitchClock) lwPitchIndicator(g, ...dial(`pitch${side}`), e.pitchClock); // each engine's blade angle (D109)
      lwRpm(g, rx, ry, rr, e.rpm, v.rpmLimit, RPM_110);
      lwAta(g, mx, my, mr, e.manifold);
      // The engine's coolant temperature, °C, on the Bf 109's thermometer with its blue ring (D89, D115).
      lwThermometer(g, ...dial(`temp${side}`), e.coolant, { label: 'Kühlst.', ring: '#2f8a96' });
    });
  });
  // The fuel contents of the tank the selector chooses (front left, at 1), white (D105).
  const tank = v.fuelSelected;
  lwFuelGauge(g, ...dial('fuel'), tank ? tank.litres : 0, tank ? tank.capacity : 0);
}
