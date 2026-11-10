// A match on the room server (Phase 9, D243; after Dawn Patrol's src/mp/matchSim.js, with the product owner's
// approval): it flies every player's aircraft with the single-player flight model and guns, at 120 steps a second, from
// the controls each browser sends, and every 4th step makes each player a snapshot. No sockets and no timers of its
// own: the room calls advanceTo(now), so a whole match runs in a test.
//
// AI only in the Bf 110, for the seat its player isn't in (the product owner, 10 Nov 2026): with the player at the controls the
// server's AI gunner mans the rear MG 15 (src/ai/gunner.js); with the player on the gun (their controls' `seat`) the server's
// defensive AI pilot flies (src/ai/defensive.js) and their aim and trigger work the gun, as in single player (D234).
//
// Controls: a browser sends each tick's controls ahead of time; the control for tick T is used for the step that makes
// tick T. Late controls and controls more than a second ahead are dropped; a tick with none repeats the last (after a
// second with none, with stick and rudder centred). The server tells each player how early their controls arrive ("lead").
//
// Down: an aircraft shot down (broken up, pilot killed), crashed or bailed out of leaves the sky at once (the browsers
// draw the smoke where it went down) and its pilot is back 10 s later where the host's respawn setting says.

import { Quaternion, Vector3 } from 'three';
import { aircraftById } from '../aircraft/index.js';
import { createArmament } from '../weapons/guns.js';
import { Craft } from '../core/craft.js';
import { FRIENDLY_SKILL } from '../core/wingmen.js';
import { stepGunners } from '../ai/gunner.js';
import { recordTrack } from '../ai/perception.js';
import { DefensivePilot } from '../ai/defensive.js';
import { direction, anglesOf } from '../weapons/mounts.js';
import { crewHealth } from '../weapons/damage.js';
import { quantiseInput, compactOf, encodeSnapshot } from './binary.js';
import { captureState } from './planeState.js';
import { spawnPoint, spawnAircraft } from './spawn.js';
import { MatchCombat } from './matchCombat.js';
import { flyTick, gunSeatControls } from './flyTick.js';
import {
  TICK_HZ, TICK_MS, SNAPSHOT_EVERY, MAX_TICKS_PER_CALLBACK, INPUT_AHEAD_MAX, HANDS_OFF_TICKS, EMPTY_TEAM_S, END_CHECK_TICKS,
  TEAM_IDS,
} from './netConfig.js';

const DT = 1 / TICK_HZ;
const _dir = new Vector3();
const _inv = new Quaternion();
const BAIL_TICKS = TICK_HZ; // bail-out held this long, as single player (D80)
const TEAM_SIDE = { raf: 'RAF', luftwaffe: 'Luftwaffe' };

/** The aircraft data a match flies: with structural damage off, without the g and diving limits that break it. */
const aircraftFor = (id, settings) => {
  const ac = aircraftById[id] ?? aircraftById.hurricane;
  return settings.structuralDamage ? ac : { ...ac, limits: null };
};

export class MatchSim {
  /** settings: the host's; world: { terrain, starts(side) }; now: ms when the match starts; combat: MatchCombat options. */
  constructor({ settings, world, now = 0, combat = {} }) {
    this.settings = settings;
    this.world = world;
    this.startMs = now;
    this.tick = 0;
    this.players = new Map(); // player id -> pilot
    this.tallies = new Map(); // player id -> kills, deaths, shots, hits (kept if they leave and come back)
    this.roster = new Map(); // everyone who took part
    this.combat = new MatchCombat({ settings, terrain: world.terrain, ...combat });
    this.result = null;
    this.resultSent = false;
    this.emptySince = { raf: null, luftwaffe: null };
    // What the server's AI sees (src/ai/gunner.js, src/ai/defensive.js): the aircraft in the sky, the clock, the ground,
    // and where its rounds go (the gunner's count as the pilot's).
    this.view = {
      world, clock: 0, others: [],
      crafts: () => [...this.players.values()].filter((p) => !p.down).map((p) => p.craft),
      projectiles: { spawn: (round, owner) => this.rearRound(owner, round) },
    };
  }

