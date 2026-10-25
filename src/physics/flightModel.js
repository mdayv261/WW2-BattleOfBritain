// The complete aircraft: engine, propeller, controls and airframe, stepped at the fixed physics rate.
//
// Game body axes (D5): +X nose, +Y up, +Z right wing. Positive moments: about X right wing down,
// about Y nose LEFT, about Z nose up. aero.js works in aeronautical terms (yaw positive nose right),
// so its yaw moment is negated here.

import { Vector3, Quaternion, Euler } from 'three';
import { G } from '../core/constants.js';
import { atmosphere, equivalentAirspeed } from './atmosphere.js';
import { createState, stepRigidBody, worldToBody, bodyToWorld } from './rigidBody.js';
import { enginePower, createCutout, updateCutout } from './engine.js';
import { propellerLoads, bladeAngleForPower } from './propeller.js';
import { aeroCoefficients } from './aero.js';
import { createSurfaces, updateSurfaces, updateSlats } from './controls.js';
import { engineFor } from '../aircraft/index.js';
import { clamp, lerp } from './interp.js';

const _vb = new Vector3();
const _f = new Vector3();
const _tmp = new Vector3();
const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);

/** Flow conditions seen by the airframe, from the rigid-body state. */
export function airflow(body) {
  const vb = worldToBody(body, body.velocity, _vb);
  const airspeed = vb.length();
  const alpha = Math.atan2(-vb.y, Math.max(vb.x, 1e-6));
  const beta = airspeed > 1e-6 ? Math.asin(clamp(vb.z / airspeed, -1, 1)) : 0;
  const w = body.angularVelocity;
  return { vb: vb.clone(), airspeed, alpha, beta, p: w.x, q: w.z, r: -w.y };
}

/** The crankshaft speed the governor aims for. */
function governedSpeed(plane, input) {
  const pr = plane.ac.propeller;
  if (pr.type === 'constantSpeed') return lerp(pr.rpmMin, pr.rpmMax, clamp(input.rpm ?? 0.8, 0, 1));
  return pr.rpmMax; // engine-management assist on the Bf 109 holds the 5-minute rpm
}

/**
 * Forces and moments for the current state and inputs (no state is changed).
 * Returns { force (world, N), moment (body, N m), momentum (body), torque, power, thrust, diag }.
 */
export function computeLoads(plane, input) {
  const { ac, body, engine, surfaces } = plane;
  const pr = ac.propeller;
  const altitude = body.position.y;
  const air = atmosphere(altitude);
  const flow = airflow(body);
  const qBar = 0.5 * air.density * flow.airspeed * flow.airspeed;

  const eng = enginePower(engine, {
    altitude,
    airspeed: flow.airspeed,
    throttle: input.throttle ?? 0,
    speed: plane.omega,
    emergency: !!input.emergency,
  });
  const power = eng.power * plane.cutout.factor;
  const omegaProp = plane.omega * pr.gearRatio;
  const prop = propellerLoads(pr, { omega: omegaProp, beta: plane.beta, v: Math.max(flow.vb.x, 0), rho: air.density });
  const disc = (Math.PI * pr.diameter * pr.diameter) / 4;
  const slipQ = Math.max(prop.thrust, 0) / disc;

  const S = ac.geometry.wingArea;
  const b = ac.geometry.span;
  const c = ac.geometry.mac;
  const co = aeroCoefficients(ac, { ...flow, qBar, slipQ }, surfaces);

  // Forces in the body frame: lift perpendicular to the airflow (in the plane of symmetry), drag
  // against it, side force along the right wing, thrust along the nose.
  const vHat = _tmp.copy(flow.vb).normalize();
  if (flow.airspeed < 1e-3) vHat.set(1, 0, 0);
  const liftDir = new Vector3().crossVectors(Z, vHat).normalize();
  const fb = new Vector3()
    .addScaledVector(liftDir, co.cl * qBar * S)
    .addScaledVector(vHat, -co.cd * qBar * S)
    .addScaledVector(Z, co.cy * qBar * S)
    .addScaledVector(X, prop.thrust);
  const force = bodyToWorld(body, fb, new Vector3());
  force.y -= ac.mass.flying * G;

  const roll = co.croll * qBar * S * b - pr.rotation * prop.torque;
  const yawRight = co.cyaw * qBar * S * b - pr.rotation * ac.aero.swirl * Math.max(prop.thrust, 0) * pr.diameter;
  const pitch = co.cpitch * qBar * S * c;
  const moment = new Vector3(roll, -yawRight, pitch);
  const momentum = new Vector3(pr.rotation * pr.inertia * omegaProp, 0, 0);

  const loadFactor = fb.y / (ac.mass.flying * G);
  return {
    force, moment, momentum, power, thrust: prop.thrust, torque: prop.torque, loadFactor,
    diag: {
      altitude, airspeed: flow.airspeed, eas: equivalentAirspeed(flow.airspeed, altitude),
      alpha: flow.alpha, beta: flow.beta, qBar, loadFactor, power, map: eng.map, ratedMap: eng.ratedMap,
      rpm: plane.omega, beta_prop: plane.beta, j: prop.j, thrust: prop.thrust,
      lift: co.cl * qBar * S, drag: co.cd * qBar * S, cl: co.cl, cd: co.cd,
      alphaLeft: co.alphaLeft, alphaRight: co.alphaRight, stalledLeft: co.stalledLeft, stalledRight: co.stalledRight,
      slatLeft: surfaces.slatLeft, slatRight: surfaces.slatRight, cutout: plane.cutout.factor,
    },
  };
}

