// The Bf 110 C panel's layout (D140), measured on the product owner's picture "Bf110C panel_5.jpg" (#34: a render seen a
// little from the left, a layout reference only: redrawn in code, nothing copied). Measured in #34's pixels, its rows
// levelled and its spacing evened out, then turned into the layout's picture pixels (PX to a dial radius, TOP the panel's
// top edge, AXIS the middle line under the Revi: the turn and bank's column, product owner) at one scale, K, which draws
// the airspeed indicator at the Bf 109's size on screen (D107). Drawn by src/ui/bf110Panel.js and its fittings.

import { BF109_PANEL, BF109_PX } from './bf109Panel.js';
import { REVI, revi110 } from './reviParts.js';
import { MAG } from './bf110MagCompass.js';

export const PX = 30; // picture pixels per dial radius
export const TOP = 57; // the panel's top edge (as D106, so the cockpit frame's sizes keep their meaning)
export const AXIS = 440; // the panel's middle line: the turn and bank's column, under the Revi

const K = 0.46; // #34's pixels to the layout's: the airspeed indicator's face (76 on #34) at the Bf 109's size
const X34 = 882; // the turn and bank's column on #34
const Y34 = 132; // the panel's top edge on #34
const pt = (X, Y) => [AXIS + (X - X34) * K, TOP + (Y - Y34) * K];
const len = (d) => d * K;
/** A dial at (X, Y) on #34: its face's radius and its mounting's half-width, in #34's pixels. */
const dial = (X, Y, face, outer) => [...pt(X, Y), len(face), len(outer)];
const box = (l, t, r, b) => [...pt(l, t), ...pt(r, b)];
const knob = (X, Y, rad) => [...pt(X, Y), len(rad)];
/** An Ein/Aus switch: its slot's x, its Ein (top) and Aus (bottom) on #34. */
const slot = (X, top, bottom) => [pt(X, top)[0], pt(X, top)[1], pt(X, bottom)[1]];

// The outline on #34, levelled, clockwise from the top left corner over the clock (mounted directly in the panel, its
// bracket gone: product owner, D156): the long top edge, the right corner and side, the manifold pressure gauges' box, the bottom centre section, the gap beside
// it and the left wing with the airscrew lever box. Below the screen's foot it only closes the shape (D129).
// The right corner (product owner, D147, D151): the top edge carried on level to the right dash cover's front edge, along
// that edge three quarters of its length from the Revi's pad, then down at #34's shoulder slope (115 across for 95 down)
// until it touches the right fuselage side (the right outer post's inner edge), and down beside it to the right
// section's foot. Worked out from the cover and the post (src/ui/bf110Covers.js, src/ui/bf110Frame.js) and set here in
// #34's pixels; tests/ui/bf110Frame.test.js keeps them together.
const RIGHT_CORNER = [[1292.1, 132], [1479.8, 167.6], [1659.3, 315.9]];
// The right side (product owner, D152): from the corner's touch, at an obtuse angle, down the right fuselage side: the
// right outer post's inner edge to its foot, out to the fuselage sheet's inner edge there, and down it to the right
// section's foot, whose bottom edge runs out to meet it. Set in #34's pixels, kept with the frame by the same tests.
const RIGHT_SIDE = [[1688.3, 423.3], [1738.3, 423.3], [1910, 895]]; // the post's foot as moved by D154
// The left side (product owner, D153-D155): from below the top left corner a short way left, level, to about 10 mm
// (70 of #34's pixels) left of the clock's bottom left corner; then straight down and left past the airscrew lever
// box's top left corner until it touches the left fuselage side (the fuselage sheet's inner edge, src/ui/bf110Frame.js;
// tests/ui/bf110Frame.test.js keeps the touch); then straight down to below the screen's foot.
const LEVERS = [40, 465, 240, 855];
/** The Fahrwerk and Landeklappe switches' line: midway between the lever box's right edge and the compass's mounting's
 * left edge (470 - 110), on #34 (product owner, D198); they stood at 268 and 270. */
const SWITCH_X = (LEVERS[2] + (470 - 110)) / 2;
const LEFT_START = [185, 295];
const FAR_LEFT = -11.5; // the touch's x on #34, left of its frame
const LEFT_SLOPE = (LEVERS[1] - LEFT_START[1]) / (LEFT_START[0] - LEVERS[0]); // down for each pixel left
const LEFT_TOUCH = [FAR_LEFT, LEFT_START[1] + (LEFT_START[0] - FAR_LEFT) * LEFT_SLOPE];
const LEFT_SIDE = [[FAR_LEFT, 1120], LEFT_TOUCH, LEFT_START, [255, 295]];
const OUTLINE_34 = [
  [255, 132], ...RIGHT_CORNER, ...RIGHT_SIDE, [1160, 895], [1160, 1080], [1130, 1120], [640, 1120],
  [608, 1090], [605, 835], [345, 835], [335, 960], [320, 1120], ...LEFT_SIDE,
];
export const OUTLINE = OUTLINE_34.map(([X, Y]) => pt(X, Y));

