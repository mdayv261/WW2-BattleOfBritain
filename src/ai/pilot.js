// The AI pilot's hands (Phase 6, D79): how an AI pilot flies the aircraft through the same controls as the player. It
// moves only the stick (pitch and roll), the rudder, the throttle and the triggers, within their travel and no faster than
// a hand can move them (the skill's stickTime), so the aircraft can do no more than it would for the player.
//
// A goal says where to go: { direction (world, unit), gMax, gMin, maxBank (rad), turnGain (rad/s of turn per rad off the
// direction; gentle for formation flying), speed (m/s) or throttle, fireMg, fireCannon }. Every physics step the hands:
//   - work out the lift the turn needs: a pull towards the direction (turning faster the further off it is), plus the
//     lift that holds the aircraft up against gravity;
//   - roll that lift into place (aileron, with damping on the roll rate), never banking past maxBank;
//   - pull or push for the g that lift needs, between gMin and gMax, easing off at the stall buffet the skill feels;
//   - keep the ball in the middle with the rudder, and hold the speed with the throttle;
//   - mind the engine as a pilot would: the radiator opened as the coolant nears its limit and closed when it has
//     cooled, and the rpm lever at the goal's setting (full in a fight, cruising rpm otherwise).

import { Vector3 } from 'three';
import { G } from '../core/constants.js';
import { clamp } from '../physics/interp.js';
import { attitude } from '../core/autopilot.js';
import { coolantLimit } from '../physics/cooling.js';

// Handling gains of the AI's hands: tuning, not aircraft data (D79).
const TURN_GAIN = 1.2; // rad/s of turn per rad off the direction wanted
const ROLL_GAIN = 2.5; // stick per rad of roll still to go
const ROLL_DAMPING = 0.6; // stick per rad/s of roll rate
const PULL_RATE = 0.6; // stick per second per g short of the g wanted
const PULL_GAIN = 0.12; // stick per g short, straight away
const SLIP_GAIN = 1.5; // rudder per rad of sideslip
const YAW_DAMPING = 0.6; // rudder per rad/s of yaw rate
const SPEED_GAIN = 0.02; // throttle per second per m/s of speed error...
const SPEED_P = 0.04; // ...and per m/s straight away
const RADIATOR_OPEN = 15; // °C below the coolant limit at which the radiator is opened
const RADIATOR_CLOSE = 30; // °C below it at which it is closed again
const CRUISE_RPM = 0.8; // rpm lever away from a fight

const _v = new Vector3();
const _d = new Vector3();
const _up = new Vector3();
const _lift = new Vector3();

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** A fresh set of hands for a skill (SKILLS entry): the stick held where the input already is. */
export function createHands(skill) {
  return { skill, pull: null };
}

/** Moves a control towards `wanted`, no faster than full travel (2 units for a stick, 1 for a lever) in stickTime. */
const move = (from, wanted, travel, stickTime, dt) => {
  const step = (travel / stickTime) * dt;
  return from + clamp(wanted - from, -step, step);
};

/**
 * The lift (world, m/s²) the aircraft needs to turn its flight path towards `direction`: a turn rate in proportion to
 * how far off it is, plus the lift that balances gravity across the flight path.
 */
export function liftWanted(velocity, direction, out = new Vector3(), turnGain = TURN_GAIN) {
  const speed = Math.max(velocity.length(), 1);
  _v.copy(velocity).divideScalar(speed);
  const off = Math.acos(clamp(_v.dot(direction), -1, 1));
  // The direction wanted, square to the flight path.
  _d.copy(direction).addScaledVector(_v, -_v.dot(direction));
  if (_d.lengthSq() > 1e-12) _d.normalize();
  out.copy(_d).multiplyScalar(speed * turnGain * off);
  // Hold the aircraft up: the part of gravity across the flight path.
  _up.set(0, 1, 0).addScaledVector(_v, -_v.y);
  return out.addScaledVector(_up, G);
}

