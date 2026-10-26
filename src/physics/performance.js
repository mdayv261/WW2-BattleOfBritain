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
import { engineMounts } from './powerplant.js';
import { propellerLoads, bladeAngleForPower } from './propeller.js';
import { aeroCoefficients, stallAlpha } from './aero.js';
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
  const engines = engineMounts(ac).length;
  const forcesAt = (alpha) => {
    const prop = propulsion(ac, setting, altitude, speed, speed * Math.cos(alpha));
    // Each engine's slipstream washes its own side of the wing, so the per-side slipstream is one engine's.
    const slipQ = Math.max(prop.thrust, 0) / disc;
    const co = aeroCoefficients(ac, { alpha, beta: 0, p: 0, q: 0, r: 0, airspeed: speed, qBar, slipQ }, surfaces);
    const thrust = prop.thrust * engines;
    const up = co.cl * qBar * S + thrust * Math.sin(alpha);
    const along = thrust * Math.cos(alpha) - co.cd * qBar * S;
    return { up, along, prop, co };
  };
  // Search from below zero lift up to the peak of the lift curve (the stall).
  let lo = ac.aero.alphaZeroLift - 0.25;
  let hi = stallAlpha(ac, flaps);
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

/**
 * Seconds for a full level turn at a true airspeed with the power setting: the steepest sustained turn, where the
 * load factor n is the highest at which thrust still balances drag (lift = n x weight), turning at g sqrt(n^2 - 1) / V.
 */
export function turnTime(ac, setting, altitude, speed, opts = {}) {
  const mass = opts.mass ?? ac.mass.flying;
  const spareAt = (n) => steadyFlight(ac, setting, altitude, speed, { ...opts, mass: n * mass })?.spare ?? -Infinity;
  let lo = 1;
  let hi = 6;
  if (spareAt(lo) < 0) return Infinity;
  for (let i = 0; i < 40; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (spareAt(mid) >= 0) lo = mid;
    else hi = mid;
  }
  const rate = (G * Math.sqrt(lo * lo - 1)) / speed;
  return (2 * Math.PI) / rate;
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
 * Elevator stick-force gradient (N per g) in a steady pull-up at an equivalent airspeed and height:
 * the elevator needed at 1 g and 3 g (pitch rate g (n - 1) / V) with level-flight power, times the
 * elevator force factor and the dynamic pressure at the tail. NACA measured this in turns (S11, S12).
 */
export function stickForcePerG(ac, { eas, altitude }) {
  const speed = trueAirspeed(eas, altitude);
  const air = atmosphere(altitude);
  const qBar = 0.5 * air.density * speed * speed;
  const S = ac.geometry.wingArea;
  const weight = ac.mass.flying * G;
  const level = steadyFlight(ac, { speed: engineFor(ac).refSpeed, throttle: 0.6 }, altitude, speed);
  const slipQ = level ? Math.max(level.prop.thrust, 0) / ((Math.PI * ac.propeller.diameter ** 2) / 4) : 0;
  const elevatorFor = (n) => {
    const q = (G * (n - 1)) / speed;
    let lo = -0.2;
    let hi = 0.5;
    const flow = (alpha) => ({ alpha, beta: 0, p: 0, q, r: 0, airspeed: speed, qBar, slipQ });
    for (let i = 0; i < 50; i += 1) {
      const mid = 0.5 * (lo + hi);
      if (aeroCoefficients(ac, flow(mid), surfacesFor()).cl * qBar * S < n * weight) lo = mid;
      else hi = mid;
    }
    const alpha = 0.5 * (lo + hi);
    const at = (e) => aeroCoefficients(ac, flow(alpha), { ...surfacesFor(), elevator: e }).cpitch;
    const m0 = at(0);
    return -m0 / (at(1) - m0);
  };
  const tailQ = qBar + common.tailSlipstream * slipQ;
  return (ac.controls.pitchHinge * tailQ * (elevatorFor(3) - elevatorFor(1))) / 2;
}
