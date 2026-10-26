// Bf 110 instrument panel laid out after the product owner's photograph of a preserved Bf 110 cockpit (D39). Positions
// and sizes are measured on the photograph (pixels, 30 to a dial radius) from the panel's centre and its top edge.
//   Flying instruments on the left: airspeed, the combined horizon and the climb indicator above; the altimeter, the
//   repeater compass and the clock below. Engine instruments on the right, a pair for each engine (left engine on the
//   left): rev counters, then manifold pressure, coolant and oil temperature. Black cover plates and the switch box at
//   the bottom left. The photographed aircraft has automatic airscrews; the C-4's are set by hand (S24), so the two
//   pitch indicators sit on the cover plates right of the engine instruments (S24: "on top at the extreme right of the
//   dashboard"). Added: the flap position indicator (upright, D34) and undercarriage lamps on the cover plates at the
//   bottom left.

import { lamp, label, flapIndicatorVertical } from './dials.js';
import { millibarWindow } from './altimeters.js';
import { mount, lwRpm, lwAta, lwFineAltimeter, lwClock, lwPitchIndicator } from './luftwaffeDials.js';
import { airspeed900, climb30, combinedHorizon, ringGauge, redRing, repeaterCompass } from './bf110Dials.js';

const PX = 30; // photograph pixels per dial radius
const CENTRE = 241; // the panel's centre on the photograph
const TOP = 334; // its top edge

const P = (px, py) => [(px - CENTRE) / PX, (py - TOP) / PX];
const size = (px) => px / PX;

// Coolant and oil temperatures are not modelled yet (the engine heat model comes later): the hands rest at typical
// running values.
const RESTING = { coolantTemp: 80, oilTemp: 70 };

export const BF110_LAYOUT = {
  width: 15.7, height: 8.9, screenShare: 0.5, ownBackground: true,
  outline: [[12, 600], [12, 380], [28, 350], [50, 340], [300, 335], [306, 340], [462, 340], [471, 350], [471, 563],
    [305, 566], [300, 600]].map(([x, y]) => P(x, y)),
  // Dial centres, face radii and mounting half-widths, in photograph pixels.
  dials: {
    airspeed: [75, 388, 30, 36], horizon: [170, 385, 38, 47], climb: [252, 378, 30, 35], altimeter: [100, 472, 30, 36],
    compass: [176, 470, 30, 36], clock: [245, 455, 18, 23],
    rpmLeft: [345, 385, 26, 33], rpmRight: [410, 380, 26, 33], ataLeft: [357, 440, 19, 24], ataRight: [404, 436, 19, 24],
    coolantLeft: [357, 489, 18, 23], coolantRight: [404, 485, 18, 23], oilLeft: [358, 531, 17, 22], oilRight: [404, 528, 17, 22],
    pitchLeft: [447, 425, 15, 0], pitchRight: [447, 471, 15, 0],
  },
  plates: [{ from: [428, 406], to: [467, 445] }, { from: [428, 452], to: [467, 491] }, { from: [304, 421], to: [334, 466] },
    { from: [15, 562], to: [70, 600] }],
  gear: { from: [12, 511], to: [66, 561] },
  flaps: { from: [81, 528], to: [148, 598] },
  switchBox: { from: [152, 505], to: [212, 573] },
  knobs: [[62, 418], [158, 582], [178, 582], [198, 582], [218, 582]],
};

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
  for (const k of L.knobs) {
    g.fillStyle = '#26282b';
    disc(g, ...xy(k), r * 0.22);
  }
  for (const [px, py, , half] of Object.values(L.dials)) if (half) mount(g, ...xy([px, py]), size(half) * r);

  // Flying instruments.
  airspeed900(g, ...dial('airspeed'), v.airspeed);
  combinedHorizon(g, ...dial('horizon'), v.bank, v.pitch, v.turnRate, v.sideG);
  climb30(g, ...dial('climb'), v.climb);
  const [ax, ay, ar] = dial('altimeter');
  lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
  repeaterCompass(g, ...dial('compass'), v.heading);
  lwClock(g, ...dial('clock'), new Date());

  // Engine instruments: left engine on the left.
  ['Left', 'Right'].forEach((side, i) => {
    const e = v.engines[i] ?? v.engines[0];
    const [rx, ry, rr] = dial(`rpm${side}`);
    redRing(g, rx, ry, rr);
    lwRpm(g, rx, ry, rr, e.rpm);
    const [mx, my, mr] = dial(`ata${side}`);
    redRing(g, mx, my, mr);
    lwAta(g, mx, my, mr, e.manifold);
    ringGauge(g, ...dial(`coolant${side}`), { min: 40, max: 120, labels: [60, 100], ring: '#8f2a22', value: RESTING.coolantTemp, text: '°C' });
    ringGauge(g, ...dial(`oil${side}`), { min: 0, max: 120, labels: [40, 80], ring: '#c9ad2a', value: RESTING.oilTemp, text: '°C' });
    const [px, py, pr] = dial(`pitch${side}`);
    lwPitchIndicator(g, px, py, pr, e.pitchClock);
    label(g, px - pr * 1.05, py - pr * 0.95, r * 0.6, side === 'Left' ? 'L' : 'R');
  });

  // Switch box, undercarriage lamps and flap position.
  const s = box(L.switchBox);
  blackPlate(s);
  g.fillStyle = '#d9d4c4';
  for (const [k, dx] of [[0, -0.3], [1, 0], [2, 0.3]]) g.fillRect(s.x + dx * s.w - s.w * 0.08, s.y + (k === 1 ? -0.3 : 0.25) * s.h, s.w * 0.16, s.h * 0.08);
  const gear = box(L.gear);
  blackPlate(gear);
  label(g, gear.x, gear.y - gear.h * 0.28, r * 0.7, 'FAHRWERK');
  lamp(g, gear.x - gear.w * 0.22, gear.y + gear.h * 0.02, r * 0.13, '#3fbf4a', v.gearDown, 'AUS');
  lamp(g, gear.x + gear.w * 0.22, gear.y + gear.h * 0.02, r * 0.13, '#d8402e', v.gearUp, 'EIN');
  const f = box(L.flaps);
  blackPlate(f);
  label(g, f.x, f.y - f.h * 0.4, r * 0.8, 'KLAPPEN');
  flapIndicatorVertical(g, f.x + f.w * 0.12, f.y + f.h * 0.08, f.h * 0.64, v, { up: '0°', down: `${Math.round(v.flapTravel)}°`, takeoff: 'START', landing: 'LANDUNG' });
}

function disc(g, x, y, radius) {
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}
