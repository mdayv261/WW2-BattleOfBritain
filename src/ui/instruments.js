// Basic instruments for Phase 2 (D28): a strip of 2D dials along the bottom of the screen, in each side's
// units. The 3D cockpits come in Phase 7.
//   RAF: the blind-flying panel (airspeed, artificial horizon, rate of climb, altimeter, direction indicator,
//        turn and slip), boost, rpm, undercarriage lamps and flap position. 1940 styles: an all-black horizon,
//        a heading drum in the direction indicator, and rate 1-3 marks on the turn indicator.
//   Bf 109 and Bf 110: their own modules, src/ui/bf109Panel.js (D38) and src/ui/bf110Panel.js (D39).
// Each side's panel is laid out after a photograph of the real one (D32, D38).

import { Euler, Vector3 } from 'three';
import { UNIT, ISA } from '../core/constants.js';
import { headingOf } from './units.js';
import { face, needle, scale, headingDrum, label } from './dials.js';
import { rafAltimeter, luftwaffeAltimeter } from './altimeters.js';
import { rafAirspeed } from './airspeed.js';
import { rafTachometer } from './engineGauges.js';
import { rafHorizon, rafClimb, rafTurnSlip } from './rafBlindFlying.js';
import { BF109_LAYOUT, bf109Panel } from './bf109Panel.js';
import { undercarriageDisplay, flapDisplay, trimDisplay, TRIM_SCALE } from './panelControls.js';
import { BF110_LAYOUT, bf110Panel } from './bf110Panel.js';
import { counterState } from './ammoCounter.js';

const DEG = 180 / Math.PI;
const PITCH_CLOCK_MINUTES_PER_DEGREE = 10; // S32: "about ten minutes on this clock being equivalent to 1 deg"

/** Propeller pitch clock: 12 o'clock at the fine stop is assumed (the zero is not stated, D32). */
function pitchClock(beta, ac) {
  const minutes = ((beta - ac.propeller.betaMin) * DEG) * PITCH_CLOCK_MINUTES_PER_DEGREE;
  return { hours: (minutes / 60) % 12, minutes: minutes % 60 };
}

/**
 * Fuel and oil pressure gauge readings (kg/cm²) from the engine's gauge data: the running values while the engine
 * turns, rising from nothing as it starts (the pressures are not modelled physically).
 */
function gaugePressures(p, rpm) {
  const kg = (pa) => Math.round((pa / UNIT.ATA) * 100) / 100;
  const running = Math.min(1, Math.max(0, (rpm - 200) / 800));
  return {
    fuel: { value: kg(p.fuelRunning) * running, max: kg(p.fuelFullScale), low: kg(p.fuelLow), normal: p.fuelNormal.map(kg) },
    oil: { value: kg(p.oilRunning) * running, max: kg(p.oilFullScale), low: kg(p.oilLow), normal: p.oilNormal.map(kg) },
  };
}

