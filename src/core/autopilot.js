// The target aircraft's autopilot (Phase 5, D68): a test aid that holds a height, heading and speed by moving the
// aircraft's own controls, as a steady pilot would. It flies the same flight model and inputs as the player, with no
// more authority: if damage takes a control away or overpowers it (a shot-off wing panel, a dead engine), the aircraft
// rolls, sinks or slows as it would. It never fights or dodges (that is the Phase 6 AI).
//
// Gains are tuning constants of this test aid, not aircraft data: they are in common.autopilot.

import { Vector3 } from 'three';
import { common } from '../aircraft/common.js';
import { clamp } from '../physics/interp.js';

const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();

/** Attitude and rates of an aircraft: bank (rad, + right wing down), heading (rad, clockwise from north), climb (m/s). */
export function attitude(plane) {
  const q = plane.body.quaternion;
  _x.set(1, 0, 0).applyQuaternion(q);
  _y.set(0, 1, 0).applyQuaternion(q);
  _z.set(0, 0, 1).applyQuaternion(q);
  return {
    bank: Math.atan2(-_z.y, _y.y),
    heading: Math.atan2(_x.x, -_x.z),
    pitch: Math.asin(clamp(_x.y, -1, 1)),
    climb: plane.body.velocity.y,
  };
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** A fresh autopilot holding `hold` = { altitude (m), heading (rad), speed (m/s, true) }. */
export function createAutopilot(hold) {
  return { hold: { ...hold }, throttle: null };
}

/**
 * Sets the stick, rudder and throttle in `input` for one step of dt to hold the autopilot's height, heading and speed.
 * The trim is left where the flight started (level flight at its speed).
 */
export function flyAutopilot(ap, plane, input, dt) {
  const k = common.autopilot;
  const att = attitude(plane);
  const w = plane.body.angularVelocity;
  const p = w.x; // roll rate, + right wing down
  const q = w.z; // pitch rate, + nose up
  const r = -w.y; // yaw rate, + nose right
  // Heading by gentle banks.
  const bankWanted = clamp(k.headingToBank * wrap(ap.hold.heading - att.heading), -k.maxBank, k.maxBank);
  input.roll = clamp(k.bankGain * (bankWanted - att.bank) - k.rollDamping * p, -1, 1);
  // Height by climb rate.
  const climbWanted = clamp(k.altitudeToClimb * (ap.hold.altitude - plane.body.position.y), -k.maxClimb, k.maxClimb);
  input.pitch = clamp(k.climbGain * (climbWanted - att.climb) - k.pitchDamping * q, -1, 1);
  // Keep the ball in the middle: rudder against sideslip and yaw rate.
  const beta = plane.last?.beta ?? 0;
  input.yaw = clamp(k.slipGain * beta - k.yawDamping * r, -1, 1);
  // Speed by throttle (slowly, as a pilot would).
  const speed = plane.body.velocity.length();
  ap.throttle ??= input.throttle ?? 0.7;
  ap.throttle = clamp(ap.throttle + k.speedGain * (ap.hold.speed - speed) * dt, 0, 1);
  input.throttle = ap.throttle;
}
