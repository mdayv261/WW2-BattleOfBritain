// Phase 3 checkpoint 2: the twins' engine levers (src/input/twinLevers.js) and their use in the simulation.
import { describe, it, expect } from 'vitest';
import { createTwinLevers, applyTwinLevers, selectNextEngine, toggleRunning, toggleFeather } from '../../src/input/twinLevers.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

const freshInput = () => ({ throttle: 0.2, rpm: 1, pitchSwitch: 0 });

describe('twin engine levers', () => {
  it('moves both engines together by default, as the joystick throttle does', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    input.throttle = 0.7;
    applyTwinLevers(state, input);
    expect(input.engines.map((e) => e.throttle)).toEqual([0.7, 0.7]);
  });

  it('moves only the selected engine, the other holding; selecting both brings both to the lever (D49)', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    expect(selectNextEngine(state, input)).toBe('left engine');
    input.throttle = 0.5;
    applyTwinLevers(state, input);
    expect(input.engines[0].throttle).toBeCloseTo(0.5, 9);
    expect(input.engines[1].throttle).toBeCloseTo(0.2, 9);
    selectNextEngine(state, input); // right: the keyboard lever starts from the right engine's 0.2
    expect(input.throttle).toBeCloseTo(0.2, 9);
    selectNextEngine(state, input); // both
    input.throttle = 0.9;
    applyTwinLevers(state, input);
    expect(input.engines.map((e) => e.throttle)).toEqual([0.9, 0.9]);
  });

  it('keeps both engines with a joystick slider, frame after frame, at the slider\'s position', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    for (const slider of [0.3, 0.6, 1, 0.4, 0]) {
      input.throttle = slider; // the joystick writes the slider's position each frame
      applyTwinLevers(state, input);
      expect(input.engines.map((e) => e.throttle)).toEqual([slider, slider]);
    }
  });

  it('sends the pitch switch only to the selected engine', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    selectNextEngine(state, input);
    selectNextEngine(state, input); // right
    input.pitchSwitch = 1;
    applyTwinLevers(state, input);
    expect(input.engines[0].pitchSwitch).toBe(0);
    expect(input.engines[1].pitchSwitch).toBe(1);
  });

  it('stops and starts the selected engines (both together, or one), and feathers one at a time (D49)', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    expect(toggleRunning(state, input).text).toBe('Both engines stopped');
    expect(input.engines.map((e) => e.failed)).toEqual([true, true]);
    expect(toggleRunning(state, input)).toEqual({ text: 'Both engines started', started: [0, 1] });
    selectNextEngine(state); // left
    expect(toggleRunning(state, input).text).toBe('Left engine stopped');
    expect(toggleFeather(state, input)).toBe('Left engine feathering');
    expect(input.engines[0]).toMatchObject({ failed: true, feather: true });
    expect(input.engines[1]).toMatchObject({ failed: false, feather: false });
    expect(toggleRunning(state, input).text).toBe('Left engine started');
    expect(input.engines[0].feather).toBe(false); // started engines are unfeathered
    selectNextEngine(state);
    selectNextEngine(state); // both
    expect(toggleFeather(state, input)).toMatch(/Select one engine/);
  });
});

describe('twin levers in the simulation', () => {
  it('gives the Bf 110 a lever per engine and none to the fighters', () => {
    expect(new Simulation(aircraftById.bf110c4).input.engines).toHaveLength(2);
    expect(new Simulation(aircraftById.bf109e4).twin).toBeNull();
  });

  it('stops the cut engine in flight while the other keeps running', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.engineKey('select'); // left
    sim.engineKey('startStop');
    expect(sim.notice.text).toBe('Left engine stopped');
    sim.engineKey('feather');
    for (let k = 0; k < 120 * 20; k += 1) {
      sim.applyLevers();
      sim.step(1 / 120);
    }
    const rpm = sim.plane.engines.map((e) => (e.omega * 60) / (2 * Math.PI));
    expect(rpm[0]).toBeLessThan(100);
    expect(rpm[1]).toBeGreaterThan(1500);
  });
});

describe('He 111 in the test version', () => {
  it('has engine levers but says its airscrews do not feather', () => {
    const sim = new Simulation(aircraftById.he111h);
    expect(sim.input.engines).toHaveLength(2);
    sim.engineKey('select');
    sim.engineKey('feather');
    expect(sim.notice.text).toMatch(/do not feather/);
    expect(sim.input.engines[0].feather).toBe(false);
  });
});

describe('views for every aircraft', () => {
  it('builds the stand-in model with an airscrew disc per engine, and a cockpit frame; only cockpit-less aircraft lack a sight', async () => {
    const { buildStandIn } = await import('../../src/render/testView.js');
    const { buildCockpitFrame } = await import('../../src/render/cockpitFrame.js');
    const { aircraftList } = await import('../../src/aircraft/index.js');
    const { engineMounts } = await import('../../src/physics/powerplant.js');
    for (const ac of aircraftList) {
      const discs = buildStandIn(ac).children.filter((c) => c.geometry?.type === 'CircleGeometry');
      expect(discs, ac.id).toHaveLength(engineMounts(ac).length);
      expect(() => buildCockpitFrame(ac), ac.id).not.toThrow();
      expect(!!ac.sight, ac.id).toBe(ac.cockpit !== false);
    }
  });
});

describe('engine start and stop on every aircraft (L, D49)', () => {
  it('stops a fighter\'s engine and starts it again, running up from the starter\'s speed', () => {
    const sim = new Simulation(aircraftById.spitfire);
    const rpm = () => (sim.plane.engines[0].omega * 60) / (2 * Math.PI);
    const run = (seconds) => {
      for (let k = 0; k < seconds * 120; k += 1) {
        sim.applyLevers();
        sim.step(1 / 120);
      }
    };
    expect(sim.input.engines[0].failed).toBe(true); // ground starts begin with the engine off
    sim.engineKey('startStop');
    expect(sim.notice.text).toBe('Engine started');
    run(3);
    expect(rpm()).toBeGreaterThan(400);
    sim.engineKey('startStop');
    expect(sim.notice.text).toBe('Engine stopped');
    run(8);
    expect(rpm()).toBeLessThan(50);
    sim.engineKey('startStop');
    expect(sim.notice.text).toBe('Engine started');
    expect(rpm()).toBeGreaterThanOrEqual(599);
    run(3);
    expect(rpm()).toBeGreaterThan(400);
  });
});

describe('idling after a start (D49)', () => {
  it('settles every aircraft\'s engines at a steady idle with the throttle closed', async () => {
    const { aircraftList } = await import('../../src/aircraft/index.js');
    for (const ac of aircraftList) {
      const sim = new Simulation(ac);
      sim.engineKey('startStop');
      for (let k = 0; k < 120 * 15; k += 1) {
        sim.applyLevers();
        sim.step(1 / 120);
      }
      for (const e of sim.plane.engines) expect((e.omega * 60) / (2 * Math.PI), ac.id).toBeGreaterThan(500);
    }
  });
});
