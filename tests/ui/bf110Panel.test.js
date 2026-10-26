// The Bf 110 panel after the product owner's photograph (D39): dial scales as photographed, the layout inside the
// panel, and each engine's own readings on its own instruments.
import { describe, it, expect } from 'vitest';
import { airspeed900Angle, climb30Angle } from '../../src/ui/bf110Dials.js';
import { BF110_LAYOUT } from '../../src/ui/bf110Panel.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;

describe('Bf 110 dial scales (as photographed)', () => {
  it('airspeed to 900 km/h: 300 at nine o\'clock, 500 at twelve, rising steadily', () => {
    expect(clockwise(airspeed900Angle(300))).toBeCloseTo(270, 6);
    expect(clockwise(airspeed900Angle(500))).toBeCloseTo(0, 6);
    for (let v = 0; v < 900; v += 10) expect(airspeed900Angle(v + 10)).toBeGreaterThan(airspeed900Angle(v));
  });

  it('climb to 30 m/s: 0 at nine o\'clock, climbs above and descents mirrored below', () => {
    expect(clockwise(climb30Angle(0))).toBeCloseTo(270, 6);
    for (const v of [5, 10, 20, 30]) {
      const up = clockwise(climb30Angle(v));
      const down = clockwise(climb30Angle(-v));
      expect(up > 270 || up < 90).toBe(true);
      expect(down).toBeGreaterThan(90);
      expect(down).toBeLessThan(270);
      expect((up + down) % 360).toBeCloseTo(180, 6);
    }
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
