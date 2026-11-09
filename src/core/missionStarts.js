// How each kind of mission starts (Phase 7, D225, D227): where the player is put in the air, and who else is. The
// distances are game design.
//   Dogfight (D225): the player over his home field at the chosen height, facing the enemy's side of the Channel; the
//     enemy 4 km ahead and 300 m higher, coming the other way, in its side's formations.
//   Interception (RAF, D227): the raid (src/core/raid.js) over mid-Channel at the chosen height (D228); the player
//     INTERCEPT_SIDE m to the English side of the middle of its course to the target, at its height, heading for a
//     point INTERCEPT_LEAD m short of that middle, to cut it off.
//   Escort (Luftwaffe, D227): the player in the escort's place, a mile behind and above the bombers (S38); the RAF
//     attackers appear once the raid is ATTACK_AT of its course to its target, ATTACK_AHEAD m ahead of it and 300 m above.
// The player's wingmen (src/core/wingmen.js) start in their places on him in every kind.

import { Vector3 } from 'three';
import { aircraftById } from '../aircraft/index.js';
import { common } from '../aircraft/common.js';
import { homeDirection } from '../ai/tactics.js';
import { spawnGroup, otherSide } from './scenarios.js';
import { raidCourse, spawnRaid } from './raid.js';
import { FRIENDLY_SKILL } from './wingmen.js';

const AHEAD = 4000; // m: the dogfight's enemy starts this far ahead of the player...
const ABOVE = 300; // m: ...this much higher...
const GROUP_SPACING = 800; // m: ...and a second group this far to the side of the first
const ENEMY_SPEED = 110; // m/s: a fighter's starting speed
const INTERCEPT_SIDE = 8000; // m: the interceptor starts this far to the side of the middle of the raid's route...
const INTERCEPT_LEAD = 3000; // m: ...heading for a point this far short of that middle
const ATTACK_AT = 1 / 3; // share of the way to its target at which the escorted raid meets its attackers...
const ATTACK_AHEAD = 6000; // m: ...which appear this far ahead of the raid

const headingOf = (v) => Math.atan2(v.x, -v.z);

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

/** Spawns `count` fighters of `id` for `side` in groups abreast around `origin`, on `heading`. Returns the craft. */
export function spawnFighters(sim, { id, count, side, origin, heading }) {
  const groups = enemyGroups(side, Math.max(1, count));
  const right = new Vector3(Math.cos(heading), 0, Math.sin(heading));
  const out = [];
  groups.forEach((g, i) => {
    const at = origin.clone().addScaledVector(right, (i - (groups.length - 1) / 2) * GROUP_SPACING);
    out.push(...spawnGroup(sim, { id, formation: g.formation, count: g.count, origin: at, heading, role: 'fighter', side, speed: ENEMY_SPEED }));
  });
  return out;
}

/** The player's air start for a setup: { altitude, heading, x?, z? } (the side's home field unless x and z are given). */
export function playerStart(setup) {
  const side = aircraftById[setup.aircraft].side;
  if (setup.type === 'interception') {
    const c = raidCourse(setup.target, setup.altitude);
    const middle = c.origin.clone().addScaledVector(c.dir, c.length / 2);
    const across = new Vector3(-c.dir.z, 0, c.dir.x);
    if (across.dot(homeDirection('RAF')) < 0) across.negate(); // to the English side of the route
    const start = middle.clone().addScaledVector(across, INTERCEPT_SIDE);
    const aim = middle.clone().addScaledVector(c.dir, -INTERCEPT_LEAD).sub(start);
    return { altitude: setup.altitude, heading: headingOf(aim), x: start.x, z: start.z };
  }
  if (setup.type === 'escort') {
    const c = raidCourse(setup.target, setup.altitude);
    const start = c.origin.clone().addScaledVector(c.dir, -common.formations.escort.behind);
    return { altitude: setup.altitude + common.formations.escort.above, heading: c.heading, x: start.x, z: start.z };
  }
  return { altitude: setup.altitude, heading: headingOf(homeDirection(otherSide(side)).setY(0)) };
}

/** Puts a mission's other aircraft in the air, after the player's: returns { enemies, raid, pending }. */
export function spawnMission(sim, setup) {
  const side = sim.ac.side;
  if (setup.type === 'interception') {
    const raid = spawnRaid(sim, { target: setup.target, bombers: setup.bombers, escorts: setup.escorts, altitude: setup.altitude });
    return { enemies: [...raid.bombers, ...raid.escorts], raid, pending: false };
  }
  if (setup.type === 'escort') {
    const raid = spawnRaid(sim, { target: setup.target, bombers: setup.bombers, escorts: 0, altitude: setup.altitude, skill: FRIENDLY_SKILL });
    return { enemies: [], raid, pending: true };
  }
  const fwd = sim.plane.body.velocity.clone().setY(0).normalize();
  const origin = sim.plane.body.position.clone().addScaledVector(fwd, AHEAD).add(new Vector3(0, ABOVE, 0));
  const enemies = spawnFighters(sim, { id: setup.enemy, count: setup.count, side: otherSide(side), origin, heading: headingOf(fwd) + Math.PI });
  return { enemies, raid: null, pending: false };
}

/**
 * The escort mission's attackers, once the raid is ATTACK_AT of its course to its target: true when they have just
 * appeared (they join `mission.enemies`).
 */
export function stepAttackers(sim, mission) {
  const { raid, setup } = mission;
  if (!mission.pending || !raid) return false;
  const leader = raid.bombers.find((c) => sim.others.includes(c)) ?? null;
  if (!leader) {
    mission.pending = false;
    return false;
  }
  const flown = leader.plane.body.position.clone().sub(raid.course.origin).setY(0).dot(raid.course.dir);
  if (flown < ATTACK_AT * raid.course.length) return false;
  const origin = leader.plane.body.position.clone().addScaledVector(raid.course.dir, ATTACK_AHEAD).add(new Vector3(0, ABOVE, 0));
  const attackers = spawnFighters(sim, { id: setup.enemy, count: setup.count, side: 'RAF', origin, heading: raid.course.heading + Math.PI });
  mission.enemies.push(...attackers);
  mission.pending = false;
  return true;
}
