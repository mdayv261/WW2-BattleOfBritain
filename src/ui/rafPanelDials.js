// The RAF panel's dials (D86), drawn after the product owner's reference picture of a Spitfire I panel: each in its
// bezel with its mounting screws. The flight instruments are the RAF faces (src/ui/airspeed.js, altimeters.js,
// rafBlindFlying.js, engineGauges.js); the engine gauges, clock, trim gauge, brake pressure and oxygen dials are here.
// Scales are read off the picture where they are not evenly spread (tableAngle). Working: the flight and engine
// instruments, the trim gauge and the clock (local time). Static at their normal readings: the fuel contents (full: fuel
// use is not modelled), brake pressures and oxygen.
// Coloured bands (D85): green over the normal ranges (S33), orange over the +12 lb emergency boost.

import { C, polar, tableAngle, text, bezel, dialScrews, knob, pointer, scaleMarks, band, roundRect } from './panelParts.js';
import { rafAirspeed } from './airspeed.js';
import { rafAltimeter } from './altimeters.js';
import { rafHorizon, rafClimb, rafTurnSlip } from './rafBlindFlying.js';
import { rafTachometer } from './engineGauges.js';
import { headingDrum } from './dials.js';

// Scales read off the picture: [value, degrees from twelve o'clock, clockwise].
export const BOOST_SCALE = [[-4, -69], [-2, -35], [0, 0], [2, 34], [4, 68], [6, 100], [8, 128], [10, 157], [12, 194],
  [14, 226], [16, 251]];
export const OIL_TEMP_SCALE = [[0, -138], [20, -96], [40, -35], [60, 24], [80, 98], [100, 150]];
export const RAD_TEMP_SCALE = [[40, -154], [60, -112], [80, -80], [90, -53], [100, -30], [110, -1], [120, 33],
  [130, 95], [140, 140]];
// The fuel gauge's needle hangs from a pivot under its placard: degrees from straight down, + to the right.
export const FUEL_FLIGHT_SCALE = [[0, -28], [5, -16], [10, -6], [20, 4.5], [30, 18], [37, 28]];
const FUEL_GROUND_SCALE = [[0, -27.5], [5, -12], [10, 0], [15, 5], [25, 11.6], [30, 19], [37, 26.6]];
const DELIVERY_SCALE = [[0, -150], [10, -125], [20, -95], [30, -40], [35, -12], [40, 15]];
const SUPPLY_SCALE = [[0, -150], [0.25, -75], [0.5, 0], [0.75, 75], [1, 140]];
export const TRIM_SWING = 30; // degrees the trim gauge's needle swings each way over the full trim range
export const OIL_PRESSURE_RANGE = 150; // lb/sq in at the top of the oil pressure gauge

const angleOf = (table) => (value) => tableAngle(table, value);

