// The pilot is told about heat and structural damage (Phase 5, D62): an overheating warning, each new kind of damage
// once, a seized engine that will not restart, and a wing failure that ends the flight.
import { describe, it, expect } from 'vitest';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { heatWarning, gunWarning } from '../../src/ui/hud.js';
import { swapSeat, rearGun } from '../../src/core/crewSeat.js';

describe('damage reports', () => {
  it('warns of an overheating engine, naming the limit', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    expect(heatWarning(sim)).toBeNull();
    sim.plane.engines[0].heat.coolant = 125;
    sim.input.radiator = 0;
    expect(heatWarning(sim)).toMatch(/overheating: coolant 125 °C, limit 120 °C \(O opens the radiator\)/);
  });

  it('with the radiator already open, says to climb less steeply or reduce power instead (D232)', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.plane.engines[0].heat.coolant = 140;
    sim.input.radiator = 1;
    expect(heatWarning(sim)).toMatch(/\(radiator open: climb less steeply or reduce power\)$/);
    expect(heatWarning(sim)).not.toMatch(/O opens/);
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

describe('the rear gun\'s warning (D234)', () => {
  it('on the Bf 110\'s MG 15: out of ammunition while the drum is changed, or with none left; nothing in the pilot\'s seat', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    const gun = rearGun(sim);
    gun.rounds = 0;
    gun.changingUntil = sim.plane.time + 10;
    expect(gunWarning(sim)).toBeNull(); // the pilot's seat: the gunner is the AI's
    swapSeat(sim);
    expect(gunWarning(sim)).toBe('MG15 OUT OF AMMO! CHANGING DRUMS');
    gun.changingUntil = null;
    gun.drums = 0;
    expect(gunWarning(sim)).toBe('MG15 OUT OF AMMO! NO DRUMS LEFT');
    gun.rounds = 40;
    expect(gunWarning(sim)).toBeNull();
  });
});
