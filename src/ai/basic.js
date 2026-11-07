// The AI pilot's common behaviours (Phase 6 checkpoint 2, D79), which the fighters' tactics (src/ai/fighter.js, D81)
// and the bombers' (src/ai/bomber.js, D83) build on:
//   pursuit of the nearest enemy it can see, aiming ahead of it by the rounds' time of flight (and above it by their
//     drop), firing within its skill's range when the aim is close enough; with nobody to fight, or until an enemy comes
//     near when it is flying escort, it keeps its place in its formation, or flies straight and level.
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
import { equivalentAirspeed } from '../physics/atmosphere.js';
import { G } from '../core/constants.js';

const DECIDE = 0.05; // s between decisions
const ENGAGE_RANGE = 2500; // m: an escort leaves its place for an enemy this close (game design, D79)
const FLOOR = 300; // m above the ground: below this a pilot won't point the nose down...
const FLOOR_TIME = 6; // s: ...and he keeps this many seconds of his descent rate above it as well, to pull out in
const LOOKAHEAD = 3; // s: a wingman steers for where his place will be this far ahead
const AIM_CHANGE = 1.5; // s: how often a pilot's aim error wanders to a new value
// Diving limits (D218): above DIVE_SHARE of the aircraft's diving limit (limits.diveEas, from the sources), less
// DIVE_STEEP_SHARE times the sine of his dive angle (a steep dive gains speed faster, so he starts sooner), he points no
// steeper than DIVE_STEEPEST down and eases the throttle back to DIVE_THROTTLE; and the ground floor allows for the
// height a pull-out at his speed and dive angle needs, at PULL_SHARE of the g his skill pulls, plus ROLL_TIME seconds
// of descent while he is upside down (at speed the ailerons are heavy, S32). Game-design values.
const DIVE_SHARE = 0.9;
const DIVE_STEEP_SHARE = 0.25;
const ROLL_TIME = 2; // s
const DIVE_STEEPEST = 10 * (Math.PI / 180);
const DIVE_THROTTLE = 0.3;
const PULL_SHARE = 0.8;
// Breaking off (D216): an enemy coming head-on (pointing within HEAD_ON_PASS of him and closing) is broken off at the
// skill's press range plus the distance the two close in PASS_CLOSING s; one he is overhauling from behind, inside half
// that press range. He breaks for PASS_BREAK s, up if he is the higher of the two and down if the lower (decided once,
// so that two pilots breaking at once part; a level pass decided by name), and a little to his right. Up or down needs
// no roll first, so it parts them in the second there is. Game-design estimates.
const HEAD_ON_PASS = 45 * (Math.PI / 180);
const PASS_CLOSING = 0.7;
const PASS_BREAK = 2;
const UP = new Vector3(0, 1, 0);

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
    // Gently, he may bank a little more than a leader's 20° so that he can hold his place on the outside of a turn.
    return { direction: ahead.normalize(), gMax: gentle ? 2 : 4, maxBank: gentle ? 0.5 : 1.2, turnGain: gentle ? 0.4 : 0.8, speed };
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

  /**
   * Breaking off a pass (D216): once `enemy` comes head-on within the skill's press range plus PASS_CLOSING s of
   * closing, or he is overhauling it inside half his press range, he breaks up or down (and a little right) for
   * PASS_BREAK s, without firing. Null while the attack goes on.
   */
  headOnBreak(craft, enemy, sim) {
    const { body } = craft.plane;
    const gMax = (craft.ac.limits?.g?.damage ?? 6) * this.skill.gShare;
    const away = () => {
      const path = body.velocity.clone().normalize();
      const dir = path.clone().addScaledVector(path.clone().cross(UP).normalize(), 0.3).addScaledVector(UP, 0.8 * this.passUp);
      return this.passUp > 0 ? { direction: dir.normalize(), gMax, throttle: 1 }
        : { direction: dir.normalize(), push: true, gMin: -1.5, gMax: 1, throttle: 1 };
    };
    if (sim.clock < (this.passUntil ?? -Infinity)) return away();
    const toMe = body.position.clone().sub(enemy.position);
    const closing = Math.max(0, enemy.velocity.clone().sub(body.velocity).dot(toMe.clone().normalize())); // m/s
    const headOn = enemy.velocity.angleTo(toMe) < HEAD_ON_PASS && body.velocity.dot(enemy.velocity) < 0;
    const overhauling = !headOn && closing > 0 && enemy.range < this.skill.press / 2;
    if (!overhauling && (!headOn || enemy.range > this.skill.press + closing * PASS_CLOSING)) return null;
    const above = body.position.y - enemy.position.y;
    this.passUp = Math.abs(above) > 0.5 ? Math.sign(above) : (craft.label ?? '') < (enemy.craft?.label ?? '') ? 1 : -1;
    this.passUntil = sim.clock + PASS_BREAK;
    return away();
  }

  /** Pursuit with lead, firing within range when the aim is close enough. */
  pursue(craft, enemy, sim) {
    const { body } = craft.plane;
    const pass = this.headOnBreak(craft, enemy, sim);
    if (pass) return pass;
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
    const enemy = this.nearestEnemy(craft, sim);
    const engage = enemy && (this.role === 'fighter' || enemy.range < ENGAGE_RANGE);
    const goal = engage ? this.pursue(craft, enemy, sim) : this.keepSlot(craft, sim, false) ?? this.level(craft, 110);
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

/** The dive angle (rad, 0 when level or climbing) of a velocity. */
const diveAngle = (v) => Math.asin(Math.min(1, Math.max(0, -v.y / Math.max(v.length(), 1))));

/**
 * The height (m) a pull-out from the present dive needs (D218): the drop of a circle of radius v² / (g (n - 1)) from
 * the dive angle to level, at PULL_SHARE of the g his skill pulls; plus ROLL_TIME seconds of descent if he must first
 * roll upright.
 */
export function pullOutHeight(craft) {
  const v = craft.plane.body.velocity;
  const speed = Math.max(v.length(), 1);
  const n = PULL_SHARE * (craft.ac.limits?.g?.damage ?? 4) * (craft.pilot?.skill?.gShare ?? 1);
  const pull = n > 1 ? ((speed * speed) / (G * (n - 1))) * (1 - Math.cos(diveAngle(v))) : 0;
  const inverted = Math.abs(attitude(craft.plane).bank) > Math.PI / 2;
  return pull + (inverted ? ROLL_TIME * Math.max(0, -v.y) : 0);
}

/**
 * Within the diving limit (D218): above DIVE_SHARE of the aircraft's limits.diveEas (less, the steeper his dive), a
 * goal pointing steeper than DIVE_STEEPEST down is raised to it, he may pull out (no push-over), and the throttle comes back (without the
 * emergency rating). Types without a limit are left alone.
 */
export function keepInLimits(craft, goal) {
  const { body } = craft.plane;
  const limit = craft.ac.limits?.diveEas;
  const share = DIVE_SHARE - DIVE_STEEP_SHARE * Math.sin(diveAngle(body.velocity));
  if (!limit || equivalentAirspeed(body.velocity.length(), body.position.y) < share * limit) return goal;
  let { direction } = goal;
  if (direction.y < -Math.sin(DIVE_STEEPEST)) {
    const flat = direction.clone().setY(0);
    if (flat.lengthSq() < 1e-6) flat.copy(body.velocity).setY(0);
    direction = flat.normalize().multiplyScalar(Math.cos(DIVE_STEEPEST)).setY(-Math.sin(DIVE_STEEPEST));
  }
  // A push-over's "push, no more than 1 g" would forbid the pull-out: he pulls as the pull-out height allows for.
  const pull = PULL_SHARE * (craft.ac.limits?.g?.damage ?? 4) * (craft.pilot?.skill?.gShare ?? 1);
  return {
    ...goal, direction, push: false, gMin: 0, gMax: Math.max(goal.gMax ?? 2, pull),
    throttle: Math.min(goal.throttle ?? DIVE_THROTTLE, DIVE_THROTTLE), speed: undefined, emergency: false,
  };
}

/**
 * Keep clear of the ground: below FLOOR, plus FLOOR_TIME seconds of the present descent, plus the height a pull-out
 * needs (D218), climb away (unless he is climbing and means to climb hard), pulling as hard as the pilot will. A goal
 * that points up is not enough while he is still diving (D216): a spiral after a target above him held him diving into
 * the ground. Every goal is also kept within the diving limit.
 */
export function keepClear(craft, sim, goal) {
  const { body } = craft.plane;
  const ground = sim.world.terrain.surfaceAt(body.position.x, body.position.z).height;
  const floor = FLOOR + FLOOR_TIME * Math.max(0, -body.velocity.y) + pullOutHeight(craft);
  if (body.position.y - ground > floor || (goal.direction.y > 0.3 && body.velocity.y > 0)) return keepInLimits(craft, goal);
  // Climb away, banking no more than 60° so that the lift holds him up, however he was turning.
  const out = body.velocity.clone().setY(0).normalize().setY(0.4).normalize();
  const gLimit = craft.ac.limits?.g?.damage ?? 4;
  return keepInLimits(craft, { ...goal, direction: out, gMax: Math.max(goal.gMax ?? 2, gLimit * 0.8), maxBank: 1.05, push: false, fireMg: false, fireCannon: false });
}

/** A pilot of these first behaviours alone (the game's pilots are made by src/ai/pilots.js). */
export const createBasicPilot = (options) => new Pilot(options);
