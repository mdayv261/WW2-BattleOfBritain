// Combat in the test flight (Phase 5, D68): the target aircraft (key Y), rounds hitting it or the player, and the test
// key (9) that puts a 20 mm hit into the player's own aircraft. Kept apart from simulation.js, which calls these.

import { aircraftList } from '../aircraft/index.js';
import { TargetAircraft } from './target.js';
import { zonesFor } from '../weapons/hitZones.js';
import { applyHit, hurt } from '../weapons/damage.js';
import { roundTypes } from '../aircraft/ammunition.js';
import { noteHit, noteCrash, fall } from './losses.js';
import { doomed, badlyDamaged, startBailout, decisionDelay, BREAK_UP_EXIT } from './bailout.js';

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

/** The aircraft rounds can hit this step: the player (until the flight ends) and every AI aircraft (D79). */
export function hittable(sim) {
  const list = sim.crashed ? [] : [{ who: sim, plane: sim.plane, random: sim.random }];
  for (const c of sim.others) list.push({ who: c, plane: c.plane, random: c.random });
  return list;
}

/** Applies a hit to whichever aircraft was struck, and tells the pilot what it did. */
export function resolveHit(sim, struck, hit) {
  const text = applyHit(struck.plane, hit, struck.random);
  noteHit(sim, struck.plane, hit);
  const time = sim.plane.time;
  if (struck.who === sim) sim.notice = { text: `Hit: ${text}`, until: time + 2 };
  else {
    struck.who.lastHit = { text, time };
    if (struck.who.role === 'target') sim.lastTargetHit = { text, time };
  }
}

/**
 * Where the target (or another aircraft) is seen from the player's nose: angles (rad) right of and above the nose, so the
 * pilot can steer onto it. Body axes: x forward, y up, z right.
 */
export function targetBearing(sim, craft = sim.target) {
  const body = sim.plane.body;
  const rel = craft.plane.body.position.clone().sub(body.position).applyQuaternion(body.quaternion.clone().invert());
  return { right: Math.atan2(rel.z, rel.x), up: Math.atan2(rel.y, Math.hypot(rel.x, rel.z)) };
}

/**
 * Steps every AI aircraft and follows its fate (D69, D79): with its pilot killed it flies on uncontrolled; broken up, it
 * becomes a falling wreck and debris; on the ground it is gone, leaving a crash site. Each is reported to the pilot (the
 * target in the words of D68-D69).
 */
export function stepOthers(sim, dt) {
  for (const c of sim.others) c.step(dt, sim);
  // Crews abandon aircraft that are lost or badly damaged (D80): the pilot's hands come off the controls as they go.
  // With the pilot killed, the rest of a crew abandon the aircraft; a single-seater's pilot is beyond deciding.
  for (const c of sim.others) {
    const d = c.plane.damage;
    if (c.bailout || (d.failed && !d.failed.pilotKilled)) continue;
    const pilotDead = d.pilot <= 0;
    if (pilotDead ? c.ac.crew.length < 2 : !(doomed(c.plane) || badlyDamaged(c.plane))) continue;
    c.bailout = startBailout(sim, {
      ac: c.ac, side: c.side, label: c.label, body: () => (c.gone ? null : c.plane.body), delay: decisionDelay(c), pilotAlive: !pilotDead, plane: c.plane,
    });
    c.abandoned = true;
  }
  const say = (text) => { sim.notice = { text, until: sim.plane.time + 5 }; };
  const name = (c) => (c.role === 'target' ? 'Target' : c.label);
  sim.others = sim.others.filter((c) => {
    const { failed } = c.plane.damage;
    const crash = c.plane.ground.crash;
    if (crash) {
      c.gone = true; // anyone still aboard is lost
      noteCrash(sim, c.plane.body.position, crash.speed);
      say(`${name(c)} crashed`);
      return false;
    }
    if (failed && !failed.pilotKilled) {
      const wreck = fall(sim, c.plane);
      // The crew get out of the falling wreck if they can, in half their usual time.
      const fromWreck = () => (wreck.landed ? null : wreck.body);
      if (c.bailout) c.bailout.body = fromWreck;
      else if (c.plane.damage.pilot > 0) {
        c.bailout = startBailout(sim, { ac: c.ac, side: c.side, label: c.label, body: fromWreck, delay: decisionDelay(c), scale: BREAK_UP_EXIT, plane: c.plane });
      }
      say(`${name(c)} destroyed: ${failed.cause}`);
      return false;
    }
    if (failed?.pilotKilled && !c.pilotReported) {
      c.pilotReported = true;
      say(`${name(c)}'s pilot killed`);
    }
    return true;
  });
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
