// Combat in the test flight (Phase 5, D68): the target aircraft (key Y), rounds hitting it or the player, and the test
// key (9) that puts a 20 mm hit into the player's own aircraft. Kept apart from simulation.js, which calls these.

import { aircraftList } from '../aircraft/index.js';
import { TargetAircraft } from './target.js';
import { zonesFor } from '../weapons/hitZones.js';
import { applyHit, hurt } from '../weapons/damage.js';
import { roundTypes } from '../aircraft/ammunition.js';
import { noteHit, noteCrash, fall } from './losses.js';

/** Y: the next target type ahead of the player (the five in turn, then none). Returns the notice text. */
export function nextTarget(sim) {
  sim.targetIndex = ((sim.targetIndex ?? -1) + 1) % (aircraftList.length + 1);
  if (sim.targetIndex === aircraftList.length) {
    sim.target = null;
    return 'Target removed';
  }
  sim.targetSeed = (sim.targetSeed ?? 0) + 1;
  const ac = aircraftList[sim.targetIndex];
  sim.target = new TargetAircraft(ac, sim.plane, sim.world, sim.targetSeed);
  return `Target: ${ac.name}, ${Math.round(sim.target.plane.body.position.distanceTo(sim.plane.body.position))} m ahead`;
}

/** The aircraft rounds can hit this step: the player (until the flight ends) and any target. */
export function hittable(sim) {
  const list = sim.crashed ? [] : [{ who: sim, plane: sim.plane, random: sim.random }];
  if (sim.target) list.push({ who: sim.target, plane: sim.target.plane, random: sim.target.random });
  return list;
}

/** Applies a hit to whichever aircraft was struck, and tells the pilot what it did. */
export function resolveHit(sim, struck, hit) {
  const text = applyHit(struck.plane, hit, struck.random);
  noteHit(sim, struck.plane, hit);
  const time = sim.plane.time;
  if (struck.who === sim) sim.notice = { text: `Hit: ${text}`, until: time + 2 };
  else sim.lastTargetHit = { text, time };
}

/**
 * Where the target is seen from the player's nose: angles (rad) right of and above the nose (the body x axis), so the
 * pilot can steer onto it. Body axes: x forward, y up, z right.
 */
export function targetBearing(sim) {
  const body = sim.plane.body;
  const rel = sim.target.plane.body.position.clone().sub(body.position).applyQuaternion(body.quaternion.clone().invert());
  return { right: Math.atan2(rel.z, rel.x), up: Math.atan2(rel.y, Math.hypot(rel.x, rel.z)) };
}

/**
 * Steps the target and follows its fate (D69): with its pilot killed it flies on uncontrolled; broken up, it becomes a
 * falling wreck and debris; on the ground it is gone, leaving a crash site. Each is reported to the pilot.
 */
export function stepTarget(sim, dt) {
  const t = sim.target;
  if (!t) return;
  t.step(dt);
  const say = (text) => { sim.notice = { text, until: sim.plane.time + 5 }; };
  const { failed } = t.plane.damage;
  const crash = t.plane.ground.crash;
  if (crash) {
    noteCrash(sim, t.plane.body.position, crash.speed);
    say('Target crashed');
    sim.target = null;
  } else if (failed && !failed.pilotKilled) {
    fall(sim, t.plane);
    say(`Target destroyed: ${failed.cause}`);
    sim.target = null;
  } else if (failed?.pilotKilled && !t.pilotReported) {
    t.pilotReported = true;
    say("Target's pilot killed");
  }
}

// The test hits of key 9, in turn: [zone kind, component].
const TEST_HITS = [['engine', 'coolant'], ['engine', 'engine'], ['engine', 'oil'], ['wingOuter', 'wing'], ['tail', 'elevator'],
  ['fuselage', 'cables'], ['cockpit', 'pilot']];

/** 9: a 20 mm HE hit on the next component of the player's own aircraft in turn. Returns the notice text. */
export function testHit(sim) {
  sim.testHitIndex = ((sim.testHitIndex ?? -1) + 1) % TEST_HITS.length;
  const [kind, component] = TEST_HITS[sim.testHitIndex];
  const zone = zonesFor(sim.ac).zones.find((z) => z.kind === kind);
  if (!zone) return `Test hit: no ${kind} zone on the ${sim.ac.name}`;
  const round = roundTypes.heTracer20;
  // As if from dead ahead, so the pilot's rear armour does not stop it.
  const text = hurt(sim.plane, zone, component, round, round.strength, { x: -1, y: 0, z: 0 }, 0, sim.random);
  sim.plane.damage.hits += 1;
  return `Test hit (20 mm): ${text}`;
}
