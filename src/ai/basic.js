// The AI's first behaviours (Phase 6 checkpoint 2, D79), enough to see the hands at work; checkpoint 3 replaces the
// fighter's with real tactics, checkpoint 4 the bombers' with their routes and gunners.
//   Fighter: pursues the nearest enemy it can see, aiming ahead of it by the rounds' time of flight (and above it by
//     their drop), and fires within its skill's range when the aim is close enough. With nobody to fight, or until an
//     enemy comes near when it is flying escort, it keeps its place in its formation, or flies straight and level.
//   Bomber: the leader holds its heading, height and formation speed; the others keep their places in the Kette.
// Every pilot decides 20 times a second from what he could see one reaction time ago (src/ai/perception.js), and his
// hands (src/ai/pilot.js) fly the aircraft between decisions.

import { Vector3 } from 'three';
import { SKILLS } from './skill.js';
import { createHands, fly } from './pilot.js';
import { seen } from './perception.js';
import { roundFlight } from './gunnery.js';
import { seededRandom } from '../weapons/random.js';
import { attitude } from '../core/autopilot.js';
import { cruiseSpeed } from '../core/target.js';

const DECIDE = 0.05; // s between decisions
const ENGAGE_RANGE = 2500; // m: an escort leaves its place for an enemy this close (game design, D79)
const FLOOR = 300; // m above the ground: below this a pilot won't point the nose down...
const FLOOR_TIME = 6; // s: ...and he keeps this many seconds of his descent rate above it as well, to pull out in
const LOOKAHEAD = 3; // s: a wingman steers for where his place will be this far ahead
const AIM_CHANGE = 1.5; // s: how often a pilot's aim error wanders to a new value

const _f = new Vector3();
const _r = new Vector3();

/** A point `slot` = { side, back, up } (m) from the leader, in the leader's heading frame (world). */
export function slotPoint(leader, slot, out = new Vector3()) {
  const { heading } = attitude(leader.plane);
  _f.set(Math.sin(heading), 0, -Math.cos(heading));
  _r.set(Math.cos(heading), 0, Math.sin(heading));
  return out.copy(leader.plane.body.position).addScaledVector(_f, -(slot.back ?? 0)).addScaledVector(_r, slot.side ?? 0)
    .add(new Vector3(0, slot.up ?? 0, 0));
}

export class Pilot {
  /** `role`: 'fighter', 'escort' or 'bomber'; `leader` and `slot` place a wingman in formation. */
  constructor({ role = 'fighter', skill = 'regular', leader = null, slot = null, seed = 1 } = {}) {
    this.role = role;
    this.leader = leader;
    this.slot = slot;
    this.random = seededRandom(seed * 7919 + 13);
    this.setSkill(skill);
    this.timer = 0;
    this.goal = null;
    this.aimOffset = new Vector3();
    this.aimTimer = 0;
    this.hold = null;
  }

  setSkill(key) {
    this.skillKey = key;
    this.hands = createHands(SKILLS[key]);
  }

  get skill() {
    return SKILLS[this.skillKey];
  }

  fly(craft, sim, dt) {
    this.timer -= dt;
    if (this.timer <= 0 || !this.goal) {
      this.timer += DECIDE;
      if (this.timer <= 0) this.timer = DECIDE;
      this.goal = this.decide(craft, sim);
    }
    fly(craft, this.hands, this.goal, dt);
  }

  /** Straight and level on the heading and height it was flying when it began. */
  level(craft, speed) {
    const { body } = craft.plane;
    this.hold ??= { heading: attitude(craft.plane).heading, altitude: body.position.y };
    const h = this.hold.heading;
    const climb = Math.max(-0.1, Math.min(0.1, (this.hold.altitude - body.position.y) * 0.004));
    const direction = new Vector3(Math.sin(h), climb, -Math.cos(h)).normalize();
    return { direction, gMax: 2, maxBank: 0.35, turnGain: 0.4, speed };
  }

  /**
   * Towards its place (`slot`, its own unless another is given) beside a living leader (`lead`, its own unless given):
   * where the place will be shortly, at the leader's speed.
   */
  keepSlot(craft, sim, gentle, slot = this.slot, lead = this.leader) {
    if (!lead?.alive) return null;
    // Where the leader is now, as the wingman judges it: where he was seen, carried on by his seen velocity.
    const leaderSeen = seen(lead, sim.clock, this.skill.reaction);
    leaderSeen.position.addScaledVector(leaderSeen.velocity, this.skill.reaction);
    const place = slotPoint(lead, slot).add(leaderSeen.position).sub(lead.plane.body.position);
    const ahead = place.clone().addScaledVector(leaderSeen.velocity, LOOKAHEAD).sub(craft.plane.body.position);
    const behind = place.clone().sub(craft.plane.body.position).dot(leaderSeen.velocity.clone().normalize());
    const speed = leaderSeen.velocity.length() + Math.max(-15, Math.min(15, behind * 0.05));
    return { direction: ahead.normalize(), gMax: gentle ? 2 : 4, maxBank: gentle ? 0.35 : 1.2, turnGain: gentle ? 0.4 : 0.8, speed };
  }

