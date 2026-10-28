// The fighter pilot's tactics (Phase 6 checkpoint 3, D81): patrol, engage, attack, evade and disengage, as the period
// sources describe each type fighting. Every 1/20 s he decides from what he can see (src/ai/perception.js) and gives
// his hands (src/ai/pilot.js) a goal; he has no more than the player has.
//   Patrol: keeps his place in the formation (D78), or his leader's heading, until he spots an enemy (his skill's
//     sighting range, not under his own tail).
//   Engage and attack, by type:
//     Bf 109 and Bf 110, boom-and-zoom (S22, S25): with height or speed to spare, dive on the target and fire in the
//       pass; pull out before 150 m, or as soon as staying would mean a turning fight; then zoom away in a shallow
//       climb at about 290 km/h (S22: "shallow climb angle and higher speeds", 280-300 km/h) to build the height for
//       the next pass. They never stay to turn: the RAF fighters turn tighter (S21, S22, S25).
//     Hurricane and Spitfire, turning fight (S21): pursue with full turns; a skilled pilot won't pull his speed away.
//     Against bombers (S29, S38): set up out of the guns' reach, ahead and above or below and to the side, then the
//       run, then break away below.
//   Evade, when he notices an enemy sitting on his tail: the RAF break turn into the attacker; the Bf 109's push-over
//     into a dive with negative g, which the RAF's carburettors cannot follow (S22), or a split-S, when the attacker is
//     close; further back, a shallow, fast climb away, which they cannot match (S22); low down, where a
//     dive has nowhere to go, it extends away at full power on its speed (S22: faster than both RAF fighters at sea
//     level); the Bf 110's turn to meet an attacker seen early head-on, or its steep climb to make him overshoot (S25).
//   Disengage: out of ammunition, damaged, or out-matched too long (his skill's staying power): home in a shallow dive.
// A wingman covers his leader in a fight and goes for anyone attacking him; an escort keeps station behind and above
// its bombers (S38) and engages only fighters coming near them. Thresholds are game-design values (D81).

import { Vector3 } from 'three';
import { Pilot, keepClear } from './basic.js';
import { seen } from './perception.js';
import { energyHeight, threatens, canSee, bomberSetup, homeDirection } from './tactics.js';
import { COVER } from './formation.js';

const DECIDE = 0.05; // s between decisions (as basic.js)
const NOTICE_EVERY = 1; // s between a pilot's chances to notice an enemy on his tail
const ENGAGE_RANGE = 2500; // m: an escort engages fighters this close to it or its bombers (D79)
const DIVE_MARGIN = 200; // m of energy height above the target needed to start a diving pass...
const ZOOM_MARGIN = 450; // ...and built up in the zoom before the next one
const PULL_OUT = 150; // m: a diving pass breaks off this close
const NO_TURNING = 45 * (Math.PI / 180); // rad: off the target's line by this much, a pass would become a turning fight
const PASS_G = 4; // g: the most a diving pass pulls (he won't turn with the target)
const ZOOM_CLIMB = 12 * (Math.PI / 180); // rad: the zoom's shallow climb
const ZOOM_SPEED = 80.5; // m/s: 290 km/h, the middle of S22's 280-300 km/h
const LOW_ENERGY_SPEED = 72; // m/s: a diving fighter this slow gives up the pass
const HEAD_ON = 45 * (Math.PI / 180); // rad: a target pointing within this of him is coming head-on: no pass from there
const ZOOM_TIME = 15; // s: after this long in the zoom he attacks with any advantage he has
const RUN_START = 400; // m from the set-up point at which the run on a bomber begins
const BREAK_TIME = 4; // s of breakaway after a run
const AMMO_LOW = 0.1; // share of the rounds left at which he goes home
const DIVE_ROOM = 900; // m above the ground needed for a push-over (below it, he extends instead)
const CLOSE_BEHIND = 400; // m: an attacker further back than this, a Bf 109 or 110 climbs away from (S22)
const WATCH_110 = 1100; // m: a Bf 110 crew (two, the gunner facing aft) watch this far behind: S25's early sighting

const up = new Vector3(0, 1, 0);
const horizontal = (v) => v.clone().setY(0).normalize();

export class FighterPilot extends Pilot {
  constructor(options) {
    super(options);
    this.state = 'patrol';
    this.tactic = null;
    this.phase = null;
    this.until = 0;
    this.outmatched = 0;
    this.home = false;
    this.noticed = new Map(); // enemy craft -> { at, yes }
    this.target = null;
  }

