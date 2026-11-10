// One match as this browser sees it (Phase 9, D245; after Dawn Patrol's src/net/netFlight.js, with the product owner's
// approval, flying this game's Simulation). The page's own Simulation flies your aircraft, so every view, panel, sight,
// sound and warning works as in single player; while a match is on its physics step is this one (`sim.net`,
// src/core/simulation.js):
//   - your controls, after your own assists (engine management and the auto-rudder, as single player applies them),
//     rounded as they are sent, fly your aircraft at once with the server's own steps (src/mp/flyTick.js), and go to
//     the server four ticks to a message;
//   - each snapshot's exact state for your aircraft is compared with what was flown here for that tick, and a
//     difference is corrected (src/net/prediction.js);
//   - on the Bf 110's rear gun (Tab), your aim and trigger go to the server, whose AI pilot flies: its controls come back
//     in each snapshot and fly the prediction here, and the gun fires here at once for your eyes;
//   - the other players' aircraft are drawn smoothly a little in the past (src/net/interpolation.js), as single-player
//     Crafts in sim.others (src/net/remoteCraft.js), and their guns fire what the server says (src/net/netCombat.js);
//   - going down, the loss shows as in single player (the wreck, or the aircraft flying on out of control); a new spawn
//     number in a snapshot puts you back in the air (or on the apron).

import { NetClock } from './clock.js';
import { Prediction } from './prediction.js';
import { RemoteTrack, RenderClock, toSample } from './interpolation.js';
import { NetCombat } from './netCombat.js';
import { RemoteAircraft } from './remoteCraft.js';
import { flyTick, gunSeatControls } from '../mp/flyTick.js';
import { restoreState, onGroundIn } from '../mp/planeState.js';
import { quantiseInput, encodeInputs, decodeSnapshot } from '../mp/binary.js';
import { AIR_SPAWN, RESPAWN_S, INPUTS_PER_MESSAGE, INTERP_DELAY_MS, INTERP_DELAY_MAX_MS, TICK_HZ, LEAD_TARGET_TICKS } from '../mp/netConfig.js';
import { anglesOf } from '../weapons/mounts.js';
import { crewHealth } from '../weapons/damage.js';
import { stepGunners } from '../ai/gunner.js';
import { recordTrack } from '../ai/perception.js';
import { manageEngine, assistedYaw, warnings } from '../core/assists.js';
import { losePlayer, stepPlayerLoss, stepFalling } from '../core/losses.js';
import { playerBailout, stepBailouts, playerLanding } from '../core/bailout.js';
import { swapSeat, rearGun } from '../core/crewSeat.js';

const DT = 1 / TICK_HZ;

export class NetFlight {
  /**
   * send(ArrayBuffer); lookup(slot): { name, team, aircraft } or null; ping() / jitter(): ms; now(): ms;
   * onReady() and onRespawn(): your aircraft has (re)appeared; notice(text): the message line.
   */
  constructor({ send, lookup, ping = () => 0, jitter = () => 0, now = () => performance.now(), onReady = () => {}, onRespawn = () => {}, notice = () => {} }) {
    Object.assign(this, { send, lookup, ping, jitter, now, onReady, onRespawn, notice });
    this.clock = new NetClock();
    this.render = new RenderClock({ delayMs: INTERP_DELAY_MS, maxDelayMs: INTERP_DELAY_MAX_MS });
    this.remotes = new Map(); // slot -> { track: RemoteTrack, remote: RemoteAircraft }
    this.sim = null;
    this.prediction = null;
    this.combat = null;
    this.ready = false;
    this.spawn = null;
    this.down = false;
    this.downAt = null; // ms, when your aircraft was lost (for "back in the air in 7 s")
    this.ai = null; // the server's AI pilot's controls while you are on the rear gun
    this.mySlot = 0;
    this.pending = []; // controls not yet sent
    this.pendingFrom = 0;
    this.serverTick = 0;
    this.lastFrame = -Infinity;
  }