/** Flies one physics step of dt towards `goal`, moving `craft.input` as a pilot's hands would. */
export function fly(craft, hands, goal, dt) {
  const { plane, input } = craft;
  const { body } = plane;
  const d = plane.last ?? {};
  const skill = hands.skill;
  const w = body.angularVelocity;
  const rollRate = w.x;
  const yawRate = -w.y;

  // The lift wanted, in body axes: its direction sets the roll, its size the g.
  liftWanted(body.velocity, goal.direction, _lift, goal.turnGain ?? TURN_GAIN);
  const inv = body.quaternion.clone().invert();
  const liftBody = _lift.clone().applyQuaternion(inv);
  let rollToGo = liftBody.y ** 2 + liftBody.z ** 2 > 1e-6 ? Math.atan2(liftBody.z, liftBody.y) : 0;
  // Never bank past the goal's limit (when it sets one), measuring round the shorter way.
  if (goal.maxBank !== undefined && goal.maxBank < Math.PI) {
    const bank = attitude(plane).bank;
    rollToGo = clamp(wrap(bank + rollToGo), -goal.maxBank, goal.maxBank) - bank;
  }
  const rollWanted = clamp(ROLL_GAIN * rollToGo - ROLL_DAMPING * rollRate, -1, 1);

  // The g wanted, while the lift is roughly in place; eased off at the buffet.
  const gNeeded = _lift.length() / G;
  let gWanted = clamp(gNeeded * Math.max(0, Math.cos(rollToGo)), goal.gMin ?? 0, goal.gMax ?? 4);
  const n = d.loadFactor ?? 1;
  const buffet = Math.max(d.stalledLeft ?? 0, d.stalledRight ?? 0);
  if (buffet > skill.buffet) gWanted = Math.min(gWanted, n - 0.5);
  hands.pull ??= input.pitch ?? 0;
  hands.pull = clamp(hands.pull + PULL_RATE * (gWanted - n) * dt, -1, 1);
  const pitchWanted = clamp(hands.pull + PULL_GAIN * (gWanted - n), -1, 1);

  // Ball in the middle.
  const yawWanted = clamp(SLIP_GAIN * (d.beta ?? 0) - YAW_DAMPING * yawRate, -1, 1);

  // Throttle: as set, or for the speed wanted.
  let throttleWanted = input.throttle ?? 0.7;
  hands.lever ??= throttleWanted;
  if (goal.throttle !== undefined) throttleWanted = hands.lever = goal.throttle;
  else if (goal.speed !== undefined) {
    const error = goal.speed - body.velocity.length();
    hands.lever = clamp(hands.lever + SPEED_GAIN * error * dt, 0, 1);
    throttleWanted = clamp(hands.lever + SPEED_P * error, 0, 1);
  }

  const t = skill.stickTime;
  input.roll = move(input.roll ?? 0, rollWanted, 2, t, dt);
  input.pitch = move(input.pitch ?? 0, pitchWanted, 2, t, dt);
  input.yaw = move(input.yaw ?? 0, yawWanted, 2, t, dt);
  input.throttle = move(input.throttle ?? 0, throttleWanted, 1, t, dt);
  input.rpm = goal.rpm ?? (goal.throttle === 1 ? 1 : CRUISE_RPM);
  mindRadiator(plane, input);
  input.fireMg = !!goal.fireMg;
  input.fireCannon = !!goal.fireCannon;
}

/** Opens the radiator as the hottest engine's coolant nears its limit, and closes it once it has cooled. */
function mindRadiator(plane, input) {
  const limit = coolantLimit(plane.engine, plane.body.position.y);
  const hottest = Math.max(...plane.engines.map((e) => e.heat.coolant));
  if (hottest > limit - RADIATOR_OPEN) input.radiator = 1;
  else if (hottest < limit - RADIATOR_CLOSE) input.radiator = 0;
}
