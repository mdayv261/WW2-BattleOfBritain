// Bf 109 instrument panel laid out after the product owner's photograph of a preserved panel (D38). Positions and
// sizes are measured on the photograph (pixels, 60 to a dial radius) from the panel's centre line and the top of
// the part shown, so the drawing keeps the photograph's proportions.
//   Raised centre plate: altimeter and fine altimeter on the left, repeater compass and turn and bank in the middle,
//   airspeed and climb indicator on the right. Engine instruments to the right (rev counter above manifold
//   pressure), the small engine gauges along the bottom, the clock, ammeter, light switch and ball compass on the
//   left. The photographed panel is from a later Bf 109 with an automatic airscrew; the E-4's manual pitch needs
//   its pitch clock, which sits on the blank plate at the upper left. Undercarriage lamps and the flap indicator
//   (D34) take the places of the later aircraft's bomb switch boxes.

import { scale, needle, face, lamp, label, flapIndicator } from './dials.js';
import { luftwaffeAltimeter, millibarWindow } from './altimeters.js';
import {
  mount, lwAirspeed, lwClimb, lwRpm, lwAta, lwCompass, lwTurnBank, lwFineAltimeter, lwClock, ringGauge, ammeter,
  ballCompass, knob, placard,
} from './luftwaffeDials.js';

const PX = 60; // photograph pixels per dial radius
const CENTRE = 512; // the panel's centre line on the photograph
const TOP = 140; // the top of the part of the panel drawn

/** Photograph pixels to panel units (dial radii from the top centre). */
const P = (px, py) => [(px - CENTRE) / PX, (py - TOP) / PX];

// The engine gauges along the bottom are not modelled yet (fuel, pressures and temperatures come with the engine
// heat and damage models): their hands rest at typical running values.
const RESTING = { fuelLitres: 400, fuelPressure: 1.5, oilPressure: 6, oilTemp: 70, coolantTemp: 80 };

export const BF109_LAYOUT = {
  width: 16.7, height: 10.05, screenShare: 0.5, ownBackground: true,
  outline: [[115, 140], [910, 140], [965, 215], [1010, 520], [940, 740], [745, 740], [700, 690], [330, 690], [290, 740],
    [130, 740], [15, 560], [60, 250]].map(([x, y]) => P(x, y)),
  plate: { from: P(278, 185), to: P(725, 528) },
  dials: {
    altimeter: [P(350, 282), 58], fineAltimeter: [P(350, 437), 58], compass: [P(500, 213), 56], turn: [P(500, 366), 56],
    airspeed: [P(655, 282), 58], climb: [P(655, 437), 58], rpm: [P(795, 285), 56], ata: [P(800, 410), 56],
    pitchClock: [P(215, 285), 45], clock: [P(215, 402), 40], ammeter: [P(108, 315), 34], light: [P(108, 415), 34],
    ballCompass: [P(105, 525), 46], fuel: [P(348, 592), 36], pressure: [P(440, 592), 36], oil: [P(563, 587), 36],
    coolant: [P(660, 587), 36],
  },
  gear: P(908, 410), flaps: P(825, 615), speedPlacard: P(835, 182), warnings: [P(512, 446), P(505, 500)],
};

