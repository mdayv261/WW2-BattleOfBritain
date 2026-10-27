// Engine heat (Phase 5, D62): the coolant and oil temperature of each engine, the engine wear that running too hot or
// over-revving causes, and the seizure that wear ends in.
//
// Each fluid is one lumped mass: heat comes in with the engine's power (plus a little at idle, from friction) and goes
// out through its radiator in proportion to the temperature above the outside air (ISA) and to the conductance
//   h = h0 * (air mass flow through the radiator / mass flow at the climb condition)^0.8 * flap * coolant left,
// where the mass flow follows the free stream plus the airscrew's slipstream, and `flap` is the radiator flap's
// opening (the oil cooler has no flap). The constants h0 and the closed-flap factor are not invented: they are solved
// from each aircraft's two calibration conditions (cooling.climb and cooling.cruise in its data file, estimates) so
// the temperatures settle there at the stated values.
//
// Wear builds up while a fluid is hotter than its limit (src/aircraft engine files, from the Pilot's Notes and the
// DB 601 manual) or the crankshaft turns faster than the diving limit. Wear costs power past common.engineWear.lossFrom
// and seizes the engine at 1. Coolant much hotter than its limit boils away, and with the coolant gone the heat is no
// longer carried off: the path a glycol leak takes in checkpoint 4.

import { atmosphere } from './atmosphere.js';
import { common } from '../aircraft/common.js';
import { UNIT } from '../core/constants.js';
import { clamp } from './interp.js';

/** Air mass flux (kg/m² s) through a radiator: free stream at dynamic pressure q plus slipstream slipQ (Pa). */
const massFlux = (rho, q, slipQ) => Math.sqrt(2 * rho * Math.max(q + slipQ, 0));

/** Heat into each fluid (W) for an engine giving `power`, never less than the idle heat while it turns. */
function heatIn(engine, power, turning) {
  const idle = turning ? common.cooling.idleHeat * engine.ratings.normal.cb[0][1] : 0;
  return Math.max(power, idle);
}

/**
 * The cooling constants of an aircraft (cached on its data object): coolant and oil conductances at the climb condition
 * (W/K), the closed-flap factor and the heat capacities (J/K), solved from the calibration conditions at sea level.
 */
export function coolingConstants(ac, engine) {
  if (ac._cooling) return ac._cooling;
  const c = ac.cooling;
  const air = atmosphere(0);
  const rated = engine.ratings.normal.cb[0][1];
  const disc = (Math.PI * ac.propeller.diameter ** 2) / 4;
  // The slipstream of the calibration flight: thrust from the power at an airscrew efficiency of common.cooling.eta.
  const flux = (point) => {
    const q = 0.5 * air.density * point.eas ** 2;
    const slip = (common.cooling.eta * point.power * rated) / point.eas / disc;
    return massFlux(air.density, q, slip);
  };
  const tAir = air.temperature - 273.15;
  const climbFlux = flux(c.climb);
  const coolant = (c.climb.power * rated) / (c.climb.coolant - tAir);
  const oil = (c.climb.power * rated) / (c.climb.oil - tAir);
  const cruiseNeeds = (c.cruise.power * rated) / (c.cruise.coolant - tAir);
  const closed = cruiseNeeds / (coolant * (flux(c.cruise) / climbFlux) ** common.cooling.flowExponent);
  ac._cooling = {
    coolant, oil, closed: clamp(closed, 0.05, 1), climbFlux,
    coolantCapacity: coolant * c.timeConstant.coolant, oilCapacity: oil * c.timeConstant.oil,
  };
  return ac._cooling;
}

/** Fresh heat state for one engine at temperatures (°C). */
export function createHeat(coolant = 60, oil = 40) {
  return { coolant, oil, coolantLeft: 1, coolantLeak: 0, oilLeft: 1, oilLeak: 0, wear: 0, seized: false };
}

