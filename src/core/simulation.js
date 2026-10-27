// The test flight: one aircraft, its control inputs, and the fixed-step loop, in a world (src/world/world.js): the real
// map in the game (D51), the Phase 2 aerodrome by default (the tests).
// Rendering reads `previous` and `current` poses and blends them with the loop's alpha (D4).
//
// Three starts: on the ground at the aerodrome with the engines off (the default; L starts them), on the approach at
// 1,000 ft about 5 km out with wheels and flaps up, or in the air at 1,500 m (the Phase 1 start).
// Twins get a lever per engine (src/input/twinLevers.js).

import { Vector3, Quaternion } from 'three';
import { FixedStepLoop } from './fixedStepLoop.js';
import { createAircraft, createOnGround, stepAircraft } from '../physics/flightModel.js';
import { steadyFlight, stallSpeed } from '../physics/performance.js';
import { flatWorld } from '../world/world.js';
import { engineFor } from '../aircraft/index.js';
import { lerp } from '../physics/interp.js';
import { engineMounts } from '../physics/powerplant.js';
import { createTwinLevers, applyTwinLevers, selectNextEngine, toggleRunning, toggleFeather } from '../input/twinLevers.js';
import { common } from '../aircraft/common.js';
import { createArmament, stepGuns, counters } from '../weapons/guns.js';
import { Projectiles } from '../weapons/projectiles.js';
import { seededRandom } from '../weapons/random.js';
import { nextTarget, hittable, resolveHit, stepTarget, testHit } from './combat.js';

export const START = { altitude: 1500, speed: 110, heading: 0, rpm: 0.8 };
export const START_MODES = ['ground', 'approach', 'air'];

