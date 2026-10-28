// The air gunners (Phase 6, D83): the crewmen who man an aircraft's flexible guns (src/weapons/mounts.js), the Bf 110's
// rear gunner (always AI, D14, the player's too) and the He 111's five positions. Each gunner:
//   - watches through his guns' arcs for enemies within his skill's gun range, seen one reaction time ago and judged on
//     to where they are now (src/ai/perception.js); he prefers one closing on his aircraft, else the nearest;
//   - aims ahead of it by his rounds' time of flight, allowing for his own aircraft's motion, and above it by their drop
//     (src/ai/gunnery.js), with a wandering aim error (his skill's, worse for a flexible gun on a moving aircraft, and
//     twice as bad when he is wounded);
//   - swings the gun towards that aim and fires bursts while it is on it, never with a friendly aircraft in the line;
//   - cannot shoot at all above common.gunners.gLimit (S25), and stops when killed or when the crew abandon the aircraft.
// One man may serve more than one gun (the He 111's beam gunner, and the tail MG 17 fired by the B- or C-Stand gunner,
// S28): he fires the one that bears. The tuning values are game design (D83).

import { Vector3 } from 'three';
import { SKILLS } from './skill.js';
import { seen } from './perception.js';
import { roundFlight } from './gunnery.js';
import { common } from '../aircraft/common.js';
import { createMounts, aimMount, stepMount, inArc, anglesOf } from '../weapons/mounts.js';
import { crewHealth } from '../weapons/damage.js';
import { seededRandom } from '../weapons/random.js';

const DECIDE = 0.05; // s between a gunner's choices of target
const FLEXIBLE_ERROR = 5; // a gunner's aim error, as a multiple of his skill's (a pilot's) aim error
const WOUNDED_ERROR = 2; // and this many times worse again when he is wounded
const AIM_CHANGE = 1.0; // s: how often his aim error wanders to a new value
const FIRE_CONE = 0.035; // rad: he fires while his gun is this close to his aim
const BURST = 1.5; // s: a burst...
const PAUSE = 0.6; // s: ...and the pause before the next
const FRIEND_CONE = 0.1; // rad: he holds his fire with a friendly aircraft this close to his line of fire
const CLOSING = 0.9; // an enemy closing on his aircraft counts as this much nearer per unit of closing (a threat)

const _rel = new Vector3();
const _aim = new Vector3();

/** The flexible guns of a craft and the men who man them (fresh: guns loaded, nobody aiming yet). */
export function createGunners(craft, seed = 1) {
  const mounts = createMounts(craft.ac);
  const seats = [...new Set(mounts.flatMap((m) => [m.spec.gunner, m.spec.gunnerAlt]).filter((i) => i !== undefined))];
  const random = seededRandom(seed * 4801 + 29);
  const gunners = seats.map((seat) => ({
    seat, target: null, mount: null, aimOffset: new Vector3(), aimTimer: 0, timer: 0, burst: 0, pause: 0, firing: false,
  }));
  return { mounts, gunners, random };
}

/** The gunner who works a gun now: its own man, or (the tail MG 17) the other if its own is out of action. */
function manning(plane, spec) {
  if (crewHealth(plane, spec.gunner) > 0) return spec.gunner;
  if (spec.gunnerAlt !== undefined && crewHealth(plane, spec.gunnerAlt) > 0) return spec.gunnerAlt;
  return null;
}

/** A position (world) seen from a gun on the aircraft, as azimuth and elevation in body axes, and the range. */
function bearing(plane, m, point) {
  const { body } = plane;
  _rel.copy(m.position).applyQuaternion(body.quaternion).add(body.position);
  _rel.subVectors(point, _rel);
  const range = _rel.length();
  const local = _rel.clone().applyQuaternion(body.quaternion.clone().invert());
  return { ...anglesOf(local), range };
}

/** Whether any friendly aircraft lies within FRIEND_CONE of the line from the gun to `point`, nearer than it. */
function friendInLine(craft, sim, m, point, range) {
  const { body } = craft.plane;
  const muzzle = m.position.clone().applyQuaternion(body.quaternion).add(body.position);
  const line = point.clone().sub(muzzle).normalize();
  for (const other of sim.crafts()) {
    if (other === craft || other.side !== craft.side || !other.alive) continue;
    const to = other.plane.body.position.clone().sub(muzzle);
    const d = to.length();
    if (d < range + 50 && to.angleTo(line) < Math.max(FRIEND_CONE, 15 / Math.max(d, 1))) return true;
  }
  return false;
}

/**
 * The best target a gunner's guns bear on: { craft, position, velocity, range, mount }, or null. Each enemy is seen as
 * it was a reaction time ago, carried on by its seen velocity to where it should be now.
 */
function chooseTarget(craft, sim, gunner, mounts, skill) {
  const { body } = craft.plane;
  let best = null;
  for (const other of sim.crafts()) {
    if (other.side === craft.side || !other.alive) continue;
    const s = seen(other, sim.clock, skill.reaction);
    s.position.addScaledVector(s.velocity, skill.reaction);
    const closing = -s.velocity.clone().sub(body.velocity).dot(s.position.clone().sub(body.position).normalize());
    for (const m of mounts) {
      if (m.spec.fixed) continue; // fired besides his own gun, when its line bears (stepGunners)
      const b = bearing(craft.plane, m, s.position);
      if (b.range > skill.gunRange || !inArc(m.spec, b.az, b.el)) continue;
      const score = b.range - CLOSING * Math.max(0, closing) * 3;
      if (!best || score < best.score) best = { craft: other, ...s, range: b.range, mount: m, score };
    }
  }
  return best;
}

