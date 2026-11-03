// The instrument panels (Phase 2, D28): 2D panels along the bottom of the screen, in each side's units, and the
// readings that drive them. The 3D cockpits come in Phase 7.
//   Hurricane and Spitfire: the Spitfire I panel of the product owner's reference picture, src/ui/rafPanel.js (D86).
//   Bf 109: the restored Bf 109 E panel of the product owner's pictures, src/ui/bf109Panel.js (D89).
//   Bf 110: the Bf 110 C panel of the product owner's pictures, src/ui/bf110Panel.js (D106).

import { Euler, Vector3 } from 'three';
import { UNIT, ISA } from '../core/constants.js';
import { headingOf } from './units.js';
import { atmosphere } from '../physics/atmosphere.js';
import { BF109_PANEL, bf109Panel } from './bf109Panel.js';
import { TRIM_SCALE } from './panelControls.js';
import { pilotCard } from './speedCard.js';
import { SPITFIRE_PANEL, rafPanel } from './rafPanel.js';
import { BF110_PANEL, bf110Panel } from './bf110Panel.js';

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
/** How far a gauge pressure has come up as the engine turns: nothing below 200 rpm, all of it from 1,000. */
const running = (rpm) => Math.min(1, Math.max(0, (rpm - 200) / 800));

function gaugePressures(p, rpm) {
  const kg = (pa) => Math.round((pa / UNIT.ATA) * 100) / 100;
  return {
    fuel: { value: kg(p.fuelRunning) * running(rpm), max: kg(p.fuelFullScale), low: kg(p.fuelLow), normal: p.fuelNormal.map(kg) },
    oil: { value: kg(p.oilRunning) * running(rpm), max: kg(p.oilFullScale), low: kg(p.oilLow), normal: p.oilNormal.map(kg) },
  };
}

