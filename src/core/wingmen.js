// The player's wingmen (Phase 7 checkpoint 2, D227): AI fighters of his side and type in the places behind his in his
// side's formation: the RAF's vic (one or two wingmen), the Luftwaffe's Rotte (one) or Schwarm (three). Their leader
// is the player's own aircraft (sim.player); how they follow him is in src/ai/fighter.js.

import { attitude } from './autopilot.js';
import { spawnGroup } from './scenarios.js';

/** The skill of a mission's friendly aircraft: the setup's skill is the enemy's (game design, D227). */
export const FRIENDLY_SKILL = 'regular';

/** The wingman numbers each side's formations offer. */
export const WINGMEN = { RAF: [0, 1, 2], Luftwaffe: [0, 1, 3] };

/** The formation the player's flight flies in with `count` wingmen. */
export const flightFormation = (side, count) => (side === 'RAF' ? 'vic' : count >= 3 ? 'schwarm' : 'rotte');

/** Puts `count` wingmen in their places behind the player, at his speed. Returns the craft. */
export function spawnWingmen(sim, count) {
  if (!count) return [];
  const { side, id } = sim.ac;
  return spawnGroup(sim, {
    id, formation: flightFormation(side, count), from: 1, count, origin: sim.plane.body.position.clone(),
    heading: attitude(sim.plane).heading, role: 'fighter', side, speed: sim.plane.body.velocity.length(), leader: sim.player,
    skill: FRIENDLY_SKILL,
  });
}
