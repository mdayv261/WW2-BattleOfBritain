// Visible damage (Phase 5 checkpoint 5, D69): glycol vapour, oil, engine smoke and fire trailing from damaged aircraft
// (what src/weapons/effects.js says each gives off), flashes and puffs where rounds strike, and a fireball and a column of
// smoke where an aircraft hits the ground. Particles are laid in the air along the path the emitter took since the last
// frame, nearly still, so the aircraft flies away from them and leaves a trail. All looks below are display choices.

import * as THREE from 'three';
import { ParticlePool } from './particles.js';
import { damageSources } from '../weapons/effects.js';

const c = (hex) => new THREE.Color(hex);

// Trails, per emitter type at full strength: particles per second, and how each particle looks. `carry` is the share of
// the aircraft's velocity a particle leaves with (the air then slows it, by `drag` per second).
const TRAILS = {
  glycol: { rate: 45, pool: 'smoke', life: 2.5, size: [0.4, 4.5], colour: c(0xf2f4f6), alpha: 0.55, carry: 0.25, drag: 2, rise: 0.3, jitter: 1 },
  oil: { rate: 25, pool: 'smoke', life: 1.2, size: [0.2, 1.6], colour: c(0x3a3530), alpha: 0.45, carry: 0.25, drag: 2, rise: 0, jitter: 0.5 },
  engineSmoke: { rate: 40, pool: 'smoke', life: 4, size: [0.6, 6], colour: c(0x8c8c8c), dark: c(0x262626), alpha: 0.6, carry: 0.25, drag: 1.5, rise: 0.5, jitter: 1 },
  fire: { rate: 30, pool: 'smoke', life: 5, size: [1, 8], colour: c(0x1c1c1c), alpha: 0.75, carry: 0.25, drag: 1.5, rise: 1, jitter: 1.5 },
};
// Flames at a fire: short-lived glowing sprites streaming back from it.
const FLAMES = { rate: 80, life: 0.25, size: [1.6, 0.4], colours: [c(0xff8a20), c(0xffc040), c(0xff6010)], alpha: 0.9, carry: 0.85, jitter: 2 };

// Strikes: a flash where the round hits (moving with the aircraft) and a puff left in the air.
const STRIKE = {
  he: { flash: { size: [1.8, 0.6], colour: c(0xfff0c0), life: 0.12 }, puff: { size: [0.6, 2.8], colour: c(0x303030), alpha: 0.65, life: 1.2 } },
  incendiary: { flash: { size: [0.7, 0.2], colour: c(0xffd060), life: 0.08 }, puff: { size: [0.2, 0.8], colour: c(0x8a8a80), alpha: 0.4, life: 0.4 } },
  plain: { puff: { size: [0.2, 0.8], colour: c(0x8a8a80), alpha: 0.5, life: 0.4 } },
};

// A crash on the ground: faster than this it burns, with a fireball and smoke rising for COLUMN_TIME seconds.
const CRASH_FIRE_SPEED = 30; // m/s
const COLUMN_TIME = 45; // s
const FIREBALL = { count: 30, life: 1.4, size: [8, 22], colour: c(0xff9a30), spread: 10 };
const COLUMN = { rate: 8, life: 20, size: [8, 50], colour: c(0x222222), alpha: 0.6, drag: 0.5, rise: 5, jitter: 3 };

const _v = new THREE.Vector3();
const _p = new THREE.Vector3();
const jittered = (v, amount) => _v.set(v.x + (Math.random() - 0.5) * 2 * amount, v.y + (Math.random() - 0.5) * 2 * amount,
  v.z + (Math.random() - 0.5) * 2 * amount);

export class EffectsView {
  constructor(scene) {
    this.pools = { smoke: new ParticlePool(5000), glow: new ParticlePool(2000, { additive: true }) };
    scene.add(this.pools.smoke.points, this.pools.glow.points);
    this.emitters = new WeakMap(); // plane -> Map(source key -> { last point, owed particles })
    this.columns = []; // burning crash sites: { position, left (s), owed }
    this.seenSites = new WeakSet();
  }

  /** Adds this frame's particles for the simulation's aircraft, hits and crashes, then moves them all by dt. */
  update(sim, dt, camera, height) {
    const step = sim.paused ? 0 : dt;
    for (const { plane, position, quaternion } of this.aircraftOf(sim)) this.trail(plane, position, quaternion, step);
    for (const hit of sim.hitEvents.splice(0)) this.strike(hit);
    for (const site of sim.crashSites) this.crash(site);
    this.burn(step);
    for (const pool of Object.values(this.pools)) {
      pool.update(step);
      pool.setView(camera, height);
    }
  }

