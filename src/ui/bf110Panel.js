// Bf 110 C instrument panel (D106), redrawn in code after the product owner's picture of a Bf 110 C panel (#31), with
// details from their picture of the cockpit (#32). The pictures are layout references only: nothing of them is copied
// into the game. Positions and sizes are measured on #31 in its pixels (PX to a dial radius) from the turn and bank
// indicator's column (where the Revi stands above it in #32, the middle of the screen) and the panel's top edge.
//   Top: the ammunition counter (three tall windows, as #32, in place of #31's box of lamps and knobs: product owner),
//   a red push button, the "4 MG / 2 MG" strip, the "L ... R" instrument and the strip under it, the elevator trim
//   indicator (D106, in place of a pasted photograph) and the clock.
//   Upper row: the repeater compass (Patin), the "00 00" instrument, turn and bank, climb indicator; under them the
//   "Umschalterstellung links / rechts" strip. Lower row: the strip compass in its recess, the fine altimeter, the
//   artificial horizon and the airspeed indicator.
//   Right, a column per engine (left engine on the left): the fuel and oil pressure gauge, the rev counter (to 3,600
//   rpm, as photographed), the manifold pressure gauge in its red ring.
//   Bottom centre: oil and coolant temperatures for each engine either side of the fuel contents gauge, four warning
//   lamps; under them the radiator flap switches either side of the fuel tank selector.
//   Left: the EIN/AUS undercarriage lights, the Landeklappe (flap) and Fahrwerk (undercarriage) switches, the magneto
//   switches, placards, the hydraulic pressure gauge and two knobs.
// Working: the flying and engine instruments, the clock, the ammunition counter, the flap and undercarriage switches
// and lights, the radiator switches, the trim indicator and the fuel gauge (the tank the selector chooses, full: fuel
// use is not modelled). The rest shows normal operation. The dials carry radium luminous paint, but for the fuel gauge
// (D105).

import { drawBf110Fittings } from './bf110Fittings.js';
import {
  mount, lwRpm, lwAta, lwClock, twoScaleGauge, pressureGauge, lwFuelGauge, lwStripCompass, RPM_110,
} from './luftwaffeDials.js';
import { lwAirspeed, lwFineAltimeter, lwVario, lwHorizon, lwPatinCompass, lwTurnBank } from './lwFlightDials.js';
import { luminous } from './lwStyle.js';
import { redRing } from './bf110Dials.js';
import { millibarWindow } from './altimeters.js';

const PX = 30; // picture pixels per dial radius: the big dials' faces
const AXIS = 428; // the turn and bank indicator's column on #31: the middle of the screen
const TOP = 57; // the panel's top edge
const FOOT = 475; // its lowest point

/** A picture point in dial radii from the axis at the panel's top. */
export const P = (px, py) => [(px - AXIS) / PX, (py - TOP) / PX];

// The panel's outline traced on #31: the raised top section, the right section, the bottom centre extension, the gap
// beside it, the left wing.
const OUTLINE = [
  [263, 57], [613, 58], [633, 117], [667, 147], [690, 180], [710, 227], [723, 273], [733, 327], [733, 350], [722, 360],
  [548, 360], [544, 400], [538, 455], [528, 472], [338, 475], [326, 462], [312, 420], [302, 384], [292, 370], [205, 370],
  [188, 384], [180, 420], [176, 452], [166, 462], [66, 462], [57, 448], [60, 380], [63, 333], [70, 280], [83, 250],
  [93, 227], [110, 200], [130, 167], [147, 150], [157, 140], [177, 133], [193, 128], [202, 120], [210, 97], [223, 80],
  [240, 64],
];

/**
 * Everything on the panel, in picture pixels: the outline; dials [x, y, face radius, mounting half-width]; boxes
 * [left, top, right, bottom]; knobs and lamps [x, y, radius]; switches [x, top, bottom] (the knob's travel).
 */
