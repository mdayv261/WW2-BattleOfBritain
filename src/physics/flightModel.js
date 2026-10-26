// The complete aircraft: engine, propeller, controls and airframe, stepped at the fixed physics rate.
//
// Game body axes (D5): +X nose, +Y up, +Z right wing. Positive moments: about X right wing down,
// about Y nose LEFT, about Z nose up. aero.js works in aeronautical terms (yaw positive nose right),
// so its yaw moment is negated here.

import { Vector3, Quaternion, Euler } from 'three';
import { G } from '../core/constants.js';
import { atmosphere, equivalentAirspeed } from './atmosphere.js';
import { createState, stepRigidBody, worldToBody, bodyToWorld } from './rigidBody.js';
import { enginePower } from './engine.js';
import { bladeAngleForPower } from './propeller.js';
import { createEngines, powerplantLoads, stepEngines, governedSpeed as governed } from './powerplant.js';
import { aeroCoefficients } from './aero.js';
import { createSurfaces, updateSurfaces, updateSlats } from './controls.js';
import { createGround, groundLoads, updateGround, flatGrass } from './ground.js';
import { common } from '../aircraft/common.js';
import { engineFor } from '../aircraft/index.js';
import { clamp, lerp } from './interp.js';
import { stepHeat, equilibrium, createHeat } from './cooling.js';
import { createDamage, stepStructure, damagedSurfaces, damageDrag } from './structure.js';

const _vb = new Vector3();
const _f = new Vector3();
const _tmp = new Vector3();
const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);

/**
 * Flow conditions seen by the airframe, from the rigid-body state. At walking pace on the ground the
 * free stream no longer sets the flow over the aircraft (the slipstream does), so the angles are worked
 * out as if moving forward at no less than common.lowSpeed; in flight this changes nothing.
 */
export function airflow(body) {
  const vb = worldToBody(body, body.velocity, _vb);
  const airspeed = vb.length();
  const alpha = Math.atan2(-vb.y, Math.max(vb.x, common.lowSpeed));
  const beta = Math.asin(clamp(vb.z / Math.max(airspeed, common.lowSpeed), -1, 1));
  const w = body.angularVelocity;
  return { vb: vb.clone(), airspeed, alpha, beta, p: w.x, q: w.z, r: -w.y };
}

/**
 * Ground effect: the factor on induced drag at height h above the ground (McCormick's approximation
 * with the constant in common.js); 1 well clear of the ground.
 */
export function groundEffectFactor(h, span) {
  const x = (common.groundEffect * Math.max(h, 0.1)) / span;
  return (x * x) / (1 + x * x);
}

/** The crankshaft speed the governor aims for, for the shared rpm lever. */
function governedSpeed(plane, input) {
  return governed(plane.ac.propeller, input.rpm ?? 0.8);
}

/**
 * Forces and moments for the current state and inputs (no state is changed).
 * Returns { force (world, N), moment (body, N m), momentum (body), torque, power, thrust, diag }.
 */
