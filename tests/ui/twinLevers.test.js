// Phase 3 checkpoint 2: the twins' engine levers (src/input/twinLevers.js) and their use in the simulation.
import { describe, it, expect } from 'vitest';
import { createTwinLevers, applyTwinLevers, selectNextEngine, toggleCut, toggleFeather } from '../../src/input/twinLevers.js';
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

  it('moves only the selected engine, keeping the split when both are selected again', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    expect(selectNextEngine(state)).toBe('left engine');
    input.throttle = 0.5;
    applyTwinLevers(state, input);
    expect(input.engines[0].throttle).toBeCloseTo(0.5, 9);
    expect(input.engines[1].throttle).toBeCloseTo(0.2, 9);
    selectNextEngine(state); // right
    selectNextEngine(state); // both
    input.throttle = 0.6;
    applyTwinLevers(state, input);
    expect(input.engines[0].throttle).toBeCloseTo(0.6, 9);
    expect(input.engines[1].throttle).toBeCloseTo(0.3, 9);
  });

  it('sends the pitch switch only to the selected engine', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    selectNextEngine(state);
    selectNextEngine(state); // right
    input.pitchSwitch = 1;
    applyTwinLevers(state, input);
    expect(input.engines[0].pitchSwitch).toBe(0);
    expect(input.engines[1].pitchSwitch).toBe(1);
  });

  it('cuts and feathers one engine at a time, never both at once', () => {
    const input = freshInput();
    const state = createTwinLevers(input, 2);
    expect(toggleCut(state, input)).toMatch(/Select one engine/);
    selectNextEngine(state);
    expect(toggleCut(state, input)).toBe('Left engine cut');
    expect(toggleFeather(state, input)).toBe('Left engine feathering');
    expect(input.engines[0]).toMatchObject({ failed: true, feather: true });
    expect(input.engines[1]).toMatchObject({ failed: false, feather: false });
    expect(toggleCut(state, input)).toBe('Left engine restarted');
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
    sim.engineKey('cut');
    expect(sim.notice.text).toBe('Left engine cut');
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
