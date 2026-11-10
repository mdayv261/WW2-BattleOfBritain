// One tick of a player's own aircraft in a match (Phase 9, D245), shared by the room server (src/mp/matchSim.js) and the
// browser's prediction (src/net/netFlight.js), so the two fly it exactly alike: the guns first (their rounds leave
// from where the aircraft is now, and their recoil acts in this step), then the flight model. As single player's
// Simulation.step, without its assists: in a match the browser applies those before it sends the controls.

import { stepAircraft } from '../physics/flightModel.js';
import { stepGuns } from '../weapons/guns.js';

/** Flies `plane` (with its fixed guns `armament`) one tick of `dt` s on `input`; `onRound(round)` for each round fired. */
export function flyTick(plane, armament, input, dt, onRound = () => {}) {
  const recoil = stepGuns(armament, plane, input, dt, plane.time, onRound);
  plane.recoil = recoil.force.lengthSq() > 0 ? recoil : null;
  stepAircraft(plane, input, dt);
}

/**
 * With the player on the Bf 110's rear gun: the AI pilot's controls `ai` as flown, given the player's own `input`
 * (only the bail-out comes from the player). The nose guns are off, the airscrew pitch automatic, and both engines take
 * the AI's throttle and rpm (as single player's src/core/crewSeat.js).
 */
export function gunSeatControls(ai, input) {
  Object.assign(ai, { fireMg: false, fireCannon: false, engineAssist: true, bailOut: input.bailOut, seat: 'gunner' });
  if (ai.engines) for (const e of ai.engines) Object.assign(e, { throttle: ai.throttle, rpm: ai.rpm });
  return ai;
}
