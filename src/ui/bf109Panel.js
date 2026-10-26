// Bf 109 E instrument panel laid out after the product owner's photograph of a preserved Bf 109 E cockpit (D41).
// Positions and sizes are measured on the photograph (pixels, 25 to a dial radius) from the panel's centre and the top
// of its arch, so the drawing keeps the photograph's proportions.
//   Black panel: the clock at the top; altimeter, repeater compass and manifold pressure in the upper row; airspeed,
//   turn and bank, rev counter and the airscrew pitch indicator in the lower row; the magneto switch (shown only, not
//   working) and a push button on the left. Placed where the product owner asked: the flap position indicator
//   (upright, D34) between the compass and the manifold pressure gauge; the undercarriage lever between the turn and
//   bank and the rev counter, with the two undercarriage lamps below it. Rearranged by the product owner (D63, D64): the
//   fuel and oil pressure gauge beside the manifold pressure gauge; the airscrew pitch indicator, small, beside the rev
//   counter; the oil and coolant thermometers, the same small size, side by side under the rev counter; and the gun
//   ammunition counter (src/ui/ammoCounter.js) above the altimeter.

import { lamp } from './dials.js';
import { ammoCounter } from './ammoCounter.js';
import { flapDisplay } from './panelControls.js';
import { millibarWindow } from './altimeters.js';
import {
  mount, lwAirspeed, lwRpm, lwAta, lwStripCompass, lwTurnBank, lwFineAltimeter, lwClock, lwPitchIndicator, placard,
  pressureGauge, lwThermometer,
} from './luftwaffeDials.js';

/** The gap between neighbouring mountings and plates, photograph pixels (D44). */
export const GAP = 5;

const PX = 25; // photograph pixels per dial radius
const CENTRE = 369; // the panel's centre on the photograph
const TOP = 394; // the top of its arch

/** Photograph pixels to panel units (dial radii from the top centre). */
const P = (px, py) => [(px - CENTRE) / PX, (py - TOP) / PX];
const size = (px) => px / PX;

export const BF109_LAYOUT = {
  width: 14.6, height: 9.45, screenShare: 0.42, ownBackground: true, // kept below the sight glass (D41)
  outline: [[190, 628], [190, 470], [205, 448], [240, 421], [290, 403], [345, 396], [400, 403], [450, 421], [490, 446],
    [530, 470], [545, 500], [548, 628]].map(([x, y]) => P(x, y)),
  lowerPanel: { from: [196, 590], to: [542, 628] },
  // Dial centres, face radii and mounting half-widths (0: a round bezel, 1.2 times the face), in photograph pixels.
  // The rows and columns keep the photograph's order with the same gap (GAP) between every pair of mountings and
  // plates, none touching (product owner, D44).
  dials: {
    clock: [347, 433.5, 17.5, 22], altimeter: [285, 489, 23, 28.5], compass: [347, 489, 23.75, 0], ata: [449, 489, 23, 28.5],
    airspeed: [285, 551, 23, 28.5], turn: [347, 551, 23, 28.5], rpm: [449, 551, 23, 28.5], pitch: [501.7, 551, 16, 0],
    pressure: [501.7, 489, 16, 0], oilTemp: [427.3, 603.7, 16, 0], coolTemp: [470.7, 603.7, 16, 0],
  },
  knobs: [[313, 607, 13]],
  bolts: [[214, 455], [524, 455], [200, 610], [538, 610]],
  flaps: { from: [380.5, 460.5], to: [415.5, 517.5] },
  gearLever: { from: [380.5, 522.5], to: [415.5, 579.5] },
  gearLamps: { from: [363.1, 591], to: [403.1, 616] },
  // Gun ammunition counter (D64): the altimeter's width, above it.
  ammo: { from: [256.5, 419], to: [313.5, 455.5] },
  magneto: { from: [221.5, 476], to: [251.5, 555] },
  button: [207, 528],
  placard: { from: [221.5, 560], to: [251.5, 574] },
};

