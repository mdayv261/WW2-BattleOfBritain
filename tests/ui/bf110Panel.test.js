// The Bf 110 panel after the product owner's photograph (D39): dial scales as photographed, the layout inside the
// panel, and each engine's own readings on its own instruments.
import { describe, it, expect } from 'vitest';
import { lwVarioAngle } from '../../src/ui/lwFlightDials.js';
import { BF110_LAYOUT } from '../../src/ui/bf110Panel.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;

describe('variometer (Fl. 22383 drawing)', () => {
  it('reads 0 at nine o\'clock, 10 m/s at about twelve and six, 15 at about half past one and half past four', () => {
    expect(clockwise(lwVarioAngle(0))).toBeCloseTo(270, 6);
    expect(clockwise(lwVarioAngle(10))).toBeCloseTo(4, 0);
    expect(clockwise(lwVarioAngle(-10))).toBeCloseTo(176, 0);
    expect(clockwise(lwVarioAngle(15))).toBeCloseTo(51, 0);
    expect(clockwise(lwVarioAngle(-15))).toBeCloseTo(129, 0);
    expect(lwVarioAngle(30)).toBe(lwVarioAngle(15)); // held at the end of the scale
  });
});

describe('Bf 110 panel', () => {
  const L = BF110_LAYOUT;
  const unit = ([px, py]) => [(px - 241) / 30, (py - 334) / 30];

  it('fits every dial and its mounting inside the panel size', () => {
    for (const [name, [px, py, face, half]] of Object.entries(L.dials)) {
      const [x, y] = unit([px, py]);
      const reach = Math.max(face * 1.14, half) / 30;
      expect(Math.abs(x) + reach, name).toBeLessThan(L.width / 2);
      expect(y - reach, name).toBeGreaterThanOrEqual(-0.05);
      expect(y + reach, name).toBeLessThan(L.height);
    }
  });

  it('shows each engine on its own gauges: a stopped left engine reads on the left only', () => {
    const sim = new Simulation(aircraftById.bf110c4);
    sim.plane.engines[0].omega = 0;
    sim.plane.engines[1].omega = 2000 * UNIT.RPM;
    const v = instrumentReadings(sim);
    expect(v.engines).toHaveLength(2);
    expect(v.engines[0].rpm).toBeCloseTo(0, 6);
    expect(v.engines[1].rpm).toBeCloseTo(2000, 6);
    expect(v.engines[0].pitchClock).toBeDefined();
  });
});