export function computeLoads(plane, input) {
  const { ac, body, surfaces } = plane;
  const altitude = body.position.y;
  const air = atmosphere(altitude);
  const flow = airflow(body);
  const qBar = 0.5 * air.density * flow.airspeed * flow.airspeed;

  const power = powerplantLoads(plane, input, flow, air, altitude);
  const first = power.engines[0];

  const S = ac.geometry.wingArea;
  const b = ac.geometry.span;
  const c = ac.geometry.mac;
  const terrain = plane.terrain ?? flatGrass;
  const groundHeight = terrain.surfaceAt(body.position.x, body.position.z).height;
  const groundEffect = groundEffectFactor(altitude - groundHeight, ac.geometry.span);
  const co = aeroCoefficients(ac, {
    ...flow, qBar, slipQ: power.slipTail, slipQLeft: power.slipLeft, slipQRight: power.slipRight, groundEffect,
  }, damagedSurfaces(surfaces, plane.damage));
  co.cd += damageDrag(ac, plane.damage); // structural damage (src/physics/structure.js); nothing when undamaged

  // Forces in the body frame: lift perpendicular to the airflow (in the plane of symmetry), drag
  // against it, side force along the right wing, thrust along the nose.
  const vHat = _tmp.copy(flow.vb).normalize();
  if (flow.airspeed < 1e-3) vHat.set(1, 0, 0);
  const liftDir = new Vector3().crossVectors(Z, vHat).normalize();
  const fb = new Vector3()
    .addScaledVector(liftDir, co.cl * qBar * S)
    .addScaledVector(vHat, -co.cd * qBar * S)
    .addScaledVector(Z, co.cy * qBar * S)
    .addScaledVector(X, power.thrust);
  if (plane.recoil) fb.add(plane.recoil.force); // the guns' recoil while firing (src/weapons/guns.js), body axes
  const force = bodyToWorld(body, fb, new Vector3());
  force.y -= ac.mass.flying * G;
  const ground = groundLoads(plane, input, terrain);
  force.add(ground.force);
  const groundBody = ground.force.clone().applyQuaternion(body.quaternion.clone().invert());

  // Aerodynamic moments (aero.js yaws positive nose right), the engines' moments, and the ground's.
  const moment = new Vector3(co.croll * qBar * S * b, -co.cyaw * qBar * S * b, co.cpitch * qBar * S * c)
    .add(power.moment).add(ground.moment);
  if (plane.recoil) moment.add(plane.recoil.moment);
  const momentum = power.momentum;

  // What an accelerometer would read: everything but gravity, including the push of the ground.
  const loadFactor = (fb.y + groundBody.y) / (ac.mass.flying * G);
  return {
    force, moment, momentum, power: power.power, thrust: power.thrust, loadFactor, ground, powerplant: power,
    diag: {
      altitude, airspeed: flow.airspeed, eas: equivalentAirspeed(flow.airspeed, altitude),
      alpha: flow.alpha, beta: flow.beta, qBar, loadFactor, power: power.power, map: first.map, ratedMap: first.ratedMap,
      rpm: plane.omega, beta_prop: plane.beta, j: first.j, thrust: power.thrust,
      engines: power.engines.map((e, i) => ({
        rpm: plane.engines[i].omega, beta: plane.engines[i].beta, map: e.map, thrust: e.thrust, power: e.power,
      })),
      lift: co.cl * qBar * S, drag: co.cd * qBar * S, cl: co.cl, cd: co.cd,
      alphaLeft: co.alphaLeft, alphaRight: co.alphaRight, stalledLeft: co.stalledLeft, stalledRight: co.stalledRight,
      slatAlphaLeft: co.slatAlphaLeft, slatAlphaRight: co.slatAlphaRight,
      slatLeft: surfaces.slatLeft, slatRight: surfaces.slatRight, cutout: plane.cutout.factor,
      groundHeight, groundEffect, onGround: ground.wheels.some(Boolean), wheelLoads: ground.wheels.map((w) => w?.load ?? 0),
      sideG: (fb.z + groundBody.z) / (ac.mass.flying * G), // sideways push felt by the pilot (+ to the right)
    },
  };
}

/** Advances the aircraft by dt seconds. */
export function stepAircraft(plane, input, dt) {
  const { ac, body, surfaces } = plane;
  const air = atmosphere(body.position.y);
  const flow = airflow(body);
  const qBar = 0.5 * air.density * flow.airspeed * flow.airspeed;
  const slipTail = plane.engines.reduce((a, e) => a + e.slipQ, 0) / plane.engines.length;
  const tailQ = qBar + slipTail * 0.5;
  updateSurfaces(ac, surfaces, input, { q: qBar, tailQ }, dt);

  const loads = computeLoads(plane, input);
  updateSlats(ac, surfaces, loads.diag.slatAlphaLeft, loads.diag.slatAlphaRight, dt);
  stepEngines(plane, input, loads.powerplant, loads.loadFactor, dt);
  plane.engines.forEach((e, i) => stepHeat(ac, plane.engine, e, {
    altitude: body.position.y, q: qBar, radiator: surfaces.radiator, power: loads.powerplant.engines[i].power,
  }, dt));
  stepStructure(plane, loads.diag, dt);

  stepRigidBody(body, {
    force: loads.force, moment: loads.moment, momentum: loads.momentum, mass: ac.mass.flying,
    inertia: { x: ac.mass.ixx, y: ac.mass.izz, z: ac.mass.iyy },
  }, dt);
  plane.time += dt;
  updateGround(plane, loads.ground, plane.terrain ?? flatGrass, plane.time);
  plane.last = loads.diag;
  return loads;
}