/** Draws every dial. `at` is the panel's placer, L its layout, v the readings, now a Date. */
export function drawRafDials(g, at, L, v, now) {
  const d = L.dials;
  const s = at.len(8);
  const mounted = (name, fn, { ring = null, screws = true } = {}) => {
    const [x, y, f, o] = at.dial(d[name]);
    bezel(g, x, y, f, o, ring);
    if (screws) dialScrews(g, x, y, o, s);
    fn(x, y, f);
  };
  // The altimeter's and direction indicator's setting knobs sit below their bezels.
  knob(g, ...at.knob(L.knobs.altimeterSet));
  knob(g, ...at.knob(L.knobs.directionSet));
  mounted('airspeed', (x, y, f) => rafAirspeed(g, x, y, f, v.airspeed));
  mounted('horizon', (x, y, f) => rafHorizon(g, x, y, f, v.bank, v.pitch));
  mounted('climb', (x, y, f) => rafClimb(g, x, y, f, v.climb));
  mounted('altimeter', (x, y, f) => rafAltimeter(g, x, y, f, v.altitude, 1013));
  mounted('direction', (x, y, f) => headingDrum(g, x, y, f, v.heading, null, C.mark), { screws: false });
  mounted('turn', (x, y, f) => rafTurnSlip(g, x, y, f, v.turnRate, v.sideG));
  mounted('rpm', (x, y, f) => rafTachometer(g, x, y, f, v.rpm));
  mounted('boost', (x, y, f) => boostGauge(g, x, y, f, v), { ring: C.amber });
  mounted('oilTemp', (x, y, f) => oilTempGauge(g, x, y, f, v), { ring: C.yellowRing });
  mounted('radTemp', (x, y, f) => radTempGauge(g, x, y, f, v));
  mounted('clock', (x, y, f) => clock(g, x, y, f, now));
  knob(g, ...at.knob(L.knobs.clockSet), '#3a3a3a');
  mounted('trim', (x, y, f) => trimGauge(g, x, y, f, v, at));
  mounted('brakes', (x, y, f) => brakeGauge(g, x, y, f));
  mounted('oxygenDelivery', (x, y, f) => oxygenDial(g, x, y, f, DELIVERY_SCALE, 8, 'delivery'), { screws: false });
  mounted('oxygenSupply', (x, y, f) => oxygenDial(g, x, y, f, SUPPLY_SCALE, 1, 'supply'), { screws: false });
  oilPressureGauge(g, at, L, v);
  fuelGauge(g, at, L, v);
}

function boostGauge(g, x, y, f, v) {
  const angle = angleOf(BOOST_SCALE);
  const normal = v.normalBoost;
  if (normal) band(g, x, y, f, angle, normal[0], normal[1], C.green);
  band(g, x, y, f, angle, 12, 16, C.orange);
  scaleMarks(g, x, y, f, angle, {
    ticks: [{ every: 1, from: -4, to: 16, len: 0.08, width: 0.025 }, { every: 2, from: -4, to: 16, len: 0.15, width: 0.045 }],
    figures: [
      { values: [-4, 4], size: 0.21, radius: 0.66, label: (k) => String(Math.abs(k)) },
      { values: [-2, 2], size: 0.21, radius: 0.66, label: (k) => String(Math.abs(k)), colour: C.white },
      { values: [6, 8], size: 0.21, radius: 0.66 },
      { values: [10, 12, 14, 16], size: 0.21, radius: 0.66, colour: C.white },
    ],
  });
  text(g, '–', ...polar(x, y, -0.33, f * 0.62), f * 0.2, C.white, { bold: true });
  text(g, '+', ...polar(x, y, 0.33, f * 0.62), f * 0.2, C.white, { bold: true });
  // The red mark on the rim at the normal maximum, +6¼ lb.
  g.strokeStyle = '#d0141a';
  g.lineWidth = f * 0.12;
  g.beginPath();
  g.arc(x, y, f * 1.02, angle(6) - Math.PI / 2, angle(7) - Math.PI / 2);
  g.stroke();
  text(g, 'BOOST', x, y - f * 0.3, f * 0.2, C.mark, { bold: true });
  text(g, 'PRESS', x, y + f * 0.32, f * 0.2, C.white, { bold: true });
  text(g, 'LB/SQ.IN', x, y + f * 0.48, f * 0.1, C.white);
  pointer(g, x, y, angle(v.manifold), f * 0.88, f * 0.08, C.mark);
}

function oilTempGauge(g, x, y, f, v) {
  const angle = angleOf(OIL_TEMP_SCALE);
  if (v.normalTemps) band(g, x, y, f, angle, ...v.normalTemps.oil, C.green);
  scaleMarks(g, x, y, f, angle, {
    colour: C.white,
    ticks: [{ every: 10, from: 0, to: 100, len: 0.1, width: 0.03 }, { every: 20, from: 0, to: 100, len: 0.16, width: 0.045 }],
    figures: [{ values: [0, 20, 40, 60, 80, 100], size: 0.2, radius: 0.66 }],
  });
  text(g, 'OIL', x, y - f * 0.22, f * 0.2, C.white, { bold: true });
  text(g, 'TEMP', x, y + f * 0.3, f * 0.2, C.white, { bold: true });
  pointer(g, x, y, angle(v.oil), f * 0.85, f * 0.08, C.mark);
}

