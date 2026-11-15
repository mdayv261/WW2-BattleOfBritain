// The optional assists (Phase 7 checkpoint 6, D232; GAME_SPEC §5): each off unless the player switches it on (D16).
// They act on the player's aircraft in every physics step (src/core/simulation.js), with the same controls the pilot
// has: they move the rudder, the radiator flap and the airscrew pitch, and nothing else.
//   Auto-rudder: while the pilot's own rudder is near the middle: in the air, rudder against the sideslip; on the
//     ground (D248), hold the heading on the take-off and landing runs, so the swing of opening up is caught.
//   Engine management: the automatic airscrew pitch (`engineAssist`, D18) on the manual-pitch aircraft, and the
//     radiator opened as the coolant nears its limit and shut once it has cooled.
//   Stall warning and g warning: flags for the warning line and tone (src/ui/hud.js, src/audio/audioEngine.js).
//   Overspeed warning (D240): an engine over its red line, or the airframe near its diving limit.
// Every threshold here is game design (D232): none of this was period equipment.

import { Vector3 } from 'three';
import { UNIT } from './constants.js';
import { common } from '../aircraft/common.js';
import { stallAlpha } from '../physics/aero.js';
import { coolantLimit, overRedLine } from '../physics/cooling.js';

export const ASSIST = {
  rudderGain: 3, // rudder per radian of sideslip
  rudderMax: 0.5, // the most rudder the auto-rudder uses (of full travel)
  pilotRudder: 0.05, // the pilot's rudder beyond this overrides the auto-rudder
  // On the ground (D248): rudder = -(groundHeadingGain x heading error + groundYawRateGain x yaw rate), up to full travel.
  // Tuned with the scripted take-off (src/dev/groundTests.js): higher gains barely reduce the swing, which is largest
  // in the first second or two, before the rudder has the airflow to act.
  groundHeadingGain: 30, // rudder per radian off the held heading
  groundYawRateGain: 8, // rudder per rad/s of yaw rate (damping)
  groundRudderMax: 1, // full travel: at low speed the rudder needs it
  radiatorOpen: 15, // °C below the coolant limit at which the radiator is opened...
  radiatorShut: 25, // ...and below which it is shut again
  stallMargin: 2 * UNIT.DEG, // the stall warning sounds this close to the stall angle
  gShare: 0.9, // the g warning sounds at this share of the damage limit
  diveShare: 0.95, // the dive-limit warning sounds at this share of the airframe's diving limit (D240)
  minSpeed: 20, // m/s EAS: no stall warning below this (on the ground, taking off)
};

/** The assists, all off (D16). */
export const NO_ASSISTS = Object.freeze({
  autoRudder: false, stallWarning: false, gWarning: false, engineManagement: false, overspeedWarning: false,
});

/** The assists switched on, by name: "auto-rudder, stall warning"; '' with none. */
export function assistNames(assists = {}) {
  const names = {
    autoRudder: 'auto-rudder', stallWarning: 'stall warning', gWarning: 'g warning', engineManagement: 'engine management',
    overspeedWarning: 'overspeed warning',
  };
  return Object.keys(names).filter((k) => assists[k]).map((k) => names[k]).join(', ');
}

const airborne = (plane) => plane.last && !plane.last.onGround;
const clampTo = (v, max) => Math.max(-max, Math.min(max, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const NOSE = new Vector3();

/** The nose's heading (rad, clockwise from north; world -Z is north). */
function noseHeading(plane) {
  NOSE.set(1, 0, 0).applyQuaternion(plane.body.quaternion);
  return Math.atan2(NOSE.x, -NOSE.z);
}

/**
 * The rudder the aircraft flies with this step: the pilot's, or the auto-rudder's while the pilot's feet are off the
 * pedals: against the sideslip in the air; on the ground, holding the heading held in `memory` (D248), taken when the
 * hold begins (a ground start, a touchdown, or the pilot letting go of the rudder) and let go at lift-off.
 */
export function assistedYaw(plane, input, assists, memory = {}) {
  if (!assists.autoRudder) return input.yaw;
  if (Math.abs(input.yaw) > ASSIST.pilotRudder) {
    memory.heading = null; // the pilot steers; letting go holds the new heading
    return input.yaw;
  }
  if (!plane.last) return input.yaw; // before the first step
  if (!airborne(plane)) {
    const heading = noseHeading(plane);
    memory.heading ??= heading;
    const off = wrap(heading - memory.heading);
    // Positive rudder yaws the nose right (heading up); body +y yaw rate is the nose swinging left.
    return clampTo(-ASSIST.groundHeadingGain * off + ASSIST.groundYawRateGain * plane.body.angularVelocity.y, ASSIST.groundRudderMax);
  }
  memory.heading = null;
  const want = ASSIST.rudderGain * plane.last.beta; // positive rudder yaws the nose towards positive sideslip
  return clampTo(want, ASSIST.rudderMax);
}

/** Engine management: the automatic airscrew pitch, and the radiator by the hottest engine's coolant. */
export function manageEngine(ac, plane, input, assists) {
  if (!assists.engineManagement) return;
  if (ac.propeller.type === 'manualPitch') input.engineAssist = true;
  const limit = coolantLimit(plane.engine, plane.body.position.y);
  const hottest = Math.max(...plane.engines.map((e) => e.heat.coolant));
  if (hottest > limit - ASSIST.radiatorOpen) input.radiator = 1;
  else if (hottest < limit - ASSIST.radiatorShut) input.radiator = 0;
}

/** The warnings due this step: { stall, g, overspeed, dive } (each false unless its assist is on). */
export function warnings(ac, plane, assists) {
  const last = plane.last;
  const out = { stall: false, g: false, overspeed: false, dive: false };
  // Overspeed (D240): an engine over its red line (also on the ground); past the airframe's diving limit.
  if (assists.overspeedWarning) {
    out.overspeed = plane.engines.some((e) => overRedLine(plane.engine, e.omega));
    out.dive = !!(last && ac.limits?.diveEas && last.eas > ASSIST.diveShare * ac.limits.diveEas);
  }
  if (!last || !airborne(plane)) return out;
  if (assists.stallWarning && last.eas > ASSIST.minSpeed) {
    out.stall = last.alpha > stallAlpha(ac, plane.surfaces.flaps) - ASSIST.stallMargin;
  }
  if (assists.gWarning && ac.limits) {
    const share = last.loadFactor >= 0 ? 1 : common.structure.negativeShare;
    out.g = Math.abs(last.loadFactor) >= ASSIST.gShare * ac.limits.g.damage * share;
  }
  return out;
}
