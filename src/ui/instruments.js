// Basic instruments for Phase 2 (D28): a strip of 2D dials along the bottom of the screen, in each side's
// units. The 3D cockpits come in Phase 7.
//   RAF: the blind-flying panel (airspeed, artificial horizon, rate of climb, altimeter, direction indicator,
//        turn and slip), boost, rpm, undercarriage lamps and flap position. 1940 styles: an all-black horizon,
//        a heading drum in the direction indicator, and rate 1-3 marks on the turn indicator.
//   Bf 109: airspeed (km/h), altimeter (m), turn and bank (its only blind-flying instrument, S20), compass,
//        manifold pressure (ata), rpm, the propeller pitch clock (S32) and the undercarriage and flaps.
// Each side's panel is laid out after a photograph of the real one (D32).

import { Euler, Vector3 } from 'three';
import { UNIT, ISA } from '../core/constants.js';
import { headingOf } from './units.js';
import { face, needle, scale, horizon, headingDrum, turnAndSlip, lamp, label, flapIndicator } from './dials.js';
import { rafAltimeter, luftwaffeAltimeter } from './altimeters.js';
import { rafAirspeed } from './airspeed.js';
import { rafTachometer } from './engineGauges.js';
import { rafHorizon, rafClimb, rafTurnSlip } from './rafBlindFlying.js';

const DEG = 180 / Math.PI;
const PITCH_CLOCK_MINUTES_PER_DEGREE = 10; // S32: "about ten minutes on this clock being equivalent to 1 deg"

/** What the instruments show, in the aircraft's own units. Pure: used by the panel and the tests. */
export function instrumentReadings(sim) {
  const { ac, plane } = sim;
  const d = plane.last;
  const body = plane.body;
  const raf = ac.side === 'RAF';
  const euler = new Euler().setFromQuaternion(body.quaternion, 'YZX');
  const spin = body.angularVelocity.clone().applyQuaternion(body.quaternion);
  // Propeller pitch clock: 12 o'clock at the fine stop is assumed (the zero is not stated, D32).
  const minutes = ((plane.beta - ac.propeller.betaMin) * DEG) * PITCH_CLOCK_MINUTES_PER_DEGREE;
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
    manifold: raf ? (d.map - ISA.P0) / UNIT.PSI : d.map / UNIT.ATA,
    pitchClock: raf ? null : { hours: (minutes / 60) % 12, minutes: minutes % 60 },
    gearDown: plane.surfaces.gear > 0.99,
    gearUp: plane.surfaces.gear < 0.01,
    flaps: plane.surfaces.flaps, // fraction of travel
    flapDegrees: plane.surfaces.flaps * ac.controls.flapTravel * DEG,
    flapTravel: ac.controls.flapTravel * DEG,
    flapTakeoff: ac.controls.flapTakeoff,
    flapLanding: ac.controls.flapLanding,
  };
}

/** A dial with one needle over a scale. */
/**
 * A dial with one needle over a scale; `opts.band` ({ from, to, colour }) paints a coloured band on the scale.
 */
