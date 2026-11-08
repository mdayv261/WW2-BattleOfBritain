// Missions (Phase 7 checkpoint 1, D225): a mission is built from the setup screen's choices, flown, watched for its end,
// and summed up for the results screen. Checkpoint 1 has the dogfight: the player in the air at the chosen height over
// his side's home airfield, facing the enemy's side of the Channel, and the chosen enemy fighters ahead of him coming the
// other way, in their side's formations (src/ai/formation.js). Checkpoint 2 adds the bomber missions.
//
// A mission ends when every enemy is lost (destroyed, abandoned or gone home), when the player is lost (shot down,
// killed or bailed out), or when he has landed on a friendly airfield and stopped; the results follow END_PAUSE later.
//
// Kill credit (D225, game design): an enemy destroyed within CREDIT_TIME of the player's last hit on it is his kill;
// one he hit that someone else (or the ground) finished is shared; one that goes home with his hits in it is damaged.
// The player's Bf 110 rear gunner's rounds count as the player's (src/core/simulation.js).

import { Vector3 } from 'three';
import { aircraftById } from '../aircraft/index.js';
import { AIRFIELDS } from '../world/airfields.js';
import { AIRFIELD } from '../world/airfield.js';
import { homeDirection } from '../ai/tactics.js';
import { spawnGroup, dropAll, otherSide } from './scenarios.js';

const AHEAD = 4000; // m: the enemy starts this far ahead of the player...
const ABOVE = 300; // m: ...this much higher...
const GROUP_SPACING = 800; // m: ...and a second group this far to the side of the first
const ENEMY_SPEED = 110; // m/s: the enemy's starting speed
export const END_PAUSE = 5; // s from a mission's end to its results
export const CREDIT_TIME = 30; // s: an enemy lost this soon after the player's last hit is his kill
const STOPPED = 3; // m/s: a landed aircraft this slow on the ground has stopped
const MIN_FLIGHT = 10; // s: no "landed" in the first seconds of a flight

/** The default setup: an RAF pilot in a Spitfire against a Rotte of Bf 109s at 4,000 m, at 2 pm BST. */
export const DEFAULT_SETUP = {
  side: 'RAF', aircraft: 'spitfire', type: 'dogfight', enemy: 'bf109e4', count: 2, skill: 'regular', altitude: 4000,
  date: { year: 1940, month: 8, day: 15 }, hoursUtc: 13,
};

/**
 * The groups the enemy flies in for `count` aircraft of `side`: the Luftwaffe in Schwarms of four, then a Rotte, then
 * a single; the RAF in vics of three, the last vic as large as the number left. [{ formation, count }]
 */
export function enemyGroups(side, count) {
  const out = [];
  let left = count;
  const size = side === 'Luftwaffe' ? 4 : 3;
  while (left > 0) {
    const n = Math.min(size, left);
    const formation = side === 'Luftwaffe' ? { 4: 'schwarm', 3: 'schwarm', 2: 'rotte', 1: 'single' }[n] : n === 1 ? 'single' : 'vic';
    out.push({ formation, count: n });
    left -= n;
  }
  return out;
}

/** A new mission for a setup (see DEFAULT_SETUP); `startMission` puts it in the air. */
export function createMission(setup = DEFAULT_SETUP) {
  return { setup: { ...DEFAULT_SETUP, ...setup }, enemies: [], outcomes: new Map(), endedAt: null, outcome: null };
}

/** Starts `mission` in `sim`: the player's aircraft in the air at the chosen height, and the enemy ahead. */
export function startMission(sim, mission) {
  const { setup } = mission;
  const ac = aircraftById[setup.aircraft];
  const enemySide = otherSide(ac.side);
  const toEnemy = homeDirection(enemySide).setY(0).normalize(); // towards the enemy's side of the Channel
  const heading = Math.atan2(toEnemy.x, -toEnemy.z);
  dropAll(sim);
  sim.mode = 'air';
  sim.startOverride = { altitude: setup.altitude, heading };
  sim.skill = setup.skill;
  sim.paused = false;
  sim.reset(ac);
  const fwd = new Vector3(Math.sin(heading), 0, -Math.cos(heading));
  const right = new Vector3(Math.cos(heading), 0, Math.sin(heading));
  const groups = enemyGroups(enemySide, Math.max(1, setup.count));
  groups.forEach((g, i) => {
    const side = (i - (groups.length - 1) / 2) * GROUP_SPACING;
    const origin = sim.plane.body.position.clone().addScaledVector(fwd, AHEAD).addScaledVector(right, side).add(new Vector3(0, ABOVE, 0));
    spawnGroup(sim, { id: setup.enemy, formation: g.formation, count: g.count, origin, heading: heading + Math.PI, role: 'fighter', side: enemySide, speed: ENEMY_SPEED });
  });
  mission.enemies = sim.others.slice();
  mission.outcomes = new Map();
  mission.endedAt = null;
  mission.outcome = null;
  sim.scenario = `Mission: dogfight against ${mission.enemies.length} ${aircraftById[setup.enemy].name}`;
  return mission;
}

/** An enemy's state for the mission: 'flying', 'destroyed' (crashed, broken up, abandoned, pilot killed) or 'home'. */
export function enemyState(sim, c) {
  if (!sim.others.includes(c) || c.abandoned || c.plane.damage.pilot <= 0) return 'destroyed';
  if (c.pilot?.home) return 'home';
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

/**
 * Watches the mission for one frame: records each enemy's loss once (and the player's credit for it), and ends the
 * mission when the enemy is all gone, the player is lost, or he has landed. True once the results are due.
 */
export function stepMission(sim, mission) {
  for (const c of mission.enemies) {
    if (mission.outcomes.has(c)) continue;
    const state = enemyState(sim, c);
    if (state !== 'flying') mission.outcomes.set(c, { state, credit: creditFor(sim, c, state), time: sim.clock });
  }
  if (mission.endedAt === null) {
    const player = playerState(sim);
    const allGone = mission.outcomes.size === mission.enemies.length;
    if (player !== 'flying' || allGone) {
      mission.endedAt = sim.clock;
      mission.outcome = player === 'lost' ? 'lost' : player === 'landed' ? 'landed' : 'enemyGone';
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

const OUTCOME_TEXT = {
  enemyGone: 'The enemy is destroyed or gone home',
  landed: 'You landed safely',
  ended: 'Mission ended',
};

/** The results screen's summary of a mission. */
export function missionResults(sim, mission) {
  const outcomes = [...mission.outcomes.values()];
  const count = (key, value) => outcomes.filter((o) => o[key] === value).length;
  const hitsGiven = mission.enemies.reduce((a, c) => a + (c.hitsBy?.get(sim) ?? 0), 0);
  const roundsFired = sim.armament.reduce((a, g) => a + g.capacity - g.rounds, 0);
  return {
    outcome: mission.outcome,
    outcomeText: mission.outcome === 'lost' ? sim.crashCause ?? 'You were lost' : OUTCOME_TEXT[mission.outcome] ?? '',
    kills: count('credit', 'kill'),
    shared: count('credit', 'shared'),
    damaged: count('credit', 'damaged'),
    enemies: mission.enemies.length,
    enemiesDestroyed: count('state', 'destroyed'),
    enemiesHome: count('state', 'home'),
    hitsGiven,
    hitsTaken: sim.plane.damage.hits ?? 0,
    roundsFired,
    flightTime: mission.endedAt ?? sim.clock,
  };
}
