// The test flight: one aircraft, its control inputs, and the fixed-step loop, at the Phase 2 aerodrome.
// Rendering reads `previous` and `current` poses and blends them with the loop's alpha (D4).
//
// Three starts: on the ground at the aerodrome with the engine idling (the default), on the approach at
// 1,000 ft about 5 km out with wheels and flaps up, or in the air at 1,500 m (the Phase 1 start).

import { Vector3, Quaternion } from 'three';
import { FixedStepLoop } from './fixedStepLoop.js';
import { createAircraft, createOnGround, stepAircraft } from '../physics/flightModel.js';
import { steadyFlight, stallSpeed } from '../physics/performance.js';
import { airfieldTerrain, STARTS } from '../world/airfield.js';
import { engineFor } from '../aircraft/index.js';
import { lerp } from '../physics/interp.js';

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

/** Builds the aircraft and its inputs for a start mode. */
function startPlane(ac, mode) {
  if (mode === 'ground') {
    const plane = createOnGround(ac, { ...STARTS.ground, terrain: airfieldTerrain });
    return { plane, input: { ...createInput(plane, 0), rpm: 1, gear: 1 } };
  }
  if (mode === 'approach') {
    const { altitude, heading, x, z } = STARTS.approach;
    const speed = 1.5 * stallSpeed(ac, { speed: ac.propeller.rpmMax, throttle: 0 }, altitude);
    const throttle = levelThrottle(ac, altitude, speed, 1);
    const plane = createAircraft(ac, { altitude, speed, heading, throttle, rpm: 1, x, z, terrain: airfieldTerrain });
    return { plane, input: { ...createInput(plane, throttle), rpm: 1 } };
  }
  const throttle = levelThrottle(ac);
  const plane = createAircraft(ac, { ...START, throttle, terrain: airfieldTerrain });
  return { plane, input: createInput(plane, throttle) };
}

export class Simulation {
  constructor(ac, mode = 'ground') {
    this.loop = new FixedStepLoop({ step: (dt) => this.step(dt) });
    this.paused = false;
    this.mode = mode;
    this.reset(ac);
  }

  /** Starts (or restarts) a flight in the given aircraft, in the current start mode. */
  reset(ac = this.ac) {
    this.ac = ac;
    ({ plane: this.plane, input: this.input } = startPlane(ac, this.mode));
    this.crashed = false;
    this.previous = { position: new Vector3(), quaternion: new Quaternion() };
    this.copyPose(this.previous);
    stepAircraft(this.plane, this.input, 0); // fills in the readings
  }

  /** Switches to the next start mode and restarts. */
  nextStart() {
    this.mode = START_MODES[(START_MODES.indexOf(this.mode) + 1) % START_MODES.length];
    this.reset();
  }

  copyPose(to) {
    to.position.copy(this.plane.body.position);
    to.quaternion.copy(this.plane.body.quaternion);
  }

  step(dt) {
    if (this.paused || this.crashed) return;
    this.copyPose(this.previous);
    stepAircraft(this.plane, this.input, dt);
    if (this.plane.ground.crash) this.crashed = true;
  }

  /** Runs the physics for `elapsed` seconds of real time. */
  advance(elapsed) {
    this.loop.advance(elapsed);
  }
}
