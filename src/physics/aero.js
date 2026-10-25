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
  // A stalled wing acts like a flat plate: normal force CN = CDmax sin a, so lift CN cos a (and the
  // matching stall drag CN sin a is added in aeroCoefficients).
  const plate = common.flatPlateCd * Math.sin(alpha) * Math.cos(alpha);
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

/** Helmbold's lifting-surface equation for the lift slope of a finite wing. */
function liftSlope(aspectRatio) {
  const a0 = common.sectionLiftSlope;
  const k = a0 / (Math.PI * aspectRatio);
  return a0 / (Math.sqrt(1 + k * k) + k);
}

/** Quantities worked out once per aircraft. */
export function wingConstants(ac) {
  const { span, wingArea } = ac.geometry;
  const aspectRatio = (span * span) / wingArea;
  return { aspectRatio, clAlpha: liftSlope(aspectRatio) };
}

/**
 * Each wing half is two panels: inner and outer half of the semispan. For an elliptical lift
 * distribution the inner panel carries 0.609 of the half-wing's lift with its centre at 0.244 of the
 * semispan, the outer 0.391 at 0.705 (common.js). The outer panel is set at a lower angle by the
 * washout, so the root stalls first. Only the outer panel carries the Bf 109's slat.
 */
const PANELS = () => [
  { lift: common.panel.innerLift, arm: common.panel.innerArm, outer: false },
  { lift: common.panel.outerLift, arm: common.panel.outerArm, outer: true },
];

const clMaxCache = new Map();

/** Peak lift coefficient of the whole wing (symmetric flow) for given panel section maxima. */
function wingPeak(clAlpha, washout, cInner, cOuter) {
  const [inner, outer] = PANELS();
  const sInner = stallAngle(clAlpha, cInner);
  const sOuter = stallAngle(clAlpha, cOuter);
  let best = 0;
  for (let a = 0; a < sInner + washout + 0.3; a += 0.0005) {
    const cl = inner.lift * liftCurve(a, clAlpha, sInner, common.stallWidth).cl
      + outer.lift * liftCurve(a - washout, clAlpha, sOuter, common.stallWidth).cl;
    best = Math.max(best, cl);
  }
  return best;
}

