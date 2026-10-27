// The target aircraft and combat in the test flight (D68): the autopilot holds height, heading and speed; Y brings each
// type ahead in turn; firing at it registers hits and damage; the test key damages the player's own aircraft.
import { describe, it, expect } from 'vitest';
import { aircraftList, aircraftById } from '../../src/aircraft/index.js';
import { createAircraft, stepAircraft } from '../../src/physics/flightModel.js';
import { createAutopilot, flyAutopilot, attitude } from '../../src/core/autopilot.js';
import { cruiseSpeed } from '../../src/core/target.js';
import { Simulation } from '../../src/core/simulation.js';
import { targetBearing } from '../../src/core/combat.js';
import { common } from '../../src/aircraft/common.js';

const DT = 1 / 120;

describe('autopilot', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: holds height, heading and speed for a minute`, () => {
      const altitude = 1500;
      const heading = 0.5;
      const speed = cruiseSpeed(ac, altitude);
      const plane = createAircraft(ac, { altitude, speed, heading, throttle: common.target.throttle });
      const input = { throttle: common.target.throttle, rpm: 0.8, pitch: 0, roll: 0, yaw: 0, trim: plane.trim, engines: ac.engines ? [{}, {}] : [{}] };
      const ap = createAutopilot({ altitude, heading, speed });
      for (let t = 0; t < 60; t += DT) {
        flyAutopilot(ap, plane, input, DT);
        stepAircraft(plane, input, DT);
      }
      const a = attitude(plane);
      expect(Math.abs(plane.body.position.y - altitude)).toBeLessThan(30);
      expect(Math.abs(Math.atan2(Math.sin(a.heading - heading), Math.cos(a.heading - heading)))).toBeLessThan(0.05);
      expect(Math.abs(plane.body.velocity.length() - speed)).toBeLessThan(5);
    });
  }
});

describe('target aircraft', () => {
  it('Y brings each type ahead in turn at the player\'s height and heading, then none', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    for (const ac of aircraftList) {
      sim.nextTarget();
      expect(sim.target.ac).toBe(ac);
      const d = sim.target.plane.body.position.clone().sub(sim.plane.body.position);
      expect(d.length()).toBeCloseTo(common.target.distance, -1);
      expect(Math.abs(d.y)).toBeLessThan(1);
      expect(Math.abs(attitude(sim.target.plane).heading - attitude(sim.plane).heading)).toBeLessThan(0.01);
    }
    sim.nextTarget();
    expect(sim.target).toBeNull();
  });

  it('the F3 bearing says where the target is from the nose', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.nextTarget();
    const ahead = targetBearing(sim);
    expect(Math.abs(ahead.right)).toBeLessThan(0.05);
    // Move the target 100 m to the pilot's left (body -z) and 50 m up: it is now left of and above the nose.
    const body = sim.plane.body;
    const offset = body.position.clone().set(0, 50, -100).applyQuaternion(body.quaternion);
    sim.target.plane.body.position.add(offset);
    const moved = targetBearing(sim);
    expect(moved.right).toBeLessThan(-0.2);
    expect(moved.up).toBeGreaterThan(0.1);
  });

  it('firing the Spitfire at a target 250 m ahead registers hits and damage', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.nextTarget(); // a Hurricane
    // Close to 250 m: put the target 250 m ahead, flying the same speed, and fire for three seconds.
    const t = sim.target;
    const ahead = t.plane.body.position.clone().sub(sim.plane.body.position).setLength(250);
    t.plane.body.position.copy(sim.plane.body.position).add(ahead);
    t.plane.body.velocity.copy(sim.plane.body.velocity);
    t.autopilot.hold.speed = sim.plane.body.velocity.length();
    sim.input.fireMg = true;
    for (let i = 0; i < 360 && sim.target; i += 1) sim.step(DT);
    const hits = sim.target ? sim.target.plane.damage.hits : 999;
    expect(hits).toBeGreaterThan(10);
    expect(sim.lastTargetHit.text.length).toBeGreaterThan(0);
  });

  it('a target that breaks up is reported destroyed and removed', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.nextTarget();
    sim.target.plane.damage.failed = { cause: 'The right wing broke' };
    sim.step(DT);
    expect(sim.target).toBeNull();
    expect(sim.notice.text).toMatch(/Target destroyed: The right wing broke/);
  });
});

describe('test hits on your own aircraft (key 9)', () => {
  it('hits the coolant, then the engine, and so on in turn, telling the pilot', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.testHit();
    expect(sim.notice.text).toBe('Test hit (20 mm): coolant');
    expect(sim.plane.engines[0].heat.coolantLeak).toBeGreaterThan(0);
    sim.testHit();
    expect(sim.notice.text).toBe('Test hit (20 mm): engine');
    expect(sim.plane.engines[0].heat.wear).toBeGreaterThan(0);
  });

  it('works on the twins (their engines are in nacelles)', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.testHit();
    expect(sim.notice.text).toBe('Test hit (20 mm): coolant');
  });
});
