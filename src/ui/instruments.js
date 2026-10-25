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

/** Altimeter with a long hand for hundreds (one turn per `perTurn`) and a short one for ten times that. */
function altimeter(g, x, y, r, value, perTurn, title) {
  face(g, x, y, r, title);
  scale(g, x, y, r, { min: 0, max: 10, start: 0, end: Math.PI * 2 * 0.9, major: 1, minor: 0.5, label: (v) => (v < 10 ? String(v) : '') });
  needle(g, x, y, r * 0.5, (value / (perTurn * 10)) * Math.PI * 2, 5);
  needle(g, x, y, r * 0.85, (value / perTurn) * Math.PI * 2, 2.5);
}

/** A dial with one needle over a scale. */
function gauge(g, x, y, r, value, opts, title) {
  face(g, x, y, r, title);
  const angle = scale(g, x, y, r, opts);
  needle(g, x, y, r * 0.8, angle(value));
}

const ARC = { start: -Math.PI * 0.75, end: Math.PI * 0.75 };

function rafPanel(g, at, r, v) {
  gauge(g, ...at(0), r, v.airspeed, { min: 0, max: 450, ...ARC, major: 50, minor: 10, label: (s) => (s % 100 ? '' : String(s / 10)) }, 'AIRSPEED');
  horizon(g, ...at(1), r, v.bank, v.pitch, 'HORIZON');
  gauge(g, ...at(2), r, v.climb / 1000, { min: -4, max: 4, start: -Math.PI * 1.35, end: Math.PI * 0.35, major: 1, minor: 0.5, label: (s) => String(Math.abs(s)) }, 'CLIMB ×1000');
  altimeter(g, ...at(3), r, v.altitude, 1000, 'ALTIMETER');
  headingDrum(g, ...at(4), r, v.heading, 'DIRECTION');
  turnAndSlip(g, ...at(5), r, v.turnRate, v.sideG, 'TURN & SLIP');
  gauge(g, ...at(6), r, v.manifold, { min: -6, max: 14, ...ARC, major: 2, minor: 1, label: (s) => (s > 0 ? `+${s}` : String(s)) }, 'BOOST');
  gauge(g, ...at(7), r, v.rpm / 1000, { min: 0, max: 4, ...ARC, major: 0.5, minor: 0.1, label: (s) => (s % 1 ? '' : String(s)) }, 'RPM ×1000');
  const [lx, ly] = at(8);
  lamp(g, lx - r * 0.3, ly - r * 0.45, r * 0.15, '#3fbf4a', v.gearDown, 'DOWN');
  lamp(g, lx + r * 0.3, ly - r * 0.45, r * 0.15, '#d8402e', v.gearUp, 'UP');
  label(g, lx, ly + r * 0.35, r * 1.2, `FLAPS ${v.flaps > 0.5 ? 'DOWN' : 'UP'}`);
}

function luftwaffePanel(g, at, r, v) {
  gauge(g, ...at(0), r, v.airspeed, { min: 0, max: 750, ...ARC, major: 100, minor: 50, label: (s) => String(s / 100) }, 'km/h ×100');
  altimeter(g, ...at(1), r, v.altitude, 1000, 'HÖHE km');
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

  /** Redraws the strip for the current state. */
  update(sim) {
    if (!this.visible) return;
    const v = instrumentReadings(sim);
    const count = v.raf ? 9 : 8;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const r = Math.min(62, (width / count) * 0.42);
    const height = r * 2 + 34;
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.canvas.style.height = `${height}px`;
    }
    const g = this.canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);
    g.fillStyle = 'rgba(28, 30, 26, 0.88)';
    const span = count * r * 2.3;
    const left = (width - span) / 2;
    g.fillRect(left - 8, 0, span + 16, height);
    const at = (i) => [left + r * 1.15 + i * r * 2.3, r + 8];
    if (v.raf) rafPanel(g, at, r, v);
    else luftwaffePanel(g, at, r, v);
  }
}
