// Flexible guns (Phase 6, D83): the air gunners' MG 15s on the Bf 110 and He 111, and the He 111's fixed rearward
// MG 17 (a mount whose arc is a single direction). Each gun points where its gunner swings it (src/ai/gunner.js), no
// faster than common.gunners.traverseRate and never outside its arc (the aircraft data's `mounts`, D78), and fires at
// its rate while he holds the trigger, from 75-round drums: an empty drum is changed in common.gunners.drumChange s
// (longer for a less skilled gunner) while spares last. Rounds leave the muzzle along the gun with the aircraft's own
// velocity added, into the shared pool, like the fixed guns' (src/weapons/guns.js). The recoil of one hand-held gun is
// left out of the flight model (small beside the fixed guns' and absorbed by the mount). Free of rendering.
//
// Angles in body axes (x forward, y up, z right): azimuth from the nose, + to the right, 180° dead astern; elevation
// + up. An arc's azimuth range may run through dead astern (150° to 210°) or all the way round (the dorsal gun).

import { Vector3 } from 'three';
import { weapons, belts, ballistics } from '../aircraft/ammunition.js';
import { common } from '../aircraft/common.js';

const TWO_PI = 2 * Math.PI;

/** An angle brought into [0, 2π). */
const turn = (a) => ((a % TWO_PI) + TWO_PI) % TWO_PI;

/** The azimuth span of an arc (rad), 0 for a fixed gun and 2π all the way round. */
const span = (spec) => spec.azimuth[1] - spec.azimuth[0];

/** The unit direction (body axes) of azimuth `az` and elevation `el`. */
export function direction(az, el, out = new Vector3()) {
  return out.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
}

/** The azimuth and elevation (rad) of a direction in body axes. */
export function anglesOf(dir) {
  const len = dir.length() || 1;
  return { az: Math.atan2(dir.z, dir.x), el: Math.asin(Math.max(-1, Math.min(1, dir.y / len))) };
}

/** The lowest elevation (rad) the gun can take at azimuth `az`: the dorsal gun clears the cabin only high up forward. */
function lowest(spec, az) {
  const forward = Math.cos(az) > 0;
  return forward && spec.forwardMinElevation !== undefined ? Math.max(spec.elevation[0], spec.forwardMinElevation) : spec.elevation[0];
}

/** Whether a direction (azimuth and elevation, rad) lies inside a gun's arc. */
export function inArc(spec, az, el) {
  const s = span(spec);
  const into = s >= TWO_PI - 1e-9 ? 0 : turn(az - spec.azimuth[0]);
  const tolerance = 1e-6;
  if (into > s + tolerance && TWO_PI - into > tolerance) return false;
  return el >= lowest(spec, az) - tolerance && el <= spec.elevation[1] + tolerance;
}

/** A fresh set of flexible guns for an aircraft type: each loaded, its spare drums stowed, pointing mid-arc. */
export function createMounts(ac) {
  return Object.entries(ac.mounts ?? {}).map(([id, spec]) => {
    const weapon = weapons[spec.type];
    const capacity = spec.fixed ? spec.rounds : weapon.drum;
    const m = {
      id, spec, group: 'mg', ballistics: weapon.ballistics, rate: weapon.rate,
      rounds: capacity, capacity, drums: spec.fixed ? 0 : spec.drums - 1, changingUntil: null,
      owed: 0, belt: 0, firing: false, lastShot: -Infinity,
      az: spec.azimuth[0] + span(spec) / 2, el: 0,
      position: new Vector3(spec.x, spec.y, spec.z), bore: new Vector3(),
    };
    m.el = Math.max(lowest(spec, m.az), Math.min(spec.elevation[1], 0));
    direction(m.az, m.el, m.bore);
    return m;
  });
}

/**
 * Swings a gun towards the direction `wanted` (body axes) for dt seconds, at no more than the traverse rate, and
 * stopping at the edges of its arc (it does not swing through the part of the circle outside its arc).
 */
export function aimMount(m, wanted, dt) {
  const { spec } = m;
  const step = common.gunners.traverseRate * dt;
  const want = anglesOf(wanted);
  const s = span(spec);
  if (s >= TWO_PI - 1e-9) {
    m.az += Math.max(-step, Math.min(step, Math.atan2(Math.sin(want.az - m.az), Math.cos(want.az - m.az))));
  } else if (s > 0) {
    // Measured into the arc from its first edge: an aim outside the arc goes to the nearer edge.
    const into = (a) => {
      const t = turn(a - spec.azimuth[0]);
      return t <= s ? t : (t - s < TWO_PI - t ? s : 0);
    };
    const now = into(m.az);
    const goal = into(want.az);
    m.az = spec.azimuth[0] + now + Math.max(-step, Math.min(step, goal - now));
  }
  const elGoal = Math.max(lowest(spec, m.az), Math.min(spec.elevation[1], want.el));
  m.el += Math.max(-step, Math.min(step, elGoal - m.el));
  m.el = Math.max(lowest(spec, m.az), Math.min(spec.elevation[1], m.el)); // swung forward, the dorsal gun lifts clear
  direction(m.az, m.el, m.bore);
}

/** The kind of the next round a gun fires, from its drum's or belt's sequence. */
function nextRound(m) {
  const belt = belts[m.spec.type];
  const kind = belt[m.belt % belt.length];
  m.belt += 1;
  return kind;
}

const _r = new Vector3();
const _v = new Vector3();

/**
 * Fires a gun for dt seconds at time `now` (s) while `trigger` is held, calling emit({ position, velocity, ballistics,
 * kind }) for each round (world axes). An empty drum is changed in `drumTime` s while spares last; no fire meanwhile.
 */
export function stepMount(m, plane, dt, now, trigger, drumTime, emit) {
  if (m.changingUntil !== null) {
    if (now < m.changingUntil) {
      m.firing = false;
      return;
    }
    m.changingUntil = null;
    m.rounds = m.capacity;
    m.drums -= 1;
  }
  const firing = trigger && m.rounds > 0;
  if (firing && !m.firing) m.owed = 1; // the first round leaves as the trigger is pressed
  m.firing = firing;
  if (firing) {
    const { body } = plane;
    const b = ballistics[m.ballistics];
    m.owed += m.rate * dt;
    while (m.owed >= 1 && m.rounds > 0) {
      m.owed -= 1;
      m.rounds -= 1;
      m.lastShot = now;
      _r.copy(m.position).applyQuaternion(body.quaternion);
      _v.copy(body.angularVelocity).applyQuaternion(body.quaternion).cross(_r).add(body.velocity);
      const velocity = m.bore.clone().applyQuaternion(body.quaternion).multiplyScalar(b.muzzleVelocity).add(_v);
      emit({ position: _r.clone().add(body.position), velocity, ballistics: m.ballistics, kind: nextRound(m) });
    }
  }
  if (m.rounds <= 0 && m.drums > 0 && m.changingUntil === null) {
    m.changingUntil = now + drumTime;
    m.firing = false;
  }
}

/** The rounds a gun has left in all: its drum and its spares. */
export const roundsLeft = (m) => m.rounds + m.drums * m.capacity + (m.changingUntil !== null ? m.capacity : 0);
