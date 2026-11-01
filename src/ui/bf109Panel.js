// Bf 109 E instrument panel (D89), redrawn in code after the product owner's pictures of a restored Bf 109 E panel (#17,
// again as #23 with the same layout as their drawing #15): its upper plate with the shoulders, the wings either side and
// the raised middle round the clock, and its lower plate with the two wings for the levers. The pictures are layout
// references only: nothing of them is copied into the game. Positions and sizes are measured on #17 in its pixels (PX
// to a dial radius) from the Revi's axis and the top of the upper plate.
//   Upper panel: the clock at the top; the flap placard, fine altimeter, repeater compass, manifold pressure and the
//   deviation card in the upper row; airspeed, turn and bank, the airscrew pitch switch, rev counter and the airscrew
//   pitch indicator in the lower row; the magneto switch, a push button, the Achtung placard and the pitot heater switch
//   on the left.
//   Lower panel: the lighting dimmer, a cover plate, the fuel and oil pressure gauge, the circuit breakers, the fuel
//   warning lamp, the fuel contents, oil and coolant thermometers, the undercarriage selector (Fahrwerk Ein / Ruhe /
//   Aus) and its emergency pull, the hand pump, the two levers, the four-lamp box and the narrow Ein/Aus strip.
// Working: the flight and engine instruments, the fuel contents (full: fuel use is not modelled), the undercarriage
// selector and the clock. The rest shows normal operation. Looking ahead, the screen shows the upper instruments and the
// top of the lower ones, as from the seat; looking down slides the whole panel into view (D89).

import { drawBf109Fittings } from './bf109Fittings.js';
import { drawBf109Lower } from './bf109Lower.js';
import {
  mount, lwAirspeed, lwRpm, lwAta, lwStripCompass, lwTurnBank, lwFineAltimeter, lwClock, lwPitchIndicator,
  pressureGauge, lwThermometer, lwFuelGauge,
} from './luftwaffeDials.js';
import { millibarWindow } from './altimeters.js';

const PX = 45; // picture pixels per dial radius: the airspeed indicator's face
const AXIS = 660; // the Revi's axis on the picture: the guns' line, the middle of the screen
const TOP = 227; // the top of the upper plate
const AHEAD = 612; // looking ahead, the screen shows the panel down to here: the top of the lower instruments
const FOOT = 868; // the bottom of the lower plate's wings
/** The guns' line above the top of the upper plate, in dial radii, as seen from the seat (#16). */
export const GLASS_ABOVE = 4.1;

/** A picture point in dial radii from the Revi's axis at the top of the upper plate. */
export const P = (px, py) => [(px - AXIS) / PX, (py - TOP) / PX];

// The upper plate (#17, #23): from its foot on the left up under the left wing, out to the wing's tip, up the left
// shoulder, the step up to the raised middle, its top behind the clock and the Revi, down the right, the right wing's tip
// and back under it to the foot.
const UPPER = [
  [262, 592], [258, 512], [192, 502], [190, 488], [295, 307], [378, 305], [383, 265], [398, 232], [590, 227],
  [710, 232], [772, 240], [790, 262], [802, 305], [845, 312], [975, 498], [968, 512], [905, 522], [900, 592],
];
// The lower plate (#17, #23): its top edge, the right wing with the hand pump lever, the foot, the left wing.
const LOWER = [
  [252, 592], [897, 592], [915, 578], [985, 575], [1000, 598], [1066, 860], [962, 864], [930, 846], [905, 818],
  [898, 810], [292, 810], [282, 820], [258, 850], [230, 865], [90, 864], [154, 629], [202, 629],
];

/**
 * Everything on the panel, in picture pixels: the upper and lower plates' outlines; dials [x, y, face radius, mounting half-width or bezel radius]; boxes
 * [left, top, right, bottom]; knobs and lamps [x, y, radius]; levers [x0, y0, x1, y1, knob radius].
 */