/** What the instruments show, in the aircraft's own units. Pure: used by the panel and the tests. */
export function instrumentReadings(sim) {
  const { ac, plane } = sim;
  const d = plane.last;
  const body = plane.body;
  const raf = ac.side === 'RAF';
  const euler = new Euler().setFromQuaternion(body.quaternion, 'YZX');
  const spin = body.angularVelocity.clone().applyQuaternion(body.quaternion);
  return {
    raf,
    airspeed: d.eas / (raf ? UNIT.MPH : UNIT.KMH),
    altitude: raf ? d.altitude / UNIT.FT : d.altitude,
    climb: raf ? (body.velocity.y / UNIT.FT) * 60 : body.velocity.y,
    heading: headingOf(new Vector3(1, 0, 0).applyQuaternion(body.quaternion)),
    bank: euler.x,
    pitch: euler.z,
    turnRate: -spin.y * DEG, // deg/s, + turning right
    sideG: d.sideG,
    rpm: plane.omega / UNIT.RPM,
    coolant: plane.engines[0].heat.coolant, // °C, the first engine's (the single-engine panels)
    oil: plane.engines[0].heat.oil,
    manifold: raf ? (d.map - ISA.P0) / UNIT.PSI : d.map / UNIT.ATA,
    // The RAF panel's manifold pressure gauge, inches of mercury absolute (product owner, D85).
    mapInHg: raf ? d.map / UNIT.INHG : null,
    // The normal boost range (lb/sq in) for the green bands of the boost and manifold pressure gauges (D85).
    normalBoost: plane.engine.boostNormal ? [plane.engine.boostNormal.from, plane.engine.boostNormal.to]
      .map((pa) => (pa - ISA.P0) / UNIT.PSI) : null,
    pitchClock: raf ? null : pitchClock(plane.beta, ac),
    // Each engine's own readings (the twins have a set of engine instruments per engine).
    engines: plane.engines.map((e, i) => ({
      rpm: e.omega / UNIT.RPM,
      coolant: e.heat.coolant, // °C (Phase 5, D62)
      oil: e.heat.oil,
      manifold: raf ? (d.engines[i].map - ISA.P0) / UNIT.PSI : d.engines[i].map / UNIT.ATA,
      pitchClock: raf ? null : pitchClock(e.beta, ac),
    })),
    // Fuel in each wing, litres (fuel use is not modelled yet: full tanks).
    fuelTanks: ac.fuel ? [ac.fuel.wingTank, ac.fuel.wingTank].map((m3) => ({ litres: m3 * 1000, capacity: m3 * 1000 })) : null,
    gearSelected: sim.input ? !!sim.input.gear : plane.surfaces.gear > 0.5, // the undercarriage lever: down
    pressures: plane.engine.pressures ? gaugePressures(plane.engine.pressures, plane.omega / UNIT.RPM) : null,
    // The ammunition counter's columns (Bf 109, D64, D65): each gun's tape and window from its rounds left, read from
    // the simulation's guns ({ rounds, capacity } by gun, from checkpoint 3); full and still until then.
    ammoCounters: ac.ammoCounter ? ac.ammoCounter.map((gun) => {
      const state = sim.guns?.[gun];
      return { gun, ...(state ? counterState(state.rounds, state.capacity) : { fraction: 1, angle: 0, empty: false }) };
    }) : null,
    // Normal temperature ranges for gauges that mark them (°C), where the engine data give them (D63).
    normalTemps: plane.engine.heat.oilNormal ? {
      oil: [plane.engine.heat.oilNormal.from, plane.engine.heat.oilNormal.to],
      coolant: [plane.engine.heat.coolantNormal.from, plane.engine.heat.coolantNormal.to],
    } : null,
    gearDown: plane.surfaces.gear > 0.99,
    gearUp: plane.surfaces.gear < 0.01,
    flaps: plane.surfaces.flaps, // fraction of travel
    flapDegrees: plane.surfaces.flaps * ac.controls.flapTravel * DEG,
    flapTravel: ac.controls.flapTravel * DEG,
    flapTakeoff: ac.controls.flapTakeoff,
    flapLanding: ac.controls.flapLanding,
    // Elevator trim on the display's ±15° scale (D74): the trim setting runs from -1 (full nose down) to +1 (nose up).
    trimDegrees: plane.surfaces.trim * TRIM_SCALE,
  };
}

/** The colours of the bands on the RAF engine gauges: the normal range (as the Luftwaffe gauges', D63) and emergency. */
export const BAND = { normal: '#2f9e4a', emergency: '#e07a26' };

/** The bands a gauge paints on its scale: `opts.bands` ([{ from, to, colour }]) and the older single `opts.band`. */
export const bandsOf = (opts) => [...(opts.bands ?? []), ...(opts.band ? [opts.band] : [])];

/**
 * A dial with one needle over a scale; each band ({ from, to, colour }) paints a coloured arc on the scale, clipped to
 * it.
 */
export function gauge(g, x, y, r, value, opts, title) {
  face(g, x, y, r, title);
  const a = (v) => {
    const t = Math.min(1, Math.max(0, (v - opts.min) / (opts.max - opts.min)));
    return opts.start + t * (opts.end - opts.start) - Math.PI / 2;
  };
  for (const { from, to, colour } of bandsOf(opts)) {
    g.strokeStyle = colour;
    g.lineWidth = r * 0.09;
    g.beginPath();
    g.arc(x, y, r * 0.9, a(from), a(to));
    g.stroke();
  }
  const angle = scale(g, x, y, r, opts);
  needle(g, x, y, r * 0.8, angle(value));
}

const ARC = { start: -Math.PI * 0.75, end: Math.PI * 0.75 };

