// Guns, rounds and belts (Phase 5, D67). Every number has a row, keyed by its path, in docs/AIRCRAFT_DATA.md, section
// "Ammunition (Phase 5)". SI units: kg, m, m/s, rounds per second.
//
// Each round's drag against Mach number is fitted to its sourced range table by scripts/fitBallistics.mjs: the .303 Mk
// VII to the Hythe table (S37), the 7.92 mm and 20 mm to Rechlin's firing tables (S41). Pairs are [Mach, Cd].
import { UNIT } from '../core/constants.js';

const ROUNDS_PER_MINUTE = 1 / 60;

/** The flight of each kind of round. */
export const ballistics = {
  mk7: { // .303 in Mark VII ball (S37): every .303 round flies like it (D67)
    mass: 0.011275, // 174 grains
    calibre: 0.0079, // 0.311 in
    muzzleVelocity: 2440 * UNIT.FT, // 2,440 f/s
    drag: [[0.9226, 0.2393], [0.9853, 0.2988], [1.0659, 0.3453], [1.1644, 0.3794], [1.2809, 0.4024], [1.4152, 0.4163],
      [1.5675, 0.4228], [1.7332, 0.4036], [1.9079, 0.3859], [2.0915, 0.3696]],
  },
  mg17: { // 7.92 mm armour-piercing bullet (S41): every 7.92 mm round flies like it (D61)
    mass: 0.010,
    calibre: 0.00792,
    muzzleVelocity: 810,
    drag: [[0.7655, 0.2163], [0.8214, 0.249], [0.8889, 0.2739], [0.9742, 0.33], [1.0932, 0.428], [1.2578, 0.4963],
      [1.4664, 0.5189], [1.7074, 0.4912], [1.9674, 0.451], [2.2407, 0.4133]],
  },
  mgffm: { // 2 cm FF/M 117 g shells (S41); no mine shell (D61)
    mass: 0.117,
    calibre: 0.020,
    muzzleVelocity: 585,
    drag: [[0.8552, 0.2089], [0.8889, 0.2612], [0.933, 0.3255], [0.9918, 0.4144], [1.0653, 0.4529], [1.1534, 0.5113],
      [1.2563, 0.5264], [1.3709, 0.5345], [1.4987, 0.5486], [1.6427, 0.5658]],
  },
};

/** Gun types: cyclic rate (rounds/s) and the rounds they fire. */
export const weapons = {
  browning: { rate: 1100 * ROUNDS_PER_MINUTE, ballistics: 'mk7' }, // Browning .303 Mk II (S39)
  mg17: { rate: 1100 * ROUNDS_PER_MINUTE, syncRate: 1000 * ROUNDS_PER_MINUTE, ballistics: 'mg17' }, // S27
  mgffm: { rate: 475 * ROUNDS_PER_MINUTE, ballistics: 'mgffm' }, // MG FF/M, middle of 450-500 (S27, D61)
};

/**
 * Kinds of round: how each shows in flight ('smoke' trail, 'tracer' streak, or nothing in daylight) and for how long
 * (s); and what it does on a hit (D68): its strength (rifle-calibre 1), whether it pierces armour (ap) or explodes (he,
 * damaging a second component), and how readily it sets things alight (incendiary, 0-1). Strengths and incendiary
 * values are estimates.
 */
export const roundTypes = {
  ball303: { shows: null, strength: 1 },
  ap303: { shows: null, strength: 1, ap: true }, // W Mark I (S37)
  incendiary303: { shows: 'smoke', burn: 1.0, strength: 1, incendiary: 0.5 }, // old-type incendiary (S38)
  deWilde303: { shows: null, strength: 1, incendiary: 1 }, // "almost magical properties" (S38)
  ap792: { shows: null, strength: 1, ap: true },
  incendiary792: { shows: null, strength: 1, incendiary: 1 },
  observing792: { shows: null, strength: 1, incendiary: 0.5 }, // B-Patrone: a flash where it strikes
  heIncendiary20: { shows: null, strength: 5, he: true, incendiary: 1 },
  heTracer20: { shows: 'tracer', burn: 1.8, strength: 5, he: true }, // 20 mm tracer burns about 1.8 s (S40)
};

/** Belts that repeat a sequence of rounds (D61). RAF guns each carry one kind of round, set per gun (S38). */
export const belts = {
  mg17: ['ap792', 'incendiary792', 'observing792'],
  mgffm: ['heIncendiary20', 'heTracer20'],
};
