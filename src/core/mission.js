// Missions (Phase 7, D225, D227): a mission is built from the setup screen's choices, flown, watched for its end, and
// summed up for the results screen. Three kinds (their starts in src/core/missionStarts.js):
//   dogfight: ends when every enemy is lost (destroyed, abandoned or gone home);
//   interception (RAF): an He 111 raid on a Kent airfield (src/core/raid.js); ends when every bomber is down,
//     straggling home, or the raid has passed its target;
//   escort (Luftwaffe): the player escorts the raid; ends when the raid is back over its home field, or every bomber is
//     down or straggling.
// Any of them also ends when the player is lost (shot down, killed or bailed out) or has landed on a friendly field and
// stopped. The results follow END_PAUSE later. The player may fly with wingmen (src/core/wingmen.js).
//
// Kill credit (D225, game design): an enemy destroyed within CREDIT_TIME of the player's last hit on it is his kill;
// one he hit that someone else (or the ground) finished is shared; one that goes home with his hits in it is damaged.
// The player's Bf 110 rear gunner's rounds count as the player's (src/core/simulation.js); a wingman's kills are his own
// and are listed apart (D227).

import { aircraftById } from '../aircraft/index.js';
import { AIRFIELDS } from '../world/airfields.js';
import { AIRFIELD } from '../world/airfield.js';
import { dropAll } from './scenarios.js';
import { playerStart, spawnMission, stepAttackers, enemyGroups } from './missionStarts.js';
import { spawnWingmen } from './wingmen.js';
import { inRaid, pastTarget, backHome } from './raid.js';

export { enemyGroups };
export const END_PAUSE = 5; // s from a mission's end to its results
export const CREDIT_TIME = 30; // s: an enemy lost this soon after the player's last hit is his kill
const STOPPED = 3; // m/s: a landed aircraft this slow on the ground has stopped
const MIN_FLIGHT = 10; // s: no "landed" in the first seconds of a flight

/** The default setup: an RAF pilot in a Spitfire against a Rotte of Bf 109s at 4,000 m, at 13:00 UTC. */
export const DEFAULT_SETUP = {
  side: 'RAF', aircraft: 'spitfire', type: 'dogfight', enemy: 'bf109e4', count: 2, skill: 'regular', altitude: 4000,
  date: { year: 1940, month: 8, day: 15 }, hoursUtc: 13,
  wingmen: 0, target: 'Hawkinge', bombers: 3, escorts: 2,
};

/** A new mission for a setup (see DEFAULT_SETUP); `startMission` puts it in the air. */
export function createMission(setup = DEFAULT_SETUP) {
  return { setup: { ...DEFAULT_SETUP, ...setup }, enemies: [], wingmen: [], raid: null, pending: false, outcomes: new Map(), endedAt: null, outcome: null };
}

/** Starts `mission` in `sim`: the player's aircraft in the air, his wingmen with him, and the rest of the mission. */
export function startMission(sim, mission) {
  const { setup } = mission;
  const ac = aircraftById[setup.aircraft];
  dropAll(sim);
  sim.mode = 'air';
  sim.startOverride = playerStart(setup);
  sim.skill = setup.skill;
  sim.paused = false;
  sim.reset(ac);
  mission.wingmen = spawnWingmen(sim, setup.wingmen ?? 0);
  Object.assign(mission, spawnMission(sim, setup));
  mission.outcomes = new Map();
  mission.endedAt = null;
  mission.outcome = null;
  mission.reachedTarget = null;
  mission.broughtHome = null;
  sim.scenario = `Mission: ${setup.type}`;
  return mission;
}

/** An enemy's state for the mission: 'flying', 'destroyed' (crashed, broken up, abandoned, pilot killed) or 'home'. */
export function enemyState(sim, c) {
  if (!sim.others.includes(c) || c.abandoned || c.plane.damage.pilot <= 0) return 'destroyed';
  if (c.pilot?.home || c.pilot?.straggler) return 'home';
  return 'flying';
}

/** The player's credit for an enemy lost as `state`: 'kill', 'shared', 'damaged' or 'none'. */
export function creditFor(sim, c, state) {
  const hits = c.hitsBy?.get(sim) ?? 0;
  if (state === 'destroyed') {
    if (c.lastHitBy === sim && sim.clock - c.lastHitAt <= CREDIT_TIME) return 'kill';
    return hits > 0 ? 'shared' : 'none';
  }
  return hits > 0 ? 'damaged' : 'none';
}

/** Whether the player has landed on a friendly airfield and stopped. */
function landedHome(sim) {
  const { plane } = sim;
  if (sim.crashed || sim.clock < MIN_FLIGHT || !plane.last?.onGround || plane.body.velocity.length() > STOPPED) return false;
  const { x, z } = plane.body.position;
  // The side's airfields on the map, and its home field in whatever world this is (the ground start is on its edge).
  const start = sim.world.starts(sim.ac.side).ground;
  const fields = [...AIRFIELDS.filter((a) => a.side === sim.ac.side), { x: start.x, z: start.z - (AIRFIELD.size / 2 - 60) }];
  return fields.some((a) => Math.abs(x - a.x) <= AIRFIELD.size / 2 && Math.abs(z - a.z) <= AIRFIELD.size / 2);
}