// RAF panel layout, after a Spitfire I panel (D32): the blind-flying panel in the middle, two rows of three
// (airspeed, artificial horizon, rate of climb above; altimeter, direction indicator, turn and slip below),
// the engine instruments to its right (product owner, D85): the rev counter, with the manifold pressure (MAP) gauge the
// same size below it, and the oil temperature, radiator (coolant) temperature and boost gauges, small, one above another
// right of them;
// the undercarriage and flap displays to the blind-flying panel's left, and the elevator trim display left of those
// (D74). Positions are in dial radii from the top centre of the panel.
const SMALL = 19 / 30; // the small engine gauges' radius, in dial radii: the Bf 110's engine gauges' proportion (D85)
const COLUMN_X = 5.2 + 1 + 0.3 + SMALL; // the small gauges' column: right of the rev counter, a 0.3-radius gap
const COLUMN_GAP = (4.7 - 6 * SMALL) / 4; // three small gauges spread evenly over the panel's height (0.1 to 4.8)
const row = (i) => 0.1 + COLUMN_GAP * (i + 1) + SMALL * (2 * i + 1);
export const RAF_LAYOUT = {
  width: 17.4, height: 4.9,
  airspeed: [-2.3, 1.3], horizon: [0, 1.3], climb: [2.3, 1.3],
  altimeter: [-2.3, 3.6], direction: [0, 3.6], turn: [2.3, 3.6],
  rpm: [5.2, 1.3], manifold: [5.2, 3.6], oilTemp: [COLUMN_X, row(0)], radTemp: [COLUMN_X, row(1)], boost: [COLUMN_X, row(2)],
  small: SMALL, // the radius of the temperature and boost gauges, in dial radii (the MAP gauge is full size)
  // Undercarriage and flap displays as on the Luftwaffe panels (product owner, D47): plates [left, top, right, bottom].
  gear: [-6.45, 0.1, -3.8, 2.4], flaps: [-6.45, 2.55, -3.8, 4.8],
  // Elevator trim display left of the undercarriage and flaps, their full height (product owner, D74).
  trim: [-7.85, 0.1, -6.6, 4.8],
  blindFlying: { left: -3.55, right: 3.55, top: 0.1, bottom: 4.8 },
};

function rafPanel(g, x0, y0, r, v) {
  const L = RAF_LAYOUT;
  const at = ([dx, dy]) => [x0 + dx * r, y0 + dy * r];
  // The blind-flying panel is a separate plate on the main panel.
  const bf = L.blindFlying;
  g.fillStyle = '#101010';
  g.fillRect(x0 + bf.left * r, y0 + bf.top * r, (bf.right - bf.left) * r, (bf.bottom - bf.top) * r);
  g.strokeStyle = '#3a3a36';
  g.lineWidth = 2;
  g.strokeRect(x0 + bf.left * r, y0 + bf.top * r, (bf.right - bf.left) * r, (bf.bottom - bf.top) * r);
  rafAirspeed(g, ...at(L.airspeed), r, v.airspeed);
  rafHorizon(g, ...at(L.horizon), r, v.bank, v.pitch);
  rafClimb(g, ...at(L.climb), r, v.climb);
  rafAltimeter(g, ...at(L.altimeter), r, v.altitude, 1013);
  headingDrum(g, ...at(L.direction), r, v.heading);
  rafTurnSlip(g, ...at(L.turn), r, v.turnRate, v.sideG);
  rafTachometer(g, ...at(L.rpm), r, v.rpm);
  rafEngineGauges(g, at, r, v);
  const plateBox = ([left, top, right, bottom]) => ({
    x: x0 + ((left + right) / 2) * r, y: y0 + ((top + bottom) / 2) * r, w: (right - left) * r, h: (bottom - top) * r,
  });
  undercarriageDisplay(g, plateBox(L.gear), r, v, 'UNDERCARRIAGE');
  flapDisplay(g, plateBox(L.flaps), r, v, 'FLAPS');
  trimDisplay(g, plateBox(L.trim), r, v);
}

/**
 * The RAF panel's MAP gauge and small engine gauges (D85): the scales are display choices; the green normal bands are the Merlin's
 * (S33), the orange band the +12 lb emergency boost (product owner's request). Captions keep the large dials' size, so
 * they stay legible.
 */
export function rafEngineScales(v) {
  const boost = v.normalBoost ?? [];
  const inHg = (psi) => (ISA.P0 + psi * UNIT.PSI) / UNIT.INHG;
  const normal = (range) => (range?.length ? [{ from: range[0], to: range[1], colour: BAND.normal }] : []);
  return {
    manifold: { min: 10, max: 60, major: 10, minor: 2, label: String,
      bands: [...normal(boost.map(inHg)), { from: inHg(12), to: 60, colour: BAND.emergency }] },
    boost: { min: -6, max: 14, major: 2, minor: 1, label: (s) => (s > 0 ? `+${s}` : String(s)),
      bands: [...normal(boost), { from: 12, to: 14, colour: BAND.emergency }] },
    oilTemp: { min: 0, max: 100, major: 20, minor: 10, label: String, bands: normal(v.normalTemps?.oil) },
    radTemp: { min: 40, max: 140, major: 20, minor: 10, label: String, bands: normal(v.normalTemps?.coolant) },
  };
}

