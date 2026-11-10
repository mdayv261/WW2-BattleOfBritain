// The defensive pilot (Phase 7 checkpoint 7, D234): flies the player's Bf 110 while the player mans its rear gun (the
// product owner's choice). Never above 2 g, so the gunner can still aim (D78), and never with the nose guns:
//   - an enemy fighter within THREAT_RANGE, in the rear half or closing: a gentle turn that brings it round towards dead
//     astern, where the gun bears (±30° about the tail, S25), and a shallow descent when it is below the horizontal
//     (the gun cannot fire below it), so that it rises into the arc;
//   - otherwise, on an escort mission, the escort's station on the raid's leader (a mile behind and above, S38);
//   - else straight and level on the heading and height he took over at, or had when the last threat passed.
// He sees enemies one reaction time late, as every AI pilot does (src/ai/perception.js). The figures are game design.

import { Vector3 } from 'three';
import { Pilot } from './basic.js';
import { seen } from './perception.js';
import { anglesOf } from '../weapons/mounts.js';
import { common } from '../aircraft/common.js';
import { attitude } from '../core/autopilot.js';

export const DEFENCE = {
  threatRange: 2000, // m: an enemy fighter this close is watched
  turnAway: 0.5, // rad: the heading change asked for, each decision, to bring the attacker astern
  astern: 15 * (Math.PI / 180), // rad: an attacker this close to dead astern needs no more turning
  belowGun: 5 * (Math.PI / 180), // rad: an attacker lower than this above the horizontal brings a descent...
  descent: -0.12, // ...of this slope (about 7°)
  gMax: 2, // the gunner cannot aim above 2 g (D78)
  maxBank: 1.0, // rad (about 57°: a level turn at 2 g needs 60°)
  speed: 120, // m/s
};

const _rel = new Vector3();

export class DefensivePilot extends Pilot {
  constructor(options = {}) {
    super({ ...options, role: 'defensive' });
    this.raid = options.raid ?? null; // an escort mission's raid: its leader's station is kept
  }

  decide(craft, sim) {
    const threat = this.threat(craft, sim);
    if (threat) {
      this.hold = null; // once it has passed, hold the heading and height he is at then
      return this.defend(craft, threat);
    }
    const leader = this.raid?.bombers.find((c) => sim.others.includes(c) && !c.abandoned);
    if (leader) return this.station(craft, leader);
    return this.level(craft, DEFENCE.speed);
  }

  /** The nearest enemy fighter that threatens: within range, in the rear half or closing. { position, velocity, az, el } */
  threat(craft, sim) {
    const { body } = craft.plane;
    const inv = body.quaternion.clone().invert();
    let best = null;
    for (const c of sim.crafts()) {
      if (c === craft || c.side === craft.side || !c.alive || c.abandoned || c.role === 'bomber') continue;
      const s = seen(c, sim.clock, this.skill.reaction);
      _rel.subVectors(s.position, body.position);
      const range = _rel.length();
      if (range > DEFENCE.threatRange) continue;
      const closing = -_rel.dot(new Vector3().subVectors(s.velocity, body.velocity)) / Math.max(range, 1);
      const { az, el } = anglesOf(_rel.clone().applyQuaternion(inv));
      if (Math.abs(az) < Math.PI / 2 && closing <= 0) continue; // ahead and not closing: no threat to the tail
      if (!best || range < best.range) best = { ...s, range, az, el };
    }
    return best;
  }

  /** Turn to bring the attacker astern; descend if he is below the gun's arc. */
  defend(craft, threat) {
    const { heading } = attitude(craft.plane);
    const offAstern = Math.PI - Math.abs(threat.az);
    // An attacker on the right (az > 0) comes round towards the tail as we turn left, and the other way about.
    const h = offAstern < DEFENCE.astern ? heading : heading + (threat.az > 0 ? -1 : 1) * DEFENCE.turnAway;
    const climb = threat.el < DEFENCE.belowGun ? DEFENCE.descent : 0;
    const direction = new Vector3(Math.sin(h), climb, -Math.cos(h)).normalize();
    return { direction, gMax: DEFENCE.gMax, maxBank: DEFENCE.maxBank, speed: DEFENCE.speed };
  }

  /** The escort's station: behind and above the raid's leader, at his speed. */
  station(craft, leader) {
    const lb = leader.plane.body;
    const fwd = lb.velocity.clone().setY(0).normalize();
    const { behind, above } = common.formations.escort;
    const point = lb.position.clone().addScaledVector(fwd, -behind).add(new Vector3(0, above, 0));
    const to = point.sub(craft.plane.body.position);
    const along = to.dot(fwd);
    const direction = to.length() > 300 ? to.normalize() : fwd.clone();
    const speed = lb.velocity.length() + Math.max(-20, Math.min(30, along * 0.03));
    return { direction, gMax: DEFENCE.gMax, maxBank: DEFENCE.maxBank, turnGain: 0.5, speed };
  }
}