/** Bisection for the section value that makes the whole-wing peak equal `target`. */
function fitSection(target, peakOf) {
  let lo = 0.3;
  let hi = 4;
  for (let i = 0; i < 40; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (peakOf(mid) < target) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/**
 * Section maximum lift of the panels, fitted so the whole wing reaches the sourced maxima: clean
 * (aero.clMax), flaps down (aero.clMaxFlaps) and, on the Bf 109, slats closed (slats.clMaxClosed).
 * Returns { inner, outerClosed, outerOpen, flaps } (flaps: the increase at full flap).
 */
export function panelClMax(ac) {
  const hit = clMaxCache.get(ac);
  if (hit) return hit;
  const { clAlpha } = wingConstants(ac);
  const a = ac.aero;
  const wo = a.washout;
  let inner;
  let outerClosed;
  let outerOpen;
  if (ac.slats) {
    // Slats raise the outer section's maximum lift by slats.sectionGain over the root's; without them
    // the outer wing stalls first.
    inner = fitSection(a.clMax, (c) => wingPeak(clAlpha, wo, c, c + ac.slats.sectionGain));
    outerOpen = inner + ac.slats.sectionGain;
    outerClosed = fitSection(ac.slats.clMaxClosed, (c) => wingPeak(clAlpha, wo, inner, c));
  } else {
    inner = fitSection(a.clMax, (c) => wingPeak(clAlpha, wo, c, c));
    outerClosed = inner;
    outerOpen = inner;
  }
  const flaps = fitSection(a.clMaxFlaps, (d) => wingPeak(clAlpha, wo, inner + d, outerOpen + d)) ;
  const result = { inner, outerClosed, outerOpen, flaps: flaps };
  clMaxCache.set(ac, result);
  return result;
}

/**
 * Coefficients for the whole aircraft.
 *  flow: { alpha, beta, p, q, r, airspeed, qBar, slipQ, groundEffect } (rad, rad/s, m/s, Pa; slipQ is
 *        the extra dynamic pressure behind the propeller; groundEffect is the factor on induced drag near
 *        the ground, 1 or absent in free air)
 *  surfaces: { elevator, aileron, rudder, trim, flaps, gear, radiator, slatLeft, slatRight } (-1..1, 0..1)
 * Returns force coefficients (on the wing area, at the free-stream dynamic pressure) and moment
 * coefficients, plus diagnostics.
 */
export function aeroCoefficients(ac, flow, surfaces) {
  const a = ac.aero;
  const { span, mac } = ac.geometry;
  const w = wingConstants(ac);
  const pc = panelClMax(ac);
  const V = Math.max(flow.airspeed, common.lowSpeed); // rotation terms: see airflow() in flightModel.js
  const flaps = surfaces.flaps;
  // Flaps raise the panels' maximum lift and shift the zero-lift angle by the same amount of lift.
  const alphaZero = a.alphaZeroLift - (flaps * pc.flaps) / w.clAlpha;
  // The slipstream covers the wing root: its share of the whole wing is applied to the inner panels.
  const slipInner = 1 + (a.slipstreamWing / common.panel.innerLift) * (flow.slipQ / Math.max(flow.qBar, 1));
  // Near the ground the wing behaves as one of larger aspect ratio: less induced drag, and a steeper lift
  // slope, applied by scaling the angle from zero lift (so the peak lift is unchanged but comes earlier).
  const ge = Math.min(1, Math.max(flow.groundEffect ?? 1, 0.2));
  const steeper = ge < 1 ? liftSlope(w.aspectRatio / ge) / w.clAlpha : 1;

  const panel = (side, def, slat) => {
    const twist = def.outer ? -a.washout : 0;
    const alpha = steeper * (flow.alpha - alphaZero + twist + side * ((flow.p * def.arm * span) / (2 * V) + (a.dihedral + common.lowWingDihedral) * flow.beta));
    const speed = Math.max(0, 1 - (side * flow.r * def.arm * span) / (2 * V)); // local airspeed ratio
    const sectionMax = (def.outer ? pc.outerClosed + (pc.outerOpen - pc.outerClosed) * slat : pc.inner) + flaps * pc.flaps;
    const lc = liftCurve(alpha, w.clAlpha, stallAngle(w.clAlpha, sectionMax), common.stallWidth);
    const qRatio = speed * speed;
    const cl = lc.cl * (def.outer ? 1 : slipInner) * qRatio;
    const cdi = (ge * lc.cl * lc.cl) / (Math.PI * a.oswald * w.aspectRatio);
    const cdStall = lc.stalled * common.flatPlateCd * Math.sin(alpha) ** 2;
    return { cl, cd: (cdi + cdStall) * qRatio, alpha, stalled: lc.stalled, lift: def.lift, arm: def.arm };
  };
  const sides = [-1, 1].map((side) => {
    const slat = side < 0 ? surfaces.slatLeft ?? 1 : surfaces.slatRight ?? 1;
    return PANELS().map((def) => panel(side, def, slat));
  });
  const [left, right] = sides;
  const sum = (ps, f) => ps.reduce((acc, x) => acc + f(x), 0);

  // Each side is half the wing area; panel shares weight the panels within a side.
  const cl = 0.5 * (sum(left, (x) => x.lift * x.cl) + sum(right, (x) => x.lift * x.cl));
  const cdWing = 0.5 * (sum(left, (x) => x.lift * x.cd) + sum(right, (x) => x.lift * x.cd));
  const cd = a.cd0 + cdWing + flaps * a.flapCd + surfaces.gear * a.gearCd + surfaces.radiator * a.radiatorCd;
  const cy = a.cyBeta * flow.beta;

  // Tail surfaces feel part of the slipstream too.
  const tailQ = 1 + (common.tailSlipstream * flow.slipQ) / Math.max(flow.qBar, 1);
  const rHat = (flow.r * span) / (2 * V);
  const qHat = (flow.q * mac) / (2 * V);

  // Roll: lift differences between matching panels (giving roll damping and dihedral effect), ailerons,
  // a small fixed bias standing in for rigging asymmetry once the outer wing stalls, and the rigging
  // that cancels engine torque, plus the roll damping of the stalled wing and fuselage that keeps a spin's
  // rotation steady. Panel arms are fractions of the semispan, i.e. half that of the span.
  const rollOf = (f) => 0.5 * left.reduce((acc, x, i) => acc + x.lift * f(x, right[i]) * x.arm * 0.5, 0);
  const outerStall = 0.5 * (left[1].stalled + right[1].stalled);
  const innerStall = 0.5 * (left[0].stalled + right[0].stalled);
  const pHat = (flow.p * span) / (2 * V);
  const croll = rollOf((l, r) => l.cl - r.cl) + a.aileronCl * surfaces.aileron + a.stallBias * outerStall + a.rollRig
    + common.stalledRollDamping * pHat * outerStall;
  // Yaw: weathercock, damping, rudder, adverse aileron yaw, the drag difference of the panels, and the
  // fixed fin offset or rudder tab that cancels slipstream swirl.
  const cyaw = a.cnBeta * flow.beta + a.cnr * rHat + (a.rudderCn * surfaces.rudder + (a.rudderTrimCn ?? 0) * (surfaces.rudderTrim ?? 0)) * tailQ
    + a.adverseYaw * surfaces.aileron - rollOf((l, r) => l.cd - r.cd) + a.yawRig;
  // Pitch: static stability about the zero-lift attitude, damping, elevator, trim tab, flaps, and the
  // nose-down moment of a stalled wing root: its lift acts near mid-chord, well behind the centre of
  // gravity, as for a flat plate (normal-force coefficient 2 sin a cos a).
  const cmAlpha = -a.staticMargin * w.clAlpha;
  const aw = flow.alpha - a.alphaZeroLift;
  const cpitch = a.cmZero + cmAlpha * aw + a.cmq * qHat
    + (a.elevatorCm * surfaces.elevator + a.trimCm * surfaces.trim) * tailQ + a.flapCm * flaps
    - common.stallNoseDown * innerStall * Math.sin(2 * aw);

  const stalledOf = (ps) => Math.max(ps[0].stalled, ps[1].stalled);
  // The slats respond to the outer wing's angle to the air, which the (inboard) flaps do not change: with
  // flaps down they open at a higher lift coefficient, as the RAE measured (S32).
  const flapShift = steeper * ((flaps * pc.flaps) / w.clAlpha);
  return {
    cl, cd, cy, croll, cyaw, cpitch,
    alphaLeft: left[1].alpha, alphaRight: right[1].alpha, stalledLeft: stalledOf(left), stalledRight: stalledOf(right),
    slatAlphaLeft: left[1].alpha - flapShift, slatAlphaRight: right[1].alpha - flapShift,
    outerStall, innerStall,
  };
}

const peakCache = new Map();

/** Body angle of attack at which the whole wing's lift peaks (symmetric flow, no slipstream). */
export function stallAlpha(ac, flaps = 0, slat = 1) {
  const key = `${flaps}|${slat}`;
  let byAc = peakCache.get(ac);
  if (!byAc) {
    byAc = new Map();
    peakCache.set(ac, byAc);
  }
  if (byAc.has(key)) return byAc.get(key);
  const surfaces = { elevator: 0, aileron: 0, rudder: 0, trim: 0, flaps, gear: 0, radiator: 0, slatLeft: slat, slatRight: slat };
  let best = -Infinity;
  let at = 0;
  for (let alpha = -0.1; alpha < 0.7; alpha += 0.0005) {
    const cl = aeroCoefficients(ac, { alpha, beta: 0, p: 0, q: 0, r: 0, airspeed: 100, qBar: 5000, slipQ: 0 }, surfaces).cl;
    if (cl > best) {
      best = cl;
      at = alpha;
    }
  }
  byAc.set(key, at);
  return at;
}
