// Scripted ground handling, take-offs and landings (Phase 2). A simple "test pilot" flies each one
// with feedback on attitude, heading and speed, the way the period trials describe the technique.
// Used by tests/physics/ground.test.js, tests/physics/takeoffLanding.test.js and npm run validate.

import { Vector3 } from 'three';
import { createAircraft, createOnGround, stepAircraft } from '../physics/flightModel.js';
import { attitude } from './flightTests.js';
import { equivalentAirspeed } from '../physics/atmosphere.js';
import { stallSpeed } from '../physics/performance.js';
import { clamp } from '../physics/interp.js';
import { staticShares } from '../physics/ground.js';
import { UNIT } from '../core/constants.js';

const DT = 1 / 120;
const DEG = UNIT.DEG;

/** Heading of the nose (rad, clockwise from north). */
export function headingRad(plane) {
  const nose = new Vector3(1, 0, 0).applyQuaternion(plane.body.quaternion);
  return Math.atan2(nose.x, -nose.z);
}

/** Height of the lowest main wheel above the ground (m). */
export function wheelHeight(plane) {
  const q = plane.body.quaternion;
  const ground = plane.terrain.surfaceAt(plane.body.position.x, plane.body.position.z).height;
  const lowest = Math.min(...plane.ground.wheels.filter((w) => w.main)
    .map((w) => w.pos.clone().applyQuaternion(q).y - w.radius));
  return plane.body.position.y + lowest - ground;
}

/** Wraps an angle to -pi..pi. */
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** Ground distance travelled from a starting position (m). */
const travelled = (plane, from) => Math.hypot(plane.body.position.x - from.x, plane.body.position.z - from.z);

/** One line of a trace, for working out what a scripted flight did. */
function snapshot(plane, input, t) {
  const { bank, pitch } = attitude(plane.body.quaternion);
  return {
    t, x: Math.hypot(plane.body.position.x, plane.body.position.z), h: plane.body.position.y, eas: plane.last.eas,
    pitch: pitch / DEG, bank: bank / DEG, heading: headingRad(plane) / DEG, wheels: plane.ground.touching.map(Number).join(''),
    stick: input.pitch, rudder: input.yaw, brake: input.brake, thrust: plane.last.thrust, vy: plane.body.velocity.y,
    alpha: plane.last.alpha / DEG,
  };
}

/** Pilot's feedback: stick and rudder to hold a pitch attitude, wings level and a heading. */
function hold(plane, input, { pitch, heading = 0 }) {
  const { bank, pitch: theta } = attitude(plane.body.quaternion);
  const w = plane.body.angularVelocity;
  if (pitch !== undefined) input.pitch = clamp(15 * (pitch - theta) - 3 * w.z, -1, 1);
  input.roll = clamp(-3 * bank - 0.8 * w.x, -1, 1);
  input.yaw = clamp(6 * wrap(heading - headingRad(plane)) + 3 * w.y, -1, 1);
}

/** Parked with brakes on, full throttle: engine speed reached and whether the tail lifts. */
export function runUp(ac, { seconds = 6 } = {}) {
  const plane = createOnGround(ac);
  const input = { throttle: 0, rpm: 1, gear: 1, brake: 1, trim: 0, pitch: 0, roll: 0, yaw: 0, engineAssist: false };
  let minTailLoad = Infinity;
  for (let t = 0; t < seconds; t += DT) {
    input.throttle = Math.min(1, t / 2);
    stepAircraft(plane, input, DT);
    const tail = plane.ground.touching[2];
    minTailLoad = Math.min(minTailLoad, tail ? 1 : 0);
    if (plane.ground.crash) break;
  }
  return { rpm: plane.omega / UNIT.RPM, tailLifted: minTailLoad === 0, crash: plane.ground.crash?.cause ?? null };
}

/**
 * Take-off as in the trials: throttle open over two seconds (take-off power), stick forward until the
 * tail is up, hold a slightly tail-down attitude, then at the stalling speed (power off, `rotateAt` times
 * it) ease the nose up toward the three-point attitude so the aircraft flies itself off; then climb away. Flaps as
 * each aircraft's technique (the Bf 109 used 20 degrees, S32; the RAF fighters none).
 *   screen: height of the screen in m (50 ft for the RAF trials, 20 m for the German figures)
 * Returns ground run, distance to the screen, lift-off speed (equivalent airspeed) and time, and the
 * largest heading excursion while on the ground (positive = right).
 */
