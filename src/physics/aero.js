// Aerodynamic coefficients of the wing and airframe.
//
// Axes inside this file are the usual aeronautical ones: alpha is positive with the nose above the
// wind, beta positive with the wind from the right, roll p positive right wing down, pitch q nose up,
// yaw r nose right. flightModel.js converts to the game's body axes.
//
// The wing is computed as two halves. Each half has its own angle of attack (changed by roll rate and,
// through dihedral, by sideslip), its own local airspeed (changed by yaw rate) and, on the Bf 109, its
// own slat. A half that stalls loses lift and gains drag, so wing drop, autorotation and the yaw
// toward the dropping wing come out of the physics rather than from added rules.

import { common } from '../aircraft/common.js';

const stallCache = new Map();

/** Lift curve of a wing section: straight line, blended into flat-plate lift past the stall. */
function liftCurve(alpha, clAlpha, alphaStall, width) {
  const x = Math.max(-40, Math.min(40, (Math.abs(alpha) - alphaStall) / width));
  const f = 1 / (1 + Math.exp(-x)); // 0 attached, 1 fully stalled
  const attached = clAlpha * alpha;
  const plate = 2 * Math.sin(alpha) * Math.cos(alpha);
  return { cl: (1 - f) * attached + f * plate, stalled: f };
}

/**
 * The stall angle (measured from zero lift) at which the blended curve peaks at exactly clMax.
 * Found by bisection and cached, since the blend starts cutting lift a little before its centre.
 */
export function stallAngle(clAlpha, clMax, width = common.stallWidth) {
  const key = `${clAlpha.toFixed(5)}|${clMax.toFixed(4)}|${width}`;
  const hit = stallCache.get(key);
  if (hit !== undefined) return hit;
  const peak = (centre) => {
    let best = 0;
    for (let a = 0; a <= centre + 0.3; a += 0.0005) best = Math.max(best, liftCurve(a, clAlpha, centre, width).cl);
    return best;
  };
  let lo = clMax / clAlpha;
  let hi = lo + 0.3;
  for (let i = 0; i < 40; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (peak(mid) < clMax) lo = mid;
    else hi = mid;
  }
  const result = 0.5 * (lo + hi);
  stallCache.set(key, result);
  return result;
}

/** The angle (measured from zero lift) at which the blended lift curve reaches its peak. */
export function peakLiftAngle(clAlpha, clMax, width = common.stallWidth) {
  const centre = stallAngle(clAlpha, clMax, width);
  let best = 0;
  let at = 0;
  for (let a = 0; a <= centre + 0.1; a += 0.0005) {
    const cl = liftCurve(a, clAlpha, centre, width).cl;
    if (cl > best) {
      best = cl;
      at = a;
    }
  }
  return at;
}

/** Quantities worked out once per aircraft. */
export function wingConstants(ac) {
  const { span, wingArea } = ac.geometry;
  const aspectRatio = (span * span) / wingArea;
  const a0 = common.sectionLiftSlope;
  // Helmbold's lifting-surface equation for the lift slope of a finite wing.
  const k = a0 / (Math.PI * aspectRatio);
  const clAlpha = a0 / (Math.sqrt(1 + k * k) + k);
  return { aspectRatio, clAlpha, arm: common.halfWingArm * (span / 2) };
}

/** Maximum lift coefficient of one wing half, given flap fraction and (Bf 109) its slat opening. */
function halfClMax(ac, flaps, slat) {
  const a = ac.aero;
  let clean = a.clMax;
  if (ac.slats) clean = ac.slats.clMaxClosed + (a.clMax - ac.slats.clMaxClosed) * slat;
  return clean + flaps * (a.clMaxFlaps - a.clMax);
}

/**
 * Coefficients for the whole aircraft.
 *  flow: { alpha, beta, p, q, r, airspeed, qBar, slipQ } (rad, rad/s, m/s, Pa; slipQ is the extra
 *        dynamic pressure behind the propeller)
 *  surfaces: { elevator, aileron, rudder, trim, flaps, gear, radiator, slatLeft, slatRight } (-1..1, 0..1)
 * Returns force coefficients (on the wing area, at the free-stream dynamic pressure) and moment
 * coefficients, plus diagnostics.
 */