function radTempGauge(g, x, y, f, v) {
  const angle = angleOf(RAD_TEMP_SCALE);
  if (v.normalTemps) band(g, x, y, f, angle, ...v.normalTemps.coolant, C.green);
  scaleMarks(g, x, y, f, angle, {
    ticks: [{ every: 5, from: 40, to: 140, len: 0.08, width: 0.025 }, { every: 10, from: 40, to: 140, len: 0.15, width: 0.045 }],
    figures: [{ values: [60, 80, 90, 100, 110, 120, 130, 140], size: 0.18, radius: 0.68 }],
  });
  text(g, 'RAD', x, y - f * 0.22, f * 0.2, C.white, { bold: true });
  text(g, 'TEMP', x, y + f * 0.3, f * 0.2, C.mark, { bold: true });
  pointer(g, x, y, angle(v.coolant), f * 0.85, f * 0.08, C.mark);
}

/** The edgewise oil pressure gauge in its red-brown case, 0-150 lb/sq in. */
function oilPressureGauge(g, at, L, v) {
  const b = at.box(L.boxes.oilPressure);
  g.fillStyle = '#6e3227';
  roundRect(g, b.x, b.y, b.w, b.h, at.len(8));
  g.fill();
  g.fillStyle = '#4a1f18';
  for (const [sx, sy] of [[0.18, 0.06], [0.82, 0.06], [0.18, 0.94], [0.82, 0.94]]) {
    g.beginPath();
    g.arc(b.x + b.w * sx, b.y + b.h * sy, at.len(3.5), 0, Math.PI * 2);
    g.fill();
  }
  text(g, 'OIL', b.x + b.w / 2, b.y + at.len(9), at.len(10), '#e6a24a', { bold: true });
  text(g, 'LB/□"', b.x + b.w / 2, b.y + b.h - at.len(9), at.len(9.5), '#e6a24a', { bold: true });
  const w = at.box([1358, 702, 1390, 792]);
  g.fillStyle = '#121212';
  roundRect(g, w.x, w.y, w.w, w.h, at.len(5));
  g.fill();
  const yOf = (p) => w.y + w.h * 0.92 - (Math.min(Math.max(p, 0), OIL_PRESSURE_RANGE) / OIL_PRESSURE_RANGE) * w.h * 0.84;
  const lx = w.x + w.w * 0.28;
  g.strokeStyle = C.mark;
  g.lineWidth = Math.max(1, at.len(1.5));
  g.beginPath();
  g.moveTo(lx, yOf(0));
  g.lineTo(lx, yOf(OIL_PRESSURE_RANGE));
  g.stroke();
  for (let p = 0; p <= OIL_PRESSURE_RANGE; p += 10) {
    const major = p % 30 === 0;
    g.strokeStyle = major && p % 60 === 0 && p ? '#b03a2a' : C.mark;
    g.beginPath();
    g.moveTo(lx, yOf(p));
    g.lineTo(lx + at.len(major ? 6 : 3.5), yOf(p));
    g.stroke();
    if (major && p) text(g, String(p), w.x + w.w * 0.68, yOf(p), at.len(7.5), p % 60 === 0 ? '#b03a2a' : C.mark);
  }
  // The pointer: a bright bar across the ladder at the pressure.
  g.fillStyle = C.mark;
  g.fillRect(w.x + at.len(2), yOf(v.oilPressure ?? 0) - at.len(1.5), w.w * 0.5, at.len(3));
}

