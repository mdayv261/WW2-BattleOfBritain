// What happens when an aircraft is lost (Phase 5 checkpoint 5, D69), for the player and the target alike:
//   broken up (a wing, the tail, a fire, overstress): the airframe becomes a falling wreck and each lost part a piece
//     of debris (src/core/wreck.js), listed in sim.falling until they reach the ground;
//   pilot killed: the aircraft is whole, so it flies on, on its own flight model, with the controls frozen, until it
//     hits the ground;
//   either way, reaching the ground marks a crash site (sim.crashSites) for the fire and smoke.
// Also keeps this step's hits (sim.hitEvents) for the hit flashes. Rendering reads these lists; nothing here draws.

import { stepAircraft } from '../physics/flightModel.js';
import { breakUp } from './wreck.js';

const MAX_EVENTS = 200; // hits and crash sites kept while nothing reads them (the tests)

/** Empties the loss lists, for a new flight. */
export function clearLosses(sim) {
  sim.falling = []; // [{ ac, plane, wreck, lost (parts) } for an airframe, or { ac, wreck, part, centre } for debris]
  sim.crashSites = []; // [{ position, speed, time }]
  sim.hitEvents = []; // [{ point (world), kind, velocity (the aircraft's) }]
  sim.wreck = null; // the player's own wreck, once broken up
  sim.uncontrolled = null; // the player's frozen controls, once the pilot is killed or has bailed out
}

const keep = (list, item) => {
  list.push(item);
  if (list.length > MAX_EVENTS) list.shift();
};

/** Notes a hit at a point on a struck aircraft (`point` in its body axes) for the flashes. */
export function noteHit(sim, plane, hit) {
  const { body } = plane;
  const point = hit.point.clone().applyQuaternion(body.quaternion).add(body.position);
  keep(sim.hitEvents, { point, kind: hit.kind, velocity: body.velocity.clone() });
}

/** Notes where an aircraft reached the ground, and how fast. */
export function noteCrash(sim, position, speed) {
  keep(sim.crashSites, { position: position.clone(), speed, time: sim.plane.time });
}

/** Breaks an aircraft up: its wreck and debris start falling. Returns the wreck. */
export function fall(sim, plane) {
  const { wreck, debris } = breakUp(plane);
  sim.falling.push({ ac: plane.ac, plane, wreck, lost: plane.damage.failed.parts ?? [] });
  for (const d of debris) sim.falling.push({ ac: plane.ac, ...d });
  return wreck;
}

/** Advances the falling wrecks and debris; an airframe that lands marks a crash site; landed pieces are dropped. */
export function stepFalling(sim, dt) {
  const terrain = sim.world.terrain;
  for (const f of sim.falling) {
    const speed = f.wreck.body.velocity.length();
    f.wreck.step(dt, terrain);
    if (f.wreck.landed && f.lost) noteCrash(sim, f.wreck.landed, speed);
  }
  sim.falling = sim.falling.filter((f) => !f.wreck.landed);
}

/** The player's aircraft is lost (a crash on the ground, a break-up or the pilot killed): the flight ends. */
export function losePlayer(sim) {
  const { ground, damage } = sim.plane;
  sim.crashed = true;
  sim.crashCause = (ground.crash ?? damage.failed).cause;
  if (ground.crash) noteCrash(sim, sim.plane.body.position, ground.crash.speed);
  else if (damage.failed.pilotKilled) sim.uncontrolled = { ...sim.input, fireMg: false, fireCannon: false };
  else sim.wreck = fall(sim, sim.plane);
}

/** After the player's loss: the wreck falls, or the uncontrolled aircraft flies on, until the ground. */
export function stepPlayerLoss(sim, dt) {
  const { plane } = sim;
  if (sim.wreck) {
    // The player's model follows its wreck (the wreck itself is stepped in sim.falling).
    sim.previous.position.copy(sim.wreck.previous.position);
    sim.previous.quaternion.copy(sim.wreck.previous.quaternion);
    plane.body.position.copy(sim.wreck.body.position);
    plane.body.quaternion.copy(sim.wreck.body.quaternion);
    plane.body.velocity.copy(sim.wreck.body.velocity);
  } else if (sim.uncontrolled && !plane.ground.crash) {
    sim.copyPose(sim.previous);
    stepAircraft(plane, sim.uncontrolled, dt);
    if (plane.ground.crash) noteCrash(sim, plane.body.position, plane.ground.crash.speed);
    // An abandoned aircraft can still break up (its fire burns on): it falls as a wreck from then on.
    else if (plane.damage.failed && !plane.damage.failed.pilotKilled) {
      sim.wreck = fall(sim, plane);
      sim.uncontrolled = null;
    }
  }
}
