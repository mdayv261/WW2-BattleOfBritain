// Basic instruments for Phase 2 (D28): a strip of 2D dials along the bottom of the screen, in each side's
// units. Period faces and layouts come with the 3D cockpits in Phase 7.
//   RAF: the blind-flying panel (airspeed, artificial horizon, rate of climb, altimeter, direction indicator,
//        turn and slip), boost, rpm, undercarriage lamps and flap position. 1940 styles: an all-black horizon,
//        a heading drum in the direction indicator, and rate 1-3 marks on the turn indicator.
//   Bf 109: airspeed (km/h), altimeter (m), turn and bank (its only blind-flying instrument, S20), compass,
//        manifold pressure (ata), rpm, the propeller pitch clock (S32) and the undercarriage and flaps.

import { Euler, Vector3 } from 'three';
import { UNIT, ISA } from '../core/constants.js';
import { headingOf } from './units.js';
import { face, needle, scale, horizon, headingDrum, turnAndSlip, lamp, label } from './dials.js';
import { rafAltimeter, luftwaffeAltimeter } from './altimeters.js';

const DEG = 180 / Math.PI;
const PITCH_CLOCK_MINUTES_PER_DEGREE = 10; // S32: "about ten minutes on this clock being equivalent to 1 deg"
const FLAP_TRAVEL_109 = 40; // deg: the 109's flap markings run 0 to 40 (S20)

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
    flaps: raf ? plane.surfaces.flaps : plane.surfaces.flaps * FLAP_TRAVEL_109,
  };
}

/** A dial with one needle over a scale. */
function gauge(g, x, y, r, value, opts, title) {
  face(g, x, y, r, title);
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
  gauge(g, ...at(L.airspeed), r, v.airspeed, { min: 0, max: 450, ...ARC, major: 50, minor: 10, label: (s) => (s % 100 ? '' : String(s / 10)) });
  horizon(g, ...at(L.horizon), r, v.bank, v.pitch);
  gauge(g, ...at(L.climb), r, v.climb / 1000, { min: -4, max: 4, start: -Math.PI * 1.35, end: Math.PI * 0.35, major: 1, minor: 0.5, label: (s) => String(Math.abs(s)) });
  rafAltimeter(g, ...at(L.altimeter), r, v.altitude, 1013);
  headingDrum(g, ...at(L.direction), r, v.heading);
  turnAndSlip(g, ...at(L.turn), r, v.turnRate, v.sideG);
  gauge(g, ...at(L.rpm), r, v.rpm / 1000, { min: 0, max: 4, ...ARC, major: 0.5, minor: 0.1, label: (s) => (s % 1 ? '' : String(s)) });
  label(g, at(L.rpm)[0], at(L.rpm)[1] + r * 0.66, r * 0.65, 'R.P.M. ×1000');
  gauge(g, ...at(L.boost), r, v.manifold, { min: -6, max: 14, ...ARC, major: 2, minor: 1, label: (s) => (s > 0 ? `+${s}` : String(s)) });
  label(g, at(L.boost)[0], at(L.boost)[1] + r * 0.66, r * 0.65, 'BOOST');
  const [gx, gy] = at(L.gear);
  lamp(g, gx - r * 0.35, gy, r * 0.17, '#3fbf4a', v.gearDown, 'DOWN');
  lamp(g, gx + r * 0.35, gy, r * 0.17, '#d8402e', v.gearUp, 'UP');
  label(g, gx, gy - r * 0.45, r * 1.3, 'UNDERCARRIAGE');
  label(g, ...at(L.flaps), r * 1.3, `FLAPS ${v.flaps > 0.5 ? 'DOWN' : 'UP'}`);
}

function luftwaffePanel(g, at, r, v) {
  gauge(g, ...at(0), r, v.airspeed, { min: 0, max: 750, ...ARC, major: 100, minor: 50, label: (s) => String(s / 100) }, 'km/h ×100');
  luftwaffeAltimeter(g, ...at(1), r, v.altitude, 1013, 'HÖHENMESSER');
  turnAndSlip(g, ...at(2), r, v.turnRate, v.sideG, 'WENDEZEIGER');
  headingDrum(g, ...at(3), r, v.heading, 'KOMPASS');
  gauge(g, ...at(4), r, v.manifold, { min: 0.6, max: 1.8, ...ARC, major: 0.2, minor: 0.1, label: (s) => s.toFixed(1) }, 'LADEDRUCK ata');
  gauge(g, ...at(5), r, v.rpm / 100, { min: 0, max: 36, ...ARC, major: 4, minor: 2, label: (s) => String(s) }, 'U/min ×100');
  // Propeller pitch clock: hour and minute hands (S32).
  const [cx, cy] = at(6);
  face(g, cx, cy, r, 'LUFTSCHRAUBE');
  scale(g, cx, cy, r, { min: 0, max: 12, start: 0, end: Math.PI * 2, major: 1, minor: 1, label: (s) => (s === 0 ? '12' : s === 12 ? '' : String(s)) });
  needle(g, cx, cy, r * 0.5, (v.pitchClock.hours / 12) * Math.PI * 2, 5);
  needle(g, cx, cy, r * 0.82, (v.pitchClock.minutes / 60) * Math.PI * 2, 2.5);
  const [lx, ly] = at(7);
  lamp(g, lx - r * 0.3, ly - r * 0.45, r * 0.15, '#3fbf4a', v.gearDown, 'AUS');
  lamp(g, lx + r * 0.3, ly - r * 0.45, r * 0.15, '#d8402e', v.gearUp, 'EIN');
  label(g, lx, ly + r * 0.35, r * 1.2, `KLAPPEN ${Math.round(v.flaps)}°`);
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

  /** Redraws the panel for the current state: the RAF layout, or the Luftwaffe strip of dials. */
  update(sim) {
    if (!this.visible) return;
    const v = instrumentReadings(sim);
    const width = window.innerWidth;
    if (v.raf) {
      const L = RAF_LAYOUT;
      const r = Math.min(66, (width * 0.92) / L.width, (window.innerHeight * 0.4) / L.height);
      const height = L.height * r + 6;
      const g = this.context(width, height);
      g.fillStyle = 'rgba(18, 18, 16, 0.94)';
      g.fillRect((width - L.width * r) / 2, 0, L.width * r, height);
      rafPanel(g, width / 2, 0, r, v);
      return;
    }
    const count = 8;
    const r = Math.min(62, (width / count) * 0.42);
    const height = r * 2 + 34;
    const g = this.context(width, height);
    g.fillStyle = 'rgba(28, 30, 26, 0.88)';
    const span = count * r * 2.3;
    const left = (width - span) / 2;
    g.fillRect(left - 8, 0, span + 16, height);
    luftwaffePanel(g, (i) => [left + r * 1.15 + i * r * 2.3, r + 8], r, v);
  }
}