/** The fuel contents gauge (bottom tank), its needle hanging from under the placard, and the placard. */
function fuelGauge(g, at, L, v) {
  const [x, y, f, o] = at.dial(L.dials.fuel);
  bezel(g, x, y, f, o);
  text(g, 'CAPACITY TANK', x, y - f * 0.68, f * 0.11, '#c8783a');
  text(g, '37 GALLONS', x, y - f * 0.56, f * 0.09, '#c8783a');
  text(g, 'GALLONS  FUEL', x, y - f * 0.35, f * 0.17, C.white, { bold: true });
  text(g, 'TAIL ON GROUND', x, y - f * 0.18, f * 0.09, C.white, { bold: true });
  text(g, 'NORMAL FLIGHT', x, y + f * 0.5, f * 0.12, C.white, { bold: true });
  text(g, 'FORE & AFT LEVEL ZERO', x, y + f * 0.64, f * 0.075, C.white, { bold: true });
  const [px, py] = at.xy([1617, 847]);
  const R = at.len(110);
  const down = (deg) => [px + Math.sin(deg * Math.PI / 180) * R, py + Math.cos(deg * Math.PI / 180) * R];
  const onArc = (table, value, d) => {
    const a = tableAngle(table, value);
    return [px + Math.sin(a) * (R + d), py + Math.cos(a) * (R + d)];
  };
  g.strokeStyle = C.mark;
  g.lineWidth = Math.max(1, at.len(2));
  g.beginPath();
  g.arc(px, py, R, Math.PI / 2 - (28 * Math.PI) / 180, Math.PI / 2 + (28 * Math.PI) / 180);
  g.stroke();
  void down;
  for (const [table, values, out] of [[FUEL_FLIGHT_SCALE, [0, 5, 10, 20, 30, 37], 1], [FUEL_GROUND_SCALE, [0, 5, 10, 15, 25, 30, 37], -1]]) {
    for (const value of values) {
      g.beginPath();
      g.moveTo(...onArc(table, value, 0));
      g.lineTo(...onArc(table, value, out * at.len(8)));
      g.stroke();
      text(g, String(value), ...onArc(table, value, out * at.len(out > 0 ? 18 : 14)), at.len(out > 0 ? 9.5 : 7.5), C.mark);
    }
  }
  // Full (fuel use is not modelled): read on the normal-flight scale.
  const a = tableAngle(FUEL_FLIGHT_SCALE, v.fuelGallons ?? 37);
  g.strokeStyle = C.white;
  g.lineWidth = Math.max(1.5, at.len(4));
  g.beginPath();
  g.moveTo(px, py);
  g.lineTo(px + Math.sin(a) * (R + at.len(12)), py + Math.cos(a) * (R + at.len(12)));
  g.stroke();
  // The placard over the gauge's top.
  const b = at.box(L.boxes.fuelPlacard);
  g.fillStyle = '#141414';
  g.beginPath();
  g.moveTo(b.x, b.y);
  g.lineTo(b.x + b.w, b.y);
  g.lineTo(b.x + b.w * 0.94, b.y + b.h);
  g.lineTo(b.x + b.w * 0.06, b.y + b.h);
  g.closePath();
  g.fill();
  ['FUEL', 'BOTTOM TANK ONLY', 'TOP TANK IS NOT GAUGED AND', 'CONTAINS 48 GALLS AT TAKE OFF', 'KEEP FUEL COCK NORMALLY OPEN']
    .forEach((t, i) => text(g, t, b.x + b.w / 2, b.y + b.h * (0.13 + i * 0.19), at.len(i ? 7.6 : 8.5), C.white, { bold: true }));
}

/** The clock: white figures 1-12 and minute marks, yellow hour and minute hands, a sweep second hand. */
export function clockAngles(now) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hour = (now.getHours() % 12) + min / 60;
  const turn = Math.PI * 2;
  return { hour: (hour / 12) * turn, minute: (min / 60) * turn, second: (sec / 60) * turn };
}

