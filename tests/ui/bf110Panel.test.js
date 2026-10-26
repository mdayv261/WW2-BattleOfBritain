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

describe('Bf 110 panel changes (D44)', () => {
  const L = BF110_LAYOUT;

  it('has the turn and bank indicator below the clock, clear of it', () => {
    const [cx, cy, , cHalf] = L.dials.clock;
    const [tx, ty, , tHalf] = L.dials.turn;
    expect(tx).toBe(cx);
    expect(ty - tHalf).toBeGreaterThan(cy + cHalf);
  });

  it('lights the undercarriage lamps green when down, red when up, and not at all in between', async () => {
    const { gearLampState } = await import('../../src/ui/bf110Panel.js');
    expect(gearLampState({ gearDown: true, gearUp: false })).toBe('green');
    expect(gearLampState({ gearDown: false, gearUp: true })).toBe('red');
    expect(gearLampState({ gearDown: false, gearUp: false })).toBe('off');
  });

  it('lines each engine\'s gauges up in its own column, left engine on the left: rpm, boost, pitch, fuel (D46)', () => {
    const order = ['rpm', 'ata', 'pitch', 'tank'];
    const xs = {};
    for (const side of ['Left', 'Right']) {
      const cells = order.map((k) => L.dials[`${k}${side}`]);
      xs[side] = cells[0][0];
      for (const c of cells) expect(c[0]).toBe(xs[side]);
      for (let k = 1; k < cells.length; k += 1) expect(cells[k][1]).toBeGreaterThan(cells[k - 1][1]);
    }
    expect(xs.Left).toBeLessThan(xs.Right);
    expect(Object.keys(L.dials).some((k) => /^(fuel|oil)(Left|Right)$/.test(k))).toBe(false);
  });

  it('labels the take-off and landing settings TAKEOFF and LANDING on every flap position indicator', async () => {
    const { readFileSync } = await import('node:fs');
    for (const file of ['instruments.js', 'bf109Panel.js', 'bf110Panel.js']) {
      const text = readFileSync(new URL(`../../src/ui/${file}`, import.meta.url), 'utf8');
      expect(text, file).toMatch(/takeoff: 'TAKEOFF'/);
      expect(text, file).not.toMatch(/takeoff: '(START|T\/O)'/);
      expect(text, file).toMatch(/landing: 'LANDING'/);
    }
  });
});

describe('Bf 110 fuel quantity gauges (D45)', () => {
  it('show each wing\'s tanks in litres: full, 635 litres (S24: 375 main + 260 reserve)', () => {
    const tanks = instrumentReadings(new Simulation(aircraftById.bf110c4)).fuelTanks;
    expect(tanks).toHaveLength(2);
    for (const t of tanks) {
      expect(t.capacity).toBeCloseTo(635, 6);
      expect(t.litres).toBeCloseTo(t.capacity, 6);
    }
    expect(BF110_LAYOUT.dials.tankLeft).toBeDefined();
    expect(BF110_LAYOUT.dials.tankRight).toBeDefined();
  });
});
