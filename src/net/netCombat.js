// The fighting as this browser shows it in a match (Phase 9, D245; after Dawn Patrol's src/net/netCombat.js, with the
// product owner's approval, using this game's guns and effects). Only the server's rounds count: everything here is for
// the eye and the ear, put into the single-player lists the drawing and sound already read:
//   - your own fixed guns fire at once as you fly (src/net/netFlight.js puts their rounds in sim.projectiles);
//   - the others' guns: each snapshot says how many rounds an aircraft fired since the last; its own guns (the
//     single-player ones, at their real rates and belts) fire that many over the next frames, from where it is drawn,
//     with their flashes, tracers and sound. The Bf 110's rear gun likewise, along the aim the server reports;
//   - your own Bf 110's rear gun while the AI gunner mans it, in the same way;
//   - the server's strikes become hit flashes (sim.hitEvents), with "You are hit!" when it was you;
//   - another aircraft going down leaves the sky as a falling wreck.
// No hits are decided here: the rounds drawn pass through aircraft (the server's strikes show where they hit).

import { stepGuns } from '../weapons/guns.js';
import { aimMount, stepMount, direction } from '../weapons/mounts.js';
import { common } from '../aircraft/common.js';
import { fall } from '../core/losses.js';
import { HIT_NOTICE_S } from '../mp/netConfig.js';
import { Vector3 } from 'three';

const PLENTY = 1e6; // the others' rounds as drawn here: they never run out (the server counts the real ones)
const _aim = new Vector3();

/** A craft's flexible gun (the Bf 110's MG 15), or null. */
const rearMount = (craft) => craft.gunnery?.mounts.find((m) => !m.spec.fixed) ?? null;

export class NetCombat {
  /** sim: the page's Simulation (its rounds, hit flashes and falling wrecks); notice(text); now() (ms). */
  constructor({ sim, notice = () => {}, now = () => performance.now() }) {
    Object.assign(this, { sim, notice, now });
    this.lastHitNotice = -Infinity;
  }

  /** A remote aircraft's guns as drawn here: plenty of rounds, so they fire whatever the server says. */
  arm(remote) {
    for (const gun of remote.craft.armament) gun.rounds = PLENTY;
    const m = rearMount(remote.craft);
    if (m) Object.assign(m, { rounds: PLENTY, drums: 0 });
  }

  /** Rounds `remote` fired since the last snapshot: { mg, cannon } and its rear gun's { az, el, shots } (or null). */
  shots(remote, shots, rearGun) {
    remote.owed.mg += shots.mg;
    remote.owed.cannon += shots.cannon;
    if (rearGun) {
      remote.owed.rear += rearGun.shots;
      remote.rearAim = rearGun;
    }
  }

  /** Once a frame: the owed rounds leave the remote aircraft's guns at their own rates. */
  frame(remotes, dt) {
    for (const r of remotes) {
      const { craft } = r;
      const owed = r.owed;
      if (owed.mg > 0 || owed.cannon > 0) {
        const input = { fireMg: owed.mg > 0, fireCannon: owed.cannon > 0 };
        stepGuns(craft.armament, craft.plane, input, dt, craft.plane.time, (round) => {
          const group = round.ballistics === 'mgffm' ? 'cannon' : 'mg';
          if (owed[group] <= 0) return;
          owed[group] -= 1;
          this.sim.projectiles.spawn(round, craft);
        });
      }
      this.fireRear(craft, owed, r.rearAim, dt);
    }
  }

  /** A rear gun fires its owed rounds along `aim` ({ az, el }, the aircraft's axes). */
  fireRear(craft, owed, aim, dt) {
    const m = rearMount(craft);
    if (!m || owed.rear <= 0) return;
    aimMount(m, direction(aim.az, aim.el, _aim), 10); // straight to the reported aim
    stepMount(m, craft.plane, dt, craft.plane.time, true, common.gunners.drumChange, (round) => {
      if (owed.rear <= 0) return;
      owed.rear -= 1;
      this.sim.projectiles.spawn(round, craft);
    });
  }

  /** Your own Bf 110's rear gun while the AI gunner mans it: the rounds the server says it fired ({ az, el, shots }). */
  owedOwnRear(rearGun) {
    const sim = this.sim;
    sim.ownRear ??= { mg: 0, cannon: 0, rear: 0 };
    sim.ownRear.rear += rearGun.shots;
    sim.ownRearAim = rearGun;
  }

  /** Each tick: those rounds leave the gun at its own rate. */
  ownRear(dt) {
    const sim = this.sim;
    if (sim.ownRear && sim.ownRearAim) this.fireRear(sim.player, sim.ownRear, sim.ownRearAim, dt);
  }

  /** The server's events: [kind, x, y, z, victim's slot, round kind or reason]. mySlot: yours; remotes: by slot. */
  impacts(list, mySlot, remotes) {
    for (const [kind, x, y, z, slot, what] of list) {
      const point = new Vector3(x, y, z);
      if (kind === 'hit') {
        const victim = slot === mySlot ? this.sim.plane : remotes.get(slot)?.craft.plane;
        this.sim.hitEvents.push({ point, kind: what ?? 'ball303', velocity: victim ? victim.body.velocity.clone() : new Vector3() });
        if (slot === mySlot && this.now() - this.lastHitNotice > HIT_NOTICE_S * 1000) {
          this.lastHitNotice = this.now();
          this.notice('You are hit!');
        }
      } else if (kind === 'down' && slot !== mySlot) {
        const r = remotes.get(slot);
        if (r && !r.fallen) this.goDown(r, what);
      }
    }
  }

  /** Another aircraft is down: it falls as a wreck from where it is drawn, and leaves the sky until it respawns. */
  goDown(remote, reason) {
    remote.fallen = true;
    const plane = remote.craft.plane;
    plane.damage.failed = { cause: reason ?? 'down', parts: [] };
    if (reason !== 'crashed') fall(this.sim, plane);
  }
}
