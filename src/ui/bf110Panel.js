// Bf 110 C instrument panel (D106, redrawn D140), after the product owner's picture of a Bf 110 C panel (#34: a render
// seen a little from the left, a layout reference only: nothing of it is copied into the game). The layout, measured on
// #34 and levelled, is in src/ui/bf110Layout.js; the plate and fittings in src/ui/bf110Fittings.js and
// src/ui/bf110Boxes.js; the panel's own gauges in src/ui/bf110Gauges.js.
//   Top: the clock (mounted directly in the panel, D156), the red Kurssteuerung button, the SKK 404-2 block for the MG 17s, the Kurssteuerung
//   indicator, the round counter for the two MG FF/M cannon (Durchladen) and the Heizung placard.
//   Middle: the repeater compass, the 2 MG / 4 MG switch and the Kurs strip; the airspeed indicator, turn and bank (under
//   the Revi) and climb indicator; the outside air thermometer and the two airscrew pitch indicators (kept, D109); the
//   Siemens course box, the elevator trim indicator (in #34's AEG indicator's place, D161), the horizon and the
//   altimeter.
//   Right: each engine's rev counter and manifold pressure gauge, with their correction cards.
//   Bottom centre: each engine's coolant thermometer either side of the fuel gauge and its tank lamps, their bottoms on
//   the screen's foot (D141); below them, out of sight, the radiator flap switches either side of the tank selector.
//   Left: the undercarriage lights, the airscrew lever box, the Fahrwerk and Landeklappe switches and their placard,
//   and the Preßluft gauge below the lever box (D141).
// The airspeed indicator, turn and bank and altimeter are the Bf 109's exactly, at its size on screen, the altimeter's
// setting knob included (D107); all three in the black square mounting, as every dial (D162).
// Working: the flying and engine instruments, the clock, the pitch indicators, the round counter, the outside air
// thermometer, the undercarriage and flap switches and lights, the radiator switches and the fuel gauge (the tank the
// selector chooses, full: fuel use is not modelled). The rest shows normal operation. The dials' markings and hands are
// white and the mountings' screws black (product owner, D160; the luminous paint of D105 gone).

import { drawBf110Fittings } from './bf110Fittings.js';
import { mount, lwRpm, lwAta, lwClock, lwPitchIndicator, lwFuelGauge, RPM_110 } from './luftwaffeDials.js';
import { lwAirspeed, lwFineAltimeter, lwVario, lwHorizon, lwPatinCompass, lwTurnBank } from './lwFlightDials.js';
import { whiteDials, blackScrews } from './lwStyle.js';
import { millibarWindow } from './altimeters.js';
import { settingKnob } from './bf109Panel.js';
import { drawBf110Interior } from './bf110Frame.js';
import {
  PX, TOP, AXIS, OUTLINE, HEIGHT, ABOVE, SINK, SHARE, BF109_SCALE, LAYOUT, REVI_RAISE, REVI_110, GLASS_ABOVE_110,
} from './bf110Layout.js';
import {
  airThermometer, autopilotIndicator, trimIndicator, cannonCounter, coolantGauge, correctionCard, pressluftGauge, pressluftReading,
  radiatorSwitch, roundCounter, tankSelector,
} from './bf110Gauges.js';

export { AXIS, BF109_SCALE, REVI_110, GLASS_ABOVE_110 };

/**
 * Where the guns' line stands looking ahead in the Bf 110's cockpit, as a fraction of the screen's height from its top:
 * GLASS_ABOVE_110 above the Revi's foot, which stands REVI_RAISE above the panel, which stands SINK below the screen's
 * foot (D107, D129, D141). The camera's picture is shifted to match (`CameraRig.aim`, as the Bf 109's, D93).
 */
export const BF110_AIM = 1 - (SHARE * (HEIGHT - SINK + REVI_RAISE + GLASS_ABOVE_110)) / HEIGHT;
export { REVI_RAISE };

/** A picture point in dial radii from the axis at the panel's top. */
export const P = (px, py) => [(px - AXIS) / PX, (py - TOP) / PX];

/**
 * Everything on the panel, in picture pixels (src/ui/bf110Layout.js): the outline; dials [x, y, face radius, mounting
 * half-width]; boxes [left, top, right, bottom]; correction cards; knobs and lamps [x, y, radius]; switches [x, top,
 * bottom] (the knob's travel).
 */
