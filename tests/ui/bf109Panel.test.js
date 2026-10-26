// The Bf 109 E panel after the product owner's photograph (D38): dial scales read as on the photographed instruments,
// and the layout keeps every dial and plate inside the panel's outline.
import { describe, it, expect } from 'vitest';
import { lwAirspeedAngle, lwRpmAngle, lwAtaAngle } from '../../src/ui/luftwaffeDials.js';
import { BF109_LAYOUT } from '../../src/ui/bf109Panel.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;

describe('Bf 109 dial scales (as photographed)', () => {
  it('airspeed (Fl. 22231 drawing): rests at six o\'clock, 200 km/h at about eight, 400 just left of twelve, rising to 750', () => {
    expect(clockwise(lwAirspeedAngle(0))).toBeCloseTo(180, 6);
    expect(clockwise(lwAirspeedAngle(200))).toBeCloseTo(245, 6);
    expect(clockwise(lwAirspeedAngle(400))).toBeCloseTo(347, 6);
    for (let v = 0; v < 750; v += 10) expect(lwAirspeedAngle(v + 10)).toBeGreaterThan(lwAirspeedAngle(v));
  });

  it('rev counter: 600 at half past seven, 1,800 at twelve, 3,000 at half past four', () => {
    expect(clockwise(lwRpmAngle(600))).toBeCloseTo(225, 6);
    expect(clockwise(lwRpmAngle(1800))).toBeCloseTo(0, 6);
    expect(clockwise(lwRpmAngle(3000))).toBeCloseTo(135, 6);
  });

  it('manifold pressure: 1.2 ata at twelve, 0.8 at nine', () => {
    expect(clockwise(lwAtaAngle(1.2))).toBeCloseTo(0, 6);
    expect(clockwise(lwAtaAngle(0.8))).toBeCloseTo(270, 6);
  });
});

describe('Bf 109 panel layout (D41)', () => {
  const L = BF109_LAYOUT;
  const unit = ([px, py]) => [(px - 369) / 25, (py - 394) / 25];

  it('fits every dial and its mounting inside the panel size', () => {
    for (const [name, [px, py, face, half]] of Object.entries(L.dials)) {
      const [x, y] = unit([px, py]);
      const reach = Math.max(face * 1.2, half) / 25;
      expect(Math.abs(x) + reach, name).toBeLessThan(L.width / 2);
      expect(y - reach, name).toBeGreaterThanOrEqual(-0.05);
      expect(y + reach, name).toBeLessThan(L.height);
    }
  });

  it('puts the flap indicator between the compass and the manifold pressure gauge, clear of both', () => {
    const [cx, , cFace] = L.dials.compass;
    const [ax, , , aHalf] = L.dials.ata;
    expect(L.flaps.from[0]).toBeGreaterThan(cx + cFace * 1.2);
    expect(L.flaps.to[0]).toBeLessThan(ax - aHalf);
  });

  it('puts the undercarriage lever between the turn and bank and the rev counter, the lamps below it, the pressure gauge below the rev counter (D63)', () => {
    const [tx, , , tHalf] = L.dials.turn;
    const [rx, , , rHalf] = L.dials.rpm;
    expect(L.gearLever.from[0]).toBeGreaterThan(tx + tHalf);
    expect(L.gearLever.to[0]).toBeLessThan(rx - rHalf);
    const lampsX = (L.gearLamps.from[0] + L.gearLamps.to[0]) / 2;
    expect(lampsX).toBeGreaterThan(L.gearLever.from[0]);
    expect(lampsX).toBeLessThan(L.gearLever.to[0]);
    expect(L.gearLamps.from[1]).toBeGreaterThan(L.gearLever.to[1]);
    const [px, py] = L.dials.pressure;
    expect(Math.abs(px - rx)).toBeLessThan(rHalf);
    expect(py).toBeGreaterThan(L.dials.rpm[1]);
  });

  it('puts the oil and coolant temperature gauges in a row below, the pressure gauge\'s size, under the rev counter and pitch indicator (D63)', () => {
    const [ox, oy, oFace] = L.dials.oilTemp;
    const [cx, cy, cFace] = L.dials.coolTemp;
    expect(oFace).toBe(L.dials.pressure[2]);
    expect(cFace).toBe(L.dials.pressure[2]);
    expect(oy).toBe(cy);
    expect(oy).toBeGreaterThan(L.dials.pressure[1]);
    expect(ox).toBeGreaterThan(L.dials.rpm[0] - L.dials.rpm[3]);
    expect(cx).toBeLessThan(L.dials.pitch[0] + L.dials.pitch[3]);
    expect(ox).toBeLessThan(cx);
    expect(Math.max(...L.outline.map(([, y]) => y))).toBeGreaterThan((oy + oFace * 1.2 - 394) / 25);
  });
});

describe('fuel and oil pressure readings (DB 601A gauge data)', () => {
  it('read the running pressures inside the green bands with the engine turning, and nothing stopped', async () => {
    const { instrumentReadings } = await import('../../src/ui/instruments.js');
    const { Simulation } = await import('../../src/core/simulation.js');
    const { aircraftById } = await import('../../src/aircraft/index.js');
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    const { fuel, oil } = instrumentReadings(sim).pressures;
    for (const p of [fuel, oil]) {
      expect(p.value).toBeGreaterThanOrEqual(p.normal[0]);
      expect(p.value).toBeLessThanOrEqual(p.normal[1]);
      expect(p.low).toBeLessThan(p.normal[0]);
    }
    expect(oil.low).toBeCloseTo(2.2, 4); // S24
    sim.plane.engines[0].omega = 0;
    expect(instrumentReadings(sim).pressures.oil.value).toBe(0);
  });
});