/** Where a gunner aims gun `m` (world direction from it) at his target, with lead, drop and his aim error. */
function aimFor(craft, gunner, m, target, error) {
  const { body } = craft.plane;
  const flight = roundFlight(m.ballistics, target.range);
  const muzzle = m.position.clone().applyQuaternion(body.quaternion).add(body.position);
  _aim.copy(target.position).addScaledVector(target.velocity.clone().sub(body.velocity), flight.time).sub(muzzle);
  _aim.y += flight.drop;
  return _aim.addScaledVector(gunner.aimOffset, target.range * error).normalize();
}

/**
 * Steps a craft's gunners and their guns by dt (the guns timed by the aircraft's own clock, as its fixed guns are).
 * Rounds go into the shared pool owned by `owner` (the craft, or the simulation for the player's own aircraft).
 */
export function stepGunners(craft, sim, dt, owner = craft) {
  const crew = craft.gunnery;
  if (!crew) return;
  const { plane } = craft;
  const skill = SKILLS[craft.skill] ?? SKILLS.regular;
  const g = Math.abs(plane.last?.loadFactor ?? 1);
  const silent = craft.abandoned || !craft.alive || g > common.gunners.gLimit;
  const drumTime = common.gunners.drumChange * skill.drumFactor;
  const emit = (round) => sim.projectiles.spawn(round, owner);
  const inv = plane.body.quaternion.clone().invert();
  const fired = new Set();
  for (const gunner of crew.gunners) {
    const health = crewHealth(plane, gunner.seat);
    const mounts = crew.mounts.filter((m) => manning(plane, m.spec) === gunner.seat);
    if (health <= 0 || !mounts.length) {
      gunner.target = null;
      gunner.firing = false;
      continue;
    }
    gunner.timer -= dt;
    if (gunner.timer <= 0) {
      gunner.timer = DECIDE;
      gunner.target = silent ? null : chooseTarget(craft, sim, gunner, mounts, skill);
      if (gunner.target) {
        gunner.mount = gunner.target.mount;
        gunner.blocked = friendInLine(craft, sim, gunner.mount, gunner.target.position, gunner.target.range);
      }
    }
    gunner.aimTimer -= dt;
    if (gunner.aimTimer <= 0) {
      gunner.aimTimer = AIM_CHANGE;
      const r = crew.random;
      gunner.aimOffset.set(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(2 * skill.aimError);
    }
    let trigger = false;
    const target = gunner.target;
    if (target && gunner.mount) {
      // Between choices the target moves on: carry it on by its velocity.
      target.position.addScaledVector(target.velocity, dt);
      const error = FLEXIBLE_ERROR * (health < 1 ? WOUNDED_ERROR : 1);
      const wanted = aimFor(craft, gunner, gunner.mount, target, error).applyQuaternion(inv);
      aimMount(gunner.mount, wanted, dt);
      const on = gunner.mount.bore.angleTo(wanted) < FIRE_CONE;
      trigger = on && !gunner.blocked && !silent && burstOn(gunner, dt);
      // A fixed gun he works (the tail MG 17) fires with his own whenever its line is on his aim.
      for (const m of mounts) {
        if (!m.spec.fixed) continue;
        const line = aimFor(craft, gunner, m, target, error).applyQuaternion(inv);
        stepMount(m, plane, dt, plane.time, trigger && m.bore.angleTo(line) < FIRE_CONE, drumTime, emit);
        fired.add(m);
      }
    } else {
      gunner.burst = 0;
    }
    gunner.firing = trigger;
    if (gunner.mount && !fired.has(gunner.mount)) {
      stepMount(gunner.mount, plane, dt, plane.time, trigger, drumTime, emit);
      fired.add(gunner.mount);
    }
  }
  // Guns nobody is firing this step still finish a drum change under way.
  for (const m of crew.mounts) if (!fired.has(m)) stepMount(m, plane, dt, plane.time, false, drumTime, emit);
}

/** Bursts and pauses: whether the gunner holds the trigger this step. */
function burstOn(gunner, dt) {
  if (gunner.pause > 0) {
    gunner.pause -= dt;
    return false;
  }
  gunner.burst += dt;
  if (gunner.burst > BURST) {
    gunner.burst = 0;
    gunner.pause = PAUSE;
    return false;
  }
  return true;
}

/** "gunners: 3 firing, 1 changing drum, 1 wounded" for F3 ("" for an aircraft without flexible guns). */
export function gunnersSummary(craft) {
  const crew = craft.gunnery;
  if (!crew) return '';
  const plane = craft.plane;
  const firing = crew.gunners.filter((g) => g.firing).length;
  const changing = crew.mounts.filter((m) => m.changingUntil !== null).length;
  const wounded = crew.gunners.filter((g) => crewHealth(plane, g.seat) > 0 && crewHealth(plane, g.seat) < 1).length;
  const killed = crew.gunners.filter((g) => crewHealth(plane, g.seat) <= 0).length;
  const parts = [`${firing} firing`];
  if (changing) parts.push(`${changing} changing drum`);
  if (wounded) parts.push(`${wounded} wounded`);
  if (killed) parts.push(`${killed} killed`);
  return `gunners: ${parts.join(', ')}`;
}