export const BF110_PANEL = {
  width: (2 * Math.max(AXIS - 57, 733 - AXIS)) / PX + 0.2,
  height: (FOOT - TOP) / PX + 0.1,
  screenShare: 0.45, // as the RAF panel: below the Revi in the middle of the view
  ownBackground: true,
  outline: OUTLINE,
  dials: {
    lr: [428, 93, 28, 33], clock: [583, 112, 20, 24],
    compass: [250, 185, 40, 47], counter: [343, 193, 27, 32], turn: [428, 193, 28, 33], climb: [513, 192, 28, 33],
    stripCompass: [255, 287, 27, 32], altimeter: [343, 297, 27, 32], horizon: [428, 297, 31, 37], airspeed: [513, 297, 28, 33],
    pressureLeft: [585, 175, 18, 22], pressureRight: [643, 175, 18, 22],
    rpmLeft: [589, 243, 29, 33], rpmRight: [660, 243, 29, 33],
    ataLeft: [602, 318, 28, 32], ataRight: [673, 318, 28, 32],
    tempLeft: [345, 381, 20, 24], fuel: [428, 381, 20, 24], tempRight: [511, 381, 20, 24],
    radiatorLeft: [365, 438, 18, 22], selector: [428, 438, 18, 22], radiatorRight: [491, 438, 18, 22],
    hydraulic: [118, 395, 18, 22],
  },
  boxes: {
    ammo: [275, 62, 382, 125], mgStrip: [298, 133, 385, 152], courseStrip: [391, 130, 470, 154],
    trim: [492, 82, 528, 150], umschalter: [394, 229, 462, 248],
    lights: [145, 152, 190, 200], flapLabel: [100, 228, 152, 240], gearLabel: [86, 345, 146, 357],
    magnetos: [86, 256, 148, 333], placard: [152, 258, 190, 322], recess: [205, 250, 298, 335],
  },
  knobs: {
    redButton: [249, 108, 11], umLeft: [383, 239, 7], umRight: [473, 239, 7],
    lampTempL1: [386, 368, 6], lampTempL2: [386, 396, 6], lampTempR1: [470, 368, 6], lampTempR2: [470, 396, 6],
    knobLeft: [77, 434, 17], knobRight: [136, 434, 17],
  },
  switches: { flaps: [168, 213, 245], gear: [163, 330, 362] },
};

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
const FITTED = ['lr', 'counter', 'hydraulic', 'radiatorLeft', 'radiatorRight', 'selector'];

/** Draws the panel with the axis at its top at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf110Panel(g, x0, y0, r, v, now = new Date()) {
  const L = BF110_PANEL;
  const at = placer(x0, y0, r);
  drawBf110Fittings(g, at, L, v);
  for (const [name, entry] of Object.entries(L.dials)) {
    if (FITTED.includes(name)) continue;
    const [x, y, , outer] = at.dial(entry);
    mount(g, x, y, outer);
  }
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
    const scale = { min: 0, max: 130, step: 10, majorStep: 50 };
    luminous(() => {
      if (v.pressures) pressureGauge(g, ...dial(`pressure${side}`), v.pressures.fuel, v.pressures.oil, { ring: null });
      lwRpm(g, rx, ry, rr, e.rpm, v.rpmLimit, RPM_110);
      lwAta(g, mx, my, mr, e.manifold);
      // Oil (left half) and coolant (right half) temperatures, °C, normal ranges in green (D63).
      twoScaleGauge(g, ...dial(`temp${side}`), { ...scale, value: e.oil, normal: v.normalTemps.oil },
        { ...scale, value: e.coolant, normal: v.normalTemps.coolant }, { labels: ['Öl', 'Kühl.'] });
    });
  });
  // The fuel contents of the tank the selector chooses (front left, at 1), white (D105).
  const tank = v.fuelSelected;
  lwFuelGauge(g, ...dial('fuel'), tank ? tank.litres : 0, tank ? tank.capacity : 0);
}
