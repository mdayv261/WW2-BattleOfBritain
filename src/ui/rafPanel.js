// Hurricane and Spitfire instrument panel (D86), redrawn in code after the product owner's reference picture of a
// Spitfire I panel (a 3D render, used only as the layout reference: nothing of it is copied into the game). Positions
// and sizes are measured on the picture (pixels, PX to a dial radius) from the panel's top centre, as the Bf 110's
// (D39).
//   Blind-flying panel (a raised plate): airspeed (mph), artificial horizon and climb above; altimeter, direction
//   indicator and the large turn and slip below.
//   Right: rev counter; the F.S. gear warning box; boost; oil pressure; oil and radiator temperatures; fuel contents with
//   its placard; the fuel pressure warning lamp. Top right: the voltmeter.
//   Left: navigation light switch, flap lever and its placard, the oxygen regulator with its two dials, the clock left
//   of the undercarriage UP/DOWN indicator, the trim gauge, magneto switches, the brake pressure gauge.
//   Bottom: compass deviation cards, flood-light knobs, boost-coil and starter buttons, the bottom-tank button.
// Working: the flight and engine instruments, the trim gauge, the UP/DOWN indicator, the flap lever and the clock (the
// computer's local time). The rest shows normal operation.

import { drawFittings } from './rafPanelFittings.js';
import { drawRafDials } from './rafPanelDials.js';

const PX = 82; // picture pixels per dial radius: the airspeed indicator's face
const CENTRE = 946; // the panel's centre on the picture
const TOP = 31; // its top edge

/** A picture point in dial radii from the panel's top centre. */
export const P = (px, py) => [(px - CENTRE) / PX, (py - TOP) / PX];

// The panel's outline, traced on the picture: the arch from the bottom left over the top to the bottom right, then
// along the foot.
const OUTLINE = [
  [65, 1012], [64, 951], [71, 911], [77, 871], [84, 831], [92, 791], [101, 751], [111, 711], [123, 671], [136, 631],
  [150, 591], [165, 551], [183, 511], [203, 471], [223, 431], [245, 391], [270, 351], [298, 311], [330, 271],
  [364, 231], [408, 191], [468, 151], [540, 111], [642, 71], [720, 51], [800, 38], [885, 31], [997, 31], [1090, 38],
  [1170, 51], [1240, 71], [1348, 111], [1418, 151], [1475, 191], [1520, 231], [1555, 271], [1586, 311], [1614, 351],
  [1639, 391], [1662, 431], [1683, 471], [1702, 511], [1720, 551], [1737, 591], [1751, 631], [1765, 671],
  [1777, 711], [1787, 751], [1797, 791], [1805, 831], [1812, 871], [1819, 911], [1826, 951], [1828, 1005],
  [1828, 1025], [1740, 1031], [1700, 1046], [180, 1036], [140, 1018],
];

/**
 * Everything on the panel, in picture pixels: dials [x, y, face radius, bezel radius]; boxes [left, top, right, bottom];
 * knobs and lamps [x, y, radius].
 */
export const SPITFIRE_PANEL = {
  width: (1829 - 63) / PX, height: (1048 - TOP) / PX + 0.1, ownBackground: true,
  // As tall as fits under the reflector sight in the middle of the view (as the Bf 109's panel, D41): a little under
  // half the screen.
  screenShare: 0.45,
  outline: OUTLINE.map(([x, y]) => P(x, y)),
  dials: {
    airspeed: [705, 510, 82, 96], horizon: [928, 510, 82, 96], climb: [1178, 512, 84, 98],
    altimeter: [705, 740, 80, 93], direction: [928, 735, 66, 78], turn: [1180, 738, 112, 126],
    rpm: [1427, 390, 86, 98], boost: [1577, 557, 55, 68], oilTemp: [1517, 747, 55, 68], radTemp: [1670, 747, 58, 70],
    fuel: [1616, 940, 84, 95],
    clock: [282, 680, 60, 72], trim: [478, 795, 57, 68], brakes: [305, 912, 68, 80],
    oxygenDelivery: [340, 482, 50, 60], oxygenSupply: [473, 482, 50, 60],
  },
  boxes: {
    blindFlying: [560, 415, 1325, 925], oilPressure: [1340, 682, 1405, 810], voltmeter: [1155, 90, 1290, 222],
    gearIndicator: [395, 548, 515, 708], fsGear: [1322, 505, 1503, 660], blankPlate: [1325, 530, 1395, 605],
    navLights: [390, 225, 465, 332], flapLever: [483, 260, 550, 335], flapPlacard: [605, 268, 710, 330],
    oxygen: [283, 350, 545, 565], magnetos: [115, 790, 195, 925], pumpNote: [102, 942, 200, 1000],
    cardLeft: [470, 925, 560, 1030], cardRight: [683, 930, 783, 1035], fuelPlacard: [1530, 818, 1705, 872],
    fuelWarning: [1732, 830, 1778, 922],
  },
  knobs: {
    altimeterSet: [700, 832, 14], directionSet: [923, 862, 18], nightBlind: [395, 527, 11], topLeft: [625, 375, 12],
    lampTest: [1067, 420, 9], floodPort: [870, 975, 24], floodStarboard: [990, 975, 24], boostCoil: [1107, 970, 31],
    starter: [1207, 970, 31], bottomTank: [1515, 985, 17], fsLamp: [1420, 572, 14], fuelLamp: [1755, 877, 17],
    clockSet: [318, 743, 8],
  },
  // Holes through the panel round its edge (the panel's mounting points) and the rivets on its face.
  holes: [[405, 212], [541, 126], [852, 46], [1012, 46], [1173, 67], [1330, 118], [1470, 205], [1581, 328],
    [1666, 467], [1735, 618], [1778, 766], [1812, 956], [78, 940], [113, 767], [153, 622], [218, 473], [312, 346]],
  rivets: [[720, 241], [783, 231], [860, 320], [915, 325], [1004, 269], [1036, 292], [1057, 226], [1062, 295],
    [1115, 213], [1118, 301], [589, 978], [630, 978], [1263, 978], [1300, 978], [1440, 1000], [1700, 1000]],
};

/** A layout entry in canvas pixels, given the panel's top centre (x0, y0) and dial radius r. */
export function placer(x0, y0, r) {
  const xy = ([px, py]) => {
    const [dx, dy] = P(px, py);
    return [x0 + dx * r, y0 + dy * r];
  };
  const len = (px) => (px / PX) * r;
  const dial = ([px, py, face, bezel]) => [...xy([px, py]), len(face), len(bezel)];
  const box = ([l, t, rt, b]) => {
    const [ax, ay] = xy([l, t]);
    const [bx, by] = xy([rt, b]);
    return { x: ax, y: ay, w: bx - ax, h: by - ay };
  };
  const knob = ([px, py, rad]) => [...xy([px, py]), len(rad)];
  return { xy, len, dial, box, knob };
}

/** Draws the panel with its top centre at (x0, y0) and dial radius r. `v` is instrumentReadings(); `now` a Date. */
export function rafPanel(g, x0, y0, r, v, now = new Date()) {
  const at = placer(x0, y0, r);
  drawFittings(g, at, SPITFIRE_PANEL, v);
  drawRafDials(g, at, SPITFIRE_PANEL, v, now);
}