/** Advances the aircraft by dt seconds. */
export function stepAircraft(plane, input, dt) {
  const { ac, body, surfaces } = plane;
  const pr = ac.propeller;
  const air = atmosphere(body.position.y);
  const flow = airflow(body);
  const qBar = 0.5 * air.density * flow.airspeed * flow.airspeed;
  const tailQ = qBar + (plane.lastSlipQ ?? 0) * 0.5;
  updateSurfaces(ac, surfaces, input, { q: qBar, tailQ }, dt);

  const loads = computeLoads(plane, input);
  plane.lastSlipQ = Math.max(loads.thrust, 0) / ((Math.PI * pr.diameter * pr.diameter) / 4);
  updateSlats(ac, surfaces, loads.diag.alphaLeft, loads.diag.alphaRight, dt);
  updateCutout(plane.engine, plane.cutout, loads.loadFactor, dt);

  // Propeller and engine rotation: engine power drives, propeller torque resists.
  const omegaProp = Math.max(plane.omega * pr.gearRatio, 1);
  const accel = (loads.power / omegaProp - loads.torque) / pr.inertia;
  plane.omega = Math.max(5, (omegaProp + accel * dt) / pr.gearRatio);

  // Blade angle: governor (constant-speed, or the Bf 109 assist) or the pilot's thumb switch.
  if (pr.type === 'constantSpeed' || input.engineAssist) {
    const target = governedSpeed(plane, input);
    const rate = clamp((pr.governorGain * (plane.omega - target)) / target, -pr.pitchRate, pr.pitchRate);
    plane.beta += rate * dt;
  } else {
    plane.beta += clamp(input.pitchSwitch ?? 0, -1, 1) * pr.pitchRate * dt;
  }
  plane.beta = clamp(plane.beta, pr.betaMin, pr.betaMax);

  stepRigidBody(body, {
    force: loads.force, moment: loads.moment, momentum: loads.momentum, mass: ac.mass.flying,
    inertia: { x: ac.mass.ixx, y: ac.mass.izz, z: ac.mass.iyy },
  }, dt);
  plane.time += dt;
  plane.last = loads.diag;
  return loads;
}

/**
 * Creates an aircraft in steady level flight.
 *   altitude m, speed m/s (true), heading rad (0 = north), throttle 0..1, rpm 0..1 (lever)
 * The pitch attitude, blade angle and engine speed are set for steady flight; the returned `trim`
 * is the elevator-trim setting that holds it hands-off (clamped to the trim range).
 */
