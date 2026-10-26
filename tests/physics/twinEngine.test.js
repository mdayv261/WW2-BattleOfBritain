// Phase 3 checkpoint 1: twin-engine physics (src/physics/powerplant.js) and the Bf 110 on one engine, against
// the RAF's flying of a captured aircraft (S24 instructions, S25 tactical trials). Flown by the scripted pilot in
// src/dev/twinTests.js.
import { describe, it, expect } from 'vitest';
import { engineMounts, engineInput } from '../../src/physics/powerplant.js';
import { propellerLoads } from '../../src/physics/propeller.js';
import { start, run } from '../../src/dev/flightTests.js';
import { singleEngine, minimumControlSpeed } from '../../src/dev/twinTests.js';
import { stallEas } from '../../src/dev/flightTests.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const { spitfire, bf110c4 } = aircraftById;
const KMH = UNIT.KMH;
const RPM = UNIT.RPM;

describe('engines as a list', () => {
  it('puts a single engine on the centre line and the 110\'s two either side', () => {
    expect(engineMounts(spitfire)).toEqual([{ x: spitfire.propHub.x, y: spitfire.propHub.y, z: 0 }]);
    const [left, right] = engineMounts(bf110c4);
    expect(left.z).toBeLessThan(0);
    expect(right.z).toBe(-left.z);
    expect(right.x).toBe(left.x);
  });

  it('lets each engine take its own inputs, or else the shared ones', () => {
    const input = { throttle: 0.7, rpm: 0.9, engines: [{ throttle: 0.2, failed: true }] };
    expect(engineInput(input, 0)).toMatchObject({ throttle: 0.2, rpm: 0.9, failed: true, feather: false });
    expect(engineInput(input, 1)).toMatchObject({ throttle: 0.7, rpm: 0.9, failed: false });
  });

  it('flies straight with both engines running: the thrust moments cancel', () => {
    const { plane, input } = start(bf110c4, { eas: 90, altitude: 1000 });
    const trace = run(plane, input, 5);
    const last = trace[trace.length - 1];
    expect(Math.abs(last.r)).toBeLessThan(0.01);
    expect(Math.abs(last.beta)).toBeLessThan(1 * UNIT.DEG);
  });

  it('yaws toward a stopped engine, hands and feet off', () => {
    for (const dead of [0, 1]) {
      const { plane, input } = start(bf110c4, { eas: 70, altitude: 1000 });
      input.engines = [{ throttle: 1 }, { throttle: 1 }];
      input.engines[dead] = { failed: true };
      run(plane, input, 1.5);
      const yawRight = -plane.body.angularVelocity.y; // body +y is nose left
      expect(Math.sign(yawRight)).toBe(dead === 0 ? -1 : 1);
    }
  });
});

describe('feathering (S24, S25: fully feathering VDM airscrews)', () => {
  it('turns the blades edge-on and stops a dead engine; unfeathered, it windmills', () => {
    const feathered = singleEngine(bf110c4, { eas: 70, feather: true, seconds: 30 });
    const windmilling = singleEngine(bf110c4, { eas: 70, feather: false, seconds: 30 });
    expect(feathered.deadRpm).toBeLessThan(50);
    expect(windmilling.deadRpm).toBeGreaterThan(800);
  });

  it('leaves a feathered airscrew only a small drag, far less than a windmilling one', () => {
    const pr = bf110c4.propeller;
    const v = 70;
    const feathered = propellerLoads(pr, { omega: 1, beta: pr.featherAngle, v, rho: 1.1 });
    expect(feathered.torque).toBeCloseTo(0, 9);
    expect(feathered.thrust).toBeCloseTo(-0.5 * 1.1 * v * v * pr.featheredDragArea, 6);
    const windmill = propellerLoads(pr, { omega: 1500 * RPM * pr.gearRatio, beta: pr.betaMin, v, rho: 1.1 });
    expect(windmill.thrust).toBeLessThan(5 * feathered.thrust);
  });
});

describe('Bf 110 on one engine (S24, S25)', () => {
  const eas = 250 * KMH;
  const results = [0, 1].map((dead) => ({
    dead,
    feathered: singleEngine(bf110c4, { eas, dead, feather: true }),
    windmilling: singleEngine(bf110c4, { eas, dead, feather: false }),
  }));

  it('climbs and holds height on either engine with the dead airscrew feathered (S25)', () => {
    for (const r of results) expect(r.feathered.climbRate).toBeGreaterThan(0.5);
  });

  it('does noticeably worse with the dead airscrew windmilling (S25: much better feathered)', () => {
    for (const r of results) {
      expect(r.windmilling.climbRate).toBeLessThan(0.75 * r.feathered.climbRate);
      expect(r.windmilling.climbRate).toBeGreaterThan(0); // S25: holds height even unfeathered
    }
  });

  it('is held straight with rudder and trim, sideslip small', () => {
    for (const r of results) {
      expect(r.feathered.headingDrift).toBeLessThan(1);
      expect(Math.abs(r.feathered.sideslip)).toBeLessThan(2);
      expect(r.feathered.rudderInput).toBeLessThan(0.5);
    }
  });

  it('has a critical engine: both airscrews turn the same way, so losing the right one needs more trim', () => {
    const [left, right] = results.map((r) => Math.abs(r.feathered.rudderTrim));
    expect(right).toBeGreaterThan(left);
  });

  it('can be held straight at the approach speed, feathered, with 25 degrees of flap (S24)', () => {
    const r = singleEngine(bf110c4, { eas: 160 * KMH, dead: 1, feather: true, flaps: 0.5 });
    expect(r.headingDrift).toBeLessThan(2);
    expect(r.rudderInput).toBeLessThan(1);
    expect(r.aileronInput).toBeLessThan(1);
  });

  it('reports its minimum control speed (no source: at or below the stall in the model)', () => {
    const vs = stallEas(bf110c4);
    const { vmc } = minimumControlSpeed(bf110c4, { stall: vs, dead: 1 });
    expect(vmc).toBeLessThan(1.2 * vs);
  });
});

describe('He 111 H (S29 close variant, D40)', () => {
  const { he111h } = aircraftById;

  it('takes off and lands without crashing, swinging little (both airscrews turn the same way)', async () => {
    const { takeoffTest, landingTest } = await import('../../src/dev/groundTests.js');
    const up = takeoffTest(he111h, { flaps: he111h.controls.flapTakeoff, screen: 20 });
    expect(up.crash).toBeNull();
    expect(Math.abs(up.maxSwing)).toBeLessThan(10);
    expect(landingTest(he111h, { screen: 20 }).crash).toBeNull();
  });

  it('can be held straight on one engine at 220 km/h (no feathering modelled: the dead airscrew windmills)', () => {
    const r = singleEngine(he111h, { eas: 220 * KMH, dead: 1, feather: false });
    expect(r.headingDrift).toBeLessThan(1);
    expect(r.rudderInput).toBeLessThan(1);
  });
});