  get timeScale() {
    return this.clock.timeScale;
  }

  /** Takes over the physics step of the page's Simulation `sim` (already reset in your aircraft) until detach(). */
  attach(sim) {
    this.sim = sim;
    sim.net = this;
    sim.others = [];
    this.prediction = new Prediction({ own: sim, fly: (t, input) => this.flyOwn(input, false) });
    this.combat = new NetCombat({ sim, notice: this.notice, now: this.now });
  }

  detach() {
    if (this.sim?.net === this) this.sim.net = null;
    if (this.sim) this.sim.others = [];
  }

  /** A snapshot from the server. */
  receive(buffer) {
    const snap = decodeSnapshot(buffer);
    if (!snap || !this.sim) return;
    const now = this.now();
    this.serverTick = snap.tick;
    this.render.arrived(snap.tick, now);
    const drawing = now - this.lastFrame < 250; // a hidden tab draws nothing: nothing to fade then
    const seen = new Set();
    for (const c of snap.others) {
      const entry = this.remoteFor(c.slot);
      if (!entry) continue;
      seen.add(c.slot);
      const r = entry.remote;
      if (c.spawn !== r.spawn) {
        // Back in the air (or new): its old path and wreck are forgotten.
        r.spawn = c.spawn;
        r.fallen = false;
        r.craft.plane.damage.failed = null;
      }
      entry.track.push(toSample(snap.tick, c), drawing);
      r.down = c.down;
      if (!c.down) this.combat.shots(r, c.shots, c.rearGun);
    }
    for (const slot of this.remotes.keys()) if (!seen.has(slot)) this.remotes.delete(slot); // gone from the match
    if (snap.you) this.ownState(snap);
  }

  /** The remote aircraft in `slot`, made when first seen (or when its player changed fighter); null if unknown yet. */
  remoteFor(slot) {
    const who = this.lookup(slot);
    if (!who) return null;
    let entry = this.remotes.get(slot);
    if (!entry || entry.remote.who.aircraft !== who.aircraft) {
      entry = { track: new RemoteTrack(), remote: new RemoteAircraft(slot, who) };
      this.combat.arm(entry.remote);
      this.remotes.set(slot, entry);
    }
    return entry;
  }

  /** Your own aircraft in a snapshot. */
  ownState(snap) {
    const { tick, you } = snap;
    const state = { numbers: you.numbers, rest: you.rest };
    this.mySlot = you.slot;
    this.ai = you.rest.ai ?? null;
    if (!this.ready || you.spawn !== this.spawn) {
      // The first sight of your aircraft, or a new one after going down: take the server's state, then run on to
      // your own clock.
      const first = !this.ready;
      if (first) this.clock.start(tick, this.ping());
      this.spawn = you.spawn;
      this.down = false;
      this.placeOwn(state);
      this.prediction.clear();
      this.prediction.history.set(tick, { input: this.controls(), state });
      this.prediction.replay(tick, this.clock.tick);
      this.pendingFrom = this.clock.tick + 1;
      this.pending = [];
      this.ready = true;
      if (first) this.onReady();
      else this.onRespawn();
      return;
    }
    const jump = this.clock.onLead(snap.lead, this.jitter());
    if (jump) this.jumpClock(jump);
    if (tick > this.clock.tick) this.jumpClock(tick + LEAD_TARGET_TICKS - this.clock.tick); // fell behind the server
    if (you.rest.down) {
      if (!this.down) this.goDown(state);
      return;
    }
    if (this.sim.crashed) return; // the pilot has jumped here: the server will say so next
    this.prediction.onServerState(tick, state, this.clock.tick, Boolean(jump));
    if (you.rest.rearGun && this.sim.seat !== 'gunner') this.combat.owedOwnRear(you.rest.rearGun);
  }