/** The player's state: 'flying', 'lost' (shot down, killed or bailed out) or 'landed'. */
export function playerState(sim) {
  if (sim.crashed || sim.plane.damage.pilot <= 0) return 'lost';
  return landedHome(sim) ? 'landed' : 'flying';
}

/** Whether the mission's own business is over: the enemy all gone, or the raid done with. */
function businessDone(sim, mission) {
  const { setup, raid } = mission;
  if (setup.type === 'dogfight') return mission.outcomes.size === mission.enemies.length;
  const intact = raid.bombers.filter((c) => inRaid(sim, c)).length;
  if (pastTarget(raid) && mission.reachedTarget === null) mission.reachedTarget = intact;
  if (setup.type === 'interception') return intact === 0 || pastTarget(raid);
  if (backHome(raid) && mission.broughtHome === null) mission.broughtHome = intact;
  return intact === 0 || backHome(raid);
}

/**
 * Watches the mission for one frame: brings in the escort mission's attackers, records each enemy's loss once (and the
 * player's credit for it), and ends the mission on its conditions. True once the results are due.
 */
export function stepMission(sim, mission) {
  stepAttackers(sim, mission);
  for (const c of mission.enemies) {
    if (mission.outcomes.has(c)) continue;
    const state = enemyState(sim, c);
    if (state !== 'flying') mission.outcomes.set(c, { state, credit: creditFor(sim, c, state), time: sim.clock });
  }
  if (mission.endedAt === null) {
    const player = playerState(sim);
    if (player !== 'flying' || businessDone(sim, mission)) {
      mission.endedAt = sim.clock;
      mission.outcome = player === 'lost' ? 'lost' : player === 'landed' ? 'landed' : 'done';
    }
  }
  return mission.endedAt !== null && sim.clock - mission.endedAt >= END_PAUSE;
}

/** Ends a mission now (the pause menu's "End mission"): the results are due at once. */
export function endMission(sim, mission) {
  stepMission(sim, mission);
  if (mission.endedAt === null) {
    mission.endedAt = sim.clock - END_PAUSE;
    mission.outcome = 'ended';
  }
}

/** The line saying how the mission's business went. */
function doneText(sim, mission, r) {
  const { setup } = mission;
  if (setup.type === 'dogfight') return 'The enemy is destroyed or gone home';
  if (setup.type === 'interception') {
    return r.bombersReachedTarget ? `${r.bombersReachedTarget} of ${r.bombers} bombers reached ${setup.target}` : `The raid was turned back before ${setup.target}`;
  }
  if (r.bombersHome !== null) return `${r.bombersHome} of ${r.bombers} bombers escorted home from ${setup.target}`;
  return 'Every bomber was lost or turned back';
}

/** The results screen's summary of a mission. */
export function missionResults(sim, mission) {
  const outcomes = [...mission.outcomes.values()];
  const count = (key, value) => outcomes.filter((o) => o[key] === value).length;
  const lost = (c) => !sim.others.includes(c) || c.abandoned || c.plane.damage.pilot <= 0;
  const byWingman = (c) => mission.wingmen.includes(c.lastHitBy) && sim.clock - c.lastHitAt <= CREDIT_TIME;
  const raid = mission.raid;
  const r = {
    outcome: mission.outcome,
    kills: count('credit', 'kill'),
    shared: count('credit', 'shared'),
    damaged: count('credit', 'damaged'),
    enemies: mission.enemies.length,
    enemiesDestroyed: count('state', 'destroyed'),
    enemiesHome: count('state', 'home'),
    hitsGiven: mission.enemies.reduce((a, c) => a + (c.hitsBy?.get(sim) ?? 0), 0),
    hitsTaken: sim.plane.damage.hits ?? 0,
    roundsFired: sim.armament.reduce((a, g) => a + g.capacity - g.rounds, 0),
    flightTime: mission.endedAt ?? sim.clock,
    wingmen: mission.wingmen.length,
    wingmenKills: mission.enemies.filter((c) => mission.outcomes.get(c)?.state === 'destroyed' && byWingman(c)).length,
    wingmenLost: mission.wingmen.filter(lost).length,
    raid: !!raid,
    bombers: raid?.bombers.length ?? 0,
    bombersDestroyed: raid ? raid.bombers.filter(lost).length : 0,
    bombersReachedTarget: mission.reachedTarget ?? 0,
    bombersHome: mission.broughtHome,
    escortsDestroyed: raid ? raid.escorts.filter(lost).length : 0,
  };
  const OUTCOME_TEXT = { landed: 'You landed safely', ended: 'Mission ended' };
  r.outcomeText = mission.outcome === 'lost' ? sim.crashCause ?? 'You were lost'
    : mission.outcome === 'done' ? doneText(sim, mission, r) : OUTCOME_TEXT[mission.outcome] ?? '';
  return r;
}