  /** The nearest living enemy as this pilot sees it: { craft, position, velocity, range } or null. */
  nearestEnemy(craft, sim) {
    let best = null;
    for (const other of sim.crafts()) {
      if (other === craft || other.side === craft.side || !other.alive) continue;
      const s = seen(other, sim.clock, this.skill.reaction);
      const range = s.position.distanceTo(craft.plane.body.position);
      if (!best || range < best.range) best = { craft: other, ...s, range };
    }
    return best;
  }

  /** Pursuit with lead, firing within range when the aim is close enough. */
  pursue(craft, enemy, sim) {
    const { body } = craft.plane;
    const gun = craft.armament[0];
    const flight = gun ? roundFlight(gun.ballistics, enemy.range) : { time: 0, drop: 0 };
    // The aim wanders by the skill's error, a new value every AIM_CHANGE seconds.
    this.aimTimer -= DECIDE;
    if (this.aimTimer <= 0) {
      this.aimTimer = AIM_CHANGE;
      const e = this.skill.aimError;
      this.aimOffset.set(this.random() - 0.5, this.random() - 0.5, this.random() - 0.5).multiplyScalar(2 * e);
    }
    const aim = enemy.position.clone().addScaledVector(enemy.velocity.clone().sub(body.velocity), flight.time)
      .add(new Vector3(0, flight.drop, 0)).addScaledVector(this.aimOffset, enemy.range);
    const toAim = aim.sub(body.position).normalize();
    // The guns lie along the nose, which rides above the flight path by the angle of attack: steer the flight path so
    // that the nose, not the flight path, comes onto the aim.
    const nose = new Vector3(1, 0, 0).applyQuaternion(body.quaternion);
    const path = body.velocity.clone().normalize();
    const direction = toAim.clone().add(path).sub(nose).normalize();
    const cone = 0.03 + 2 * this.skill.aimError; // rad: a fighter's span at gun range, about (D81)
    const onTarget = enemy.range < this.skill.fireRange && nose.angleTo(toAim) < cone;
    const gLimit = craft.ac.limits?.g?.damage ?? 6;
    return {
      direction, gMax: gLimit * this.skill.gShare, gMin: 0, throttle: 1,
      fireMg: onTarget, fireCannon: onTarget && enemy.range < Math.min(300, this.skill.fireRange),
    };
  }

  decide(craft, sim) {
    let goal;
    if (this.role === 'bomber') {
      this.cruise ??= formationSpeed(craft.ac, craft.plane.body.position.y); // worked out once: a costly solve
      goal = this.keepSlot(craft, sim, true) ?? this.level(craft, this.cruise);
    }
    else {
      const enemy = this.nearestEnemy(craft, sim);
      const engage = enemy && (this.role === 'fighter' || enemy.range < ENGAGE_RANGE);
      if (engage) goal = this.pursue(craft, enemy, sim);
      else goal = this.keepSlot(craft, sim, false) ?? this.level(craft, 110);
    }
    return keepClear(craft, sim, goal);
  }
}

/**
 * A bomber formation's speed at a height (D79): its formation cruise (D78), but no faster than its level speed at 60%
 * throttle there (the target's cruise, src/core/target.js), so low down it isn't flown near flat out.
 */
export function formationSpeed(ac, altitude) {
  return Math.min(ac.formationSpeed ?? Infinity, cruiseSpeed(ac, altitude));
}

/**
 * Keep clear of the ground: below FLOOR, plus FLOOR_TIME seconds of the present descent, climb away (unless already
 * climbing hard), pulling as hard as the pilot will.
 */
export function keepClear(craft, sim, goal) {
  const { body } = craft.plane;
  const ground = sim.world.terrain.surfaceAt(body.position.x, body.position.z).height;
  const floor = FLOOR + FLOOR_TIME * Math.max(0, -body.velocity.y);
  if (body.position.y - ground > floor || goal.direction.y > 0.3) return goal;
  // Climb away, banking no more than 60° so that the lift holds him up, however he was turning.
  const out = body.velocity.clone().setY(0).normalize().setY(0.4).normalize();
  const gLimit = craft.ac.limits?.g?.damage ?? 4;
  return { ...goal, direction: out, gMax: Math.max(goal.gMax ?? 2, gLimit * 0.8), maxBank: 1.05, push: false, fireMg: false, fireCannon: false };
}

/** A pilot of these first behaviours (the bombers'; fighters fly src/ai/fighter.js: see src/ai/pilots.js). */
export const createBasicPilot = (options) => new Pilot(options);