function clock(g, x, y, f, now) {
  g.strokeStyle = C.white;
  for (let k = 0; k < 60; k += 1) {
    const a = (k / 60) * Math.PI * 2;
    g.lineWidth = Math.max(1, f * (k % 5 ? 0.02 : 0.04));
    g.beginPath();
    g.moveTo(...polar(x, y, a, f * 0.95));
    g.lineTo(...polar(x, y, a, f * (k % 5 ? 0.89 : 0.84)));
    g.stroke();
  }
  for (let h = 1; h <= 12; h += 1) text(g, String(h), ...polar(x, y, (h / 12) * Math.PI * 2, f * 0.7), f * 0.2, C.white);
  const { hour, minute, second } = clockAngles(now);
  pointer(g, x, y, hour, f * 0.5, f * 0.1, C.mark, 0.1);
  pointer(g, x, y, minute, f * 0.78, f * 0.07, C.mark, 0.1);
  g.save();
  g.translate(x, y);
  g.rotate(second);
  g.strokeStyle = C.white;
  g.lineWidth = Math.max(1, f * 0.02);
  g.beginPath();
  g.moveTo(0, f * 0.18);
  g.lineTo(0, -f * 0.85);
  g.stroke();
  g.restore();
}

/** The trim gauge's needle angle (rad, from pointing right, + nose down) for a trim setting in display degrees. */
export const trimNeedle = (trimDegrees) => (-Math.max(-15, Math.min(15, trimDegrees)) / 15) * TRIM_SWING * (Math.PI / 180);

/** The trim gauge: a needle pivoted at the left over an arc on the right, NOSE UP above and NOSE DOWN below. */
function trimGauge(g, x, y, f, v, at) {
  const px = x - f * 0.75;
  const py = y + f * 0.03;
  const R = f * 1.63;
  g.strokeStyle = C.white;
  g.lineWidth = Math.max(1, f * 0.025);
  const swing = (TRIM_SWING + 4) * (Math.PI / 180);
  for (const rr of [R - f * 0.05, R + f * 0.06]) {
    g.beginPath();
    g.arc(px, py, rr, -swing, swing);
    g.stroke();
  }
  for (let k = -TRIM_SWING; k <= TRIM_SWING; k += 3) {
    const a = (k * Math.PI) / 180;
    g.lineWidth = Math.max(1, f * (k % 15 ? 0.02 : 0.04));
    g.beginPath();
    g.moveTo(px + Math.cos(a) * (R - f * 0.05), py + Math.sin(a) * (R - f * 0.05));
    g.lineTo(px + Math.cos(a) * (R + f * 0.06), py + Math.sin(a) * (R + f * 0.06));
    g.stroke();
  }
  text(g, 'NOSE', x + f * 0.12, y - f * 0.72, f * 0.2, C.white, { bold: true });
  text(g, 'UP', x + f * 0.12, y - f * 0.5, f * 0.2, C.white, { bold: true });
  text(g, 'NOSE', x + f * 0.12, y + f * 0.5, f * 0.2, C.white, { bold: true });
  text(g, 'DOWN', x + f * 0.12, y + f * 0.72, f * 0.2, C.white, { bold: true });
  const a = trimNeedle(v.trimDegrees ?? 0);
  g.save();
  g.translate(px, py);
  g.rotate(a);
  g.fillStyle = C.white;
  g.beginPath();
  g.moveTo(0, -f * 0.06);
  g.lineTo(R - f * 0.12, -f * 0.02);
  g.lineTo(R - f * 0.06, 0);
  g.lineTo(R - f * 0.12, f * 0.02);
  g.lineTo(0, f * 0.06);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(0, 0, f * 0.14, 0, Math.PI * 2);
  g.fill();
  g.restore();
  void at;
}