const FOOT = Math.max(...OUTLINE.map(([, y]) => y));
/** The panel's height below its top edge, in dial radii. */
export const HEIGHT = (FOOT - TOP) / PX + 0.1;
/** How far the panel rises above its top edge, in dial radii (nothing since the clock's bracket went, D156). */
export const ABOVE = (TOP - Math.min(...OUTLINE.map(([, y]) => y))) / PX + 0.05;
// The panel lowered until the screen's foot touches the bottoms of the coolant thermometers (their green rings and
// mountings, 920 + 60 on #34; product owner, D141). The radiator switches, the tank selector and the Preßluft gauge
// below them go below the screen's foot.
const LOWEST = pt(0, 980)[1];
export const SINK = (FOOT - LOWEST) / PX + 0.1;
/**
 * How far the Revi stands above the panel's top edge, in dial radii: the gunsight is kept where it stood in D140 (its
 * foot on the panel's top while the screen's foot crossed the radiator switches' centres, 1045 on #34) while the panel
 * moved down (product owner, D141).
 */
export const REVI_RAISE = (pt(0, 1045)[1] - LOWEST) / PX;
/**
 * The share of the screen's height the panel's full height takes: the dial radius kept as a share of the screen's
 * height as since D106 (0.45 of the screen over 14.03 radii), so the Bf 109's instruments keep their size on screen.
 */
export const SHARE = HEIGHT * (0.45 / ((475 - 57) / PX + 0.1));
/** The Bf 109's dial radius in the Bf 110's (D107): its instruments and Revi drawn at their own size on screen. */
export const BF109_SCALE = (BF109_PANEL.screenShare / BF109_PANEL.height) / (SHARE / HEIGHT);
/**
 * The Revi-110 on the Bf 110 (D107, D130-D133): the Bf 109's Revi, its body cut to its brown pad, with a round glass as
 * wide as the body in a holder frame of the body's width. No mounting block, knob or sun filter lever (D132, D133).
 */
export const REVI_110 = revi110(REVI);
/** The guns' line above the Revi's foot, in dial radii, at the Bf 109's size (D133). */
export const GLASS_ABOVE_110 = REVI_110.body.y[1] * BF109_SCALE;
/** The guns' line's height in picture pixels: GLASS_ABOVE_110 above the Revi's foot, REVI_RAISE above the top edge. */
export const GUNS_Y = TOP - (REVI_RAISE + GLASS_ABOVE_110) * PX;
const FROM_109 = (BF109_SCALE * PX) / BF109_PX; // the Bf 109's picture pixels to the Bf 110's

/** A Bf 109 instrument (its BF109_PANEL entry `name`) at (X, Y) on #34, its size as on the Bf 109. */
function as109(name, X, Y) {
  const [, , face, outer] = BF109_PANEL.dials[name];
  return [...pt(X, Y), face * FROM_109, outer * FROM_109];
}

/** The Bf 109's setting knob `name` below its dial `of`, under the same dial standing at `entry` on the Bf 110's. */
function knob109(name, of, [x, y]) {
  const [, ky, rad] = BF109_PANEL.knobs[name];
  return [x, y + (ky - BF109_PANEL.dials[of][1]) * FROM_109, rad * FROM_109];
}

/**
 * How far the Kurs strip, the turn and slip indicator, the horizon, the altimeter, the climb indicator and the round
 * counter stand right of their places, in #34's pixels: 5 mm (product owner, D180). The panel's middle line (AXIS) and
 * the Revi stay, so the turn and slip indicator now stands 5 mm right of the Revi.
 */
const RIGHT_5MM = 34.7;
const HORIZON_X = 880 + RIGHT_5MM; // the horizon's centre line, the turn and slip indicator's too (D184)
const KURS = box(790 + RIGHT_5MM, 312, 975 + RIGHT_5MM, 382); // the Kurs strip, 5 mm right (D180)
const KURS_X = (KURS[0] + KURS[2]) / 2; // its centre line, the Kurssteuerung indicator's too (D187)
const AIRSPEED = as109('airspeed', 690, 480);
const SIZE = AIRSPEED.slice(2); // the airspeed indicator's face and mounting
// The turn and slip indicator: the airspeed indicator's size exactly (D173), its centre line the horizon's (D184).
const TURN = [...pt(HORIZON_X, 480), ...SIZE];
// The climb indicator: the airspeed indicator's size (D175), as far from the turn and slip indicator as that is from
// the airspeed indicator (D185).
const ROW_GAP = TURN[0] - SIZE[1] - (AIRSPEED[0] + SIZE[1]);
const CLIMB = [TURN[0] + 2 * SIZE[1] + ROW_GAP, TURN[1], ...SIZE];
// The altimeter: its foot level with the trim indicator's (D179), on the climb indicator's centre line (D186).
const altimeter = [CLIMB[0], pt(0, 716)[1], ...as109('altimeter', 0, 0).slice(2)];
/**
 * How far the right engine's rev counter and manifold pressure gauge stand right of #34's place, in #34's pixels
 * (product owner, D165): 25 mm on the product owner's 2560 px wide screen, taken as 43 screen px to 10 mm (as D154),
 * where one of #34's pixels is 0.619 screen px.
 */