export const BF109_PANEL = {
  width: (2 * (AXIS - 90)) / PX + 0.2, // the panel's reach either side of the axis: the left wing is the farther
  height: (AHEAD - TOP) / PX + 0.1,
  full: (FOOT - TOP) / PX + 0.1, // the whole panel, seen when looking down
  // Looking ahead the guns' line is GLASS_ABOVE radii above the upper plate on the middle of the screen, the screen's foot at
  // AHEAD: the panel takes this share of the screen height.
  screenShare: ((AHEAD - TOP) / PX + 0.1) / (2 * ((AHEAD - TOP) / PX + 0.1 + GLASS_ABOVE)),
  ownBackground: true,
  lookDown: true,
  upper: UPPER,
  lower: LOWER,
  dials: {
    clock: [539, 272, 30, 40], altimeter: [411, 397, 44, 54], compass: [537, 392, 44, 55], ata: [742, 397, 44, 54],
    airspeed: [411, 522, 44, 54], turn: [537, 525, 44, 55], rpm: [740, 525, 44, 53], pitch: [850, 525, 31, 40],
    dimmer: [453, 646, 36, 42], pressure: [620, 645, 33, 42], fuel: [530, 765, 32, 40], oilTemp: [620, 762, 32, 40],
    coolTemp: [710, 765, 32, 40],
  },
  // The altimeter, manifold pressure and airspeed indicators have red bezels on the picture (#17).
  redBezels: ['altimeter', 'ata', 'airspeed'],
  boxes: {
    flapPlacard: [387, 268, 484, 335], magneto: [303, 375, 346, 491], achtung: [290, 495, 342, 534],
    button: [249, 446, 288, 508], pitot: [270, 540, 342, 580], pitchSwitch: [617, 460, 660, 580],
    deviation: [817, 335, 852, 467], cableHook: [632, 382, 656, 400],
    blank: [499, 607, 576, 687], breakers: [672, 607, 750, 687], coolantPlacard: [672, 696, 750, 721],
    reserve: [480, 702, 532, 719], reserveLamp: [552, 692, 602, 718], lampBox: [252, 692, 425, 800],
    fuelCock: [125, 750, 225, 847], arrowPlacard: [812, 662, 910, 682], gearSelector: [805, 695, 900, 749],
    emergency: [812, 772, 908, 795], handPump: [895, 616, 948, 628], pumpSlot: [955, 600, 970, 690],
    strip: [957, 750, 995, 830],
  },
  knobs: { setAltimeter: [411, 450, 11], setAta: [742, 447, 10], setAirspeed: [411, 576, 10], primer: [457, 757, 22] },
  bolts: [[436, 251], [734, 255], [211, 487], [952, 495], [160, 662], [110, 820], [177, 737], [972, 595], [1042, 832]],
  levers: { left: [250, 594, 132, 740, 27], right: [967, 584, 1002, 752, 27] },
};

/** A layout entry in canvas pixels, given the Revi's axis at the top of the upper plate (x0, y0) and dial radius r. */
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

/**
 * How far (CSS px) the panel slides up as the pilot looks down (D89): as far as a point straight ahead moves on the
 * screen for the head's pitch (rad, + up) at the camera's vertical field of view (degrees), up to the whole panel.
 */
export function lookDownShift(pitch, fov, height, r, L = BF109_PANEL) {
  if (!L.lookDown || pitch >= 0) return 0;
  const shift = (height / 2 / Math.tan((fov * Math.PI) / 360)) * Math.tan(-pitch);
  return Math.min(shift, (L.full - L.height) * r);
}

/** Draws the panel with the Revi's axis at the top of the upper plate at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf109Panel(g, x0, y0, r, v, now = new Date()) {
  const L = BF109_PANEL;
  const at = placer(x0, y0, r);
  drawBf109Fittings(g, at, L);
  drawBf109Lower(g, at, L, v);
  for (const [name, entry] of Object.entries(L.dials)) {
    if (name === 'dimmer') continue; // a switch: drawn with the fittings
    const [x, y, , outer] = at.dial(entry);
    if (L.redBezels.includes(name)) redBezel(g, x, y, outer);
    else mount(g, x, y, outer, name === 'clock' ? 'screw' : null);
  }
  const dial = (name) => at.dial(L.dials[name]).slice(0, 3);
  lwClock(g, ...dial('clock'), now);
  const [ax, ay, ar] = dial('altimeter');
  lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
  lwStripCompass(g, ...dial('compass'), v.heading);
  lwAta(g, ...dial('ata'), v.manifold);
  lwAirspeed(g, ...dial('airspeed'), v.airspeed);
  lwTurnBank(g, ...dial('turn'), v.turnRate, v.sideG);
  lwRpm(g, ...dial('rpm'), v.rpm, v.rpmLimit);
  lwPitchIndicator(g, ...dial('pitch'), v.pitchClock);
  if (v.pressures) pressureGauge(g, ...dial('pressure'), v.pressures.fuel, v.pressures.oil, { ring: null });
  const tank = v.fuelTanks?.[0];
  lwFuelGauge(g, ...dial('fuel'), tank ? tank.litres : 0, tank ? tank.capacity : 0, { ring: '#c9b52c' });
  lwThermometer(g, ...dial('oilTemp'), v.oil, { label: 'Öl' });
  lwThermometer(g, ...dial('coolTemp'), v.coolant, { label: 'Kühlst.', ring: '#2f8a96' });
  for (const name of ['setAltimeter', 'setAta', 'setAirspeed']) settingKnob(g, ...at.knob(L.knobs[name]));
}

/** The round red bezel of the altimeter, manifold pressure and airspeed indicators, with a dark rim. */
function redBezel(g, x, y, outer) {
  g.fillStyle = '#0d0d0d';
  g.beginPath();
  g.arc(x, y, outer * 1.04, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#8a3a2c';
  g.beginPath();
  g.arc(x, y, outer, 0, Math.PI * 2);
  g.fill();
}

/** A knurled black setting knob below a dial. */
function settingKnob(g, x, y, rad) {
  g.fillStyle = '#0c0c0c';
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#3a3c3e';
  g.lineWidth = Math.max(1, rad * 0.12);
  for (let k = 0; k < 12; k += 1) {
    const a = (k / 12) * Math.PI * 2;
    g.beginPath();
    g.moveTo(x + Math.cos(a) * rad * 0.7, y + Math.sin(a) * rad * 0.7);
    g.lineTo(x + Math.cos(a) * rad * 0.95, y + Math.sin(a) * rad * 0.95);
    g.stroke();
  }
}
