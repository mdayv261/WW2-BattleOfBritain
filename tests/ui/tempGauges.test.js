// Coolant and oil temperature gauges on the panels (product owner's placements, D63), and the readings that drive them.
import { describe, it, expect } from 'vitest';
import { RAF_LAYOUT, instrumentReadings } from '../../src/ui/instruments.js';
import { BF110_LAYOUT } from '../../src/ui/bf110Panel.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

describe('temperature gauges (D63)', () => {
  it('RAF: the oil temperature right of the rev counter, the radiator temperature below it', () => {
    const L = RAF_LAYOUT;
    expect(L.oilTemp[1]).toBe(L.rpm[1]);
    expect(L.oilTemp[0]).toBeGreaterThan(L.rpm[0] + 2);
    expect(L.radTemp[0]).toBe(L.oilTemp[0]);
    expect(L.radTemp[1]).toBeGreaterThan(L.oilTemp[1] + 2);
    expect(L.width / 2).toBeGreaterThan(L.oilTemp[0] + 1); // inside the panel
  });

  it('Bf 110: a combined gauge below each engine\'s fuel gauge, inside the panel', () => {
    const d = BF110_LAYOUT.dials;
    for (const side of ['Left', 'Right']) {
      expect(d[`temp${side}`][0]).toBe(d[`tank${side}`][0]);
      expect(d[`temp${side}`][1]).toBeGreaterThan(d[`tank${side}`][1]);
    }
    const bottom = Math.max(...BF110_LAYOUT.outline.map(([, y]) => y));
    expect(bottom).toBeGreaterThan((d.tempLeft[1] + d.tempLeft[3] - 334) / 30);
  });

  it('reads each engine\'s temperatures, and the DB 601A\'s normal ranges for the green bands', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.plane.engines[1].heat.coolant = 101;
    sim.plane.engines[0].heat.oil = 77;
    const v = instrumentReadings(sim);
    expect(v.engines[1].coolant).toBe(101);
    expect(v.engines[0].oil).toBe(77);
    expect(v.normalTemps).toEqual({ oil: [90, 100], coolant: [75, 105] });
  });

  it('single-engine panels read the engine\'s temperatures; the Merlin marks no green band', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.engines[0].heat.coolant = 88;
    const v = instrumentReadings(sim);
    expect(v.coolant).toBe(88);
    expect(v.normalTemps).toBeNull();
  });
});