  /** A player takes part (at the start, or joining or rejoining mid-match): spawns at once. p: { id, slot, name, team, aircraft }. */
  addPlayer(p, { start = false } = {}) {
    this.addPlayers([p], { start });
  }

  /** Several players at once: all join before any spawns, so an air start lines up each whole team. */
  addPlayers(list, { start = false } = {}) {
    const fresh = [];
    for (const p of list) {
      if (this.players.has(p.id)) continue;
      const pilot = { ...p, ac: aircraftFor(p.aircraft, this.settings), inputs: new Map(), last: null, viewTick: 0, heard: 0, spawn: 0, respawnAt: null, lead: 0 };
      this.players.set(p.id, pilot);
      this.roster.set(p.id, { id: p.id, name: p.name, team: p.team, aircraft: p.aircraft });
      this.combat.addPilot(pilot, this.tallies.get(p.id));
      this.tallies.set(p.id, pilot.tally);
      fresh.push(pilot);
    }
    for (const pilot of fresh) this.spawn(pilot, start ? this.settings.start : this.settings.respawn, start);
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  /** Into the air (or onto the apron): `where` 'air' or 'apron'; `start` at the match's start. */
  spawn(p, where, start = false) {
    const mates = [...this.players.values()].filter((q) => q.team === p.team).sort((a, b) => a.slot - b.slot);
    const enemies = [...this.players.values()].filter((q) => q.team !== p.team && !q.down && q.plane).map((q) => q.plane.body.position);
    const point = spawnPoint(this.world, p.team, mates.indexOf(p), { where, enemies, start, count: mates.length });
    const { plane, input } = spawnAircraft(p.ac, this.world, point);
    if (p.ac.engines) input.engines = [0, 1].map(() => ({ throttle: input.throttle, rpm: input.rpm }));
    p.plane = plane;
    p.armament = createArmament(p.ac);
    p.craft = new Craft(p.ac, { plane, input: { ...input }, side: TEAM_SIDE[p.team], label: p.name, skill: FRIENDLY_SKILL, role: 'player' });
    p.relief = null; // the AI pilot while the player is on the rear gun
    p.last = quantiseInput(input);
    p.spawn += 1;
    p.heard = this.tick; // a fresh aircraft holds its starting controls for a moment
    p.respawnAt = null;
    p.down = false;
    p.lastHit = null;
    p.bailHeld = 0;
    p.shotsSince = { mg: 0, cannon: 0 };
    p.rearSince = { shots: 0, az: 0, el: 0 }; // the rear gun's rounds since the last snapshot, and its last aim
    p.aiInput = null;
    p.history.clear();
  }

  /** Controls from a player's browser (decodeInputs's result). */
  receiveInputs(id, msg) {
    const p = this.players.get(id);
    if (!p || !msg) return;
    p.lead = msg.firstTick - this.tick - 1;
    msg.inputs.forEach((input, k) => {
      const tick = msg.firstTick + k;
      if (tick > this.tick && tick <= this.tick + INPUT_AHEAD_MAX) p.inputs.set(tick, { input: quantiseInput(input), view: msg.viewTick });
    });
  }

  /** Flies the ticks due by `now` (ms): { snapshots: [{ id, buffer }], notices, fx, score (or null), result (once) }. */
  advanceTo(now) {
    const due = Math.floor((now - this.startMs) / TICK_MS);
    let n = due - this.tick;
    if (n > MAX_TICKS_PER_CALLBACK) {
      this.startMs += (n - MAX_TICKS_PER_CALLBACK) * TICK_MS; // a stalled server drops the backlog
      n = MAX_TICKS_PER_CALLBACK;
    }
    const snapshots = [];
    for (let k = 0; k < n; k += 1) {
      this.step();
      if (this.tick % SNAPSHOT_EVERY === 0) snapshots.push(...this.snapshots());
    }
    const c = this.combat;
    const scoreDue = c.scoreChanged || (c.talliesChanged && this.tick - (this.scoreTick ?? -Infinity) >= TICK_HZ);
    const score = scoreDue ? c.score([...this.players.values()]) : null;
    if (scoreDue) {
      c.scoreChanged = false;
      c.talliesChanged = false;
      this.scoreTick = this.tick;
    }
    const result = this.result && !this.resultSent ? this.result : null;
    if (result) this.resultSent = true;
    return { snapshots, notices: c.notices.splice(0), fx: c.fx.splice(0), score, result };
  }

  /** One tick for everyone. */
  step() {
    this.tick += 1;
    const t = this.tick;
    this.view.clock = t / TICK_HZ;
    const pilots = [...this.players.values()];
    for (const p of pilots) {
      const got = p.inputs.get(t);
      let input;
      if (got) {
        input = got.input;
        p.viewTick = got.view;
        p.heard = t;
      } else if (t - p.heard > HANDS_OFF_TICKS) input = { ...p.last, pitch: 0, roll: 0, yaw: 0, fireMg: false, fireCannon: false, bailOut: false };
      else input = p.last;
      p.inputs.delete(t);
      p.last = input;
      if (p.down) {
        if (t >= p.respawnAt) this.spawn(p, this.settings.respawn);
        continue;
      }
      this.fly(p, input, t);
    }
    // The Bf 110s' rear guns, once every aircraft has moved: the AI gunner's, or the player's own aim and trigger.
    for (const p of pilots) if (!p.down && p.craft.gunnery) stepGunners(p.craft, this.view, DT, p);
    this.combat.moveRounds(t, pilots);
    for (const p of pilots) if (!p.down) this.checkDown(p, t);
    if (t % END_CHECK_TICKS === 0) this.checkEnd(t);
  }

  /** One pilot's aircraft for one tick: who flies it, the guns, then the flight. */
  fly(p, input, t) {
    const { plane } = p;
    input = this.seat(p, input);
    const rewind = t - (p.viewTick || t);
    const fired = { mg: 0, cannon: 0 };
    flyTick(plane, p.armament, input, DT, (round) => {
      this.combat.fire(p, round, rewind);
      fired[round.ballistics === 'mgffm' || /20/.test(round.kind) ? 'cannon' : 'mg'] += 1;
    });
    p.shotsSince.mg += fired.mg;
    p.shotsSince.cannon += fired.cannon;
    p.history.record(t, plane.body);
    recordTrack(p.craft, t / TICK_HZ);
    p.bailHeld = input.bailOut ? p.bailHeld + 1 : 0;
  }

  /**
   * The controls the aircraft flies with this tick. On the Bf 110's rear gun (input.seat 'gunner', its gunner fit to
   * man it) the AI pilot flies, as in single player (src/core/crewSeat.js), and the player's aim and trigger go to the
   * gun; back at the controls, the AI gunner mans it again.
   */
  seat(p, input) {
    const crew = p.craft.gunnery;
    const gun = crew?.mounts.find((m) => !m.spec.fixed);
    const onGun = input.seat === 'gunner' && gun && crewHealth(p.plane, gun.spec.gunner) > 0;
    if (!onGun) {
      p.relief = null;
      p.aiInput = null;
      if (crew) crew.manned = null;
      p.craft.input = input;
      return input;
    }
    if (!p.relief) {
      // The AI pilot takes over the controls as the player left them, in an input of its own.
      p.relief = new DefensivePilot({ skill: FRIENDLY_SKILL });
      p.aiInput = { ...input, engines: input.engines?.map((e) => ({ ...e })) };
    }
    const ai = p.aiInput;
    p.craft.input = ai;
    if (p.plane.damage.pilot > 0) p.relief.fly(p.craft, this.view, DT);
    gunSeatControls(ai, input);
    crew.manned = { seat: gun.spec.gunner, aim: direction(input.gunAz, input.gunEl), trigger: input.gunTrigger };
    return ai;
  }

  /** A round from pilot p's rear gun (the AI gunner's, or the player's own on it): no rewind; its aim noted for the others' tracers. */
  rearRound(p, round) {
    this.combat.fire(p, round, 0);
    const v = p.plane.body.velocity;
    _dir.set(round.velocity.x - v.x, round.velocity.y - v.y, round.velocity.z - v.z).applyQuaternion(_inv.copy(p.plane.body.quaternion).invert());
    const { az, el } = anglesOf(_dir);
    Object.assign(p.rearSince, { shots: p.rearSince.shots + 1, az, el });
  }

  /** Is p's aircraft lost? Broken up, its pilot killed, crashed, or bailed out of. */
  checkDown(p, t) {
    const { plane } = p;
    const d = plane.damage;
    const reason = plane.ground.crash ? 'crashed' : d.failed ? d.failed.cause : d.pilot <= 0 ? 'pilot killed' : p.bailHeld >= BAIL_TICKS ? 'bailed out' : null;
    if (reason) this.combat.goDown(p, t, reason);
  }

  /** Is the match over? (Once a second.) The score limit, the time limit, or a team gone for EMPTY_TEAM_S. */
  checkEnd(t) {
    if (this.result) return;
    const { teams } = this.combat;
    const limit = this.settings.scoreLimit;
    if (teams.raf >= limit || teams.luftwaffe >= limit) return this.finish('score');
    if (t >= this.settings.timeLimit * 60 * TICK_HZ) return this.finish('time');
    for (const team of TEAM_IDS) {
      if ([...this.players.values()].some((p) => p.team === team)) this.emptySince[team] = null;
      else {
        this.emptySince[team] ??= t;
        if (t - this.emptySince[team] >= EMPTY_TEAM_S * TICK_HZ) return this.finish('left', team);
      }
    }
    return undefined;
  }

  /** Ends the match: { winner, reason, leftTeam, scoreLimit, teams, seconds, players: [...] }. */
  finish(reason, leftTeam = null) {
    if (this.result) return this.result;
    const teams = { ...this.combat.teams };
    let winner = teams.raf > teams.luftwaffe ? 'raf' : teams.luftwaffe > teams.raf ? 'luftwaffe' : 'draw';
    if (reason === 'left') winner = TEAM_IDS.find((x) => x !== leftTeam);
    this.result = {
      winner, reason, leftTeam, scoreLimit: this.settings.scoreLimit, teams, seconds: Math.round(this.tick / TICK_HZ),
      players: [...this.roster.values()].map((r) => ({ ...r, ...(this.tallies.get(r.id) ?? { kills: 0, deaths: 0, shots: 0, hits: 0 }) })),
    };
    return this.result;
  }

  /**
   * A snapshot for each player: their own aircraft exactly (with, besides its state: whether it is down, the AI
   * pilot's controls while they are on the rear gun, and the rear gun's rounds), the others compactly.
   */
  snapshots() {
    const all = [...this.players.values()];
    const compact = all.map((p) => {
      const rearGun = p.rearSince.shots ? { ...p.rearSince } : null;
      const c = compactOf(p.slot, p.spawn, p.plane, { down: p.down, shots: p.shotsSince, rearGun });
      p.shotsSince = { mg: 0, cannon: 0 };
      p.rearSince.shots = 0;
      return c;
    });
    return all.map((p, i) => {
      const { numbers, rest } = captureState(p.plane, p.armament);
      Object.assign(rest, { down: p.down, ai: p.aiInput, rearGun: compact[i].rearGun });
      return {
        id: p.id,
        buffer: encodeSnapshot({ tick: this.tick, lead: p.lead, you: { slot: p.slot, spawn: p.spawn, numbers, rest }, others: compact.filter((_, k) => k !== i) }),
      };
    });
  }
}
