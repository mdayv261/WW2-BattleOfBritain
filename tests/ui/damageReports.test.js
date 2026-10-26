// The pilot is told about heat and structural damage (Phase 5, D62): an overheating warning, each new kind of damage
// once, a seized engine that will not restart, and a wing failure that ends the flight.
import { describe, it, expect } from 'vitest';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { heatWarning } from '../../src/ui/hud.js';

describe('damage reports', () => {
  it('warns of an overheating engine, naming the limit', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    expect(heatWarning(sim)).toBeNull();
    sim.plane.engines[0].heat.coolant = 125;
    expect(heatWarning(sim)).toMatch(/overheating: coolant 125 °C, limit 120 °C/);
  });

  it('names the engine on a twin', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.plane.engines[1].heat.oil = 110;
    expect(heatWarning(sim)).toMatch(/^Right engine oil 110 °C/);
  });

  it('tells the pilot once when an engine seizes, and it will not start again', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.plane.engines[0].heat.seized = true;
    sim.step(1 / 120);
    expect(sim.notice.text).toBe('The engine has seized');
    sim.notice = null;
    sim.step(1 / 120);
    expect(sim.notice).toBeNull();
    sim.engineKey('startStop'); // stop
    sim.engineKey('startStop'); // try to start
    expect(sim.notice.text).toMatch(/seized: it will not start/);
  });

  it('reports an overstressed airframe, and ends the flight when the wings fail', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    sim.plane.damage.airframe = 0.4;
    sim.step(1 / 120);
    expect(sim.notice.text).toMatch(/overstressed/);
    sim.plane.damage.failed = { cause: 'The wings failed at 13.2 g' };
    sim.step(1 / 120);
    expect(sim.crashed).toBe(true);
    expect(sim.crashCause).toBe('The wings failed at 13.2 g');
  });
});