/** Draws the panel with its top centre at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf109Panel(g, x0, y0, r, v) {
  const L = BF109_LAYOUT;
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

  // The black panel and the lower panel below it, bolts, knobs and the dials' mountings.
  g.fillStyle = '#1a1b1c';
  g.strokeStyle = '#2f3133';
  g.lineWidth = 2;
  g.beginPath();
  L.outline.forEach(([dx, dy], i) => (i ? g.lineTo(x0 + dx * r, y0 + dy * r) : g.moveTo(x0 + dx * r, y0 + dy * r)));
  g.closePath();
  g.fill();
  g.stroke();
  const low = box(L.lowerPanel);
  g.fillStyle = '#141516';
  g.fillRect(low.x - low.w / 2, low.y - low.h / 2, low.w, low.h);
  for (const b of L.bolts) disc(g, ...xy(b), r * 0.14, '#3c3e40');
  for (const [px, py, rad] of L.knobs) disc(g, ...xy([px, py]), size(rad) * r, '#2b2c2e');
  for (const [px, py, face, half] of Object.values(L.dials)) {
    if (half) mount(g, ...xy([px, py]), size(half) * r);
    else disc(g, ...xy([px, py]), size(face) * r * 1.2, '#0d0d0d');
  }

  // Instruments.
  lwClock(g, ...dial('clock'), new Date());
  const [ax, ay, ar] = dial('altimeter');
  lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
  lwStripCompass(g, ...dial('compass'), v.heading);
  lwAta(g, ...dial('ata'), v.manifold);
  lwAirspeed(g, ...dial('airspeed'), v.airspeed);
  lwTurnBank(g, ...dial('turn'), v.turnRate, v.sideG);
  lwRpm(g, ...dial('rpm'), v.rpm);
  lwPitchIndicator(g, ...dial('pitch'), v.pitchClock);
  if (v.pressures) pressureGauge(g, ...dial('pressure'), v.pressures.fuel, v.pressures.oil);
  lwThermometer(g, ...dial('oilTemp'), v.oil, { label: 'Öl' });
  lwThermometer(g, ...dial('coolTemp'), v.coolant, { label: 'Kühlst.' });

  // Flap position (D34), standing upright between the compass and the manifold pressure gauge.
  flapDisplay(g, box(L.flaps), r, v, 'KLAPPEN');

  // Undercarriage lever, and the two lamps below it.
  gearLever(g, box(L.gearLever), r, v.gearSelected);
  const k = box(L.gearLamps);
  g.fillStyle = '#0c0c0c';
  g.fillRect(k.x - k.w / 2, k.y - k.h / 2, k.w, k.h);
  lamp(g, k.x - k.w * 0.25, k.y - k.h * 0.12, r * 0.14, '#3fbf4a', v.gearDown, 'AUS');
  lamp(g, k.x + k.w * 0.25, k.y - k.h * 0.12, r * 0.14, '#d8402e', v.gearUp, 'EIN');

  // Gun ammunition counter: left MG 17, cannon, right MG 17 (product owner, D64).
  ammoCounter(g, box(L.ammo), r, v.ammoCounters);

  // Magneto switch (shown for accuracy only), the push button and a placard.
  magnetoSwitch(g, box(L.magneto), r);
  const [bx, by] = xy(L.button);
  g.fillStyle = '#0c0c0c';
  g.beginPath();
  g.roundRect(bx - r * 0.42, by - r * 0.42, r * 0.84, r * 0.84, r * 0.12);
  g.fill();
  disc(g, bx, by, r * 0.28, '#d8382c');
  const pl = box(L.placard);
  placard(g, pl.x, pl.y, pl.w, pl.h, { scribbles: 2, plate: '#4a2a1c' });
}

function disc(g, x, y, radius, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

/** Undercarriage lever in its slot: up at EIN (raised), down at AUS (lowered). */
function gearLever(g, { x, y, w, h }, r, down) {
  g.fillStyle = '#0c0c0c';
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = '#050505';
  g.fillRect(x - w * 0.1, y - h * 0.36, w * 0.2, h * 0.72);
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.max(6, Math.round(r * 0.18))}px ui-sans-serif, Helvetica, sans-serif`;
  g.fillText('EIN', x, y - h * 0.44);
  g.fillText('AUS', x, y + h * 0.44);
  const ky = y + (down ? 0.3 : -0.3) * h;
  g.fillStyle = '#9a9a96';
  g.fillRect(x - w * 0.06, Math.min(y, ky), w * 0.12, Math.abs(ky - y));
  disc(g, x, ky, r * 0.2, '#d8382c');
}

/** The magneto switch (not working): a lever in a slot at M1+2, marked M1+2, M2 and M1. */
function magnetoSwitch(g, { x, y, w, h }, r) {
  g.fillStyle = '#0c0c0c';
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = '#050505';
  g.fillRect(x - w * 0.36, y - h * 0.4, w * 0.18, h * 0.8);
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.max(6, Math.round(r * 0.2))}px ui-sans-serif, Helvetica, sans-serif`;
  ['M1+2', 'M2', 'M1'].forEach((t, i) => g.fillText(t, x - w * 0.12, y - h * 0.3 + i * h * 0.3));
  disc(g, x - w * 0.27, y - h * 0.3, r * 0.15, '#d8382c');
}