  /** The aircraft that can give off trails, with their poses: the player, the target and falling airframes. */
  aircraftOf(sim) {
    const list = [{ plane: sim.plane, ...sim.plane.body }];
    if (sim.target) list.push({ plane: sim.target.plane, ...sim.target.plane.body });
    for (const f of sim.falling) if (f.plane && f.plane !== sim.plane) list.push({ plane: f.plane, ...f.wreck.body });
    return list;
  }

  /** Lays one aircraft's trails along the path each emitter took since the last frame. */
  trail(plane, position, quaternion, dt) {
    let known = this.emitters.get(plane);
    if (!known) this.emitters.set(plane, (known = new Map()));
    const live = new Set();
    damageSources(plane).forEach((s, i) => {
      const key = `${s.type}${i}`;
      live.add(key);
      const now = s.point.clone().applyQuaternion(quaternion).add(position);
      const e = known.get(key) ?? { last: now.clone(), owed: 0 };
      known.set(key, e);
      const look = TRAILS[s.type];
      e.owed += look.rate * s.strength * dt;
      const n = Math.floor(e.owed);
      e.owed -= n;
      const velocity = plane.body.velocity;
      for (let k = 0; k < n; k += 1) {
        _p.lerpVectors(e.last, now, (k + 1) / n);
        const colour = look.dark ? look.colour.clone().lerp(look.dark, s.strength) : look.colour;
        this.pools[look.pool].emit({
          position: _p, velocity: jittered(velocity.clone().multiplyScalar(look.carry), look.jitter), life: look.life,
          size: look.size, colour, alpha: look.alpha, drag: look.drag, rise: look.rise,
        });
      }
      if (s.type === 'fire') this.flames(e.last, now, velocity, dt);
      e.last.copy(now);
    });
    for (const key of known.keys()) if (!live.has(key)) known.delete(key);
  }

  /** Flames streaming back from a fire, laid along its path this frame. */
  flames(from, to, velocity, dt) {
    const n = Math.max(1, Math.round(FLAMES.rate * dt));
    for (let k = 0; k < n; k += 1) {
      this.pools.glow.emit({
        position: _p.lerpVectors(from, to, (k + 1) / n), velocity: jittered(velocity.clone().multiplyScalar(FLAMES.carry), FLAMES.jitter),
        life: FLAMES.life, size: FLAMES.size, colour: FLAMES.colours[k % FLAMES.colours.length], alpha: FLAMES.alpha,
      });
    }
  }

  /** A round striking: a flash moving with the aircraft (HE and incendiary rounds) and a puff left in the air. */
  strike({ point, kind, velocity }) {
    const look = /20$/.test(kind) ? STRIKE.he : /incendiary|deWilde|observing/.test(kind) ? STRIKE.incendiary : STRIKE.plain;
    if (look.flash) {
      this.pools.glow.emit({ position: point, velocity, life: look.flash.life, size: look.flash.size, colour: look.flash.colour, alpha: 1 });
    }
    const p = look.puff;
    this.pools.smoke.emit({ position: point, velocity: velocity.clone().multiplyScalar(0.3), life: p.life, size: p.size, colour: p.colour, alpha: p.alpha, drag: 3 });
  }

  /** A new crash site: a fast crash bursts into a fireball and starts a column of smoke. */
  crash(site) {
    if (this.seenSites.has(site)) return;
    this.seenSites.add(site);
    if (site.speed < CRASH_FIRE_SPEED) return;
    for (let k = 0; k < FIREBALL.count; k += 1) {
      this.pools.glow.emit({
        position: site.position, velocity: jittered({ x: 0, y: FIREBALL.spread / 2, z: 0 }, FIREBALL.spread), life: FIREBALL.life,
        size: FIREBALL.size, colour: FIREBALL.colour, alpha: 0.9, drag: 1,
      });
    }
    this.columns.push({ position: site.position.clone(), left: COLUMN_TIME, owed: 0 });
  }

  /** Smoke rising from the burning crash sites. */
  burn(dt) {
    for (const col of this.columns) {
      col.left -= dt;
      col.owed += COLUMN.rate * dt;
      for (; col.owed >= 1; col.owed -= 1) {
        this.pools.smoke.emit({
          position: jittered(col.position, COLUMN.jitter), velocity: { x: 0, y: 0, z: 0 }, life: COLUMN.life, size: COLUMN.size,
          colour: COLUMN.colour, alpha: COLUMN.alpha, drag: COLUMN.drag, rise: COLUMN.rise,
        });
      }
    }
    this.columns = this.columns.filter((col) => col.left > 0);
  }

  /** Clears every particle and burning site (a new flight). */
  clear() {
    for (const pool of Object.values(this.pools)) pool.clear();
    this.columns = [];
  }
}
