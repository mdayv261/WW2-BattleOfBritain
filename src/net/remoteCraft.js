// Another player's aircraft as this browser draws it (Phase 9, D245): a single-player Craft (src/core/craft.js) with no
// pilot, so the existing drawing, muzzle flashes, sounds, enemy pointers and radar plots show it as they show an AI
// aircraft. Nothing flies it here: each frame its pose comes from the smoothed snapshots (src/net/interpolation.js), its
// control surfaces and engine speed from the newest one, and its guns fire, for the eye and ear only, the rounds the
// server says it fired (src/net/netCombat.js). Its smoke, glycol and fire follow the snapshot's damage bits.

import { aircraftById } from '../aircraft/index.js';
import { createAircraft } from '../physics/flightModel.js';
import { Craft } from '../core/craft.js';
import { TEAMS } from '../mp/netConfig.js';

const RPM_TO_OMEGA = (2 * Math.PI) / 60;

export class RemoteAircraft {
  /** slot: the player's place in the room; who: { name, team, aircraft (id) }. */
  constructor(slot, who) {
    this.slot = slot;
    this.who = who;
    this.ac = aircraftById[who.aircraft] ?? aircraftById.hurricane;
    const plane = createAircraft(this.ac, { altitude: 2000 });
    this.craft = new Craft(this.ac, { plane, role: 'remote', label: who.name, side: TEAMS[who.team] ?? this.ac.side });
    this.craft.remote = this;
    this.owed = { mg: 0, cannon: 0, rear: 0 }; // rounds still to leave its guns (for the eye)
    this.rearAim = { az: Math.PI, el: 0 };
    this.spawn = null;
  }

  /** Brings the drawn aircraft to the track's pose (`track`: a RemoteTrack) and the newest sample's details. */
  update(track, dt) {
    const s = track.latest;
    const { plane } = this.craft;
    const b = plane.body;
    b.position.copy(track.position);
    b.quaternion.copy(track.quaternion);
    b.velocity.copy(s.velocity);
    // Drawn where it is: no blending with an earlier step (src/render/testView.js blends previous to now).
    this.craft.previous.position.copy(b.position);
    this.craft.previous.quaternion.copy(b.quaternion);
    Object.assign(plane.surfaces, s.surfaces);
    plane.engines.forEach((e, i) => { e.omega = (s.rpm[i] ?? s.rpm[0] ?? 0) * RPM_TO_OMEGA; });
    this.smoke(s.smoke);
    plane.time += dt;
  }

  /** The snapshot's damage bits as the effects read them: 1 a coolant leak, 2 an oil leak, 4 fire. */
  smoke(bits) {
    const { plane } = this.craft;
    for (const e of plane.engines) {
      e.heat.coolantLeak = bits & 1 ? 1 : 0;
      e.heat.coolantLeft = bits & 1 ? Math.max(e.heat.coolantLeft, 0.5) : e.heat.coolantLeft;
      e.heat.oilLeak = bits & 2 ? 1 : 0;
      e.heat.oilLeft = bits & 2 ? Math.max(e.heat.oilLeft, 0.5) : e.heat.oilLeft;
    }
    plane.damage.fire = bits & 4 ? (plane.damage.fire ?? { zone: null }) : null;
  }
}
