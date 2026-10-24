// Propeller thrust and torque from measured full-scale coefficients (NACA Report 640, 3 blades).
//
// For an advance ratio J = V / (n D) and a blade angle beta (at 0.75 R) the tables give the thrust
// coefficient CT and the efficiency eta. The power coefficient follows as CP = CT J / eta, so the
// three stay consistent. Thrust T = CT rho n^2 D^4 and absorbed power P = CP rho n^3 D^5, where n is
// in revolutions per second. Blade angles outside the measured 15-45 degrees reuse the nearest curve
// stretched in J so that its zero-thrust point moves on at the measured rate (AIRCRAFT_DATA.md).

import { naca640 } from '../aircraft/naca640.js';
import { interpPairs, extrapPairs, lerp } from './interp.js';
import { UNIT } from '../core/constants.js';

const ETA_FLOOR = 0.3; // below this the CT J / eta division is too sensitive to reading errors
const BETAS = Object.keys(naca640.ct).map((k) => Number(k.slice(1))).sort((a, b) => a - b);

/**
 * Builds, for one blade angle, the CP(J) curve from the measured CT and eta curves, at every J where
 * either is tabulated and the efficiency is high enough to divide by safely.
 */
function buildCpCurve(betaDeg) {
  const ct = naca640.ct[`b${betaDeg}`];
  const eta = naca640.eta[`b${betaDeg}`];
  const cpStatic = interpPairs(naca640.cpStatic, betaDeg);
  const etaStart = eta[0][0];
  const js = [...new Set([...ct.map((p) => p[0]), ...eta.map((p) => p[0])])].sort((a, b) => a - b);
  const valid = [];
  for (const j of js) {
    const e = interpPairs(eta, j);
    const t = interpPairs(ct, j);
    if (j >= etaStart && e >= ETA_FLOOR && t > 0) valid.push([j, (t * j) / e]);
  }
  // From J = 0 to the first measured efficiency, blend linearly from the static value.
  return [[0, cpStatic], ...valid];
}

/**
 * Keeps extrapolated coefficients physical: a propeller making thrust cannot beat the measured peak
 * efficiency, and a windmilling one cannot return more power than the air gives up.
 */
function physical(ct, cp, j) {
  if (ct > 0) return Math.max(cp, (ct * j) / naca640.etaMax);
  return Math.max(cp, ct * j);
}

const curves = Object.fromEntries(
  BETAS.map((b) => {
    const ct = naca640.ct[`b${b}`];
    return [b, { ct, cp: buildCpCurve(b), j0: ct[ct.length - 1][0] }];
  }),
);

const lowest = BETAS[0];
const highest = BETAS[BETAS.length - 1];
// Measured rate at which the zero-thrust advance ratio moves with blade angle at each end.
const j0SlopeHigh = (curves[highest].j0 - curves[BETAS[BETAS.length - 2]].j0) / (highest - BETAS[BETAS.length - 2]);
const j0SlopeLow = (curves[BETAS[1]].j0 - curves[lowest].j0) / (BETAS[1] - lowest);

/** CT and CP of one measured curve, extrapolated in straight lines past its ends. */
function onCurve(betaDeg, j) {
  const c = curves[betaDeg];
  const ct = extrapPairs(c.ct, j);
  return { ct, cp: physical(ct, extrapPairs(c.cp, j), j) };
}

/** Non-dimensional coefficients at advance ratio J and blade angle beta (rad). */
export function propellerCoefficients(j, beta) {
  const jj = Math.max(0, j);
  const deg = beta / UNIT.DEG;
  if (deg >= highest || deg <= lowest) {
    const edge = deg >= highest ? highest : lowest;
    const slope = deg >= highest ? j0SlopeHigh : j0SlopeLow;
    const j0 = curves[edge].j0 + (deg - edge) * slope;
    const k = j0 / curves[edge].j0;
    const c = onCurve(edge, jj / k);
    return { ct: c.ct, cp: c.cp * k };
  }
  let i = 1;
  while (BETAS[i] < deg) i += 1;
  const b0 = BETAS[i - 1];
  const b1 = BETAS[i];
  const t = (deg - b0) / (b1 - b0);
  const c0 = onCurve(b0, jj);
  const c1 = onCurve(b1, jj);
  return { ct: lerp(c0.ct, c1.ct, t), cp: lerp(c0.cp, c1.cp, t) };
}

/**
 * Thrust (N) and absorbed torque (N m, at the propeller shaft) for a propeller turning at omega
 * (rad/s) with blade angle beta, axial airspeed v (m/s) and air density rho.
 */
export function propellerLoads(prop, { omega, beta, v, rho }) {
  const n = Math.max(omega, 1e-3) / (2 * Math.PI);
  const d = prop.diameter;
  const j = v / (n * d);
  const { ct, cp } = propellerCoefficients(j, beta);
  const thrust = ct * rho * n * n * d ** 4;
  const power = cp * rho * n ** 3 * d ** 5;
  return { thrust, torque: power / Math.max(omega, 1e-3), power, j, ct, cp };
}

/**
 * The blade angle at which the propeller absorbs `power` (W) at shaft speed omega, or the nearest
 * limit if it cannot. Used by the steady-state performance solver (a perfect governor).
 */
export function bladeAngleForPower(prop, { omega, v, rho, power }) {
  let lo = prop.betaMin;
  let hi = prop.betaMax;
  const absorbed = (b) => propellerLoads(prop, { omega, beta: b, v, rho }).power;
  if (absorbed(lo) >= power) return lo;
  if (absorbed(hi) <= power) return hi;
  for (let k = 0; k < 50; k += 1) {
    const mid = 0.5 * (lo + hi);
    if (absorbed(mid) < power) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}