  /** "attack (boom-and-zoom)", "evade (push-over)", ... for the readouts. */
  describe() {
    return this.tactic ? `${this.state} (${this.tactic})` : this.state;
  }

  decide(craft, sim) {
    return keepClear(craft, sim, this.choose(craft, sim));
  }

  /** The enemies he can see now: [{ craft, position, velocity, range }], his current target kept a little further. */
  look(craft, sim) {
    const body = craft.plane.body;
    const out = [];
    for (const other of sim.crafts()) {
      if (other === craft || other.side === craft.side || !other.alive) continue;
      const s = seen(other, sim.clock, this.skill.reaction);
      const range = s.position.distanceTo(body.position);
      const keep = other === this.target?.craft && range < this.skill.sighting * 1.5;
      if (keep || canSee(body, s.position, this.skill.sighting)) out.push({ craft: other, ...s, range });
    }
    return out;
  }

  /** Whether he notices `enemy` on his tail: a chance by skill, rolled again every NOTICE_EVERY s. */
  notices(enemy, now) {
    const n = this.noticed.get(enemy.craft);
    if (n && now - n.at < NOTICE_EVERY) return n.yes;
    const yes = this.random() < this.skill.notice;
    this.noticed.set(enemy.craft, { at: now, yes });
    return yes;
  }

  outOfAmmo(craft) {
    const rounds = craft.armament.reduce((a, g) => a + g.rounds, 0);
    const capacity = craft.armament.reduce((a, g) => a + g.capacity, 0);
    return capacity > 0 && rounds / capacity < AMMO_LOW;
  }

  /** Damage that slows or weakens the aircraft: a worn or leaking engine, a holed wing or tail, a hurt control. */
  hurt(craft) {
    const d = craft.plane.damage;
    if (!d.hits) return false;
    const engine = craft.plane.engines.some((e) => e.heat.wear > 0.3 || e.heat.coolantLeak > 0 || e.heat.oilLeak > 0);
    const wings = d.wing.some((side) => side.some((p) => p > 0.25));
    return engine || wings || d.tail > 0.25 || Object.values(d.controls).some((c) => c < 0.7);
  }

  choose(craft, sim) {
    const now = sim.clock;
    const body = craft.plane.body;
    const view = this.look(craft, sim);
    const reach = craft.ac.id === 'bf110c4' ? WATCH_110 : undefined;
    const threat = view.find((e) => threatens(body, e, reach) && this.notices(e, now));
    this.outmatched = threat ? this.outmatched + DECIDE : Math.max(0, this.outmatched - DECIDE / 2);
    if (!this.home && (this.outOfAmmo(craft) || this.hurt(craft) || this.outmatched > this.skill.stay)) this.home = true;

    // Evade: keep the manoeuvre going, or start one.
    if (this.state === 'evade' && now < this.until) return this.evadeGoal(craft, sim);
    if (threat) {
      this.startEvade(craft, threat, sim);
      return this.evadeGoal(craft, sim);
    }
    if (this.home) {
      this.set('disengage', null);
      return { direction: homeDirection(craft.side), gMax: 3, throttle: 1 };
    }

    // A wingman covers a fighting leader, and goes for anyone on his tail.
    const lead = this.leader?.alive ? this.leader : null;
    const leadFighting = lead?.pilot instanceof FighterPilot && lead.pilot.state !== 'patrol';
    if (lead?.pilot instanceof FighterPilot) {
      const onLeader = view.find((e) => threatens(lead.plane.body, e));
      if (onLeader) return this.engage(craft, onLeader, sim);
      if (leadFighting) {
        this.set('engage', 'covering');
        return this.keepSlot(craft, sim, false, { ...COVER, side: Math.sign(this.slot?.side ?? 1) * COVER.side });
      }
      this.set('patrol', null);
      return this.keepSlot(craft, sim, true) ?? this.level(craft, 110);
    }

    // An escort engages only fighters near it or its bombers, else keeps station.
    const target = this.pickTarget(craft, view, sim);
    if (target && this.role === 'escort') {
      const bombers = lead?.plane.body.position ?? body.position;
      const near = target.range < ENGAGE_RANGE || target.position.distanceTo(bombers) < ENGAGE_RANGE;
      if (!near) return this.patrol(craft, sim, lead);
    }
    if (target) return this.engage(craft, target, sim);
    return this.patrol(craft, sim, lead);
  }

  patrol(craft, sim, lead) {
    this.set('patrol', null);
    this.target = null;
    return this.keepSlot(craft, sim, false, this.slot, lead) ?? this.level(craft, 110);
  }