export const BF110_PANEL = {
  width: (2 * Math.max(...OUTLINE.map(([x]) => Math.abs(x - AXIS)))) / PX + 0.2,
  height: HEIGHT,
  screenShare: SHARE,
  sink: SINK, // dial radii below the screen's foot (D129)
  above: ABOVE, // dial radii the panel rises above its top edge, kept on its canvas (D140; none since D156)
  ownBackground: true,
  outline: OUTLINE,
  ...LAYOUT,
};

/** The Bf 110's Revi for reviPlacement (src/ui/reviSight.js): on its guns' line, at the Bf 109's size, no cable (D107). */
export const BF110_REVI = { panel: BF110_PANEL, aim: BF110_AIM, scale: BF109_SCALE, parts: REVI_110, cable: false };

/**
 * The panel's top edge on a screen `height` px high at dial radius r, as InstrumentPanel draws it: the canvas is cut at
 * the lowest gauges' centres, on the screen's foot (D129).
 */
export const panelTop110 = (height, r) => height - (BF110_PANEL.height - SINK) * r;

/** A layout entry in canvas pixels, given the axis at the panel's top (x0, y0) and dial radius r. */
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



/** Draws the panel with the axis at its top at (x0, y0) and dial radius r. `v` is instrumentReadings(). */
export function bf110Panel(g, x0, y0, r, v, now = new Date()) {
  blackScrews(() => drawPanel(g, x0, y0, r, v, now)); // every screw black (D160)
}

function drawPanel(g, x0, y0, r, v, now) {
  const L = BF110_PANEL;
  const at = placer(x0, y0, r);
  drawBf110Interior(g, at); // the cockpit's sides round the panel, below the drawn front frame (D117)
  drawBf110Fittings(g, at, L, v);
  for (const [name, entry] of Object.entries(L.dials)) {
    const [x, y, , outer] = at.dial(entry);
    mount(g, x, y, outer); // every dial in the turn and slip indicator's black mounting (the red bezels gone, D162)
  }
  settingKnob(g, ...at.knob(L.knobs.setAltimeter));
  const dial = (name) => at.dial(L.dials[name]);
  const face = (name) => dial(name).slice(0, 3);
  whiteDials(() => {
    lwClock(g, ...face('clock'), now);
    lwPatinCompass(g, ...face('compass'), v.heading);
    lwTurnBank(g, ...face('turn'), v.turnRate, v.sideG);
    lwVario(g, ...face('climb'), v.climb);
    const [ax, ay, ar] = face('altimeter');
    lwFineAltimeter(g, ax, ay, ar, v.altitude, (x, wy) => millibarWindow(g, x, wy, ar, 1013));
    lwHorizon(g, ...face('horizon'), v.bank, v.pitch);
    lwAirspeed(g, ...face('airspeed'), v.airspeed);
    airThermometer(g, ...face('airTemp'), v.airTemp);
    autopilotIndicator(g, ...face('autopilot'));
    trimIndicator(g, ...face('trim'), v.trimDegrees); // the elevator trim, in the AEG indicator's place (D161)
    pressluftGauge(g, ...dial('pressluft'), pressluftReading(v)); // 0 stopped, 150 running (D142)
    radiatorSwitch(g, ...dial('radiatorLeft'), !!v.radiatorOpen);
    radiatorSwitch(g, ...dial('radiatorRight'), !!v.radiatorOpen);
    tankSelector(g, ...dial('selector'));
  });
  roundCounter(g, ...dial('counter'), cannonCounter(v));
  ['Left', 'Right'].forEach((side, i) => {
    const e = v.engines[i] ?? v.engines[0];
    whiteDials(() => {
      if (e.pitchClock) lwPitchIndicator(g, ...face(`pitch${side}`), e.pitchClock); // each engine's blade angle (D109)
      lwRpm(g, ...face(`rpm${side}`), e.rpm, v.rpmLimit, RPM_110);
      lwAta(g, ...face(`ata${side}`), e.manifold);
      coolantGauge(g, ...face(`temp${side}`), e.coolant);
    });
  });
  // The correction cards over the engine gauges' and coolant thermometers' tops (#34, shown only).
  for (const [name, b] of Object.entries(L.cards)) correctionCard(g, at.box(b), name.startsWith('temp') ? 'Km 10 5 0' : 'd 30′ 5′');
  // The fuel contents of the tank the selector chooses (front left, at 1), white, in its yellow ring (D105, #34).
  const tank = v.fuelSelected;
  lwFuelGauge(g, ...face('fuel'), tank ? tank.litres : 0, tank ? tank.capacity : 0, { ring: '#d9b623' });
}