/** The fuel tanks' contents and capacities (litres), full: fuel use is not modelled yet. */
function fuelTanks(ac) {
  const tanks = ac.fuel?.wingTank ? [ac.fuel.wingTank, ac.fuel.wingTank] : ac.fuel?.tank ? [ac.fuel.tank] : null;
  return tanks ? tanks.map((m3) => ({ litres: m3 * 1000, capacity: m3 * 1000 })) : null;
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
    id: ac.id, // which aircraft: the RAF fighters share a panel but not a cockpit (D100)
    airspeed: d.eas / (raf ? UNIT.MPH : UNIT.KMH),
    altitude: raf ? d.altitude / UNIT.FT : d.altitude,
    climb: raf ? (body.velocity.y / UNIT.FT) * 60 : body.velocity.y,
    heading: headingOf(new Vector3(1, 0, 0).applyQuaternion(body.quaternion)),
    bank: euler.x,
    pitch: euler.z,
    turnRate: -spin.y * DEG, // deg/s, + turning right
    sideG: d.sideG,
    rpm: plane.omega / UNIT.RPM,
    rpmLimit: plane.engine.maxSpeed / UNIT.RPM, // the red mark on the rev counter (D89)
    pilotCard: pilotCard(ac, raf), // the speed card on the panel (D91)
    // The diving speed limit for the Bf 110's dive placard (D140): km/h, or mph on the RAF side.
    diveLimit: ac.limits?.diveEas ? Math.round(ac.limits.diveEas / (raf ? UNIT.MPH : UNIT.KMH)) : null,
    // The outside air temperature at the aircraft's height, °C, from the standard atmosphere (the Bf 110's, D140).
    airTemp: atmosphere(d.altitude).temperature - 273.15,
    coolant: plane.engines[0].heat.coolant, // °C, the first engine's (the single-engine panels)
    oil: plane.engines[0].heat.oil,
    manifold: raf ? (d.map - ISA.P0) / UNIT.PSI : d.map / UNIT.ATA,
    // The normal boost range (lb/sq in) for the green bands of the boost and manifold pressure gauges (D85).
    normalBoost: plane.engine.boostNormal ? [plane.engine.boostNormal.from, plane.engine.boostNormal.to]
      .map((pa) => (pa - ISA.P0) / UNIT.PSI) : null,
    pitchClock: raf ? null : pitchClock(plane.beta, ac),
    // The blade angle from the fine stop (0) to the coarse stop (1), for the Bf 109's pitch lever (D95).
    pitchFraction: raf ? null : Math.max(0, Math.min(1, (plane.beta - ac.propeller.betaMin) / (ac.propeller.betaMax - ac.propeller.betaMin))),
    // Each engine's own readings (the twins have a set of engine instruments per engine).
    engines: plane.engines.map((e, i) => ({
      rpm: e.omega / UNIT.RPM,
      coolant: e.heat.coolant, // °C (Phase 5, D62)
      oil: e.heat.oil,
      manifold: raf ? (d.engines[i].map - ISA.P0) / UNIT.PSI : d.engines[i].map / UNIT.ATA,
      pitchClock: raf ? null : pitchClock(e.beta, ac),
    })),
    // Fuel in each tank, litres (fuel use is not modelled yet: full tanks): each wing's on the Bf 110, the one tank on
    // the Bf 109 (D89).
    fuelTanks: fuelTanks(ac),
    // The Bf 110's fuel gauge: the tank its selector chooses, at 1 the front left main tank, full (D106).
    fuelSelected: ac.fuel?.main ? { litres: ac.fuel.main * 1000, capacity: ac.fuel.main * 1000 } : null,
    radiatorOpen: sim.input ? !!sim.input.radiator : false, // the Bf 110's radiator flap switches (D106)
    // Each gun's rounds left and loaded, by gun, for the Bf 110's ammunition counter (D106).
    rounds: Object.fromEntries((sim.armament ?? []).map((gun) => [gun.id, { rounds: gun.rounds, capacity: gun.capacity }])),
    gearSelected: sim.input ? !!sim.input.gear : plane.surfaces.gear > 0.5, // the undercarriage lever: down
    pressures: plane.engine.pressures ? gaugePressures(plane.engine.pressures, plane.omega / UNIT.RPM) : null,
    // The RAF oil pressure gauge, lb/sq in (D86): the Merlin's normal pressure while it turns, rising from nothing as it
    // starts (the pressure is not modelled physically, as the DB 601A's gauges, D63).
    oilPressure: plane.engine.oilPressure ? (plane.engine.oilPressure.normal / UNIT.PSI) * running(plane.omega / UNIT.RPM) : null,
    // Normal temperature ranges for gauges that mark them (°C), where the engine data give them (D63).
    normalTemps: plane.engine.heat.oilNormal ? {
      oil: [plane.engine.heat.oilNormal.from, plane.engine.heat.oilNormal.to],
      coolant: [plane.engine.heat.coolantNormal.from, plane.engine.heat.coolantNormal.to],
    } : null,
    gearDown: plane.surfaces.gear > 0.99,
    gearUp: plane.surfaces.gear < 0.01,
    flaps: plane.surfaces.flaps, // fraction of travel
    flapSelected: sim.input ? sim.input.flaps ?? 0 : plane.surfaces.flaps, // the flap setting selected (D93)
    flapDegrees: plane.surfaces.flaps * ac.controls.flapTravel * DEG,
    flapTravel: ac.controls.flapTravel * DEG,
    flapTakeoff: ac.controls.flapTakeoff,
    flapLanding: ac.controls.flapLanding,
    // Elevator trim on the display's ±15° scale (D74): the trim setting runs from -1 (full nose down) to +1 (nose up).
    trimDegrees: plane.surfaces.trim * TRIM_SCALE,
  };
}

/** The fitted dial radius for a panel layout on a screen: as large as fits, capped. */
function fittedRadius(L, width, height) {
  return Math.min(66, (width * 0.96) / L.width, (height * (L.screenShare ?? 0.4)) / L.height);
}

/** A panel's dial radius (screen pixels) on a screen `width` x `height`: as large as fits, capped. */
export function panelRadius(L, width, height) {
  return fittedRadius(L, width, height);
}

/** Whether the panel hides: looking away (D58), after bailing out, or in the outside views (D97). */
export const panelHidden = (rig, sim) => rig.lookingAway || !!sim.playerJumper || !rig.inCockpit;

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
    const L = v.raf ? SPITFIRE_PANEL : twin ? BF110_PANEL : BF109_PANEL;
    const r = panelRadius(L, width, window.innerHeight);
    // A panel set below the screen's foot (the Bf 110's, D129) is cut there: its 3 px top margin and no foot margin.
    // Room kept above a panel whose fittings rise over its top edge (the Bf 110's clock bracket, D140).
    const above = (L.above ?? 0) * r;
    const height = L.sink ? (L.height - L.sink) * r + 3 + above : L.height * r + 6;
    const g = this.context(width, height);
    if (!L.ownBackground) {
      g.fillStyle = 'rgba(18, 18, 16, 0.94)';
      g.fillRect((width - L.width * r) / 2, 0, L.width * r, height);
    }
    if (v.raf) rafPanel(g, width / 2, 0, r, v);
    else if (twin) bf110Panel(g, width / 2, 3 + above, r, v);
    else bf109Panel(g, width / 2, 6, r, v); // the margin above, for the coaming's lip over its top (D90)
  }
}