export function takeoffTest(ac, { screen = 15.24, flaps = 0, mass, tailUpPitch = 2 * DEG, rotateAt = 0.9, climbAt = 1, trace } = {}) {
  const craft = mass ? { ...ac, mass: { ...ac.mass, flying: mass } } : ac;
  const vs = equivalentAirspeed(stallSpeed(craft, { speed: craft.propeller.rpmMax, throttle: 0 }, 0, { flaps, gear: 1 }), 0);
  const plane = createOnGround(craft);
  const start = plane.body.position.clone();
  const input = { throttle: 0, rpm: 1, gear: 1, flaps, brake: 0, trim: 0, pitch: 0, roll: 0, yaw: 0, engineAssist: true };
  const flyOffPitch = craft.gear.groundAngle - 1 * DEG;
  const climbSpeed = climbAt * vs;
  let climbPitch = flyOffPitch;
  let climbing = false;
  let liftOff = null;
  let toScreen = null;
  let maxSwing = 0;
  let tailUp = false;
  for (let t = 0; t < 60 && !toScreen; t += DT) {
    input.throttle = Math.min(1, t / 2);
    const { pitch } = attitude(plane.body.quaternion);
    if (!tailUp && pitch < tailUpPitch + 1 * DEG) tailUp = true;
    const height = plane.body.position.y - start.y;
    let target;
    if (liftOff) {
      // Climb away at `climbAt` times the stalling speed: hold the lift-off attitude until there, then
      // the elevator holds that speed.
      if (plane.last.eas > climbSpeed) climbing = true;
      if (climbing) climbPitch += 0.01 * (plane.last.eas - climbSpeed) * DT;
      target = climbing ? climbPitch + 0.02 * (plane.last.eas - climbSpeed) : flyOffPitch;
    } else if (tailUp && plane.last.eas > rotateAt * vs) target = flyOffPitch;
    else target = tailUp ? tailUpPitch : -10 * DEG;
    hold(plane, input, { pitch: target });
    if (plane.ground.onGround) {
      const h = wrap(headingRad(plane));
      if (Math.abs(h) > Math.abs(maxSwing)) maxSwing = h;
    }
    stepAircraft(plane, input, DT);
    trace?.push(snapshot(plane, input, t));
    if (plane.ground.crash) return { crash: plane.ground.crash.cause, time: t };
    if (!liftOff && !plane.ground.onGround && t > 1) {
      liftOff = { distance: travelled(plane, start), eas: plane.last.eas, time: t };
    }
    if (liftOff && height > screen) toScreen = { distance: travelled(plane, start), time: t };
  }
  return {
    groundRun: liftOff?.distance ?? Infinity, liftOffEas: liftOff?.eas, liftOffTime: liftOff?.time,
    toScreen: toScreen?.distance ?? Infinity, maxSwing: maxSwing / DEG, crash: null,
  };
}

/**
 * Landing as in the trials: a power-off glide at the approach speed with flaps and undercarriage down
 * (the elevator holding the speed), a flare to the three-point attitude, then stick held back and as
 * much brake as keeps the tail on the ground.
 *   screen: height of the screen in m; approach: equivalent airspeed of the glide (m/s)
 * Returns distances from the screen and from touchdown to a stop, touchdown speed and sink rate.
 */
export function landingTest(ac, { screen = 15.24, approach, mass, flaps = 1, flareHeight = 15, trace } = {}) {
  const craft = mass ? { ...ac, mass: { ...ac.mass, flying: mass } } : ac;
  const vs = equivalentAirspeed(stallSpeed(craft, { speed: craft.propeller.rpmMax, throttle: 0 }, 0, { flaps: 1, gear: 1 }), 0);
  const glide = approach ?? 1.2 * vs;
  const plane = createAircraft(craft, { altitude: screen + 120, speed: glide, throttle: 0.2, rpm: 1 });
  plane.surfaces.gear = 1;
  plane.surfaces.flaps = flaps;
  stepAircraft(plane, { throttle: 0.2, rpm: 1, gear: 1, flaps, trim: plane.trim }, 0); // fills in the readings
  const input = { throttle: 0, rpm: 1, gear: 1, flaps, brake: 0, trim: plane.trim, pitch: 0, roll: 0, yaw: 0, engineAssist: true };
  const flarePitch = craft.gear.groundAngle;
  let glidePitch = attitude(plane.body.quaternion).pitch - 5 * DEG;
  let flare = null;
  let atScreen = null;
  let touchdown = null;
  for (let t = 0; t < 120; t += DT) {
    const h = plane.body.position.y - plane.last.groundHeight;
    const hw = wheelHeight(plane);
    if (!touchdown) {
      if (!flare && hw > flareHeight) {
        // Speed on the elevator: a slow trim of the glide attitude, plus a direct correction.
        glidePitch += 0.004 * (plane.last.eas - glide) * DT;
        hold(plane, input, { pitch: glidePitch + 0.01 * (plane.last.eas - glide) });
      } else {
        // Flare and hold-off: the sink rate is brought down with the height, then held small just
        // above the ground while the speed falls and the nose comes up to the three-point attitude.
        flare ??= attitude(plane.body.quaternion).pitch;
        const sinkError = -(0.25 + 0.35 * Math.max(hw - 0.3, 0)) - plane.body.velocity.y;
        flare = Math.min(flarePitch, flare + 0.3 * sinkError * DT);
        hold(plane, input, { pitch: Math.min(flarePitch, flare + 0.1 * sinkError) });
      }
    } else {
      // Rolling out: stick back once the tail is down, and brake as hard as keeps it down (eased off as
      // the tailwheel's share of the wheel loads falls toward a fifth of its parked share).
      const tailOn = plane.ground.touching[2];
      hold(plane, input, { pitch: flarePitch });
      if (tailOn) input.pitch = 1;
      const loads = plane.last.wheelLoads;
      const tailShare = loads[2] / Math.max(loads[0] + loads[1] + loads[2], 1) / staticShares(craft).tail;
      input.brake = clamp(4 * (tailShare - 0.2), 0, 1);
    }
    stepAircraft(plane, input, DT);
    trace?.push(snapshot(plane, input, t));
    if (plane.ground.crash) return { crash: plane.ground.crash.cause, time: t };
    if (!atScreen && h <= screen) atScreen = plane.body.position.clone();
    if (!touchdown && plane.ground.onGround) {
      touchdown = { at: plane.body.position.clone(), eas: plane.last.eas, sink: plane.ground.touchdown?.sink ?? 0 };
    }
    if (touchdown && plane.body.velocity.length() < 0.3) {
      return {
        fromScreen: travelled(plane, atScreen), fromTouchdown: travelled(plane, touchdown.at),
        touchdownEas: touchdown.eas, sink: touchdown.sink, approachEas: glide, crash: null,
      };
    }
  }
  return { crash: 'did not stop', fromScreen: Infinity, fromTouchdown: Infinity };
}