export function aeroCoefficients(ac, flow, surfaces) {
  const a = ac.aero;
  const { span, mac } = ac.geometry;
  const w = wingConstants(ac);
  const V = Math.max(flow.airspeed, 1);
  const flaps = surfaces.flaps;
  const alphaZero = a.alphaZeroLift - (flaps * (a.clMaxFlaps - a.clMax)) / w.clAlpha;
  const slip = 1 + (a.slipstreamWing * flow.slipQ) / Math.max(flow.qBar, 1);

  const half = (side, slat) => {
    // side: +1 right, -1 left
    const alpha = flow.alpha + side * ((flow.p * w.arm) / V + a.dihedral * flow.beta) - alphaZero;
    const speed = Math.max(0, 1 - (side * flow.r * w.arm) / V); // local airspeed ratio
    const clMax = halfClMax(ac, flaps, slat);
    const stall = stallAngle(w.clAlpha, clMax);
    const lc = liftCurve(alpha, w.clAlpha, stall, common.stallWidth);
    const cl = lc.cl * slip;
    const cdi = (lc.cl * lc.cl) / (Math.PI * a.oswald * w.aspectRatio);
    const cdStall = lc.stalled * common.flatPlateCd * Math.sin(alpha) ** 2;
    const qRatio = speed * speed;
    return { cl: cl * qRatio, cd: (cdi + cdStall) * qRatio, alpha, stalled: lc.stalled };
  };
  const left = half(-1, surfaces.slatLeft ?? 1);
  const right = half(1, surfaces.slatRight ?? 1);

  const cl = 0.5 * (left.cl + right.cl);
  const cd = a.cd0 + 0.5 * (left.cd + right.cd) + flaps * a.flapCd + surfaces.gear * a.gearCd
    + surfaces.radiator * a.radiatorCd;
  const cy = a.cyBeta * flow.beta;

  // Tail surfaces feel part of the slipstream too.
  const tailQ = 1 + (common.tailSlipstream * flow.slipQ) / Math.max(flow.qBar, 1);
  const pHat = (flow.p * span) / (2 * V);
  const rHat = (flow.r * span) / (2 * V);
  const qHat = (flow.q * mac) / (2 * V);

  // Roll: lift difference between the halves (includes roll damping and dihedral effect), ailerons,
  // a small fixed bias standing in for rigging asymmetry when the wing is stalled, and the rigging
  // that cancels engine torque at cruise.
  const armRatio = w.arm / span;
  const stalledness = 0.5 * (left.stalled + right.stalled);
  const croll = 0.5 * (left.cl - right.cl) * armRatio + a.aileronCl * surfaces.aileron + a.stallBias * stalledness
    + a.rollRig;
  // Yaw: weathercock, damping, rudder, adverse aileron yaw, the drag difference of the halves, and the
  // fixed fin offset or rudder tab that cancels slipstream swirl at cruise.
  const cyaw = a.cnBeta * flow.beta + a.cnr * rHat + a.rudderCn * surfaces.rudder * tailQ
    + a.adverseYaw * surfaces.aileron + 0.5 * (right.cd - left.cd) * armRatio + a.yawRig;
  // Pitch: static stability about the zero-lift attitude, damping, elevator, trim tab and flaps.
  const cmAlpha = -a.staticMargin * w.clAlpha;
  const cpitch = a.cmZero + cmAlpha * (flow.alpha - a.alphaZeroLift) + a.cmq * qHat
    + (a.elevatorCm * surfaces.elevator + a.trimCm * surfaces.trim) * tailQ + a.flapCm * flaps;

  return {
    cl, cd, cy, croll, cyaw, cpitch, pHat,
    alphaLeft: left.alpha, alphaRight: right.alpha, stalledLeft: left.stalled, stalledRight: right.stalled,
  };
}
