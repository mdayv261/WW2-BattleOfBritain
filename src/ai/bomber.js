// The bomber pilots (Phase 6, D83). A bomber formation (a Kette, D78) flies a route to its target and home, at its
// formation speed and height, with gentle turns (S22, S29: the bombers held their course and relied on their gunners
// and the escort):
//   - the leader steers for each waypoint of the route in turn, then holds his heading;
//   - the others keep their places in the formation; with enemy fighters near they close up, so that their guns support
//     each other, and open out again once clear;
//   - a bomber badly damaged (D80) or with an engine out can't keep up: it leaves the formation, a straggler, and turns
//     for home, losing height gently;
//   - if the leader is lost (or straggles), the next bomber takes the lead, the route and the escort with it.
// The group is shared by its bombers: { bombers (in formation order), escorts (their pilots), formation, route }.
// The distances are game-design values (D83).

import { Vector3 } from 'three';
import { Pilot, keepClear, formationSpeed } from './basic.js';
import { seen } from './perception.js';
import { homeDirection } from './tactics.js';
import { FORMATIONS } from './formation.js';
import { badlyDamaged } from '../core/bailout.js';
import { attitude } from '../core/autopilot.js';

const WAYPOINT_REACHED = 1000; // m (horizontal): the leader turns for the next waypoint this close to one...
const WAYPOINT_PASSED = 3000; // m: ...or this close once it is behind his wing line (his gentle turns are wide)
const CLOSE_UP = 1500; // m: with enemy fighters this close to the leader, the formation closes up...
const OPEN_OUT = 2500; // m: ...and opens out again once they are all further than this
const CLOSED = 0.6; // share of the usual spacing when closed up
const STRAGGLER_DESCENT = 0.05; // the straggler's glide home (rise over run, about 3°)
const STRAGGLER_SPEED = 0.9; // share of the formation speed a straggler flies home at
const SAME_SIDE = 10; // m across from the leader beyond which a wingman counts as on that side of him
const LOW = 0.05; // the coolant or oil left at which an engine is as good as dead (as src/core/bailout.js)

/** Whether one of an aircraft's engines has stopped or is dying: it can't keep its place. */
const engineOut = (plane) => plane.engines.some((e) => e.heat.seized || e.heat.coolantLeft <= LOW || e.heat.oilLeft <= LOW);

/** A bomber group for a formation flying `route` ([{ x, z }], world m): its bombers and escorts are added by the scenario. */
export const createBomberGroup = (formation = 'kette', route = []) => ({ formation, route, bombers: [], escorts: [], leg: 0 });

export class BomberPilot extends Pilot {
  constructor(options) {
    super({ ...options, role: 'bomber' });
    this.group = options.group ?? null;
    this.straggler = false;
    this.closed = false;
    this.state = 'formation';
  }

  describe() {
    return this.state;
  }

  /** The bombers still in formation: alive, still flown, not straggling. */
  inFormation() {
    return (this.group?.bombers ?? []).filter((c) => c.alive && !c.abandoned && c.plane.damage.pilot > 0 && !c.pilot.straggler);
  }

  decide(craft, sim) {
    this.cruise ??= formationSpeed(craft.ac, craft.plane.body.position.y); // worked out once: a costly solve
    if (!this.straggler && (badlyDamaged(craft.plane) || engineOut(craft.plane))) this.straggler = true;
    if (this.straggler) {
      this.state = 'straggling home';
      const home = homeDirection(craft.side).setY(0).normalize().setY(-STRAGGLER_DESCENT).normalize();
      return keepClear(craft, sim, { direction: home, gMax: 2, maxBank: 0.35, turnGain: 0.4, speed: this.cruise * STRAGGLER_SPEED });
    }
    const formation = this.inFormation();
    const index = formation.indexOf(craft);
    if (!this.group || index <= 0) return keepClear(craft, sim, this.lead(craft, sim));
    // A wingman keeps his place from the present leader: his place by his order in what is left of the formation, on
    // the side of the leader he is already on (moving up, he never crosses over behind the new leader).
    const lead = formation[0];
    const place = FORMATIONS[this.group.formation][index] ?? FORMATIONS[this.group.formation].at(-1);
    const share = lead.pilot.closed ? CLOSED : 1;
    const { heading } = attitude(lead.plane);
    const across = craft.plane.body.position.clone().sub(lead.plane.body.position).dot(new Vector3(Math.cos(heading), 0, Math.sin(heading)));
    const side = Math.abs(across) > SAME_SIDE && Math.sign(across) !== Math.sign(place.side ?? 0) ? -1 : 1;
    const slot = { side: side * (place.side ?? 0) * share, back: (place.back ?? 0) * share, up: place.up ?? 0 };
    this.state = lead.pilot.closed ? 'formation (closed up)' : 'formation';
    return keepClear(craft, sim, this.keepSlot(craft, sim, true, slot, lead) ?? this.level(craft, this.cruise));
  }

  /** The leader: hands the escort on to himself, watches for fighters, and flies the route. */
  lead(craft, sim) {
    const group = this.group;
    if (group) for (const e of group.escorts) e.leader = craft;
    this.watch(craft, sim);
    const { body } = craft.plane;
    const wp = group?.route[group.leg];
    if (!wp) {
      this.state = this.closed ? 'leading (closed up)' : 'leading';
      return this.level(craft, this.cruise);
    }
    const to = new Vector3(wp.x - body.position.x, 0, wp.z - body.position.z);
    const behind = to.dot(body.velocity) < 0;
    if (to.length() < WAYPOINT_REACHED || (behind && to.length() < WAYPOINT_PASSED)) {
      group.leg += 1;
      return this.lead(craft, sim); // past the last waypoint he holds the heading he is on
    }
    this.routeAltitude ??= body.position.y;
    const climb = Math.max(-0.1, Math.min(0.1, (this.routeAltitude - body.position.y) * 0.004));
    this.state = `leading to waypoint ${group.leg + 1}${this.closed ? ' (closed up)' : ''}`;
    return { direction: to.normalize().setY(climb).normalize(), gMax: 2, maxBank: 0.35, turnGain: 0.4, speed: this.cruise };
  }

  /** Closes the formation up with enemy fighters near the leader, opening out once they are all well clear. */
  watch(craft, sim) {
    let nearest = Infinity;
    for (const other of sim.crafts()) {
      if (other.side === craft.side || !other.alive) continue;
      const s = seen(other, sim.clock, this.skill.reaction);
      nearest = Math.min(nearest, s.position.distanceTo(craft.plane.body.position));
    }
    if (nearest < CLOSE_UP) this.closed = true;
    else if (nearest > OPEN_OUT) this.closed = false;
  }
}
