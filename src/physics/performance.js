// Steady-state performance from the flight model: level speed, climb, ceiling, stall and roll.
// Used by the validation tests, `npm run validate` and `npm run calibrate`.
//
// Method: at a speed and altitude, find the angle of attack at which lift plus the vertical part of
// thrust equals weight. The propeller runs at the governed engine speed with the blade angle that
// absorbs the engine's power (a perfect governor). The spare thrust times speed over weight is the
// steady rate of climb. No pilot inputs, no acceleration.

import { G } from '../core/constants.js';
import { atmosphere, trueAirspeed } from './atmosphere.js';
import { enginePower } from './engine.js';
import { propellerLoads, bladeAngleForPower } from './propeller.js';
import { aeroCoefficients, wingConstants, peakLiftAngle } from './aero.js';
import { authority } from './controls.js';
import { common } from '../aircraft/common.js';
import { engineFor } from '../aircraft/index.js';

export const SERVICE_CEILING_RATE = 0.508; // m/s (100 ft/min)

const surfacesFor = (flaps = 0, gear = 0) => ({
  elevator: 0, aileron: 0, rudder: 0, trim: 0, flaps, gear, radiator: 0, slatLeft: 1, slatRight: 1,
});

/**
 * Engine setting for a performance case: { speed (crank rad/s), throttle 0..1, emergency, map }.
 * If `map` (Pa) is given, the throttle is set to demand exactly that manifold pressure.
 */
function throttleFor(engine, setting) {
  if (setting.map === undefined) return setting.throttle ?? 1;
  const rating = setting.emergency && engine.ratings.emergency ? engine.ratings.emergency : engine.ratings.normal;
  return (setting.map - engine.idleMap) / (rating.map - engine.idleMap);
}

/**
 * Thrust and engine data at a flight condition. The governor holds the set engine speed while the
 * blades can absorb the power; once they reach the fine-pitch stop the engine speed falls until
 * power and propeller torque balance (as with a closed throttle).
 */
export function propulsion(ac, setting, altitude, speed, axial = speed) {
  const engine = engineFor(ac);
  const pr = ac.propeller;
  const air = atmosphere(altitude);
  const throttle = throttleFor(engine, setting);
  const powerAt = (crank) => enginePower(engine, {
    altitude, airspeed: speed, throttle, speed: crank, emergency: !!setting.emergency,
  });
  let crank = setting.speed;
  let eng = powerAt(crank);
  let beta = bladeAngleForPower(pr, { omega: crank * pr.gearRatio, v: axial, rho: air.density, power: eng.power });
  const absorbed = (c) => propellerLoads(pr, { omega: c * pr.gearRatio, beta: pr.betaMin, v: axial, rho: air.density }).power;
  if (beta <= pr.betaMin + 1e-9 && absorbed(crank) > eng.power) {
    let lo = 1;
    let hi = crank;
    for (let i = 0; i < 50; i += 1) {
      const mid = 0.5 * (lo + hi);
      if (absorbed(mid) > powerAt(mid).power) hi = mid;
      else lo = mid;
    }
    crank = 0.5 * (lo + hi);
    eng = powerAt(crank);
    beta = pr.betaMin;
  }
  const loads = propellerLoads(pr, { omega: crank * pr.gearRatio, beta, v: axial, rho: air.density });
  return { ...loads, beta, crank, enginePower: eng.power, map: eng.map };
}

/**
 * 1 g flight at a speed: the angle of attack that balances weight, and the spare force along the
 * flight path. Returns null if the wing cannot carry the weight at this speed.
 */
export function steadyFlight(ac, setting, altitude, speed, { flaps = 0, gear = 0, mass = ac.mass.flying } = {}) {
  const air = atmosphere(altitude);
  const qBar = 0.5 * air.density * speed * speed;
  const S = ac.geometry.wingArea;
  const weight = mass * G;
  const surfaces = surfacesFor(flaps, gear);
  const disc = (Math.PI * ac.propeller.diameter ** 2) / 4;
  const forcesAt = (alpha) => {
    const prop = propulsion(ac, setting, altitude, speed, speed * Math.cos(alpha));
    const slipQ = Math.max(prop.thrust, 0) / disc;
    const co = aeroCoefficients(ac, { alpha, beta: 0, p: 0, q: 0, r: 0, airspeed: speed, qBar, slipQ }, surfaces);
    const up = co.cl * qBar * S + prop.thrust * Math.sin(alpha);
    const along = prop.thrust * Math.cos(alpha) - co.cd * qBar * S;
    return { up, along, prop, co };
  };
  // Search from below zero lift up to the peak of the lift curve (the stall), with flaps shifting
  // the zero-lift angle as in aero.js.
  const w = wingConstants(ac);
  const dCl = flaps * (ac.aero.clMaxFlaps - ac.aero.clMax);
  const zeroLift = ac.aero.alphaZeroLift - dCl / w.clAlpha;
  let lo = zeroLift - 0.1;
  let hi = zeroLift + peakLiftAngle(w.clAlpha, ac.aero.clMax + dCl);
  if (forcesAt(hi).up < weight) return null;
  for (let i = 0; i < 40; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (forcesAt(mid).up < weight) lo = mid;
    else hi = mid;
  }
  const alpha = 0.5 * (lo + hi);
  const r = forcesAt(alpha);
  return { alpha, spare: r.along, climbRate: (r.along * speed) / weight, prop: r.prop, cl: r.co.cl };
}