/** Conductances (W/K) of an engine's coolant radiator and oil cooler in the current flow. */
function conductances(ac, k, rho, q, slipQ, radiator, coolantLeft) {
  const ratio = (massFlux(rho, q, slipQ) / k.climbFlux) ** common.cooling.flowExponent;
  const flap = k.closed + (1 - k.closed) * clamp(radiator, 0, 1);
  // With most of the coolant gone the radiator no longer carries the heat away.
  const carried = clamp(coolantLeft / common.engineWear.coolantNeeded, 0, 1);
  return { coolant: k.coolant * ratio * flap * carried, oil: k.oil * ratio };
}

/** Temperatures (°C) the engine would settle at for a steady power, flow and radiator setting. */
export function equilibrium(ac, engine, { altitude, q, slipQ = 0, power, radiator = 1, turning = true }) {
  const k = coolingConstants(ac, engine);
  const air = atmosphere(altitude);
  const tAir = air.temperature - 273.15;
  const h = conductances(ac, k, air.density, q, slipQ, radiator, 1);
  const heat = heatIn(engine, power, turning);
  return { coolant: tAir + heat / h.coolant, oil: tAir + heat / h.oil };
}

/** The engine's coolant limit (°C) at an altitude: the sea-level limit less its fall with height, if any. */
export const coolantLimit = (engine, altitude) => engine.heat.coolantLimit - (engine.heat.coolantLapse ?? 0) * Math.max(altitude, 0);

/** Power remaining (fraction) for an engine's wear. */
export function wearFactor(heat) {
  const { lossFrom, lossAtSeize } = common.engineWear;
  if (heat.wear <= lossFrom) return 1;
  return 1 - (lossAtSeize * (heat.wear - lossFrom)) / (1 - lossFrom);
}

/**
 * Advances one engine's temperatures and wear by dt.
 *   e: the engine's state (its `heat`, its crankshaft speed omega), power: its power (W), slipQ: its slipstream (Pa)
 */
export function stepHeat(ac, engine, e, { altitude, q, radiator, power }, dt) {
  const k = coolingConstants(ac, engine);
  const h = e.heat;
  const air = atmosphere(altitude);
  const tAir = air.temperature - 273.15;
  const cond = conductances(ac, k, air.density, q, e.slipQ, radiator, h.coolantLeft);
  const heat = heatIn(engine, power, e.omega > 1);
  const coolantMass = k.coolantCapacity * Math.max(h.coolantLeft, 0.1);
  h.coolant += ((heat - cond.coolant * (h.coolant - tAir)) / coolantMass) * dt;
  h.oil += ((heat - cond.oil * (h.oil - tAir)) / k.oilCapacity) * dt;

  // Leaks from hits (src/weapons/damage.js, D68): fractions of the coolant or oil lost per second.
  h.coolantLeft = Math.max(0, h.coolantLeft - h.coolantLeak * dt);
  h.oilLeft = Math.max(0, h.oilLeft - h.oilLeak * dt);
  const w = common.engineWear;
  const limit = coolantLimit(engine, altitude);
  // Short of oil, the bearings wear out (D68).
  const starved = Math.max(0, common.damage.oilStarve - h.oilLeft) / common.damage.oilStarve;
  h.wear += (starved / common.damage.oilWearLife) * dt;
  const over = (t, lim) => Math.max(0, t - lim) / w.overheatSpan;
  const rpm = e.omega / UNIT.RPM;
  const overRev = Math.max(0, rpm - engine.heat.overRev / UNIT.RPM) / w.overRevSpan;
  h.wear += ((over(h.coolant, limit) + over(h.oil, engine.heat.oilLimit)) / w.overheatLife + overRev / w.overRevLife) * dt;
  // Coolant well past its limit boils off through the relief valve.
  if (h.coolant > limit + w.boilMargin) h.coolantLeft = Math.max(0, h.coolantLeft - w.boilRate * dt);
  if (h.wear >= 1) h.seized = true;
}