function gauge(g, x, y, r, value, opts, title) {
  face(g, x, y, r, title);
  if (opts.band) {
    const { from, to, colour } = opts.band;
    const a = (v) => opts.start + ((v - opts.min) / (opts.max - opts.min)) * (opts.end - opts.start) - Math.PI / 2;
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
// the engine instruments to its right (rpm above, boost below) and the undercarriage indicator to its left.
// Positions are in dial radii from the top centre of the panel. No captions: the real panel has none.
const RAF_LAYOUT = {
  width: 13.4, height: 4.9,
  airspeed: [-2.3, 1.3], horizon: [0, 1.3], climb: [2.3, 1.3],
  altimeter: [-2.3, 3.6], direction: [0, 3.6], turn: [2.3, 3.6],
  rpm: [5.2, 1.3], boost: [5.2, 3.6], gear: [-5.0, 1.6], flaps: [-5.0, 3.5],
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
  // Orange band over the +12 lb emergency boost (product owner's request).
  gauge(g, ...at(L.boost), r, v.manifold, {
    min: -6, max: 14, ...ARC, major: 2, minor: 1, label: (s) => (s > 0 ? `+${s}` : String(s)), band: { from: 12, to: 14, colour: '#e07a26' },
  });
  label(g, at(L.boost)[0], at(L.boost)[1] + r * 0.66, r * 0.65, 'BOOST');
  const [gx, gy] = at(L.gear);
  lamp(g, gx - r * 0.35, gy, r * 0.17, '#3fbf4a', v.gearDown, 'DOWN');
  lamp(g, gx + r * 0.35, gy, r * 0.17, '#d8402e', v.gearUp, 'UP');
  label(g, gx, gy - r * 0.45, r * 1.3, 'UNDERCARRIAGE');
  label(g, ...at(L.flaps), r * 1.3, 'FLAPS');
  flapIndicator(g, at(L.flaps)[0], at(L.flaps)[1] + r * 0.55, r * 1.5, v, { up: 'UP', down: 'DOWN', takeoff: 'T/O', landing: 'LAND' });
}

// Bf 109 E panel layout, after a photograph of a preserved E (D32): the propeller pitch clock at the top
// centre; altimeter above airspeed on the left; the compass above the turn and bank in the middle (as the
// product owner placed them); a gap for the
// gunsight placard, then the rpm gauge with the smaller manifold-pressure gauge beside it on the right; the
// undercarriage indicator and flap position on the left. Positions in dial radii from the top centre.
const LW_LAYOUT = {
  width: 12.8, height: 5.9,
  pitchClock: [0, 0.66], altimeter: [-2.4, 2.3], airspeed: [-2.4, 4.6], compass: [0, 2.3], turn: [0, 4.6],
  rpm: [3.5, 2.6], ata: [5.4, 2.6], gear: [-4.9, 2.5], flaps: [-4.9, 4.4],
  sizes: { pitchClock: 0.56, ata: 0.72 },
};

function luftwaffePanel(g, x0, y0, r, v) {
  const L = LW_LAYOUT;
  const at = ([dx, dy]) => [x0 + dx * r, y0 + dy * r];
  luftwaffeAltimeter(g, ...at(L.altimeter), r, v.altitude, 1013);
  gauge(g, ...at(L.airspeed), r, v.airspeed, { min: 0, max: 750, ...ARC, major: 100, minor: 50, label: (s) => String(s) });
  label(g, at(L.airspeed)[0], at(L.airspeed)[1] + r * 0.66, r * 0.7, 'km/h');
  turnAndSlip(g, ...at(L.turn), r, v.turnRate, v.sideG);
  headingDrum(g, ...at(L.compass), r, v.heading);
  gauge(g, ...at(L.rpm), r, v.rpm / 100, { min: 0, max: 36, ...ARC, major: 4, minor: 2, label: (s) => String(s) });
  label(g, at(L.rpm)[0], at(L.rpm)[1] + r * 0.66, r * 0.7, 'U/min ×100');
  const ra = r * L.sizes.ata;
  gauge(g, ...at(L.ata), ra, v.manifold, { min: 0.6, max: 1.8, ...ARC, major: 0.2, minor: 0.1, label: (s) => s.toFixed(1) });
  label(g, at(L.ata)[0], at(L.ata)[1] + ra * 0.66, ra * 0.9, 'ata');
  // Propeller pitch clock: hour and minute hands (S32).
  const rc = r * L.sizes.pitchClock;
  const [cx, cy] = at(L.pitchClock);
  face(g, cx, cy, rc);
  scale(g, cx, cy, rc, { min: 0, max: 12, start: 0, end: Math.PI * 2, major: 1, minor: 1, label: (s) => (s === 0 ? '12' : s === 12 ? '' : String(s)) });
  needle(g, cx, cy, rc * 0.5, (v.pitchClock.hours / 12) * Math.PI * 2, 4);
  needle(g, cx, cy, rc * 0.82, (v.pitchClock.minutes / 60) * Math.PI * 2, 2);
  const [gx, gy] = at(L.gear);
  lamp(g, gx - r * 0.35, gy, r * 0.17, '#3fbf4a', v.gearDown, 'AUS');
  lamp(g, gx + r * 0.35, gy, r * 0.17, '#d8402e', v.gearUp, 'EIN');
  label(g, gx, gy - r * 0.45, r * 1.3, 'FAHRWERK');
  label(g, ...at(L.flaps), r * 1.3, 'KLAPPEN');
  flapIndicator(g, at(L.flaps)[0], at(L.flaps)[1] + r * 0.55, r * 1.5, v, { up: '0°', down: `${Math.round(v.flapTravel)}°`, takeoff: 'START', landing: 'LANDUNG' });
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

  /** Redraws the panel for the current state, in the layout of the aircraft's side. */
  update(sim) {
    if (!this.visible) return;
    const v = instrumentReadings(sim);
    const width = window.innerWidth;
    const L = v.raf ? RAF_LAYOUT : LW_LAYOUT;
    const r = Math.min(66, (width * 0.92) / L.width, (window.innerHeight * 0.4) / L.height);
    const height = L.height * r + 6;
    const g = this.context(width, height);
    g.fillStyle = 'rgba(18, 18, 16, 0.94)';
    g.fillRect((width - L.width * r) / 2, 0, L.width * r, height);
    if (v.raf) rafPanel(g, width / 2, 0, r, v);
    else luftwaffePanel(g, width / 2, 0, r, v);
  }
}