  /** A fresh aircraft at the server's state: on the apron (engines running, as the server's) or in the air. */
  placeOwn(state) {
    const sim = this.sim;
    const net = sim.net;
    sim.net = null; // the reset is single player's own
    const grounded = onGroundIn(state.numbers, sim.plane.engines.length);
    sim.mode = grounded ? 'ground' : 'air';
    sim.startOverride = grounded ? null : { altitude: AIR_SPAWN.altitude };
    sim.reset(sim.ac);
    for (const e of sim.input.engines ?? []) e.failed = false;
    restoreState(sim.plane, state, sim.armament);
    sim.copyPose(sim.previous);
    sim.others = [];
    sim.ownRear = null;
    sim.net = net;
    this.downAt = null;
  }

  /** The server says you are down: the loss as single player shows it (the wreck falls, or the aircraft flies on). */
  goDown(state) {
    const sim = this.sim;
    this.down = true;
    if (sim.crashed) return; // already lost here (the pilot has jumped): the server agrees
    restoreState(sim.plane, state, sim.armament);
    if (sim.plane.ground.crash || sim.plane.damage.failed) losePlayer(sim);
    else {
      sim.crashed = true;
      sim.crashCause = sim.plane.damage.pilot <= 0 ? 'pilot killed' : 'bailed out';
      sim.uncontrolled = { ...sim.input, fireMg: false, fireCannon: false };
    }
  }

  /** Moves the clock by `ticks` (rare: the connection changed a lot). Unsent controls go first. */
  jumpClock(ticks) {
    this.flush();
    this.clock.tick += ticks;
    this.pendingFrom = this.clock.tick + 1;
  }

  /**
   * The controls you send for this tick, rounded: your stick, levers and switches after your own assists; on the rear
   * gun, your aim (from the gun view) and trigger.
   */
  controls() {
    const sim = this.sim;
    const raw = sim.input;
    const onGun = sim.seat === 'gunner';
    if (!onGun) manageEngine(sim.ac, sim.plane, raw, sim.assists);
    const c = { ...raw, engines: raw.engines?.map((e) => ({ ...e })) };
    if (onGun) {
      const { az, el } = anglesOf(sim.gunControl.aim ?? rearGun(sim).bore);
      Object.assign(c, { seat: 'gunner', gunAz: az, gunEl: el, gunTrigger: !!sim.gunControl.trigger });
    } else c.yaw = assistedYaw(sim.plane, raw, sim.assists);
    return quantiseInput(c);
  }

  /** One tick of your aircraft with `input` (as the server flies it); `effects`: its rounds drawn (not when replaying). */
  flyOwn(input, effects) {
    const sim = this.sim;
    let flown = input;
    if (input.seat === 'gunner' && this.gunnerFit()) {
      const ai = this.ai ?? input;
      flown = gunSeatControls({ ...ai, engines: ai.engines?.map((e) => ({ ...e })) }, input);
    }
    flyTick(sim.plane, sim.armament, flown, DT, effects ? (round) => sim.projectiles.spawn(round, sim) : undefined);
  }

  /** Can the Bf 110's gunner man the rear gun (as the server decides)? */
  gunnerFit() {
    const gun = rearGun(this.sim);
    return !!gun && crewHealth(this.sim.plane, gun.spec.gunner) > 0;
  }

  /** One physics step (the Simulation's, while a match is on). */
  step() {
    const sim = this.sim;
    if (!this.ready) return;
    sim.clock += DT;
    sim.copyPose(sim.previous);
    if (sim.seat === 'gunner' && !this.gunnerFit()) {
      swapSeat(sim);
      sim.notice = { text: 'The rear gun is out of action: back in the pilot\'s seat', until: sim.plane.time + 3 };
    }
    const input = this.controls();
    const t = this.clock.tick + 1;
    this.clock.tick = t;
    // Bailing out, as single player (src/core/bailout.js): the crew go at their exit times and the view follows the
    // pilot down under his parachute; the server counts the aircraft lost as he jumps.
    playerBailout(sim, DT);
    if (sim.crashed && this.downAt === null) this.downAt = this.now();
    if (this.down || sim.crashed) stepPlayerLoss(sim, DT);
    else {
      this.flyOwn(input, true);
      this.prediction.record(t, input);
      this.rearGunHere();
      sim.warnings = warnings(sim.ac, sim.plane, sim.assists);
      recordTrack(sim.player, sim.clock);
      sim.reportDamage();
    }
    // The rounds drawn here fly on (no hits: the server's strikes show those); falling wrecks fall.
    sim.projectiles.step(DT, sim.world.terrain);
    stepFalling(sim, DT);
    stepBailouts(sim, DT);
    playerLanding(sim);
    if (!this.pending.length) this.pendingFrom = t;
    this.pending.push(input);
    if (this.pending.length >= INPUTS_PER_MESSAGE) this.flush();
  }

