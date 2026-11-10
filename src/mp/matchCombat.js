// The fighting in a match, on the server (Phase 9, D243; after Dawn Patrol's src/mp/matchCombat.js, with the product
// owner's approval, using this game's guns, rounds, hit zones and damage): the rounds in the air and every hit, decided
// here and only here. A round fired at tick T by a player whose screen showed the others at tick V is tested, all its
// flight, against the targets as they were (T - V) ticks earlier, up to MAX_REWIND_TICKS ("favour the shooter"). The
// Bf 110's rear gunner, the server's own AI, sees the present (no rewind). Hits damage the part they strike (the single
// player damage model, src/weapons/damage.js, with the server's random numbers); an aircraft lost is down, and the
// last enemy to hit it in the last KILL_CREDIT_S seconds gets the kill.

import { Vector3 } from 'three';
import { ballistics } from '../aircraft/ammunition.js';
import { stepRound } from '../weapons/ballistics.js';
import { firstHit } from '../weapons/hitZones.js';
import { applyHit } from '../weapons/damage.js';
import { PoseHistory } from './history.js';
import { TICK_HZ, MAX_REWIND_TICKS, KILL_CREDIT_S, RESPAWN_S, FX_MAX } from './netConfig.js';

const DT = 1 / TICK_HZ;
const MAX_AGE = 5; // s, as single player's rounds (src/weapons/projectiles.js)
const _from = new Vector3();
const _to = new Vector3();
const _start = new Vector3();

export class MatchCombat {
  /** settings: the match's (friendly fire); terrain: the ground rounds stop in; rng: damage dice; maxRewind: ticks allowed. */
  constructor({ settings, terrain = null, rng = Math.random, maxRewind = MAX_REWIND_TICKS }) {
    this.settings = settings;
    this.terrain = terrain;
    this.rng = rng;
    this.maxRewind = maxRewind;
    this.rounds = [];
    this.fx = []; // [kind, x, y, z, victimSlot] since the last send
    this.notices = []; // { to: player id | 'all', except?, text }
    this.teams = { raf: 0, luftwaffe: 0 };
    this.scoreChanged = true;
    this.talliesChanged = false;
    this.tick = 0;
  }

  /** A pilot joins (their tallies kept if they come back in the same match). */
  addPilot(p, tally = null) {
    p.tally = tally ?? { kills: 0, deaths: 0, shots: 0, hits: 0 };
    p.history = new PoseHistory();
    this.scoreChanged = true;
  }

  /** A round leaves a gun of pilot p (`round` as the guns emit it), tested `rewind` ticks back. */
  fire(p, round, rewind) {
    this.rounds.push({
      p: { x: round.position.x, y: round.position.y, z: round.position.z },
      v: { x: round.velocity.x, y: round.velocity.y, z: round.velocity.z },
      start: { x: round.position.x, y: round.position.y, z: round.position.z },
      b: ballistics[round.ballistics], kind: round.kind, owner: p, rewind: Math.max(0, Math.min(this.maxRewind, rewind)), age: 0,
    });
    p.tally.shots += 1;
    this.talliesChanged = true;
  }

  /** What a round with this rewind can strike this tick: every other aircraft flying, where it was `rewind` ticks ago. */
  targetsFor(rewind, pilots) {
    const list = this.targets.get(rewind) ?? [];
    if (!this.targets.has(rewind)) {
      for (const q of pilots) {
        if (q.down) continue;
        const pose = q.history.at(this.tick - rewind);
        if (pose) list.push({ pilot: q, ac: q.ac, body: pose });
      }
      this.targets.set(rewind, list);
    }
    return list;
  }

  /** Moves every round one tick and deals with what it strikes. */
  moveRounds(tick, pilots) {
    this.tick = tick;
    this.targets = new Map();
    const keep = [];
    for (const r of this.rounds) {
      _from.set(r.p.x, r.p.y, r.p.z);
      stepRound(r.b, r.p, r.v, DT);
      r.age += DT;
      if (r.age > MAX_AGE) continue;
      if (this.terrain && r.p.y < this.terrain.surfaceAt(r.p.x, r.p.z).height) continue;
      _to.set(r.p.x, r.p.y, r.p.z);
      const struck = this.strike(r, pilots);
      if (struck) {
        this.hit(struck, r, tick);
        continue;
      }
      keep.push(r);
    }
    this.rounds = keep;
  }

  /** The first aircraft a round strikes this tick, as single player's test (src/weapons/projectiles.js). */
  strike(r, pilots) {
    const friendly = this.settings.friendlyFire;
    let best = null;
    for (const t of this.targetsFor(r.rewind, pilots)) {
      if (t.pilot === r.owner || (!friendly && t.pilot.team === r.owner.team)) continue;
      _start.copy(_from).addScaledVector(t.body.velocity, DT);
      const hit = firstHit(t.ac, t.body, _start, _to);
      if (hit && (!best || hit.at < best.hit.at)) best = { target: t, hit };
    }
    return best;
  }

  hit({ target, hit }, r, tick) {
    const victim = target.pilot;
    const shooter = r.owner;
    const body = victim.plane.body;
    const velocity = new Vector3(r.v.x, r.v.y, r.v.z).sub(target.body.velocity);
    applyHit(victim.plane, { zone: hit.zone, point: hit.point, kind: r.kind, velocity, owner: shooter }, this.rng);
    this.addFx('hit', hit.point?.x ?? body.position.x, hit.point?.y ?? body.position.y, hit.point?.z ?? body.position.z, victim.slot);
    shooter.tally.hits += 1;
    this.talliesChanged = true;
    if (victim.team !== shooter.team) victim.lastHit = { by: shooter, tick };
  }

  /** A pilot is down (shot down, crashed, broken up or bailed out): someone may get the kill. */
  goDown(p, tick, reason) {
    if (p.down) return;
    p.down = true;
    p.respawnAt = tick + RESPAWN_S * TICK_HZ;
    p.tally.deaths += 1;
    const s = p.plane.body.position;
    this.addFx('down', s.x, s.y, s.z, p.slot);
    const last = p.lastHit;
    const by = last && tick - last.tick <= KILL_CREDIT_S * TICK_HZ ? last.by : null;
    if (by) {
      by.tally.kills += 1;
      this.teams[by.team] += 1;
      this.notices.push({ to: 'all', except: [p.id, by.id], text: `${by.name} shot down ${p.name} (${reason})` });
      this.notices.push({ to: by.id, text: `You shot down ${p.name} (${reason})` });
      this.notices.push({ to: p.id, text: `You were shot down by ${by.name} (${reason})` });
    } else {
      this.notices.push({ to: 'all', except: [p.id], text: `${p.name} went down (${reason})` });
      this.notices.push({ to: p.id, text: `You went down (${reason})` });
    }
    this.notices.push({ to: p.id, text: `Back in the air in ${RESPAWN_S} s` });
    this.scoreChanged = true;
  }

  addFx(kind, x, y, z, slot) {
    if (this.fx.length < FX_MAX) this.fx.push([kind, Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(z * 10) / 10, slot]);
  }

  /** The score, for everyone: { teams, players: [{ id, kills, deaths, shots, hits }] }. */
  score(pilots) {
    return { teams: { ...this.teams }, players: pilots.map((p) => ({ id: p.id, ...p.tally })) };
  }
}
