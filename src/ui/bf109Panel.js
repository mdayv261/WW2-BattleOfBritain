// Bf 109 E instrument panel laid out after the product owner's photograph of a preserved E panel (D38, revised
// 26 Oct 2026). Positions and sizes are measured on the photograph (pixels, 30 to a dial radius) from the panel's
// centre and the top of its centre tab, so the drawing keeps the photograph's proportions.
//   The grey panel with the clock on its centre tab; airspeed, repeater compass and manifold pressure in the upper
//   row; altimeter, turn and bank and rev counter below, with the airscrew pitch indicator to the right; the airscrew
//   pitch switch between the lower dials; the magneto switch, a push button and the pitot heater switch on the left;
//   placards. Added to the photograph: the flap position indicator (D34) between the compass and the manifold
//   pressure gauge, where the product owner placed it, standing upright with 0° at the top, and the undercarriage lamps on the right wing of the panel.

import { lamp, label, flapIndicatorVertical } from './dials.js';
import { millibarWindow } from './altimeters.js';
import {
  mount, lwAirspeed, lwRpm, lwAta, lwStripCompass, lwTurnBank, lwFineAltimeter, lwClock, lwPitchIndicator, placard,
} from './luftwaffeDials.js';

const PX = 30; // photograph pixels per dial radius
const CENTRE = 350; // the panel's centre on the photograph
const TOP = 26; // the top of the centre tab

/** Photograph pixels to panel units (dial radii from the top centre). */
const P = (px, py) => [(px - CENTRE) / PX, (py - TOP) / PX];
const size = (px) => px / PX;

const PANEL_GREY = '#7d8388';
const PANEL_EDGE = '#5b6065';