  /** Your Bf 110's rear gun, for your eyes: fired here at once while you man it; else as the server's AI gunner fired. */
  rearGunHere() {
    const sim = this.sim;
    if (!sim.player.gunnery) return;
    if (sim.seat === 'gunner') {
      const view = { projectiles: sim.projectiles, crafts: () => [], clock: sim.clock };
      sim.player.gunnery.manned.aim.copy(sim.gunControl.aim ?? rearGun(sim).bore);
      sim.player.gunnery.manned.trigger = !!sim.gunControl.trigger;
      stepGunners(sim.player, view, DT, sim);
    } else this.combat.ownRear(DT);
  }

  flush() {
    if (!this.pending.length) return;
    this.send(encodeInputs(this.pendingFrom, Math.max(0, Math.round(this.render.tickAt())), this.pending));
    this.pending = [];
  }

  /** Once a frame: fade corrections; move the other aircraft to where they are drawn now; their guns fire. */
  frame(realDt) {
    if (!this.sim) return;
    this.prediction?.fade(realDt);
    const now = this.now();
    this.lastFrame = now;
    this.render.advance(realDt, now);
    const tick = this.render.tickAt();
    const flying = [];
    for (const { track, remote } of this.remotes.values()) {
      if (!track.latest) continue;
      track.update(tick, realDt);
      if (remote.fallen || track.latest.down) continue;
      remote.update(track, realDt);
      flying.push(remote);
    }
    this.combat.frame(flying, realDt);
    this.sim.others = flying.map((r) => r.craft);
  }

  /** The server's events (strikes, aircraft down). */
  onFx(list) {
    const bySlot = new Map([...this.remotes.values()].map((e) => [e.remote.slot, e.remote]));
    this.combat?.impacts(list, this.mySlot, bySlot);
  }

  /** Your aircraft as drawn: its pose plus the fading correction. */
  smoothOwn(position, quaternion) {
    if (!this.down) this.prediction?.shown(position, quaternion);
  }

  /** The other players' aircraft as drawn: [{ craft, name, team }] (for the name tags). */
  drawn() {
    return this.sim.others.map((craft) => ({ craft, name: craft.remote.who.name, team: craft.remote.who.team }));
  }

  /** While your aircraft is lost: when you are back (the message line's ending, in place of single player's restart). */
  respawnText() {
    const left = this.downAt === null ? RESPAWN_S : RESPAWN_S - (this.now() - this.downAt) / 1000;
    return left > 0.5 ? `back in the air in ${Math.ceil(left)} s` : 'back in the air shortly';
  }

  /** Numbers for the F3 panel. */
  debugLines() {
    const ping = this.ping();
    return [
      `net  ping ${ping === null ? '-' : Math.round(ping)} ms  jitter ${Math.round(this.jitter() ?? 0)} ms  lead ${this.clock.lead.toFixed(1)}  clock x${this.clock.timeScale.toFixed(2)}`,
      `net  corrections ${this.prediction?.corrections ?? 0} (last ${(this.prediction?.lastError ?? 0).toFixed(2)} m)  others ${Math.round(this.render.delayMs)} ms behind  tick ${this.clock.tick} (server ${this.serverTick})`,
    ];
  }
}