// Each gauge's caption, its unit line above it where it has one, and the caption's size against the usual lettering
// (product owner, D85: a larger MAP, "in.Hg" above it, "PSI" above BOOST).
export const CAPTIONS = {
  manifold: { text: 'MAP', unit: 'in.Hg', scale: 1.3 },
  boost: { text: 'BOOST', unit: 'PSI' },
  oilTemp: { text: 'OIL °C' },
  radTemp: { text: 'RADIATOR °C' },
};
const LETTERING = 0.65; // label() size (in dial radii of the large dials) of the usual captions: about 0.1 r high

/**
 * A gauge's caption lines: [{ text, dy (below the dial's centre), size (label() size) }], the unit line above the
 * caption. `size` is the dial's radius, `r` the large dials'.
 */
export function captionLines(name, size, r) {
  const c = CAPTIONS[name];
  const captionSize = r * LETTERING * (c.scale ?? 1);
  const dy = size * 0.62;
  const lines = [{ text: c.text, dy, size: captionSize }];
  // The unit line one line-height above, half of each line's lettering apart (label() letters are 0.16 of its size).
  if (c.unit) lines.unshift({ text: c.unit, dy: dy - 0.16 * 1.25 * (captionSize + r * LETTERING) / 2, size: r * LETTERING });
  return lines;
}

function rafEngineGauges(g, at, r, v) {
  const L = RAF_LAYOUT;
  const s = L.small * r;
  const scales = rafEngineScales(v);
  const values = { manifold: v.mapInHg, boost: v.manifold, oilTemp: v.oil, radTemp: v.coolant };
  for (const name of Object.keys(CAPTIONS)) {
    const [x, y] = at(L[name]);
    const size = name === 'manifold' ? r : s; // the MAP gauge as large as the rev counter (product owner, D85)
    gauge(g, x, y, size, values[name], { ...scales[name], ...ARC });
    for (const line of captionLines(name, size, r)) label(g, x, y + line.dy, line.size, line.text);
  }
}

/** The fitted dial radius for a panel layout on a screen: as large as fits, capped. */
function fittedRadius(L, width, height) {
  return Math.min(66, (width * 0.96) / L.width, (height * (L.screenShare ?? 0.4)) / L.height);
}

/**
 * A panel's dial radius (screen pixels) on a screen `width` x `height`. A layout with `matchBf109` takes the Bf 109's
 * radius times that factor, so its instruments come out the same size as the Bf 109's (D64), but never more than fits.
 */
export function panelRadius(L, width, height) {
  const r = fittedRadius(L, width, height);
  return L.matchBf109 ? Math.min(r, fittedRadius(BF109_LAYOUT, width, height) * L.matchBf109) : r;
}

export class InstrumentPanel {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;left:0;bottom:0;width:100%;pointer-events:none;';
    document.body.appendChild(this.canvas);
    this.visible = true;
  }

  toggle() {
    this.visible = !this.visible;
    this.canvas.style.display = this.visible ? 'block' : 'none';
  }

  /** Sizes the canvas to `height` CSS pixels and returns its 2D context, cleared. */
  context(width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.canvas.style.height = `${height}px`;
    }
    const g = this.canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);
    return g;
  }

  /**
   * Redraws the panel for the current state, in the layout of the aircraft's side. `hidden` hides it for now (the pilot
   * looking to the side, up or behind, D58) without changing the I key's setting.
   */
  update(sim, { hidden = false } = {}) {
    // Aircraft without a cockpit (the AI-only He 111) have no panel.
    const shown = this.visible && !hidden && sim.ac.cockpit !== false;
    this.canvas.style.display = shown ? 'block' : 'none';
    if (!shown) return;
    const v = instrumentReadings(sim);
    const width = window.innerWidth;
    const twin = sim.ac.id === 'bf110c4';
    const L = v.raf ? RAF_LAYOUT : twin ? BF110_LAYOUT : BF109_LAYOUT;
    const r = panelRadius(L, width, window.innerHeight);
    const height = L.height * r + 6;
    const g = this.context(width, height);
    if (!L.ownBackground) {
      g.fillStyle = 'rgba(18, 18, 16, 0.94)';
      g.fillRect((width - L.width * r) / 2, 0, L.width * r, height);
    }
    if (v.raf) rafPanel(g, width / 2, 0, r, v);
    else if (twin) bf110Panel(g, width / 2, 0, r, v);
    else bf109Panel(g, width / 2, 0, r, v);
  }
}