const RIGHT_MOVE = 173.6;
const LEFT_MOVE = 138.9; // the left engine's, 15 mm (D166) and 5 mm more (D167), the same way
const ENGINE_UP = 34.7; // both engines' gauges 5 mm up (D168)
const RPM_UP = ENGINE_UP + 20.8; // the rev counters 3 mm more (D170)
const UP_4MM = 27.8; // the round counter and the Heizung placard 4 mm up (D172)
// The outside air thermometer's mounting's left edge, in line with the left manifold pressure gauge's (D169); the
// Heizung placard's left edge in line with it too (D178).
const OAT_LEFT = 1265 + LEFT_MOVE - 86;
/**
 * The magnetic compass on its bracket (product owner's picture #36, D203), on #34: its case's half-width (55 first,
 * then 20% and 25% larger) and its bracket's, MAG.bracket wider all round. The bracket stands next to the Heizung
 * placard, 3 right of it, its foot 4 above the right rev counter's correction card (520 - RPM_UP). Its top right corner
 * overhangs the panel's sloping edge onto the frame.
 */
/** A box moved sideways to stand centred on the layout's x (product owner, D206: under the dial above it). */
const centredOn = (x, [l, t, r, b]) => [x - (r - l) / 2, t, x + (r - l) / 2, b];
// The labels between the flying instruments, each centred under the dial above it (D206): the dive placard under the
// airspeed indicator, the Umschaltwarnung placard (its lamps with it) under the turn and slip indicator and the two-bar
// window under the climb indicator.
const DIVE = centredOn(AIRSPEED[0], box(615, 578, 735, 620));
const UMSCHALT_34 = box(806, 576, 959, 603);
const UMSCHALT = centredOn(TURN[0], UMSCHALT_34);
const UMSCHALT_SHIFT = UMSCHALT[0] - UMSCHALT_34[0];
const lamp = ([x, y, rad]) => [x + UMSCHALT_SHIFT, y, rad];
const WINDOW = centredOn(CLIMB[0], box(1042, 590 - 13.9, 1122, 630 - 13.9)); // 2 mm up (D176)
const MAG_CASE = 55 * 1.2 * 1.25;
const MAG_HALF = MAG_CASE * (1 + MAG.bracket);
const MAG_LEFT = OAT_LEFT + 133 + 3;
const MAG_FOOT = 520 - RPM_UP - 4;

/**
 * Everything on the panel, in the layout's picture pixels: dials [x, y, face radius, mounting half-width]; boxes [left,
 * top, right, bottom]; knobs and lamps [x, y, radius]; switches [x, top, bottom] (the lever's travel).
 */
