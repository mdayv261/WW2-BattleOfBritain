// The Phase 1 test flight: one aircraft, its control inputs, and the fixed-step loop.
// Rendering reads `previous` and `current` poses and blends them with the loop's alpha (D4).

import { Vector3, Quaternion } from 'three';
import { FixedStepLoop } from './fixedStepLoop.js';
import { createAircraft, stepAircraft } from '../physics/flightModel.js';
import { steadyFlight } from '../physics/performance.js';
import { engineFor } from '../aircraft/index.js';
import { lerp } from '../physics/interp.js';

export const START = { altitude: 1500, speed: 110, heading: 0, rpm: 0.8 };

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

export class Simulation {
  constructor(ac) {
    this.loop = new FixedStepLoop({ step: (dt) => this.step(dt) });
    this.paused = false;
    this.reset(ac);
  }

  /** Starts (or restarts) a flight in the given aircraft. */
  reset(ac = this.ac) {
    this.ac = ac;
    const throttle = levelThrottle(ac);
    this.plane = createAircraft(ac, { ...START, throttle });
    this.input = createInput(this.plane, throttle);
    this.crashed = false;
    this.previous = { position: new Vector3(), quaternion: new Quaternion() };
    this.copyPose(this.previous);
    stepAircraft(this.plane, this.input, 0); // fills in the readings
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
