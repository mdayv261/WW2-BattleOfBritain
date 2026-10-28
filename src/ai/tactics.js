// What a fighter pilot reads from the sky around him (Phase 6 checkpoint 3, D81): the energy each aircraft has (height
// plus the height its speed would buy), whether an enemy is sitting behind him nose-on, whether he can see an aircraft
// at all (sighting range and the blind cone behind and below), and where to set up an attack on a bomber outside its
// guns' reach (S29, S38). Free of rendering. Thresholds are game-design values unless a source is named.

import { Vector3 } from 'three';
import { G } from '../core/constants.js';

export const THREAT_RANGE = 800; // m: an enemy this close behind can shoot
export const THREAT_TAIL = 60 * (Math.PI / 180); // rad: "behind" is within this of the tail
export const NOSE_ON = 25 * (Math.PI / 180); // rad: an enemy pointing within this of us is aiming at us
const BLIND_BACK = 0.6; // share of the range behind...
const BLIND_LOW = 0.25; // ...and below, where a pilot can't see (under the tail)

const _a = new Vector3();
const _b = new Vector3();

/** Energy height (m): height plus the height the speed would buy in a zoom, v²/2g. */
export const energyHeight = (position, velocity) => position.y + velocity.lengthSq() / (2 * G);

/** True when `enemy` ({ position, velocity }) sits behind `body` within `reach` (THREAT_RANGE), pointing at it. */
export function threatens(body, enemy, reach = THREAT_RANGE) {
  _a.copy(body.position).sub(enemy.position); // from the enemy to us
  const range = _a.length();
  if (range > reach || range < 1) return false;
  const behind = _b.copy(body.velocity).normalize().negate().angleTo(_a.clone().negate()) < THREAT_TAIL;
  const noseOn = enemy.velocity.lengthSq() > 1 && enemy.velocity.angleTo(_a) < NOSE_ON;
  return behind && noseOn;
}

/** True when a pilot in `body` can see something at `position`: within his sighting range (m), not hidden
 * under his own tail (behind and below). */
export function canSee(body, position, sighting) {
  const rel = _a.copy(position).sub(body.position);
  const range = rel.length();
  if (range > sighting) return false;
  const inBody = rel.applyQuaternion(body.quaternion.clone().invert());
  return !(inBody.x < -BLIND_BACK * range && inBody.y < -BLIND_LOW * range);
}

/**
 * Where to set up an attack on a bomber (`bomber` = { position, velocity }) from `me` (a position), outside its guns'
 * reach (S29): from ahead and above, within 30° of its path, if we are ahead of it; else from below and to the side,
 * more than 40° off its path (S38: "from ahead or below"). Returns { point, from } with `from` 'ahead' or 'below'.
 */
export function bomberSetup(bomber, me) {
  const fwd = bomber.velocity.clone().setY(0).normalize();
  const right = new Vector3(-fwd.z, 0, fwd.x);
  const side = Math.sign(me.clone().sub(bomber.position).dot(right)) || 1;
  if (me.clone().sub(bomber.position).dot(fwd) > 0) {
    // 1.5 km ahead, 400 m above and a little out to the side: the run comes in within 30° of its path.
    return { from: 'ahead', point: bomber.position.clone().addScaledVector(fwd, 1500).addScaledVector(right, side * 300).add(new Vector3(0, 400, 0)) };
  }
  // 800 m out on its quarter, 50° off its path, 500 m below.
  return { from: 'below', point: bomber.position.clone().addScaledVector(fwd, 800 * Math.cos(0.87)).addScaledVector(right, side * 800 * Math.sin(0.87)).add(new Vector3(0, -500, 0)) };
}

/** Home for each side: the RAF's to the north-west, the Luftwaffe's to the south-east (world: north is -z, east +x). */
export function homeDirection(side) {
  return side === 'RAF' ? new Vector3(-0.7, -0.08, -0.7).normalize() : new Vector3(0.7, -0.08, 0.7).normalize();
}
