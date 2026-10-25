// The Bf 109 panel after the product owner's photograph (D38): dial scales read as on the photographed instruments,
// the layout stays inside its outline, and the red marks come from the aircraft data.
import { describe, it, expect } from 'vitest';
import { lwAirspeedAngle, lwClimbAngle, lwRpmAngle, lwAtaAngle } from '../../src/ui/luftwaffeDials.js';
import { BF109_LAYOUT } from '../../src/ui/bf109Panel.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;

describe('Bf 109 dial scales (as photographed)', () => {
  it('airspeed: rests at six o\'clock, 200 km/h at about eight, rising steadily to 750', () => {
    expect(clockwise(lwAirspeedAngle(0))).toBeCloseTo(172, 0);
    expect(clockwise(lwAirspeedAngle(200))).toBeCloseTo(237, 0);
    for (let v = 0; v < 750; v += 10) expect(lwAirspeedAngle(v + 10)).toBeGreaterThan(lwAirspeedAngle(v));
  });

  it('climb: 0 at nine o\'clock, 5 m/s up at twelve, 5 down at six, 10 either way at three', () => {
    expect(clockwise(lwClimbAngle(0))).toBeCloseTo(270, 6);
    expect(clockwise(lwClimbAngle(5))).toBeCloseTo(0, 6);
    expect(clockwise(lwClimbAngle(-5))).toBeCloseTo(180, 6);
    expect(clockwise(lwClimbAngle(10))).toBeCloseTo(90, 6);
    expect(clockwise(lwClimbAngle(-10))).toBeCloseTo(90, 6);
  });

  it('rev counter: 600 at half past seven, 2,100 rpm at the top; manifold pressure 1.2 ata at the top', () => {
    expect(clockwise(lwRpmAngle(600))).toBeCloseTo(225, 6);
    expect(clockwise(lwRpmAngle(2100))).toBeCloseTo(0, 6);
    expect(clockwise(lwAtaAngle(1.2))).toBeCloseTo(0, 6);
    expect(clockwise(lwAtaAngle(0.8))).toBeCloseTo(270, 6);
  });
});

describe('Bf 109 panel layout', () => {
  it('keeps every dial inside the panel', () => {
    const L = BF109_LAYOUT;
    for (const [name, [[x, y], px]] of Object.entries(L.dials)) {
      const r = px / 60;
      expect(Math.abs(x) + r, name).toBeLessThan(L.width / 2);
      expect(y - r * 1.2, name).toBeGreaterThan(0);
      expect(y + r * 1.2, name).toBeLessThan(L.height);
    }
  });

  it('marks the 5-minute rating in red: 2,400 rpm and 1.30 ata', () => {
    const v = instrumentReadings(new Simulation(aircraftById.bf109e4));
    expect(v.limits.rpm[0]).toBeCloseTo(2400, 6);
    expect(v.limits.manifold[0]).toBeCloseTo(1.3, 2);
  });
});
