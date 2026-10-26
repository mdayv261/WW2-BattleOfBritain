// Bf 110 instrument panel laid out after the product owner's photograph of a preserved Bf 110 cockpit (D39). Positions
// and sizes are measured on the photograph (pixels, 30 to a dial radius) from the panel's centre and its top edge.
//   Flying instruments on the left: airspeed, the artificial horizon and the climb indicator above; the altimeter, the
//   repeater compass and the clock below, the turn and bank under the clock. Their faces follow the product owner's
//   reference drawings (D43); everything sits on an even grid with the same gap between mountings (D44).
//   Engine instruments on the right in two columns, the left engine's on the left and the right engine's on the right
//   (product owner, D46): rev counter, manifold pressure, airscrew pitch indicator (the C-4's pitch is set by hand,
//   S24), the fuel quantity in that wing's tanks (D45) and a combined oil and coolant temperature gauge, oil on the left
//   and coolant on the right, the normal ranges in green (product owner, D63).
//   Bottom left: the undercarriage display and the upright flap position indicator (D34, D44).

import { undercarriageDisplay, flapDisplay } from './panelControls.js';

export { gearLampState } from './panelControls.js';
import { millibarWindow } from './altimeters.js';
import { mount, lwRpm, lwAta, lwClock, lwPitchIndicator, twoScaleGauge } from './luftwaffeDials.js';
import { lwAirspeed, lwFineAltimeter, lwVario, lwHorizon, lwPatinCompass, lwTurnBank } from './lwFlightDials.js';
import { ringGauge, redRing } from './bf110Dials.js';

const PX = 30; // photograph pixels per dial radius
const CENTRE = 241; // the panel's centre on the photograph
const TOP = 334; // its top edge

const P = (px, py) => [(px - CENTRE) / PX, (py - TOP) / PX];
const size = (px) => px / PX;


export const BF110_LAYOUT = {
  width: 15.7, height: 9.55, screenShare: 0.54, ownBackground: true,
  // Sized like the Bf 109's panel (D64): its large dial faces are 23 of 25 photograph pixels to a radius, these 30 of 30.
  matchBf109: 23 / 25,
  outline: [[12, 600], [12, 380], [28, 350], [50, 340], [300, 335], [306, 340], [462, 340], [471, 350], [471, 620],
    [300, 620]].map(([x, y]) => P(x, y)),
  // Dial centres, face radii and mounting half-widths, in photograph pixels. The instruments sit on an even grid with
  // the same gap (GAP) between every pair of mountings, none touching (product owner, D44): the flying instruments in
  // 80-pixel cells (three columns, the turn and bank below the clock), the engine instruments in 55-pixel cells (a
  // column per engine).
  dials: {
    airspeed: [70, 382, 30, 37], horizon: [150, 382, 30, 37], climb: [230, 382, 30, 37],
    altimeter: [70, 462, 30, 37], compass: [150, 462, 30, 37], clock: [230, 462, 30, 37], turn: [230, 542, 30, 37],
    rpmLeft: [360, 370, 19, 24.5], rpmRight: [415, 370, 19, 24.5], ataLeft: [360, 425, 19, 24.5], ataRight: [415, 425, 19, 24.5],
    pitchLeft: [360, 480, 19, 24.5], pitchRight: [415, 480, 19, 24.5], tankLeft: [360, 535, 18.5, 24.5], tankRight: [415, 535, 18.5, 24.5],
    tempLeft: [360, 590, 19, 24.5], tempRight: [415, 590, 19, 24.5],
  },
  plates: [],
  gear: { from: [33, 505], to: [107, 579] },
  flaps: { from: [113, 505], to: [187, 579] },
};

/** The gap between neighbouring mountings and plates, photograph pixels (D44). */
export const GAP = 6;

/** Draws the panel with its top centre at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf110Panel(g, x0, y0, r, v) {
  const L = BF110_LAYOUT;
  const xy = ([px, py]) => {
    const [dx, dy] = P(px, py);
    return [x0 + dx * r, y0 + dy * r];
  };
  const box = ({ from, to }) => {
    const [ax, ay] = xy(from);
    const [bx, by] = xy(to);
    return { x: (ax + bx) / 2, y: (ay + by) / 2, w: bx - ax, h: by - ay };
  };
  const dial = (name) => {
    const [px, py, face] = L.dials[name];
    return [...xy([px, py]), size(face) * r];
  };
  const blackPlate = (b) => {
    g.fillStyle = '#121314';
    g.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    g.fillStyle = '#8a8270';
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) disc(g, b.x + sx * (b.w / 2 - r * 0.12), b.y + sy * (b.h / 2 - r * 0.12), r * 0.05);
  };

  // The blue-grey panel, cover plates, knobs and mountings.
  g.fillStyle = '#7c8594';
  g.strokeStyle = '#596170';
  g.lineWidth = 2;
  g.beginPath();
  L.outline.forEach(([dx, dy], i) => (i ? g.lineTo(x0 + dx * r, y0 + dy * r) : g.moveTo(x0 + dx * r, y0 + dy * r)));
  g.closePath();
  g.fill();
  g.stroke();
  for (const p of L.plates) blackPlate(box(p));
  // Mountings on the even grid; no tabs or knobs below them, which would close the gaps (D44).
  for (const [px, py, , half] of Object.values(L.dials)) mount(g, ...xy([px, py]), size(half) * r);

  // Flying instruments.
  lwAirspeed(g, ...dial('airspeed'), v.airspeed);
  lwHorizon(g, ...dial('horizon'), v.bank, v.pitch);
  lwVario(g, ...dial('climb'), v.climb);
  const [ax, ay, ar] = dial('altimeter');
  lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
  lwPatinCompass(g, ...dial('compass'), v.heading);
  lwClock(g, ...dial('clock'), new Date());
  lwTurnBank(g, ...dial('turn'), v.turnRate, v.sideG);

  // Engine instruments: left engine on the left.
  ['Left', 'Right'].forEach((side, i) => {
    const e = v.engines[i] ?? v.engines[0];
    const [rx, ry, rr] = dial(`rpm${side}`);
    redRing(g, rx, ry, rr);
    lwRpm(g, rx, ry, rr, e.rpm);
    const [mx, my, mr] = dial(`ata${side}`);
    redRing(g, mx, my, mr);
    lwAta(g, mx, my, mr, e.manifold);
    // Fuel quantity in this wing's tanks, litres (D45).
    const tank = v.fuelTanks[i];
    ringGauge(g, ...dial(`tank${side}`), {
      min: 0, max: 700, labels: [0, 300, 600], ring: '#c9ad2a', value: tank.litres, text: `FUEL ${side === 'Left' ? 'L' : 'R'}\nLiter`,
    });
    const [px, py, pr] = dial(`pitch${side}`);
    lwPitchIndicator(g, px, py, pr, e.pitchClock);
    // Oil (left half) and coolant (right half) temperatures, °C, normal ranges in green (D63).
    const scale = { min: 0, max: 130, step: 10, majorStep: 50 };
    twoScaleGauge(g, ...dial(`temp${side}`), { ...scale, value: e.oil, normal: v.normalTemps.oil },
      { ...scale, value: e.coolant, normal: v.normalTemps.coolant }, { labels: ['Öl', 'Kühl.'] });
  });

  // Undercarriage display and flap position.
  undercarriageDisplay(g, box(L.gear), r, v, 'FAHRWERK');
  flapDisplay(g, box(L.flaps), r, v, 'KLAPPEN');
}

function disc(g, x, y, radius) {
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}
