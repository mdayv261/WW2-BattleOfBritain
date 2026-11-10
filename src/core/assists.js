// The optional assists (Phase 7 checkpoint 6, D232; GAME_SPEC §5): each off unless the player switches it on (D16).
// They act on the player's aircraft in every physics step (src/core/simulation.js), with the same controls the pilot
// has: they move the rudder, the radiator flap and the airscrew pitch, and nothing else.
//   Auto-rudder: while airborne and the pilot's own rudder is near the middle, rudder against the sideslip.
//   Engine management: the automatic airscrew pitch (`engineAssist`, D18) on the manual-pitch aircraft, and the
//     radiator opened as the coolant nears its limit and shut once it has cooled.
//   Stall warning and g warning: flags for the warning line and tone (src/ui/hud.js, src/audio/audioEngine.js).
// Every threshold here is game design (D232): none of this was period equipment.

import { UNIT } from './constants.js';
import { common } from '../aircraft/common.js';
import { stallAlpha } from '../physics/aero.js';
import { coolantLimit } from '../physics/cooling.js';

export const ASSIST = {
  rudderGain: 3, // rudder per radian of sideslip
  rudderMax: 0.5, // the most rudder the auto-rudder uses (of full travel)
  pilotRudder: 0.05, // the pilot's rudder beyond this overrides the auto-rudder
  radiatorOpen: 15, // °C below the coolant limit at which the radiator is opened...
  radiatorShut: 25, // ...and below which it is shut again
  stallMargin: 2 * UNIT.DEG, // the stall warning sounds this close to the stall angle
  gShare: 0.9, // the g warning sounds at this share of the damage limit
  minSpeed: 20, // m/s EAS: no stall warning below this (on the ground, taking off)
};

/** The assists, all off (D16). */
export const NO_ASSISTS = Object.freeze({ autoRudder: false, stallWarning: false, gWarning: false, engineManagement: false });

/** The assists switched on, by name: "auto-rudder, stall warning"; '' with none. */
export function assistNames(assists = {}) {
  const names = { autoRudder: 'auto-rudder', stallWarning: 'stall warning', gWarning: 'g warning', engineManagement: 'engine management' };
  return Object.keys(names).filter((k) => assists[k]).map((k) => names[k]).join(', ');
}

const airborne = (plane) => plane.last && !plane.last.onGround;

/** The rudder the aircraft flies with this step: the pilot's, or with auto-rudder against the sideslip. */
export function assistedYaw(plane, input, assists) {
  if (!assists.autoRudder || !airborne(plane) || Math.abs(input.yaw) > ASSIST.pilotRudder) return input.yaw;
  const want = ASSIST.rudderGain * plane.last.beta; // positive rudder yaws the nose towards positive sideslip
  return Math.max(-ASSIST.rudderMax, Math.min(ASSIST.rudderMax, want));
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

/** The warnings due this step: { stall, g } (each false unless its assist is on). */
export function warnings(ac, plane, assists) {
  const last = plane.last;
  const out = { stall: false, g: false };
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
