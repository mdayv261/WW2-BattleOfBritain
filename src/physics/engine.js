// Supercharged piston engine: brake power from altitude, throttle, crankshaft speed and airspeed.
//
// Each engine's data give, for each boost rating, two curves against altitude at the reference
// crankshaft speed:
//   cb - power at the rated manifold pressure held constant (the rising line of the chart);
//   ft - power at full throttle (follows cb up to the full-throttle height, then falls).
// From these the model works out:
//   1. the manifold pressure the supercharger can reach at this altitude (from ft / cb);
//   2. the pressure the throttle asks for (boost control holds it while it can);
//   3. the power at the actual manifold pressure, interpolated between ratings (or, with one rating,
//      in proportion above the pressure at which net power would be zero).
// Ram air raises the intake pressure by a fraction of the dynamic pressure.

import { atmosphere, altitudeForPressure } from './atmosphere.js';
import { interpPairs, extrapPairs, clamp } from './interp.js';
import { common } from '../aircraft/common.js';

/** Constant-boost power of a rating at an altitude (W). Merlin lines extend in a straight line. */
function cbPower(rating, alt) {
  return rating.cb.length === 2 ? extrapPairs(rating.cb, alt) : interpPairs(rating.cb, alt);
}

/** Power at manifold pressure `map` and altitude `alt`, at the reference crankshaft speed. */
function powerAtMap(engine, alt, map) {
  const { normal, emergency } = engine.ratings;
  const pN = cbPower(normal, alt);
  if (emergency) {
    const pE = cbPower(emergency, alt);
    return pN + ((map - normal.map) * (pE - pN)) / (emergency.map - normal.map);
  }
  return (pN * (map - engine.zeroPowerMap)) / (normal.map - engine.zeroPowerMap);
}

/** Inverse of powerAtMap at one altitude: the manifold pressure that gives `power`. */
function mapForPower(engine, alt, power) {
  const a = powerAtMap(engine, alt, 0);
  const b = powerAtMap(engine, alt, 1e5);
  return ((power - a) * 1e5) / (b - a);
}

/**
 * Highest manifold pressure the supercharger can deliver at this (intake) altitude, reference speed.
 * Above the last measured point the supercharger's pressure ratio is taken as fixed, so the manifold
 * pressure falls in proportion to the outside pressure.
 */
function availableMap(engine, alt) {
  const top = engine.ratings.emergency ?? engine.ratings.normal;
  const last = top.ft[top.ft.length - 1][0];
  if (alt <= last) return mapForPower(engine, alt, interpPairs(top.ft, alt));
  const atLast = mapForPower(engine, last, interpPairs(top.ft, last));
  return (atLast * atmosphere(alt).pressure) / atmosphere(last).pressure;
}

/**
 * Brake power and manifold pressure.
 *   altitude m, airspeed m/s (true), throttle 0..1, speed: crankshaft rad/s,
 *   emergency: true when the boost cut-out (+12 lb) is pulled (ignored without that rating).
 * Returns { power W, map Pa, ratedMap Pa, intakeAltitude m }.
 */
export function enginePower(engine, { altitude, airspeed, throttle, speed, emergency = false }) {
  const air = atmosphere(altitude);
  const ram = common.ramRecovery * 0.5 * air.density * airspeed * airspeed;
  const intakeAltitude = altitudeForPressure(air.pressure + ram);
  const rating = emergency && engine.ratings.emergency ? engine.ratings.emergency : engine.ratings.normal;
  const speedRatio = Math.max(speed, 0) / engine.refSpeed;
  const demanded = engine.idleMap + clamp(throttle, 0, 1) * (rating.map - engine.idleMap);
  // The supercharger's delivery falls with engine speed, but the engine can always draw the air at its intake, so a
  // slow-running engine (idling, starting) still reaches the outside pressure (D49).
  const reachable = Math.max(availableMap(engine, intakeAltitude) * speedRatio ** engine.mapSpeedExponent, air.pressure + ram);
  const map = Math.min(demanded, reachable);
  const power = powerAtMap(engine, intakeAltitude, map) * speedRatio ** engine.rpmPowerExponent;
  return { power: speedRatio > 0 ? Math.max(power, 0) : 0, map, ratedMap: rating.map, intakeAltitude };
}

/** Creates the negative-g cut-out state for engines with a float carburettor. */
export function createCutout() {
  return { factor: 1, negTime: 0, posTime: 0, cut: false };
}

/**
 * Updates the carburettor cut-out from the normal load factor (g). Returns the power factor 0..1.
 * Under negative g the float chamber starves the engine; when g returns, flooding delays recovery.
 */
export function updateCutout(engine, cut, loadFactor, dt) {
  const ng = engine.negativeG;
  if (!ng) return 1;
  if (loadFactor < ng.threshold) {
    cut.negTime += dt;
    cut.posTime = 0;
    if (cut.negTime > ng.delay) cut.cut = true;
  } else {
    cut.negTime = 0;
    cut.posTime += dt;
    if (cut.cut && cut.posTime > ng.recoverDelay) cut.cut = false;
  }
  const target = cut.cut ? 0 : 1;
  const rate = cut.cut ? 1 / ng.cutTime : 1 / ng.recoverTime;
  cut.factor += clamp(target - cut.factor, -rate * dt, rate * dt);
  return cut.factor;
}