  set(state, tactic) {
    if (state !== this.state || tactic !== this.tactic) this.phase = null;
    this.state = state;
    this.tactic = tactic;
  }

  /** Attackers of his side first, then (for the RAF, with no fighters close) the bombers, then the nearest. */
  pickTarget(craft, view, sim) {
    if (!view.length) return null;
    const friends = sim.crafts().filter((c) => c.side === craft.side && c !== craft && c.alive);
    const attacker = view.find((e) => friends.some((f) => threatens(f.plane.body, e)));
    if (attacker) return attacker;
    const bombers = view.filter((e) => e.craft.ac.id === 'he111h');
    const fighters = view.filter((e) => e.craft.ac.id !== 'he111h');
    if (craft.side === 'RAF' && bombers.length && !fighters.some((e) => e.range < 1500)) return nearest(bombers);
    return nearest(fighters.length ? fighters : bombers);
  }

  /** Engages `target` with his type's tactic. */
  engage(craft, target, sim) {
    if (this.target?.craft !== target.craft) this.phase = null;
    this.target = target;
    if (target.craft.ac.id === 'he111h') return this.bomberRun(craft, target, sim);
    if (craft.ac.id === 'bf109e4' || craft.ac.id === 'bf110c4') return this.boomAndZoom(craft, target, sim);
    return this.turningFight(craft, target, sim);
  }

  boomAndZoom(craft, target, sim) {
    const body = craft.plane.body;
    const mine = energyHeight(body.position, body.velocity);
    const theirs = energyHeight(target.position, target.velocity);
    const speed = body.velocity.length();
    // Never a pass head-on: from behind or the beam only, so he comes round first.
    const toMe = body.position.clone().sub(target.position);
    const headOn = target.velocity.angleTo(toMe) < HEAD_ON && body.velocity.dot(target.velocity) < 0;
    const zoomed = sim.clock - (this.zoomSince ?? sim.clock);
    if (!this.phase) this.phase = mine > theirs + DIVE_MARGIN && !headOn ? 'dive' : 'zoom';
    if (this.phase === 'dive') {
      const off = body.velocity.angleTo(target.position.clone().sub(body.position));
      if (target.range < PULL_OUT || (off > NO_TURNING && target.range < 800) || speed < LOW_ENERGY_SPEED || (headOn && target.range > 600)) {
        this.phase = 'zoom';
        this.zoomSince = sim.clock;
      }
    } else if (!headOn && (mine > theirs + ZOOM_MARGIN || target.range > 3000 || (zoomed > ZOOM_TIME && mine > theirs))) this.phase = 'dive';
    if (this.phase === 'zoom') this.zoomSince ??= sim.clock;
    else this.zoomSince = null;
    if (this.phase === 'dive') {
      this.set('attack', 'boom-and-zoom');
      const goal = this.pursue(craft, target, sim);
      goal.gMax = Math.min(goal.gMax, PASS_G);
      return goal;
    }
    this.set('engage', 'boom-and-zoom');
    // The zoom: a shallow climb at about 290 km/h, flattened if he is slower; against a target coming head-on, a
    // climbing turn out to its side, to come round behind it.
    const climb = speed > ZOOM_SPEED ? ZOOM_CLIMB : 0;
    let track = horizontal(body.velocity);
    if (headOn) {
      const across = horizontal(toMe).cross(up);
      track = track.add(across.multiplyScalar(Math.sign(across.dot(track)) || 1)).normalize();
    }
    const direction = track.multiplyScalar(Math.cos(climb)).addScaledVector(up, Math.sin(climb)).normalize();
    return { direction, gMax: 3, throttle: 1 };
  }

  turningFight(craft, target, sim) {
    this.set('attack', 'turning fight');
    const goal = this.pursue(craft, target, sim);
    // A skilled pilot keeps his speed; below his minimum he eases the turn.
    if (this.skill.minSpeed && craft.plane.body.velocity.length() < this.skill.minSpeed) goal.gMax = Math.min(goal.gMax, 2.5);
    return goal;
  }