/** Draws the panel with its top centre at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf109Panel(g, x0, y0, r, v) {
  const L = BF109_LAYOUT;
  const xy = ([dx, dy]) => [x0 + dx * r, y0 + dy * r];
  const dial = (name) => {
    const [pos, px] = L.dials[name];
    return [...xy(pos), (px / PX) * r];
  };
  // The panel's outline and the raised centre plate.
  g.fillStyle = '#16191b';
  g.beginPath();
  L.outline.forEach((p, i) => (i ? g.lineTo(...xy(p)) : g.moveTo(...xy(p))));
  g.closePath();
  g.fill();
  const [ax, ay] = xy(L.plate.from);
  const [bx, by] = xy(L.plate.to);
  g.fillStyle = '#1b1e20';
  g.strokeStyle = '#2c3033';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(ax, ay, bx - ax, by - ay, r * 0.3);
  g.fill();
  g.stroke();

  // Mountings first, so the dials sit on them.
  for (const name of ['altimeter', 'fineAltimeter', 'turn', 'airspeed', 'climb', 'rpm', 'ata', 'clock', 'pitchClock']) {
    const [x, y, rd] = dial(name);
    mount(g, x, y, rd * (name === 'pitchClock' ? 1.33 : 1.2));
  }
  {
    const [x, y, rd] = dial('compass');
    g.fillStyle = '#2a2d2f';
    g.beginPath();
    g.arc(x, y, rd * 1.2, 0, Math.PI * 2);
    g.fill();
  }

  // Flying instruments.
  luftwaffeAltimeter(g, ...dial('altimeter'), v.altitude, 1013, undefined, false);
  const [fx, fy, fr] = dial('fineAltimeter');
  lwFineAltimeter(g, fx, fy, fr, v.altitude, (x, wy) => millibarWindow(g, x, wy, fr, 1013));
  lwCompass(g, ...dial('compass'), v.heading);
  lwTurnBank(g, ...dial('turn'), v.turnRate, v.sideG);
  lwAirspeed(g, ...dial('airspeed'), v.airspeed);
  lwClimb(g, ...dial('climb'), v.climb);

  // Engine instruments, with red marks at the 5-minute rating.
  lwRpm(g, ...dial('rpm'), v.rpm, v.limits.rpm);
  lwAta(g, ...dial('ata'), v.manifold, v.limits.manifold);
  pitchClock(g, ...dial('pitchClock'), v.pitchClock);

  // Left-hand column.
  lwClock(g, ...dial('clock'), new Date());
  ammeter(g, ...dial('ammeter'), 4);
  knob(g, ...dial('light'), [['Hell', -0.5], ['Aus', 0.55]]);
  ballCompass(g, ...dial('ballCompass'), v.heading);

  // Small engine gauges (resting values, see above).
  ringGauge(g, ...dial('fuel'), { min: 0, max: 4, labels: [0, 2, 4], ring: '#e2c81e', value: RESTING.fuelLitres / 100, text: 'Liter' });
  ringGauge(g, ...dial('pressure'), {
    min: 0, max: 10, labels: [2, 10], ring: '#d9c21c', bands: [{ from: 8, to: 10, colour: '#c0392b' }], value: RESTING.oilPressure, text: 'Öl',
  });
  ringGauge(g, ...dial('oil'), {
    min: 0, max: 120, labels: [60, 100], ring: '#8c4a3c', bands: [{ from: 100, to: 120, colour: '#c0392b' }], value: RESTING.oilTemp, text: '°C',
  });
  ringGauge(g, ...dial('coolant'), {
    min: 40, max: 120, labels: [60, 80, 100], ring: '#2f8f4a', bands: [{ from: 105, to: 120, colour: '#c0392b' }], value: RESTING.coolantTemp, text: '°C',
  });

  // Placards: the E-4's diving limit (S15) and the warning plates under the turn indicator.
  const [sx, sy] = xy(L.speedPlacard);
  placard(g, sx, sy, r * 2.2, r * 0.7, ['Größte zulässige', 'Geschwindigkeit', '750 km/h']);
  for (const p of L.warnings) placard(g, ...xy(p), r * 2.2, r * 0.42, ['Achtung!']);

  // Undercarriage lamps and flap position.
  const [gx, gy] = xy(L.gear);
  g.fillStyle = '#101214';
  g.fillRect(gx - r * 0.58, gy - r * 1.0, r * 1.16, r * 2.0);
  label(g, gx, gy - r * 0.7, r * 0.85, 'FAHRWERK');
  lamp(g, gx - r * 0.25, gy, r * 0.14, '#3fbf4a', v.gearDown, 'AUS');
  lamp(g, gx + r * 0.25, gy, r * 0.14, '#d8402e', v.gearUp, 'EIN');
  const [kx, ky] = xy(L.flaps);
  g.fillStyle = '#101214';
  g.fillRect(kx - r * 1.3, ky - r * 1.15, r * 2.6, r * 2.1);
  label(g, kx, ky - r * 0.8, r * 1.3, 'KLAPPEN');
  flapIndicator(g, kx, ky, r * 1.8, v, { up: '0°', down: `${Math.round(v.flapTravel)}°`, takeoff: 'START', landing: 'LANDUNG' });
}

/** The airscrew pitch clock: hour and minute hands (S32), 12 o'clock at fine pitch. */
function pitchClock(g, x, y, r, clock) {
  face(g, x, y, r);
  scale(g, x, y, r, { min: 0, max: 12, start: 0, end: Math.PI * 2, major: 1, minor: 1, label: (s) => (s === 0 ? '12' : s === 12 ? '' : String(s)) });
  needle(g, x, y, r * 0.5, (clock.hours / 12) * Math.PI * 2, 4);
  needle(g, x, y, r * 0.82, (clock.minutes / 60) * Math.PI * 2, 2);
}
