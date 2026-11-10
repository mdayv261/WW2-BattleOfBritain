// The Bf 110's crew positions in single player (Phase 7 checkpoint 7, D234; GAME_SPEC §9, D16): the player swaps (Tab)
// between the pilot's seat and the rear gun. While he mans the gun:
//   - a defensive AI pilot (src/ai/defensive.js) flies the aircraft, in every physics step before the guns, while the
//     pilot lives; both engines take his throttle and the automatic airscrew pitch is held on;
//   - the player's aim and trigger (`sim.gunControl`, set by the page from the view and his fire button) work the gun
//     (src/ai/gunner.js `crew.manned`), his rounds counting as his own;
//   - his own keys and stick no longer reach the aircraft's controls (src/main.js gives them the gun instead).
// Back in the pilot's seat the AI pilot lets go and the controls stand as he left them. Every flight starts in the
// pilot's seat. In multiplayer the same swap works, with the server's AI pilot flying (D243, D245).

import { DefensivePilot } from '../ai/defensive.js';
import { FRIENDLY_SKILL } from './wingmen.js';
import { crewHealth } from '../weapons/damage.js';

/** The player's flexible gun (the Bf 110's MG 15), or null in an aircraft without one. */
export const rearGun = (sim) => sim.player.gunnery?.mounts.find((m) => !m.spec.fixed) ?? null;

/** Starts a flight in the pilot's seat. */
export function resetSeat(sim) {
  sim.seat = 'pilot';
  sim.relief = null; // the AI pilot flying while the player is on the gun
  sim.gunControl = { aim: null, trigger: false };
}

/** Takes the player back to the pilot's seat. */
function toPilot(sim) {
  sim.seat = 'pilot';
  sim.relief = null;
  if (sim.player.gunnery) sim.player.gunnery.manned = null;
  sim.gunControl.trigger = false;
}

/** Tab: swaps seats. Returns what happened, for the message line ('' in an aircraft without a rear gun). */
export function swapSeat(sim) {
  const gun = rearGun(sim);
  if (!gun) return '';
  if (sim.seat === 'gunner') {
    toPilot(sim);
    return 'In the pilot\'s seat';
  }
  if (sim.crashed || sim.playerJumper || sim.bailout) return 'No time to change seats now';
  if (crewHealth(sim.plane, gun.spec.gunner) <= 0) return 'The gunner is out of action: the rear gun can\'t be manned';
  sim.seat = 'gunner';
  sim.relief = new DefensivePilot({ skill: FRIENDLY_SKILL, raid: sim.escortRaid ?? null });
  sim.player.gunnery.manned = { seat: gun.spec.gunner, aim: gun.bore.clone(), trigger: false };
  sim.gunControl = { aim: gun.bore.clone(), trigger: false };
  return 'On the rear gun: the pilot flies. Tab for the pilot\'s seat';
}

/** One physics step with the player on the gun: the AI pilot flies, and the player's aim and trigger go to the gun. */
export function stepCrewSeat(sim, dt) {
  if (sim.seat !== 'gunner') return;
  const gun = rearGun(sim);
  // The gun's station hit: the player can't stay there.
  if (!gun || crewHealth(sim.plane, gun.spec.gunner) <= 0) {
    toPilot(sim);
    sim.notice = { text: 'The rear gun is out of action: back in the pilot\'s seat', until: sim.plane.time + 3 };
    return;
  }
  const { input } = sim;
  if (sim.plane.damage.pilot > 0 && !sim.playerJumper) sim.relief.fly(sim.player, sim, dt);
  input.fireMg = input.fireCannon = false; // the pilot doesn't use the nose guns
  input.engineAssist = true;
  for (const e of input.engines ?? []) {
    e.throttle = input.throttle;
    e.rpm = input.rpm;
  }
  const manned = sim.player.gunnery.manned;
  if (sim.gunControl.aim) manned.aim.copy(sim.gunControl.aim);
  manned.trigger = !!sim.gunControl.trigger;
}
