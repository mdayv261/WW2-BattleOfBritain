// The optional assists (Phase 7 checkpoint 6, D232): off by default and then changing nothing; auto-rudder against the
// sideslip unless the pilot uses his own; the radiator opened near the coolant limit and shut once cool; the stall and
// g warnings at their thresholds and not in cruise.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { ASSIST, NO_ASSISTS, assistedYaw, manageEngine, warnings, assistNames } from '../../src/core/assists.js';
import { stallAlpha } from '../../src/physics/aero.js';
import { coolantLimit } from '../../src/physics/cooling.js';

const DT = 1 / 120;

/** The worst sideslip (degrees) of an aircraft rolled hands-off into turns one way and the other for 8 s. */
function worstSlip(id, assists) {
  const sim = new Simulation(aircraftById[id], 'air');
  Object.assign(sim.assists, assists);
  let worst = 0;
  for (let i = 0; i < 120 * 8; i += 1) {
    const t = i / 120;
    sim.input.roll = t < 1.5 ? 0.6 : t < 3 ? -0.6 : t < 4.5 ? 0.6 : 0;
    sim.input.pitch = 0.2;
    sim.step(DT);
    worst = Math.max(worst, Math.abs(sim.plane.last.beta) * 180 / Math.PI);
  }
  return worst;
}

describe('the assists', () => {
  it('are all off by default and then leave the controls alone', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    expect(sim.assists).toEqual(NO_ASSISTS);
    sim.step(DT);
    sim.plane.last.beta = 0.1;
    expect(assistedYaw(sim.plane, sim.input, sim.assists)).toBe(sim.input.yaw);
    sim.input.engineAssist = false;
    manageEngine(sim.ac, sim.plane, sim.input, sim.assists);
    expect(sim.input.engineAssist).toBe(false);
    expect(warnings(sim.ac, sim.plane, sim.assists)).toEqual({ stall: false, g: false, overspeed: false, dive: false });
    expect(assistNames(sim.assists)).toBe('');
    expect(assistNames({ autoRudder: true, gWarning: true })).toBe('auto-rudder, g warning');
  });

  for (const id of ['hurricane', 'spitfire', 'bf109e4', 'bf110c4']) {
    it(`${id}: auto-rudder at least halves the sideslip of hands-off rolling turns`, () => {
      expect(worstSlip(id, { autoRudder: true })).toBeLessThan(worstSlip(id, {}) * 0.65);
    });
  }

  it('auto-rudder gives way to the pilot\'s own rudder, and leaves the input as the pilot set it', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.assists.autoRudder = true;
    sim.step(DT);
    sim.plane.last.beta = 0.05;
    expect(assistedYaw(sim.plane, sim.input, sim.assists)).toBeCloseTo(ASSIST.rudderGain * 0.05, 6);
    sim.input.yaw = -0.3;
    expect(assistedYaw(sim.plane, sim.input, sim.assists)).toBe(-0.3);
    sim.input.yaw = 0;
    sim.step(DT);
    expect(sim.input.yaw).toBe(0); // the auto-rudder flew the step; the pilot's input is untouched
  });

  it('engine management sets automatic pitch and opens the radiator near the coolant limit, shutting it once cool', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    const on = { ...NO_ASSISTS, engineManagement: true };
    const limit = coolantLimit(sim.plane.engine, sim.plane.body.position.y);
    sim.input.engineAssist = false;
    sim.input.radiator = 0;
    sim.plane.engines[0].heat.coolant = limit - ASSIST.radiatorOpen + 1;
    manageEngine(sim.ac, sim.plane, sim.input, on);
    expect([sim.input.engineAssist, sim.input.radiator]).toEqual([true, 1]);
    sim.plane.engines[0].heat.coolant = limit - 20; // between: stays open
    manageEngine(sim.ac, sim.plane, sim.input, on);
    expect(sim.input.radiator).toBe(1);
    sim.plane.engines[0].heat.coolant = limit - ASSIST.radiatorShut - 1;
    manageEngine(sim.ac, sim.plane, sim.input, on);
    expect(sim.input.radiator).toBe(0);
  });

  it('the stall warning sounds within 2° of the stall angle, not in cruise or on the ground', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    const on = { ...NO_ASSISTS, stallWarning: true };
    sim.step(DT);
    expect(warnings(sim.ac, sim.plane, on).stall).toBe(false);
    const stall = stallAlpha(sim.ac, sim.plane.surfaces.flaps);
    sim.plane.last = { ...sim.plane.last, alpha: stall - ASSIST.stallMargin + 0.002 };
    expect(warnings(sim.ac, sim.plane, on).stall).toBe(true);
    sim.plane.last = { ...sim.plane.last, alpha: stall - ASSIST.stallMargin - 0.01 };
    expect(warnings(sim.ac, sim.plane, on).stall).toBe(false);
    sim.plane.last = { ...sim.plane.last, alpha: stall, onGround: true };
    expect(warnings(sim.ac, sim.plane, on).stall).toBe(false);
  });

  it('the g warning sounds at 90% of the damage limit, positive and negative, not at 1 g', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const on = { ...NO_ASSISTS, gWarning: true };
    sim.step(DT);
    const limit = sim.ac.limits.g.damage;
    expect(warnings(sim.ac, sim.plane, on).g).toBe(false);
    sim.plane.last = { ...sim.plane.last, loadFactor: 0.9 * limit };
    expect(warnings(sim.ac, sim.plane, on).g).toBe(true);
    sim.plane.last = { ...sim.plane.last, loadFactor: 0.85 * limit };
    expect(warnings(sim.ac, sim.plane, on).g).toBe(false);
    sim.plane.last = { ...sim.plane.last, loadFactor: -0.9 * limit * 0.5 };
    expect(warnings(sim.ac, sim.plane, on).g).toBe(true);
  });

  it('the simulation reports the warnings each step: the stall warning in a hard pull, none with it off', () => {
    for (const on of [true, false]) {
      const sim = new Simulation(aircraftById.spitfire, 'air');
      sim.assists.stallWarning = on;
      sim.input.pitch = 1;
      let warned = false;
      for (let i = 0; i < 120 * 3 && !warned; i += 1) {
        sim.step(DT);
        warned = sim.warnings.stall;
      }
      expect(warned).toBe(on);
    }
  });
});