export const BF109_LAYOUT = {
  width: 20.5, height: 9.6, screenShare: 0.5, ownBackground: true,
  outline: [[106, 312], [106, 246], [44, 244], [44, 236], [180, 89], [192, 56], [231, 41], [282, 31], [285, 28], [367, 28],
    [367, 108], [446, 108], [446, 36], [508, 56], [515, 88], [561, 98], [656, 239], [656, 244], [602, 249], [600, 312]]
    .map(([x, y]) => P(x, y)),
  // Dial centres, face radii and mounting half-widths (0: a round black bezel instead), in photograph pixels.
  dials: {
    clock: [315, 62, 23, 34], airspeed: [220, 155, 32, 0], compass: [314, 154, 32, 41], ata: [477, 152, 32, 41],
    altimeter: [220, 255, 32, 41], turn: [315, 255, 32, 41], rpm: [477, 254, 32, 41], pitch: [562, 254, 25, 33],
  },
  knobs: [[218, 201], [218, 301], [477, 200]],
  bolts: [[229, 53], [68, 223], [467, 51], [629, 221]],
  pitchSwitch: { from: [374, 190], to: [418, 298] },
  magneto: { from: [124, 158], to: [168, 236] },
  button: [95, 212],
  placards: {
    left: { from: [199, 64], to: [257, 106] }, right: { from: [527, 110], to: [561, 216] },
    magneto: { from: [127, 243], to: [164, 262] }, pitot: { from: [109, 273], to: [165, 301] },
  },
  flaps: { from: [360, 113], to: [430, 184] },
  gear: { from: [566, 150], to: [618, 214] },
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

  // The grey panel, its bolts and knobs, and the dials' mountings (the airspeed indicator has a round bezel).
  g.fillStyle = PANEL_GREY;
  g.strokeStyle = PANEL_EDGE;
  g.lineWidth = 2;
  g.beginPath();
  L.outline.forEach(([dx, dy], i) => (i ? g.lineTo(x0 + dx * r, y0 + dy * r) : g.moveTo(x0 + dx * r, y0 + dy * r)));
  g.closePath();
  g.fill();
  g.stroke();
  for (const b of L.bolts) disc(g, ...xy(b), r * 0.2, '#6c7276');
  for (const k of L.knobs) disc(g, ...xy(k), r * 0.22, '#3a3d40');
  for (const [px, py, face, half] of Object.values(L.dials)) {
    if (half) mount(g, ...xy([px, py]), size(half) * r);
    else disc(g, ...xy([px, py]), size(face) * r * 1.38, '#111');
  }

  // Instruments.
  lwClock(g, ...dial('clock'), new Date());
  lwAirspeed(g, ...dial('airspeed'), v.airspeed);
  lwStripCompass(g, ...dial('compass'), v.heading);
  lwAta(g, ...dial('ata'), v.manifold);
  const [ax, ay, ar] = dial('altimeter');
  lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
  lwTurnBank(g, ...dial('turn'), v.turnRate, v.sideG);
  lwRpm(g, ...dial('rpm'), v.rpm);
  lwPitchIndicator(g, ...dial('pitch'), v.pitchClock);

  // Switches, the push button and placards (their small print is too fine to read on the photograph).
  pitchSwitch(g, box(L.pitchSwitch), r);
  magnetoSwitch(g, box(L.magneto), r);
  const [bx, by] = xy(L.button);
  g.fillStyle = '#111';
  g.beginPath();
  g.roundRect(bx - r * 0.5, by - r * 0.5, r, r, r * 0.15);
  g.fill();
  disc(g, bx, by, r * 0.36, '#d8382c');
  const plate = (p, opts) => {
    const { x, y, w, h } = box(p);
    placard(g, x, y, w, h, opts);
  };
  plate(L.placards.left, { scribbles: 5 });
  plate(L.placards.right, { scribbles: 12, plate: '#e8e6df', ink: '#222' });
  plate(L.placards.magneto, { scribbles: 3 });
  plate(L.placards.pitot, { lines: ['Staurohr heiz'] });

  // Flap position (D34) and undercarriage lamps, on black plates.
  const f = box(L.flaps);
  g.fillStyle = '#0f1011';
  g.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
  label(g, f.x, f.y - f.h * 0.4, r * 0.85, 'KLAPPEN');
  flapIndicatorVertical(g, f.x + f.w * 0.12, f.y + f.h * 0.08, f.h * 0.66, v, { up: '0°', down: `${Math.round(v.flapTravel)}°`, takeoff: 'START', landing: 'LANDUNG' });
  const k = box(L.gear);
  g.fillStyle = '#0f1011';
  g.fillRect(k.x - k.w / 2, k.y - k.h / 2, k.w, k.h);
  label(g, k.x, k.y - k.h * 0.3, r * 0.75, 'FAHRWERK');
  lamp(g, k.x - k.w * 0.22, k.y, r * 0.13, '#3fbf4a', v.gearDown, 'AUS');
  lamp(g, k.x + k.w * 0.22, k.y, r * 0.13, '#d8402e', v.gearUp, 'EIN');
}

function disc(g, x, y, radius, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

/** The airscrew pitch switch: a slot with a red-knobbed lever, marked Größer, Drehzahl, Kleiner and Handbetrieb. */
function pitchSwitch(g, { x, y, w, h }, r) {
  g.fillStyle = '#121314';
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = '#050505';
  g.fillRect(x - w * 0.36, y - h * 0.4, w * 0.16, h * 0.78);
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.max(6, Math.round(r * 0.15))}px ui-sans-serif, Helvetica, sans-serif`;
  ['Größer', 'Drehzahl', 'Kleiner', 'Handbetrieb'].forEach((t, i) => g.fillText(t, x - w * 0.08, y - h * 0.36 + i * h * 0.25));
  disc(g, x - w * 0.28, y + h * 0.36, r * 0.17, '#d8382c');
}

/** The magneto switch: a lever in a slot, at M1-2 (both magnetos on), marked M1-2, M2 and M1. */
function magnetoSwitch(g, { x, y, w, h }, r) {
  g.fillStyle = '#121314';
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.fillStyle = '#050505';
  g.fillRect(x - w * 0.36, y - h * 0.4, w * 0.18, h * 0.8);
  g.fillStyle = '#e9e6dc';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = `bold ${Math.max(6, Math.round(r * 0.22))}px ui-sans-serif, Helvetica, sans-serif`;
  ['M1-2', 'M2', 'M1'].forEach((t, i) => g.fillText(t, x - w * 0.08, y - h * 0.32 + i * h * 0.32));
  disc(g, x - w * 0.27, y - h * 0.32, r * 0.17, '#d8382c');
}