/** The throttle that holds a speed in level flight (rpm lever 0..1 for constant-speed propellers). */
export function levelThrottle(ac, altitude = START.altitude, speed = START.speed, rpmLever = START.rpm) {
  const pr = ac.propeller;
  const crank = pr.type === 'constantSpeed' ? lerp(pr.rpmMin, pr.rpmMax, rpmLever) : engineFor(ac).refSpeed;
  let lo = 0.0;
  let hi = 1;
  for (let i = 0; i < 30; i += 1) {
    const mid = 0.5 * (lo + hi);
    const s = steadyFlight(ac, { speed: crank, throttle: mid }, altitude, speed);
    if (!s || s.spare < 0) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** Control inputs as the pilot sets them; the input modules write into this object. */
export function createInput(plane, throttle) {
  return {
    pitch: 0, roll: 0, yaw: 0, throttle, rpm: START.rpm, pitchSwitch: 0,
    trim: plane.trim, flaps: 0, gear: 0, radiator: 0, emergency: false, engineAssist: false,
  };
}

/** Builds the aircraft and its inputs for a start mode, at the aircraft's side's start in the world. */
function startPlane(ac, mode, world) {
  const { terrain } = world;
  const starts = world.starts(ac.side);
  if (mode === 'ground') {
    const plane = createOnGround(ac, { ...starts.ground, terrain });
    return { plane, input: { ...createInput(plane, 0), rpm: 1, gear: 1 } };
  }
  if (mode === 'approach') {
    const { altitude, heading, x, z } = starts.approach;
    const speed = 1.5 * stallSpeed(ac, { speed: ac.propeller.rpmMax, throttle: 0 }, altitude);
    const throttle = levelThrottle(ac, altitude, speed, 1);
    const plane = createAircraft(ac, { altitude, speed, heading, throttle, rpm: 1, x, z, terrain });
    return { plane, input: { ...createInput(plane, throttle), rpm: 1 } };
  }
  const { altitude, heading, x, z } = starts.air;
  const throttle = levelThrottle(ac, altitude);
  const plane = createAircraft(ac, { ...START, altitude, heading, x, z, throttle, terrain });
  return { plane, input: createInput(plane, throttle) };
}

export class Simulation {
  constructor(ac, mode = 'ground', world = flatWorld) {
    this.world = world;
    this.loop = new FixedStepLoop({ step: (dt) => this.step(dt) });
    this.paused = false;
    this.mode = mode;
    this.reset(ac);
  }

  /** Starts (or restarts) a flight in the given aircraft, in the current start mode. */
  reset(ac = this.ac) {
    this.ac = ac;
    ({ plane: this.plane, input: this.input } = startPlane(ac, this.mode, this.world));
    const engines = engineMounts(ac).length;
    this.twin = engines > 1 ? createTwinLevers(this.input, engines) : null;
    // A single engine's own switch (no levers of its own: it uses the shared throttle and rpm).
    if (!this.twin) this.input.engines = [{ failed: false, feather: false }];
    // On the ground every aircraft starts with its engines off (product owner, D49): L starts them.
    if (this.mode === 'ground') {
      for (const e of this.input.engines) e.failed = true;
      for (const e of this.plane.engines) e.omega = 0;
    }
    this.armament = createArmament(ac); // the fixed guns (Phase 5, D67)
    this.projectiles ??= new Projectiles();
    this.projectiles.clear();
    this.random = seededRandom(1); // the player's damage dice (D68)
    this.target = null; // the target aircraft (Y, D68)
    this.targetIndex = -1;
    this.notice = null; // a short message for the pilot: { text, until } (simulation time)
    this.crashed = false;
    this.crashCause = null;
    this.seen = { seized: this.plane.engines.map(() => false), airframe: 0, flutter: false }; // damage already reported
    this.previous = { position: new Vector3(), quaternion: new Quaternion() };
    this.copyPose(this.previous);
    stepAircraft(this.plane, this.input, 0); // fills in the readings
  }

  /** Switches to the next start mode and restarts. */
  nextStart() {
    this.mode = START_MODES[(START_MODES.indexOf(this.mode) + 1) % START_MODES.length];
    this.reset();
  }

  /** Passes the shared levers' movement on to the selected engines (twins); call after the input modules. */
  applyLevers() {
    if (this.twin) applyTwinLevers(this.twin, this.input);
  }

  /**
   * Engine keys: start or stop (L, every aircraft; on a twin, the engines the levers are set to); and on the twins,
   * select the engines the levers move (K) and feather one (M). A started engine is turned to the starter's speed.
   */
  engineKey(action) {
    if (action === 'startStop') {
      const { text, started } = toggleRunning(this.twin, this.input);
      for (const i of started) this.plane.engines[i].omega = Math.max(this.plane.engines[i].omega, common.starterSpeed);
      const seized = started.some((i) => this.plane.engines[i].heat.seized);
      this.notice = { text: seized ? 'The engine has seized: it will not start' : text, until: this.plane.time + 3 };
      return;
    }
    if (!this.twin) return;
    if (action === 'feather' && !this.ac.propeller.featherAngle) {
      this.notice = { text: `The ${this.ac.name}'s airscrews do not feather (not confirmed from a source)`, until: this.plane.time + 3 };
      return;
    }
    const text = action === 'select' ? `Levers: ${selectNextEngine(this.twin, this.input)}`
      : toggleFeather(this.twin, this.input);
    this.notice = { text, until: this.plane.time + 3 };
  }

  /** Y: the next target aircraft ahead (D68). */
  nextTarget() {
    this.notice = { text: nextTarget(this), until: this.plane.time + 3 };
  }

  /** 9: a test 20 mm hit on the player's own aircraft (D68). */
  testHit() {
    this.notice = { text: testHit(this), until: this.plane.time + 3 };
  }

  /** The ammunition counter's columns as { rounds, capacity } (the Bf 109's: D64, D65). */
  get guns() {
    return counters(this.armament);
  }

  copyPose(to) {
    to.position.copy(this.plane.body.position);
    to.quaternion.copy(this.plane.body.quaternion);
  }

  step(dt) {
    if (this.paused || this.crashed) return;
    this.copyPose(this.previous);
    // Guns first: their rounds leave from where the aircraft is now, and their recoil acts in this step.
    const recoil = stepGuns(this.armament, this.plane, this.input, dt, this.plane.time, (round) => this.projectiles.spawn(round, this));
    this.plane.recoil = recoil.force.lengthSq() > 0 ? recoil : null;
    stepAircraft(this.plane, this.input, dt);
    stepTarget(this, dt);
    this.projectiles.step(dt, this.world.terrain, hittable(this), (struck, hit) => resolveHit(this, struck, hit));
    const { ground, damage } = this.plane;
    if (ground.crash || damage.failed) {
      this.crashed = true;
      this.crashCause = (ground.crash ?? damage.failed).cause;
    }
    this.reportDamage();
  }

  /** Tells the pilot once about each new kind of damage from heat or overstress (Phase 5). */
  reportDamage() {
    const { plane, seen } = this;
    const say = (text) => { this.notice = { text, until: plane.time + 4 }; };
    plane.engines.forEach((e, i) => {
      if (e.heat.seized && !seen.seized[i]) say(`${this.twin ? ['Left engine', 'Right engine'][i] : 'The engine'} has seized`);
      seen.seized[i] = e.heat.seized;
    });
    if (plane.damage.airframe > seen.airframe + 0.1) {
      say('Airframe overstressed: the skin has wrinkled');
      seen.airframe = plane.damage.airframe;
    }
    if (plane.damage.flutter > 0 && !seen.flutter) say('Control surfaces fluttering: too fast');
    seen.flutter = plane.damage.flutter > 0;
  }

  /** Runs the physics for `elapsed` seconds of real time. */
  advance(elapsed) {
    this.loop.advance(elapsed);
  }
}
