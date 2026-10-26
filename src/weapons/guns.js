// An aircraft's fixed guns (Phase 5, D67): each fires at its documented rate while its trigger is held, counts its rounds
// down, feeds them from its belt, and releases each round at the muzzle with the aircraft's own velocity added. Firing
// pushes back on the aircraft (recoil) for the flight model. Free of rendering, so the multiplayer server can run it.
//
// Harmonisation: each gun's bore is aimed so its rounds cross the sight line (the pilot's eye looking along the body
// axis, as the reflector sight does) at the aircraft's harmonisation range in level flight, allowing for their drop.
// Triggers: input.fireMg fires the machine guns (on the RAF fighters, all eight), input.fireCannon the cannon.

import { Vector3 } from 'three';
import { ballistics, weapons, belts } from '../aircraft/ammunition.js';
import { flightTable } from './ballistics.js';

/** The gun's firing group: 'cannon' for the 20 mm guns, 'mg' for the machine guns. */
export const groupOf = (spec) => (spec.type === 'mgffm' ? 'cannon' : 'mg');

/** The unit bore direction (body axes) of a gun, harmonised on the sight line at the aircraft's harmonisation range. */
export function aimLine(ac, spec) {
  const b = ballistics[weapons[spec.type].ballistics];
  const range = ac.harmonisation;
  const [{ drop }] = flightTable(b, [range]);
  const target = new Vector3(ac.eye.x + range, ac.eye.y + drop, 0);
  return target.sub(new Vector3(spec.x, spec.y, spec.z)).normalize();
}

/** A fresh armament: every gun loaded, aimed and ready. */
export function createArmament(ac) {
  return Object.entries(ac.guns ?? {}).map(([id, spec]) => {
    const weapon = weapons[spec.type];
    return {
      id, spec, group: groupOf(spec), ballistics: weapon.ballistics,
      rate: spec.synchronised ? weapon.syncRate : weapon.rate,
      rounds: spec.rounds, capacity: spec.rounds, owed: 0, belt: 0, firing: false, lastShot: -Infinity,
      position: new Vector3(spec.x, spec.y, spec.z), bore: aimLine(ac, spec),
    };
  });
}

/** The kind of the next round a gun fires: its own (RAF guns) or the next on its belt. */
function nextRound(gun) {
  if (gun.spec.round) return gun.spec.round;
  const belt = belts[gun.spec.type];
  const kind = belt[gun.belt % belt.length];
  gun.belt += 1;
  return kind;
}

const _r = new Vector3();
const _v = new Vector3();

/**
 * Fires the guns whose triggers are held for dt seconds at time `now`, calling emit({ position, velocity, ballistics,
 * kind }) for each round released (world axes). Returns the recoil { force, moment } in body axes (zero when silent).
 */
export function stepGuns(armament, plane, input, dt, now, emit) {
  const { body } = plane;
  const force = new Vector3();
  const moment = new Vector3();
  for (const gun of armament) {
    const held = gun.group === 'cannon' ? !!input.fireCannon : !!input.fireMg;
    const firing = held && gun.rounds > 0;
    if (firing && !gun.firing) gun.owed = 1; // the first round leaves as the trigger is pressed
    gun.firing = firing;
    if (!firing) continue;
    gun.owed += gun.rate * dt;
    const b = ballistics[gun.ballistics];
    while (gun.owed >= 1 && gun.rounds > 0) {
      gun.owed -= 1;
      gun.rounds -= 1;
      gun.lastShot = now;
      // Muzzle in world axes; the round's velocity is the aircraft's at the muzzle plus the muzzle velocity.
      _r.copy(gun.position).applyQuaternion(body.quaternion);
      _v.copy(body.angularVelocity).applyQuaternion(body.quaternion).cross(_r).add(body.velocity);
      const velocity = gun.bore.clone().applyQuaternion(body.quaternion).multiplyScalar(b.muzzleVelocity).add(_v);
      emit({ position: _r.clone().add(body.position), velocity, ballistics: gun.ballistics, kind: nextRound(gun) });
    }
    // Recoil: the momentum of the rounds leaving, averaged over the firing, along the bore and at the gun.
    const push = gun.bore.clone().multiplyScalar(-gun.rate * b.mass * b.muzzleVelocity);
    force.add(push);
    moment.add(gun.position.clone().cross(push));
  }
  return { force, moment };
}

/** Rounds left and loaded for each ammunition-counter column (the Bf 109's: D64, D65), summed over its guns. */
export function counters(armament) {
  const out = {};
  for (const gun of armament) {
    if (!gun.spec.counter) continue;
    const c = (out[gun.spec.counter] ??= { rounds: 0, capacity: 0 });
    c.rounds += gun.rounds;
    c.capacity += gun.capacity;
  }
  return out;
}

/** Rounds left in each firing group: { mg: { rounds, capacity }, cannon: { ... } } (groups the aircraft has). */
export function groupRounds(armament) {
  const out = {};
  for (const gun of armament) {
    const c = (out[gun.group] ??= { rounds: 0, capacity: 0 });
    c.rounds += gun.rounds;
    c.capacity += gun.capacity;
  }
  return out;
}
