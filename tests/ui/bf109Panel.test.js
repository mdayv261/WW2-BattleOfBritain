// The Bf 109 E panel after the product owner's photograph (D38): dial scales read as on the photographed instruments,
// and the layout keeps every dial and plate inside the panel's outline.
import { describe, it, expect } from 'vitest';
import { lwAirspeedAngle, lwRpmAngle, lwAtaAngle } from '../../src/ui/luftwaffeDials.js';
import { BF109_LAYOUT } from '../../src/ui/bf109Panel.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;

describe('Bf 109 dial scales (as photographed)', () => {
  it('airspeed: rests near six o\'clock, 200 km/h at about eight, rising steadily to 750', () => {
    expect(clockwise(lwAirspeedAngle(0))).toBeCloseTo(172, 0);
    expect(clockwise(lwAirspeedAngle(200))).toBeCloseTo(237, 0);
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

describe('Bf 109 panel layout', () => {
  const L = BF109_LAYOUT;
  // Panel units (dial radii from the top centre) of a point measured on the photograph.
  const unit = ([px, py]) => [(px - 350) / 30, (py - 26) / 30];

  it('fits every dial and its mounting inside the panel size', () => {
    for (const [name, [px, py, face, half]] of Object.entries(L.dials)) {
      const [x, y] = unit([px, py]);
      const reach = Math.max(face * 1.38, half) / 30;
      expect(Math.abs(x) + reach, name).toBeLessThan(L.width / 2);
      expect(y - reach, name).toBeGreaterThanOrEqual(-0.01);
      expect(y + reach, name).toBeLessThan(L.height);
    }
  });

  it('puts the flap indicator between the compass and the manifold pressure gauge, clear of both', () => {
    const [cx, , , cHalf] = L.dials.compass;
    const [ax, , , aHalf] = L.dials.ata;
    expect(L.flaps.from[0]).toBeGreaterThan(cx + cHalf);
    expect(L.flaps.to[0]).toBeLessThan(ax - aHalf);
    expect(L.flaps.to[1]).toBeLessThan(L.pitchSwitch.from[1]);
  });
});
