// Scripted single-engine flights for the twins (Phase 3). A simple autopilot flies as a pilot would on one
// engine: elevator holds the airspeed, ailerons hold a small bank toward the live engine, rudder holds the
// heading (no turning), and the rudder trimmer takes the load once it settles. The engines are stopped and
// feathered through the per-engine inputs (src/physics/powerplant.js). Used by tests/physics/twinEngine.test.js.

import { start, run, attitude } from './flightTests.js';
import { UNIT } from '../core/constants.js';

const DEG = UNIT.DEG;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * One engine stopped from level flight at an indicated airspeed. Returns the steady climb rate (m/s, negative
 * when sinking), the rudder and aileron the pilot holds (fractions of full travel), the sideslip and whether the
 * heading could be held.
 *   dead: index of the stopped engine (0 = left); feather: feather its airscrew; flaps 0..1; bank toward the live
 *   engine in degrees (5 is the usual figure for minimum control speed); seconds of flight after the failure.
 */
export function singleEngine(ac, { eas, altitude = 1000, dead = 0, feather = true, flaps = 0, bank = 0, seconds = 60, rudderTrim = true } = {}) {
  const { plane, input } = start(ac, { eas, altitude });
  const live = 1 - dead;
  const liveSide = live === 0 ? -1 : 1; // -1 left, +1 right (positive bank is right wing down)
  input.engines = [{}, {}];
  input.engines[dead] = { failed: true, feather };
  input.engines[live] = { throttle: 1 };
  input.flaps = flaps;
  input.rudderTrim = 0;
  let yawI = 0;
  let rollI = 0;
  let speedI = 0;
  const heading0 = headingOf(plane);
  const pitch0 = attitude(plane.body.quaternion).pitch;
  const trace = run(plane, input, seconds, (t, p, i) => {
    const dt = 1 / 120;
    const { bank: phi, pitch } = attitude(p.body.quaternion);
    const w = p.body.angularVelocity; // body rates: x roll (+ right wing down), y yaw (+ nose left), z pitch (+ nose up)
    // Elevator: a pitch attitude that holds the airspeed (too slow: nose down), then the elevator to hold it.
    const speedError = (p.last?.eas ?? eas) - eas;
    speedI = clamp(speedI + speedError * dt * 0.002, -0.2, 0.2);
    const pitchWanted = pitch0 + clamp(0.01 * speedError, -0.15, 0.15) + speedI;
    i.pitch = clamp(2 * (pitchWanted - pitch) - 1.5 * w.z, -1, 1);
    // Ailerons: hold the bank toward the live engine.
    const bankError = liveSide * bank * DEG - phi;
    rollI = clamp(rollI + bankError * dt * 1.5, -1, 1);
    i.roll = clamp(rollI + 1.5 * bankError - 0.6 * w.x, -1, 1);
    // Rudder (+ yaws the nose right): hold the heading, with an integral term for the steady load.
    const headingError = wrap(headingOf(p) - heading0); // + when the nose is right of where it started
    yawI = clamp(yawI - headingError * dt * 1.5, -1, 1);
    i.yaw = clamp(yawI - 3 * headingError + 2 * w.y, -1, 1);
    // Once settled, the pilot winds on rudder trim to take the load off his feet (and the rudder eases off).
    if (rudderTrim && t > seconds * 0.3) {
      const step = clamp(i.yaw, -0.1, 0.1) * dt;
      i.rudderTrim = clamp(i.rudderTrim + step, -1, 1);
    }
  });
  const late = trace.filter((s) => s.t > seconds * 0.75);
  const climb = (late[late.length - 1].altitude - late[0].altitude) / (late[late.length - 1].t - late[0].t);
  const mean = (f) => late.reduce((a, s) => a + f(s), 0) / late.length;
  return {
    climbRate: climb,
    rudder: mean(() => plane.surfaces.rudder),
    rudderInput: Math.abs(input.yaw),
    rudderTrim: input.rudderTrim,
    aileron: mean(() => plane.surfaces.aileron),
    sideslip: mean((s) => s.beta) / DEG,
    bank: mean((s) => s.bank) / DEG,
    aileronInput: Math.abs(input.roll),
    headingDrift: Math.abs(wrap(headingOf(plane) - heading0)) / DEG,
    eas: mean((s) => s.eas),
    liveRpm: (plane.engines[live].omega * 60) / (2 * Math.PI),
    deadRpm: (plane.engines[dead].omega * 60) / (2 * Math.PI),
  };
}

/**
 * Minimum control speed: the lowest indicated airspeed at which the heading can be held with one engine stopped
 * (windmilling unless `feather`) and the other at full power, wings level and no rudder trim. (The usual
 * definition allows 5 degrees of bank toward the live engine, but the model has no side force from the rudder to
 * balance it, so a banked aircraft would slip.) Searched downward in 2 m/s steps from 1.6 times the stall; it
 * returns the stall-limited speed if control lasts down to the stall.
 */
export function minimumControlSpeed(ac, { altitude = 1000, feather = false, stall, dead = 0 } = {}) {
  let last = null;
  for (let eas = Math.round(stall * 1.6); eas > stall * 0.95; eas -= 2) {
    const r = singleEngine(ac, { eas, altitude, dead, feather, seconds: 30, rudderTrim: false });
    if (r.headingDrift > 5 || r.rudderInput > 0.98 || r.aileronInput > 0.98) return { vmc: last ?? eas, limitedBy: r.aileronInput > 0.98 ? 'aileron' : 'rudder' };
    last = eas;
  }
  return { vmc: last, limitedBy: 'stall' };
}

function headingOf(plane) {
  const q = plane.body.quaternion;
  // Nose direction in the world: x forward when heading east.
  const x = 1 - 2 * (q.y * q.y + q.z * q.z);
  const z = 2 * (q.x * q.z - q.w * q.y);
  return Math.atan2(z, x);
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
