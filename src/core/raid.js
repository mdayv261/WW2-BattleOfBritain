// Raids (Phase 7 checkpoint 2, D227): an He 111 formation from the Luftwaffe's home field near Calais to a target among
// the Kent coastal airfields and back, for the interception and escort missions. The bombers fly their route with the
// Phase 6 bomber pilots (src/ai/bomber.js): the route's first waypoint is the target, the second the home field, and
// past it they hold their heading inland. No bombs are modelled: a raid "reaches the target" when its leader passes the
// target waypoint. A Kette is three bombers; six are two Ketten as one formation, the second behind and below
// (FORMATIONS.ketten, estimates). The raid's own Bf 109 escort is placed as Dowding describes it (S38): a mile behind
// and above the bombers (common.formations.escort).

import { Vector3 } from 'three';
import { aircraftById } from '../aircraft/index.js';
import { common } from '../aircraft/common.js';
import { airfieldNamed, HOME } from '../world/airfields.js';
import { formationSpeed } from '../ai/basic.js';
import { createBomberGroup } from '../ai/bomber.js';
import { spawnGroup } from './scenarios.js';

/** The targets offered: the Kent coastal fields, a few minutes' flight from Calais. */
export const TARGETS = ['Hawkinge', 'Lympne', 'Manston'];
/** Where the raids come from: the Luftwaffe's home field (src/world/airfields.js). */
export const RAID_FIELD = HOME.Luftwaffe;

/** The raid's route to `target` and home: [{ x, z }] (world m). */
export function raidRoute(target) {
  const to = airfieldNamed(target);
  const home = airfieldNamed(RAID_FIELD);
  return [{ x: to.x, z: to.z }, { x: home.x, z: home.z }];
}

/** The raid's course from its field to `target`: { origin (Vector3, at `altitude`), heading (rad), dir (unit), length (m) }. */
export function raidCourse(target, altitude) {
  const from = airfieldNamed(RAID_FIELD);
  const to = airfieldNamed(target);
  const dir = new Vector3(to.x - from.x, 0, to.z - from.z);
  const length = dir.length();
  dir.normalize();
  return { origin: new Vector3(from.x, altitude, from.z), heading: Math.atan2(dir.x, -dir.z), dir, length };
}

/**
 * Puts a raid in the air over its field at `altitude`: `bombers` He 111s (3 or 6) on the route to `target`, and `escorts`
 * Bf 109s (0, 2 or 4) in the escort's place, their pilots of `skill`. Returns { group, bombers, escorts, course }.
 */
export function spawnRaid(sim, { target, bombers = 3, escorts = 0, altitude, skill = sim.skill }) {
  const course = raidCourse(target, altitude);
  const speed = formationSpeed(aircraftById.he111h, altitude);
  const group = createBomberGroup(bombers > 3 ? 'ketten' : 'kette', raidRoute(target));
  const formation = spawnGroup(sim, {
    id: 'he111h', formation: group.formation, count: bombers, origin: course.origin, heading: course.heading, role: 'bomber',
    side: 'Luftwaffe', speed, group, skill,
  });
  const escort = escorts > 0 ? spawnGroup(sim, {
    id: 'bf109e4', formation: escorts >= 4 ? 'schwarm' : 'rotte', count: escorts, origin: course.origin, heading: course.heading,
    role: 'escort', side: 'Luftwaffe', speed, leader: formation[0], group, skill,
    offset: { back: common.formations.escort.behind, up: common.formations.escort.above },
  }) : [];
  return { group, bombers: formation, escorts: escort, course };
}

/** Whether a bomber is still in the raid: flying, flown, and not straggling home. */
export const inRaid = (sim, c) => sim.others.includes(c) && !c.abandoned && c.plane.damage.pilot > 0 && !c.pilot.straggler;

/** Whether the raid's leader has passed its target (the group's route leg beyond the first waypoint). */
export const pastTarget = (raid) => raid.group.leg >= 1;
/** Whether the raid's leader is back over its home field. */
export const backHome = (raid) => raid.group.leg >= 2;