export function createAircraft(ac, { altitude = 3000, speed = 110, heading = 0, throttle = 0.8, rpm = 0.8 } = {}) {
  const plane = {
    ac, engine: engineFor(ac), body: createState(), surfaces: createSurfaces(), cutout: createCutout(),
    omega: 0, beta: ac.propeller.betaMin, time: 0, last: null, lastSlipQ: 0,
  };
  const input = { throttle, rpm, pitch: 0, roll: 0, yaw: 0, trim: 0 };
  plane.omega = governedSpeed(plane, input);
  const air = atmosphere(altitude);
  const level = levelFlight(plane, input, altitude, speed);
  // Heading is clockwise from north (-Z); a turn of +90 degrees about +Y takes the nose (+X) north.
  const yaw = Math.PI / 2 - heading;
  const q = new Quaternion().setFromEuler(new Euler(0, yaw, level.alpha, 'YXZ'));
  plane.body.position.set(0, altitude, 0);
  plane.body.quaternion.copy(q);
  plane.body.velocity.set(speed, 0, 0).applyAxisAngle(Y, yaw);
  const eng = enginePower(plane.engine, { altitude, airspeed: speed, throttle, speed: plane.omega });
  plane.beta = bladeAngleForPower(ac.propeller, {
    omega: plane.omega * ac.propeller.gearRatio, v: speed * Math.cos(level.alpha), rho: air.density, power: eng.power,
  });
  plane.lastSlipQ = 0;
  refineTrim(plane, { ...input, trim: level.trim }, yaw, speed);
  return plane;
}

/**
 * Refines the starting attitude and trim with the full model (thrust, slipstream on wing and tail),
 * so the flight starts in balance: vertical force zero by attitude, pitching moment zero by trim.
 */
function refineTrim(plane, input, yaw, speed) {
  const { ac, body } = plane;
  const setAlpha = (alpha) => {
    body.quaternion.setFromEuler(new Euler(0, yaw, alpha, 'YXZ'));
    body.velocity.set(speed, 0, 0).applyAxisAngle(Y, yaw);
  };
  let alpha = airflow(body).alpha;
  let trim = input.trim;
  for (let pass = 0; pass < 3; pass += 1) {
    let lo = alpha - 0.1;
    let hi = alpha + 0.1;
    plane.surfaces.trim = trim;
    for (let i = 0; i < 40; i += 1) {
      const mid = 0.5 * (lo + hi);
      setAlpha(mid);
      if (computeLoads(plane, input).force.y < 0) lo = mid;
      else hi = mid;
    }
    alpha = 0.5 * (lo + hi);
    setAlpha(alpha);
    // The aerodynamics read the trim from the surfaces, so set it there for each trial.
    plane.surfaces.trim = 0;
    const m0 = computeLoads(plane, input).moment.z;
    plane.surfaces.trim = 1;
    const m1 = computeLoads(plane, input).moment.z;
    trim = clamp(-m0 / (m1 - m0), -1, 1);
  }
  plane.surfaces.trim = trim;
  plane.trim = trim;
}

/** Angle of attack and trim for 1 g level flight at a speed (wings level, no sideslip). */
function levelFlight(plane, input, altitude, speed) {
  const { ac } = plane;
  const air = atmosphere(altitude);
  const qBar = 0.5 * air.density * speed * speed;
  const S = ac.geometry.wingArea;
  const weight = ac.mass.flying * G;
  const flowAt = (alpha) => ({ alpha, beta: 0, p: 0, q: 0, r: 0, airspeed: speed, qBar, slipQ: 0 });
  let lo = -0.2;
  let hi = 0.4;
  for (let i = 0; i < 50; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (aeroCoefficients(ac, flowAt(mid), plane.surfaces).cl * qBar * S < weight) lo = mid;
    else hi = mid;
  }
  const alpha = 0.5 * (lo + hi);
  const s = { ...plane.surfaces, trim: 0 };
  const cm0 = aeroCoefficients(ac, flowAt(alpha), s).cpitch;
  const trim = clamp(-cm0 / ac.aero.trimCm, -1, 1);
  return { alpha, trim };
}