  bomberRun(craft, target, sim) {
    const body = craft.plane.body;
    this.phase ??= 'setup';
    if (this.phase === 'break' && sim.clock > this.until) this.phase = 'setup';
    if (this.phase === 'setup') {
      const { point, from } = bomberSetup(target, body.position);
      this.setupFrom = from;
      if (point.distanceTo(body.position) < RUN_START) this.phase = 'run';
      else {
        this.set('engage', `bomber run from ${from}`);
        // Steer for where the set-up point will be when he gets there: it moves with the bomber.
        const ahead = point.addScaledVector(target.velocity, point.distanceTo(body.position) / Math.max(body.velocity.length(), 50));
        return { direction: ahead.sub(body.position).normalize(), gMax: 4, throttle: 1 };
      }
    }
    if (this.phase === 'run') {
      if (target.range < PULL_OUT) {
        this.phase = 'break';
        this.until = sim.clock + BREAK_TIME;
      } else {
        this.set('attack', `bomber run from ${this.setupFrom}`);
        return this.pursue(craft, target, sim);
      }
    }
    // Break away below, along his line.
    this.set('engage', 'breakaway');
    return { direction: horizontal(body.velocity).add(new Vector3(0, -0.6, 0)).normalize(), gMax: 4, throttle: 1 };
  }

  /** Chooses the evasive manoeuvre for his type against `threat`. */
  startEvade(craft, threat, sim) {
    const id = craft.ac.id;
    const ground = sim.world.terrain.surfaceAt(craft.plane.body.position.x, craft.plane.body.position.z).height;
    let move = 'break';
    const room = craft.plane.body.position.y - ground;
    if (id === 'bf109e4') {
      if (threat.range >= CLOSE_BEHIND) move = 'climb away'; // S22: away in a shallow, fast climb, which they can't match
      else move = room > 1500 && this.random() < 0.4 ? 'split-S' : room > DIVE_ROOM ? 'push-over' : 'extend';
    }
    if (id === 'bf110c4') move = threat.range >= 900 ? 'head-on' : 'zoom climb';
    this.set('evade', move);
    this.threat = threat.craft;
    this.until = sim.clock + { break: 3, 'push-over': 4, 'split-S': 5, extend: 6, 'climb away': 6, 'head-on': 5, 'zoom climb': 4 }[move];
  }

  evadeGoal(craft, sim) {
    const body = craft.plane.body;
    const path = body.velocity.clone().normalize();
    const gLimit = (craft.ac.limits?.g?.damage ?? 6) * this.skill.gShare;
    const attacker = this.threat?.alive ? seen(this.threat, sim.clock, this.skill.reaction) : null;
    switch (this.tactic) {
      case 'push-over': // nose down hard, wings level, negative g (S22)
        return { direction: horizontal(body.velocity).add(new Vector3(0, -1.2, 0)).normalize(), push: true, gMin: -1.5, gMax: 1, throttle: 1 };
      case 'climb away': { // full power, a shallow climb at about 290 km/h, turning away from him (S22)
        const away = attacker ? horizontal(body.position.clone().sub(attacker.position)) : horizontal(body.velocity);
        const climb = body.velocity.length() > ZOOM_SPEED ? ZOOM_CLIMB : 0;
        const track = away.multiplyScalar(0.3).add(horizontal(body.velocity)).normalize(); // mostly straight on
        return { direction: track.multiplyScalar(Math.cos(climb)).addScaledVector(up, Math.sin(climb)).normalize(), gMax: 3, throttle: 1 };
      }
      case 'extend': { // full power, straight and a little down, away from the attacker
        const away = attacker ? horizontal(body.position.clone().sub(attacker.position)) : horizontal(body.velocity);
        return { direction: away.add(horizontal(body.velocity)).normalize().add(new Vector3(0, -0.05, 0)).normalize(), gMax: 3, throttle: 1 };
      }
      case 'split-S': // over onto his back and pull through, down and away
        return { direction: horizontal(body.velocity).multiplyScalar(-0.5).add(new Vector3(0, -1, 0)).normalize(), gMax: gLimit, throttle: 1 };
      case 'zoom climb': // up steeply: the attacker overshoots (S25)
        return { direction: horizontal(body.velocity).multiplyScalar(0.5).add(new Vector3(0, 0.87, 0)).normalize(), gMax: gLimit, throttle: 1 };
      case 'head-on': // round to meet him nose to nose (S25)
        if (attacker) return this.pursue(craft, { craft: this.threat, ...attacker, range: attacker.position.distanceTo(body.position) }, sim);
        break;
      default: { // break: a hard turn towards the attacker
        if (!attacker) break;
        const rel = attacker.position.clone().sub(body.position);
        const across = rel.addScaledVector(path, -rel.dot(path));
        if (across.lengthSq() < 1) across.copy(new Vector3(-path.z, 0, path.x));
        return { direction: path.clone().multiplyScalar(0.3).add(across.normalize()).normalize(), gMax: gLimit, throttle: 1 };
      }
    }
    return { direction: path, gMax: gLimit, throttle: 1 };
  }
}

const nearest = (list) => list.reduce((a, b) => (!a || b.range < a.range ? b : a), null);
