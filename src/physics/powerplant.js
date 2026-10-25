// The engines and airscrews of an aircraft (Phase 3: one or more). Each engine is placed at its airscrew hub
// in body axes. A single-engine fighter's one engine sits on the thrust line, so its thrust passes through
// the centre of gravity and every sum is as it was before twins were added.
//
// Per-engine inputs (all optional) override the shared ones in the control input:
//   input.engines = [{ throttle, rpm, pitchSwitch, feather, failed }, ...]
//   feather: drive the blades to the feathered angle; failed: no power (the engine has stopped firing).

import { Vector3 } from 'three';
import { enginePower, createCutout, updateCutout } from './engine.js';
import { propellerLoads } from './propeller.js';
import { common } from '../aircraft/common.js';
import { clamp, lerp } from './interp.js';

/** Airscrew hub positions (body axes, m): the twins list theirs; single-engine aircraft use propHub. */
export function engineMounts(ac) {
  return ac.engines ? Object.values(ac.engines) : [{ x: ac.propHub.x, y: ac.propHub.y, z: 0 }];
}

/** The per-engine state carried by an aircraft. */
export function createEngines(ac) {
  return engineMounts(ac).map((mount) => ({
    mount, omega: 0, beta: ac.propeller.betaMin, cutout: createCutout(), slipQ: 0,
  }));
}

/** The inputs one engine sees: its own, or else the shared ones. */
export function engineInput(input, i) {
  const own = input.engines?.[i] ?? {};
  return {
    throttle: own.throttle ?? input.throttle ?? 0,
    rpm: own.rpm ?? input.rpm ?? 0.8,
    pitchSwitch: own.pitchSwitch ?? input.pitchSwitch ?? 0,
    feather: !!own.feather,
    failed: !!own.failed,
    emergency: !!input.emergency,
    engineAssist: !!input.engineAssist,
  };
}

const discArea = (pr) => (Math.PI * pr.diameter * pr.diameter) / 4;

/** The crankshaft speed the governor aims for. */
function governedSpeed(pr, rpmLever) {
  if (pr.type === 'constantSpeed') return lerp(pr.rpmMin, pr.rpmMax, clamp(rpmLever, 0, 1));
  return pr.rpmMax; // the engine-management assist holds the 5-minute rpm
}

/**
 * Thrust, torque and power of every engine for the current state (nothing is changed), and their summed
 * force and moments about the centre of gravity in body axes.
 *   flow: airflow(body); air: atmosphere at the aircraft; altitude in m
 */
export function powerplantLoads(plane, input, flow, air, altitude) {
  const { ac } = plane;
  const pr = ac.propeller;
  const disc = discArea(pr);
  const engines = plane.engines.map((e, i) => {
    const inp = engineInput(input, i);
    const eng = enginePower(plane.engine, {
      altitude, airspeed: flow.airspeed, throttle: inp.throttle, speed: e.omega, emergency: inp.emergency,
    });
    const power = inp.failed ? 0 : eng.power * e.cutout.factor;
    const omegaProp = e.omega * pr.gearRatio;
    const prop = propellerLoads(pr, { omega: omegaProp, beta: e.beta, v: Math.max(flow.vb.x, 0), rho: air.density });
    return {
      power, thrust: prop.thrust, torque: prop.torque, j: prop.j, map: eng.map, ratedMap: eng.ratedMap,
      omegaProp, slipQ: Math.max(prop.thrust, 0) / disc, mount: e.mount,
    };
  });
  // Moments in the game's body axes (+x right wing down, +y nose left, +z nose up): thrust at each hub, the
  // torque reaction, and slipstream swirl on the fin (yawing against the airscrew's rotation).
  const moment = new Vector3();
  let thrust = 0;
  let momentum = 0;
  let slipLeft = 0;
  let slipRight = 0;
  for (const e of engines) {
    thrust += e.thrust;
    moment.y += e.mount.z * e.thrust;
    moment.z += -e.mount.y * e.thrust;
    moment.x += -pr.rotation * e.torque;
    moment.y -= -pr.rotation * ac.aero.swirl * Math.max(e.thrust, 0) * pr.diameter;
    momentum += pr.rotation * pr.gyroInertia * e.omegaProp;
    // Each engine's slipstream washes its own side of the wing; one on the centre line washes both.
    if (e.mount.z <= 0) slipLeft += e.slipQ;
    if (e.mount.z >= 0) slipRight += e.slipQ;
  }
  const slipTail = engines.reduce((a, e) => a + e.slipQ, 0) / engines.length;
  return {
    engines, thrust, moment, momentum: new Vector3(momentum, 0, 0),
    power: engines.reduce((a, e) => a + e.power, 0), slipLeft, slipRight, slipTail,
  };
}

/**
 * Advances each engine's rotation and blade angle by dt: power drives the airscrew and its torque resists;
 * the governor (constant-speed airscrews, or the engine-management assist) or the pilot's pitch control
 * moves the blades; feathering drives them to the feathered angle. A failed engine also has the drag of
 * its own friction. `power` is the powerplantLoads result; loadFactor feeds the carburettor cut-out.
 */
export function stepEngines(plane, input, power, loadFactor, dt) {
  const pr = plane.ac.propeller;
  plane.engines.forEach((e, i) => {
    const inp = engineInput(input, i);
    const loads = power.engines[i];
    updateCutout(plane.engine, e.cutout, loadFactor, dt);
    const omegaProp = Math.max(e.omega * pr.gearRatio, 1);
    const friction = inp.failed ? common.deadEngineFriction * ratedTorque(plane.engine, pr) * Math.min(1, e.omega / 20) : 0;
    const accel = (loads.power / omegaProp - loads.torque - friction) / pr.inertia;
    e.omega = Math.max(inp.failed ? 0 : 5, (omegaProp + accel * dt) / pr.gearRatio);
    e.slipQ = loads.slipQ;

    const feathered = pr.featherAngle ?? pr.betaMax;
    if (inp.feather) {
      e.beta = Math.min(feathered, e.beta + pr.pitchRate * dt);
      return;
    }
    if (e.beta > pr.betaMax) {
      // Coming out of feather: the blades turn back at their normal rate.
      e.beta = Math.max(pr.betaMax, e.beta - pr.pitchRate * dt);
      return;
    }
    if (pr.type === 'constantSpeed' || inp.engineAssist) {
      const target = governedSpeed(pr, inp.rpm);
      const rate = clamp((pr.governorGain * (e.omega - target)) / target, -pr.pitchRate, pr.pitchRate);
      e.beta += rate * dt;
    } else {
      e.beta += clamp(inp.pitchSwitch, -1, 1) * pr.pitchRate * dt;
    }
    e.beta = clamp(e.beta, pr.betaMin, pr.betaMax);
  });
}

/** Torque (N m, at the airscrew shaft) of the engine's normal rating at sea level and its reference speed. */
function ratedTorque(engine, pr) {
  const cb = engine.ratings.normal.cb;
  return cb[0][1] / (engine.refSpeed * pr.gearRatio);
}

export { governedSpeed };