/** Dunlop triple pressure gauge: the supply pressure above, the left and right brake pressures below (static). */
function brakeGauge(g, x, y, f) {
  const angle = (p) => ((-120 + (p / 300) * 240) * Math.PI) / 180;
  band(g, x, y, f, angle, 220, 300, '#c48a2e');
  scaleMarks(g, x, y, f, angle, {
    colour: C.white,
    ticks: [{ every: 10, from: 0, to: 300, len: 0.07, width: 0.02 }, { every: 50, from: 0, to: 300, len: 0.14, width: 0.04 }],
    figures: [{ values: [0, 100, 200, 300], size: 0.13, radius: 0.72 }],
  });
  text(g, 'SUPPLY', x, y - f * 0.42, f * 0.12, C.white, { bold: true });
  text(g, 'LBS', x, y - f * 0.28, f * 0.09, C.white);
  text(g, 'BRAKE', x - f * 0.62, y + f * 0.1, f * 0.09, C.white, { bold: true });
  text(g, 'BRAKE', x + f * 0.62, y + f * 0.1, f * 0.09, C.white, { bold: true });
  // The brake needles, hanging off (brakes off), and the supply needle at its normal 250 lb.
  for (const [sx, side] of [[-0.13, 'L'], [0.13, 'R']]) {
    const bx = x + sx * f;
    const by = y + f * 0.3;
    g.strokeStyle = C.white;
    g.lineWidth = Math.max(1, f * 0.035);
    g.beginPath();
    g.moveTo(bx, by - f * 0.1);
    g.lineTo(bx, by + f * 0.28);
    g.stroke();
    g.fillStyle = C.white;
    g.beginPath();
    g.arc(bx, by - f * 0.12, f * 0.07, 0, Math.PI * 2);
    g.fill();
    text(g, side, bx + sx * f * 2.2, by + f * 0.2, f * 0.13, C.white, { bold: true });
  }
  g.fillStyle = '#e8e8e4';
  roundRect(g, x - f * 0.3, y + f * 0.62, f * 0.6, f * 0.17, f * 0.06);
  g.fill();
  text(g, 'DUNLOP', x, y + f * 0.705, f * 0.12, '#151515', { bold: true });
  pointer(g, x, y, angle(250), f * 0.8, f * 0.07, C.white, 0.1);
}

/** The oxygen regulator's dials: delivery (thousands of feet) and supply (fraction of the bottle), static. */
function oxygenDial(g, x, y, f, table, value, kind) {
  const angle = angleOf(table);
  if (kind === 'supply') {
    g.fillStyle = '#c0141a';
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, f * 0.6, angle(0) - Math.PI / 2, angle(0.18) - Math.PI / 2);
    g.closePath();
    g.fill();
    scaleMarks(g, x, y, f, angle, {
      ticks: [{ every: 0.05, from: 0, to: 1, len: 0.08, width: 0.025 }, { every: 0.25, from: 0, to: 1, len: 0.16, width: 0.05 }],
      figures: [{ values: [0, 0.25, 0.5, 0.75], size: 0.24, radius: 0.64, label: (k) => ['0', '¼', '½', '¾'][k * 4] }],
    });
    text(g, 'FULL', ...polar(x, y, angle(1), f * 0.62), f * 0.15, C.white, { bold: true });
  } else {
    scaleMarks(g, x, y, f, angle, {
      ticks: [{ every: 5, from: 0, to: 40, len: 0.1, width: 0.03 }],
      figures: [{ values: [10, 20, 30, 40], size: 0.26, radius: 0.64 }, { values: [35], size: 0.14, radius: 0.66 }],
    });
    text(g, 'FT', x + f * 0.05, y - f * 0.2, f * 0.18, C.white, { bold: true });
    text(g, 'EMERGENCY', ...polar(x, y, 1.6, f * 0.55), f * 0.09, '#8a8a86');
  }
  pointer(g, x, y, angle(value), f * 0.8, f * 0.09, C.mark);
}
