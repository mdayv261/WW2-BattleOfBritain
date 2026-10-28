// Coolant and oil temperature gauges on the panels (product owner's placements, D63), and the readings that drive them.
import { describe, it, expect } from 'vitest';
import { RAF_LAYOUT, instrumentReadings, panelRadius, rafEngineScales, gauge, BAND } from '../../src/ui/instruments.js';
import { BF109_LAYOUT } from '../../src/ui/bf109Panel.js';
import { BF110_LAYOUT } from '../../src/ui/bf110Panel.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

describe('temperature gauges (D63)', () => {
  it('RAF (D85): the MAP gauge, full size, below the rev counter; oil, radiator and boost small, in a column right', () => {
    const L = RAF_LAYOUT;
    expect(L.small).toBeCloseTo(19 / 30, 9); // the Bf 110's engine gauges' proportion
    expect(L.manifold[0]).toBe(L.rpm[0]);
    expect(L.manifold[1]).toBeGreaterThan(L.rpm[1] + 2); // full size, clear of the rev counter
    const column = [L.oilTemp, L.radTemp, L.boost];
    for (const [x] of column) {
      expect(x).toBe(L.oilTemp[0]);
      expect(x - L.small).toBeGreaterThan(L.rpm[0] + 1); // clear of the rev counter
      expect(x + L.small).toBeLessThan(L.width / 2); // inside the panel
    }
    for (let i = 1; i < column.length; i += 1) expect(column[i][1] - column[i - 1][1]).toBeGreaterThan(2 * L.small);
    expect(column[0][1] - L.small).toBeGreaterThanOrEqual(0.1);
    expect(column[2][1] + L.small).toBeLessThanOrEqual(4.8 + 1e-9);
    expect(L.manifold[1] + 1).toBeLessThanOrEqual(4.8);
  });

  it('RAF: green normal bands on oil, radiator, boost and manifold pressure (S33), orange over +12 lb on both pressures', () => {
    const v = instrumentReadings(new Simulation(aircraftById.hurricane, 'air'));
    const s = rafEngineScales(v);
    const green = (o) => o.bands.find((b) => b.colour === BAND.normal);
    const orange = (o) => o.bands.find((b) => b.colour === BAND.emergency);
    expect([green(s.oilTemp).from, green(s.oilTemp).to]).toEqual([15, 90]);
    expect([green(s.radTemp).from, green(s.radTemp).to]).toEqual([60, 95]);
    expect(green(s.boost).from).toBeCloseTo(2.25, 3);
    expect(green(s.boost).to).toBeCloseTo(6.25, 3);
    expect(green(s.manifold).from).toBeCloseTo(34.50, 1); // in. Hg absolute
    expect(green(s.manifold).to).toBeCloseTo(42.65, 1);
    expect(orange(s.boost).from).toBe(12);
    expect(orange(s.manifold).from).toBeCloseTo(54.35, 1);
  });

  it('RAF: the manifold pressure gauge reads the boost in inches of mercury; the throttle moves both, the rpm lever neither', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const inHg = (psi) => (101325 + psi * 6894.757293168) / 3386.389;
    let v = instrumentReadings(sim);
    expect(v.mapInHg).toBeCloseTo(inHg(v.manifold), 6);
    const full = v.mapInHg;
    sim.input.throttle = 0.3;
    for (let t = 0; t < 2; t += 1 / 120) sim.step(1 / 120);
    v = instrumentReadings(sim);
    expect(v.mapInHg).toBeLessThan(full - 5);
    expect(v.mapInHg).toBeCloseTo(inHg(v.manifold), 6);
    expect(instrumentReadings(new Simulation(aircraftById.bf109e4, 'air')).mapInHg).toBeNull();
  });

  it('draws every band of a gauge on its scale', () => {
    const arcs = [];
    const g = new Proxy({}, {
      get: (target, key) => (key in target ? target[key] : key === 'arc' ? (...a) => arcs.push(a) : () => ({ width: 10 })),
      set: (target, key, value) => { target[key] = value; return true; },
    });
    gauge(g, 0, 0, 10, 5, { min: 0, max: 10, start: -2, end: 2, major: 5, minor: 1, label: String,
      bands: [{ from: 1, to: 2, colour: 'green' }, { from: 8, to: 20, colour: 'orange' }] });
    const bandArcs = arcs.filter((a) => a[2] === 9); // the bands sit at 0.9 of the radius
    expect(bandArcs).toHaveLength(2);
    expect(bandArcs[1][4]).toBeCloseTo(2 - Math.PI / 2, 9); // clipped at the scale's end
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

  it('single-engine panels read the engine\'s temperatures and the Merlin\'s normal ranges', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.engines[0].heat.coolant = 88;
    const v = instrumentReadings(sim);
    expect(v.coolant).toBe(88);
    expect(v.normalTemps).toEqual({ oil: [15, 90], coolant: [60, 95] }); // S33 (D85)
  });

  it('reads the Bf 109 ammunition counter: left MG 17, cannon, right MG 17, full until the guns are wired', () => {
    const v = instrumentReadings(new Simulation(aircraftById.bf109e4, 'air'));
    expect(v.ammoCounters.map((c) => c.gun)).toEqual(['mg17Left', 'cannon', 'mg17Right']);
    expect(v.ammoCounters.every((c) => c.fraction === 1)).toBe(true);
    expect(instrumentReadings(new Simulation(aircraftById.spitfire, 'air')).ammoCounters).toBeNull();
  });

  it('draws the Bf 110\'s large dials the same size as the Bf 109\'s on any screen (D64)', () => {
    for (const [w, h] of [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259]]) {
      const big109 = panelRadius(BF109_LAYOUT, w, h) * (BF109_LAYOUT.dials.airspeed[2] / 25);
      const big110 = panelRadius(BF110_LAYOUT, w, h) * (BF110_LAYOUT.dials.airspeed[2] / 30);
      expect(big110, `${w}x${h}`).toBeCloseTo(big109, 6);
    }
  });
});