export const LAYOUT = {
  dials: {
    // Top row: the clock, mounted directly in the panel (D156), the Kurssteuerung indicator and the round counter.
    clock: dial(325, 230, 50, 62),
    autopilot: [KURS_X, pt(0, 237)[1], len(55), len(65)], // on the Kurs strip's centre line (D187)
    // On the climb indicator's centre line (D186), and its size: the round body as wide as the climb indicator's
    // mounting (product owner, D197).
    counter: [CLIMB[0], pt(0, 280 - UP_4MM)[1], ...SIZE],
    // The flying instruments: the repeater compass; the airspeed indicator, turn and bank and climb indicator (the first
    // two the Bf 109's); the elevator trim indicator (D161), horizon and altimeter (the Bf 109's) below.
    compass: dial(470, 418, 92, 110), airspeed: AIRSPEED, turn: TURN, climb: CLIMB,
    // The elevator trim indicator at the airspeed indicator's size, a little lower to clear the dive placard (D174).
    trim: [...pt(690, 716), ...as109('airspeed', 0, 0).slice(2)], // its right edge in line with the airspeed's (D183)
    altimeter,
    horizon: [...pt(HORIZON_X, 715), ...as109('airspeed', 0, 0).slice(2).map((v) => v * 1.15)], // 15% larger (D177)
    // The outside air thermometer (the airscrew pitch indicators of D109 removed: the Bf 110 C had none, D163).
    // Its left edge in line with the left manifold pressure gauge's, 5 mm up (product owner, D169).
    airTemp: dial(OAT_LEFT + 60, 440 - ENGINE_UP, 52, 60),
    // Each engine's rev counter and manifold pressure gauge.
    // The right engine's moved 25 mm right (product owner, D165), the left engine's 20 mm (D166, D167); all 5 mm up
    // (D168), the rev counters 3 mm more (D170).
    rpmLeft: dial(1265 + LEFT_MOVE, 630 - RPM_UP, 78, 86), rpmRight: dial(1442 + RIGHT_MOVE, 630 - RPM_UP, 78, 86),
    ataLeft: dial(1265 + LEFT_MOVE, 805 - ENGINE_UP, 78, 86), ataRight: dial(1442 + RIGHT_MOVE, 805 - ENGINE_UP, 78, 86),
    // Bottom centre: the coolant thermometers either side of the fuel gauge; below them the radiator flap switches either
    // side of the tank selector, now below the screen's foot (D141); the Preßluft gauge on the left wing.
    tempLeft: dial(682, 920, 50, 60), fuel: dial(877, 920, 50, 60), tempRight: dial(1072, 920, 50, 60),
    radiatorLeft: dial(725, 1045, 46, 56), selector: dial(867, 1045, 44, 52), radiatorRight: dial(1010, 1045, 46, 56),
    pressluft: dial(180, 905, 42, 48), // below the airscrew lever box, between its labels, as #34 (product owner, D141)
  },
  boxes: {
    skk: box(525, 145, 775, 300), mgSwitch: box(590, 307, 785, 367), kurs: KURS,
    heizung: box(OAT_LEFT, 245 - UP_4MM, OAT_LEFT + 133, 352 - UP_4MM), levers: box(...LEVERS),
    // (the Heizung placard: 4 mm up with the round counter, D172; its left edge in line with the thermometer's, D178)
    gearLights: box(202.5, 312.5, 352.5, 462.5), // round, the round counter's diameter (D157, D158)
    achtung: box(250, 590, 345, 730), dive: DIVE,
    course: box(360, 550, 580, 830), // the repeater compass's width, under it (D159)
    umschalt: UMSCHALT, window: WINDOW, // centred under their dials (D206)
    // (the Landeklappe label centred under its switch, its width kept, D198)
    fahrwerkLabel: box(55, 858, 125, 878), klappeLabel: box(SWITCH_X - 36.5, 870, SWITCH_X + 36.5, 892),
  },
  // The "d 30′ 5′" correction cards above the engine gauges and the "Km" cards above the coolant thermometers: shown
  // only, lying over the tops of their dials' mountings, as photographed.
  // The magnetic compass's bracket, the case centred in it (D203); apart from the boxes, as it overhangs the panel's edge.
  magCompass: box(MAG_LEFT, MAG_FOOT - 2 * MAG_HALF, MAG_LEFT + 2 * MAG_HALF, MAG_FOOT),
  cards: {
    rpmLeft: box(1185 + LEFT_MOVE, 520 - RPM_UP, 1345 + LEFT_MOVE, 557 - RPM_UP),
    rpmRight: box(1362 + RIGHT_MOVE, 520 - RPM_UP, 1522 + RIGHT_MOVE, 557 - RPM_UP),
    ataLeft: box(1185 + LEFT_MOVE, 697 - ENGINE_UP, 1345 + LEFT_MOVE, 734 - ENGINE_UP),
    ataRight: box(1362 + RIGHT_MOVE, 697 - ENGINE_UP, 1522 + RIGHT_MOVE, 734 - ENGINE_UP),
    tempLeft: box(627, 842, 737, 895), tempRight: box(1017, 842, 1127, 895),
  },
  knobs: {
    redButton: knob(442, 252, 30), heizungKnob: knob(OAT_LEFT + 55, 340 - UP_4MM, 30),
    umschaltLeft: lamp(knob(790, 590, 12)), umschaltRight: lamp(knob(975, 590, 12)), // with their placard (D206)
    tankLeftFront: knob(775, 885, 17), tankLeftRear: knob(775, 955, 17),
    tankRightFront: knob(975, 885, 17), tankRightRear: knob(975, 955, 17),
    setAltimeter: knob109('setAltimeter', 'altimeter', altimeter),
  },
  // Both on the vertical centre line between the airscrew lever box and the compass's mounting (product owner, D198).
  // The Landeklappe pair 20 up from 775 / 835, so its pulled-out AUS T stays on the plate above the step beside the
  // course box (D199). Each pair then spread 5 apart (D200), its thumb discs riding on the T, clear of the boxes above
  // and below.
  switches: { gear: slot(SWITCH_X, 500, 560), flaps: slot(SWITCH_X, 760, 820) },
};
