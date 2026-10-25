// Phase 2 checkpoint 3: take-off and landing behaviour against the sources, flown by the scripted pilot
// (src/dev/groundTests.js). Distances are in tests/physics/validation.test.js.
import { describe, it, expect } from 'vitest';
import { takeoffTest, landingTest } from '../../src/dev/groundTests.js';
import { createOnGround, stepAircraft } from '../../src/physics/flightModel.js';
import { stallAlpha } from '../../src/physics/aero.js';
import { aircraftList, aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const { spitfire, hurricane, bf109e4 } = aircraftById;
const DEG = UNIT.DEG;
const DT = 1 / 120;

describe('take-off swing', () => {
  it('swings the RAF fighters left (S12) and the Bf 109 right (S20), each held with rudder', () => {
    for (const ac of [spitfire, hurricane]) {
      const r = takeoffTest(ac, { flaps: ac.controls.flapTakeoff });
      expect(r.crash).toBeNull();
      expect(r.maxSwing).toBeLessThan(0);
      expect(Math.abs(r.maxSwing)).toBeLessThan(10);
    }
    const r = takeoffTest(bf109e4, { flaps: bf109e4.controls.flapTakeoff });
    expect(r.crash).toBeNull();
    expect(r.maxSwing).toBeGreaterThan(0);
    expect(r.maxSwing).toBeLessThan(10);
  });
});

describe('landing', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: lands three-point and rolls out straight, with no ground loop (S11, S12, S20)`, () => {
      const trace = [];
      const r = landingTest(ac, { trace });
      expect(r.crash).toBeNull();
      const touchdown = trace.findIndex((s) => s.wheels !== '000');
      const heading = Math.max(...trace.slice(touchdown).map((s) => Math.abs(s.heading)));
      expect(heading).toBeLessThan(10);
    });
  }

  it('makes tail-first landings possible: each ground angle is below the flaps-down stalling attitude (S12)', () => {
    for (const ac of aircraftList) expect(ac.gear.groundAngle).toBeLessThan(stallAlpha(ac, 1));
  });

  it('needs about 8.4 degrees of up elevator for the Spitfire\'s three-point landing (S11: varied over 10 degrees)', () => {
    const trace = [];
    landingTest(spitfire, { trace });
    const touchdown = trace.find((s) => s.wheels !== '000');
    const elevator = touchdown.stick * spitfire.controls.elevatorUp / DEG;
    expect(elevator).toBeGreaterThan(8.4 - 5);
    expect(elevator).toBeLessThan(8.4 + 5);
  });
});

describe('Bf 109 brakes', () => {
  it('can be used harshly after touch-down without lifting the tail (S20, S32)', () => {
    const plane = createOnGround(bf109e4);
    const nose = { x: 0, z: -1 }; // the parked aircraft faces north
    plane.body.velocity.set(nose.x * 15, 0, nose.z * 15);
    const input = { throttle: 0, rpm: 1, gear: 1, brake: 1, trim: 0, pitch: 1, roll: 0, yaw: 0 };
    let tailLifted = false;
    for (let t = 0; t < 6 && plane.body.velocity.length() > 0.5; t += DT) {
      stepAircraft(plane, input, DT);
      if (!plane.ground.touching[2]) tailLifted = true;
    }
    expect(plane.ground.crash).toBeNull();
    expect(tailLifted).toBe(false);
  });
});
