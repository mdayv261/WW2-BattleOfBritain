// Coolant and oil temperature gauges on the panels (product owner's placements, D63), and the readings that drive them.
import { describe, it, expect } from 'vitest';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

describe('temperature gauges (D63)', () => {
  it('reads each engine\'s temperatures, and the DB 601A\'s normal ranges for the green bands', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.plane.engines[1].heat.coolant = 101;
    sim.plane.engines[0].heat.oil = 77;
    const v = instrumentReadings(sim);
    expect(v.engines[1].coolant).toBe(101);
    expect(v.engines[0].oil).toBe(77);
    expect(v.normalTemps).toEqual({ oil: [90, 100], coolant: [75, 105] });
  });

  it('single-engine panels read the engine\'s temperatures and the Merlin\'s normal ranges', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.engines[0].heat.coolant = 88;
    const v = instrumentReadings(sim);
    expect(v.coolant).toBe(88);
    expect(v.normalTemps).toEqual({ oil: [15, 90], coolant: [60, 95] }); // S33 (D85)
  });

  it('has no ammunition counter: the Bf 109 E had none (product owner, D89)', () => {
    expect(instrumentReadings(new Simulation(aircraftById.bf109e4, 'air')).ammoCounters).toBeUndefined();
    expect(aircraftById.bf109e4.ammoCounter).toBeUndefined();
  });
});