/** Highest level speed (m/s, true) at an altitude, or 0 if level flight is impossible. */
export function topSpeed(ac, setting, altitude, opts) {
  let hi = 260;
  while (hi > 20) {
    const s = steadyFlight(ac, setting, altitude, hi, opts);
    if (s && s.spare >= 0) break;
    hi -= 5;
  }
  if (hi <= 20) return 0;
  let lo = hi;
  hi = hi + 5;
  for (let i = 0; i < 30; i += 1) {
    const mid = 0.5 * (lo + hi);
    const s = steadyFlight(ac, setting, altitude, mid, opts);
    if (s && s.spare >= 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Best steady climb rate (m/s) and its speed at an altitude. */
export function bestClimb(ac, setting, altitude, opts) {
  let best = { rate: -Infinity, speed: 0 };
  for (let v = 45; v <= 160; v += 2.5) {
    const s = steadyFlight(ac, setting, altitude, v, opts);
    if (s && s.climbRate > best.rate) best = { rate: s.climbRate, speed: v };
  }
  let lo = best.speed - 2.5;
  let hi = best.speed + 2.5;
  for (let i = 0; i < 25; i += 1) {
    const a = lo + (hi - lo) / 3;
    const b = hi - (hi - lo) / 3;
    const ra = steadyFlight(ac, setting, altitude, a, opts)?.climbRate ?? -Infinity;
    const rb = steadyFlight(ac, setting, altitude, b, opts)?.climbRate ?? -Infinity;
    if (ra < rb) lo = a;
    else hi = b;
  }
  const speed = 0.5 * (lo + hi);
  return { rate: steadyFlight(ac, setting, altitude, speed, opts)?.climbRate ?? -Infinity, speed };
}

/** Seconds to climb from sea level to `altitude` at the best climb speed, in 100 m steps. */
export function timeToClimb(ac, setting, altitude, opts) {
  let t = 0;
  for (let h = 0; h < altitude; h += 100) {
    const dh = Math.min(100, altitude - h);
    const r = bestClimb(ac, setting, h + dh / 2, opts).rate;
    if (r <= 0.05) return Infinity;
    t += dh / r;
  }
  return t;
}

/** Altitude (m) at which the best climb rate falls to `rate` (default: service ceiling). */
export function ceiling(ac, setting, opts, rate = SERVICE_CEILING_RATE) {
  let lo = 0;
  let hi = 13000;
  for (let i = 0; i < 30; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (bestClimb(ac, setting, mid, opts).rate > rate) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** 1 g stall speed (m/s, true) with the power setting given (throttle 0 for power off). */
export function stallSpeed(ac, setting, altitude, opts) {
  let lo = 15;
  let hi = 120;
  for (let i = 0; i < 40; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (steadyFlight(ac, setting, altitude, mid, opts)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Steady roll helix angle pb/2V reached at an equivalent airspeed and altitude with: full aileron
 * (full: true), a stick force in N (stickForce), or a stick fraction limited by the pilot's strength
 * (aileron). Roll damping comes from the half-wing model.
 */
export function steadyRoll(ac, { eas, altitude, aileron, stickForce, full = false }) {
  const speed = trueAirspeed(eas, altitude);
  const air = atmosphere(altitude);
  const qBar = 0.5 * air.density * speed * speed;
  const level = steadyFlight(ac, { speed: engineFor(ac).refSpeed, throttle: 0.6 }, altitude, speed);
  const alpha = level ? level.alpha : 0.05;
  const fraction = full ? 1 : stickForce !== undefined
    ? Math.min(1, stickForce / (ac.controls.rollHinge * qBar))
    : aileron * authority(ac.controls.rollHinge, common.pilotMaxForce.roll, qBar);
  const surfaces = { ...surfacesFor(), aileron: fraction };
  const rollCoef = (p) => aeroCoefficients(ac, { alpha, beta: 0, p, q: 0, r: 0, airspeed: speed, qBar, slipQ: 0 }, surfaces).croll
    - ac.aero.rollRig;
  let lo = 0;
  let hi = 6;
  for (let i = 0; i < 50; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (rollCoef(mid) > 0) lo = mid;
    else hi = mid;
  }
  const p = 0.5 * (lo + hi);
  return { p, pb2v: (p * ac.geometry.span) / (2 * speed), fraction };
}