/**
 * Creates an aircraft in steady level flight.
 *   altitude m, speed m/s (true), heading rad (0 = north), throttle 0..1, rpm 0..1 (lever), x and z (m),
 *   terrain (what the ground under it is)
 * The pitch attitude, blade angle and engine speed are set for steady flight; the returned `trim`
 * is the elevator-trim setting that holds it hands-off (clamped to the trim range).
 */
export function createAircraft(ac, {
  altitude = 3000, speed = 110, heading = 0, throttle = 0.8, rpm = 0.8, x = 0, z = 0, terrain = flatGrass,
} = {}) {
  const plane = newPlane(ac, terrain);
  const input = { throttle, rpm, pitch: 0, roll: 0, yaw: 0, trim: 0 };
  plane.omega = governedSpeed(plane, input);
  const air = atmosphere(altitude);
  const level = levelFlight(plane, input, altitude, speed);
  // Heading is clockwise from north (-Z); a turn of +90 degrees about +Y takes the nose (+X) north.
  const yaw = Math.PI / 2 - heading;
  const q = new Quaternion().setFromEuler(new Euler(0, yaw, level.alpha, 'YXZ'));
  plane.body.position.set(x, altitude, z);
  plane.body.quaternion.copy(q);
  plane.body.velocity.set(speed, 0, 0).applyAxisAngle(Y, yaw);
  const eng = enginePower(plane.engine, { altitude, airspeed: speed, throttle, speed: plane.omega });
  plane.beta = bladeAngleForPower(ac.propeller, {
    omega: plane.omega * ac.propeller.gearRatio, v: speed * Math.cos(level.alpha), rho: air.density, power: eng.power,
  });
  for (const e of plane.engines) e.slipQ = 0;
  refineTrim(plane, { ...input, trim: level.trim }, yaw, speed);
  // Engines start at the temperatures they would settle at in this flight, radiators closed (as the input starts).
  for (const e of plane.engines) {
    const t = equilibrium(ac, plane.engine, { altitude, q: 0.5 * air.density * speed * speed, power: eng.power, radiator: 0 });
    e.heat = createHeat(t.coolant, t.oil);
  }
  return plane;
}

/** An aircraft at rest at the origin, before a start position is set. */
function newPlane(ac, terrain = flatGrass) {
  return {
    ac, engine: engineFor(ac), engines: createEngines(ac), body: createState(), surfaces: createSurfaces(),
    time: 0, last: null, trim: 0, ground: createGround(ac), terrain, damage: createDamage(),
    // The first engine's state, for single-engine code and the readouts.
    get omega() { return this.engines[0].omega; },
    set omega(v) { for (const e of this.engines) e.omega = v; },
    get beta() { return this.engines[0].beta; },
    set beta(v) { for (const e of this.engines) e.beta = v; },
    get cutout() { return this.engines[0].cutout; },
  };
}

/**
 * Creates an aircraft parked on the ground with the engine idling, the undercarriage down and locked,
 * facing `heading` (rad, clockwise from north) at (x, z). It is let settle on its springs for two
 * seconds with the brakes on, so it starts at rest in its natural three-point attitude.
 */
export function createOnGround(ac, { x = 0, z = 0, heading = 0, terrain = flatGrass, idleRpm = 1000 } = {}) {
  const plane = newPlane(ac, terrain);
  const yaw = Math.PI / 2 - heading;
  plane.body.quaternion.setFromEuler(new Euler(0, yaw, ac.gear.groundAngle, 'YXZ'));
  const { main } = ac.gear;
  const wheel = new Vector3(main.x, main.y, main.z).applyQuaternion(plane.body.quaternion);
  const height = terrain.surfaceAt(x, z).height;
  plane.body.position.set(x, height + main.radius - ac.gear.mainDeflection - wheel.y, z);
  plane.surfaces.gear = 1;
  plane.omega = (idleRpm * 2 * Math.PI) / 60;
  const input = { throttle: 0, rpm: 1, gear: 1, brake: 1, trim: 0, pitch: 0, roll: 0, yaw: 0 };
  for (let t = 0; t < 2; t += 1 / 120) stepAircraft(plane, input, 1 / 120);
  plane.body.velocity.set(0, 0, 0);
  plane.body.angularVelocity.set(0, 0, 0);
  plane.ground.touchdown = null;
  plane.time = 0;
  for (const e of plane.engines) e.heat = createHeat(common.groundStartHeat.coolant, common.groundStartHeat.oil);
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
