// The Bf 110 C's Fahrwerk and Landeklappe push/pull valves (D199): which T shows pushed in, their size, and their room
// on the panel between the lever box, the compass, the undercarriage lights, the Achtung placard and the label.
import { describe, it, expect } from 'vitest';
import { valve, valveGeometry, VALVE } from '../../src/ui/bf110Valves.js';
import { BF110_PANEL } from '../../src/ui/bf110Panel.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

const L = BF110_PANEL;
const S = 30; // one dial radius in the layout's units
const DT = 1 / 120;
const run = (sim, seconds) => { for (let t = 0; t < seconds; t += DT) sim.step(DT); };

/** A valve's outer edges [left, top, right, bottom], its shadow included. */
function extent(p) {
  const [dx, dy, dr] = p.disc;
  const [cx, cy, cr] = p.collar;
  const { x, y, w, h } = p.bar;
  return [
    Math.min(dx - dr, x), Math.min(dy - dr, cy - cr, y),
    Math.max(dx + dr, x + w + p.shadow, cx + cr), Math.max(dy + dr, cy + cr, y + h + p.shadow),
  ];
}

/** Whether a layout point lies inside the panel's outline. */
function inside([px, py]) {
  let hit = false;
  const pts = L.outline;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

describe('Bf 110 C Fahrwerk and Landeklappe valves: which is pushed in (D199)', () => {
  it('pushes AUS while the undercarriage runs down and EIN while it runs up, neither once it stops', () => {
    expect(valve.gear({ gearSelected: true, gearDown: false, gearUp: false })).toBe('aus');
    expect(valve.gear({ gearSelected: true, gearDown: true, gearUp: false })).toBeNull();
    expect(valve.gear({ gearSelected: false, gearDown: false, gearUp: false })).toBe('ein');
    expect(valve.gear({ gearSelected: false, gearDown: false, gearUp: true })).toBeNull();
  });

  it('pushes AUS while the flaps run down to the setting, EIN while they run up, neither once there', () => {
    expect(valve.flaps({ flapSelected: 0.6, flaps: 0.3 })).toBe('aus');
    expect(valve.flaps({ flapSelected: 0.2, flaps: 0.3 })).toBe('ein');
    expect(valve.flaps({ flapSelected: 0.4, flaps: 0.4 })).toBeNull();
    expect(valve.flaps({})).toBeNull();
  });

  it('follows the flaps and undercarriage in flight: pushed while they travel (8 s), out once they stop', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    const now = () => instrumentReadings(sim);
    expect([valve.gear(now()), valve.flaps(now())]).toEqual([null, null]); // flying, wheels and flaps up
    sim.input.flaps = 1;
    sim.input.gear = 1;
    run(sim, 2);
    expect([valve.gear(now()), valve.flaps(now())]).toEqual(['aus', 'aus']);
    run(sim, 7);
    expect([valve.gear(now()), valve.flaps(now())]).toEqual([null, null]);
    sim.input.flaps = 0;
    sim.input.gear = 0;
    run(sim, 2);
    expect([valve.gear(now()), valve.flaps(now())]).toEqual(['ein', 'ein']);
  });
});

describe('Bf 110 C valves: the bigger two-finger T (D199)', () => {
  it('draws the T bigger than D198\'s (bar 0.63 dial radii wide), keeping the discs at 0.3', () => {
    expect(VALVE.bar[0]).toBeGreaterThanOrEqual(0.75);
    expect(VALVE.bar[1]).toBeGreaterThan(0.16);
    expect(valveGeometry(0, 0, S, false).disc[2]).toBeCloseTo(0.3 * S, 9);
  });

  it('sits a pushed-in T on its collar and stands a pulled-out one off it, on its shaft', () => {
    const inn = valveGeometry(100, 200, S, true);
    const out = valveGeometry(100, 200, S, false);
    expect(inn.bar.y + inn.bar.h / 2).toBeCloseTo(inn.collar[1], 9);
    expect(inn.shaft).toBeNull();
    expect(out.bar.y + out.bar.h / 2 - out.collar[1]).toBeCloseTo(VALVE.out * S, 9);
    expect(out.shaft.h).toBeCloseTo(VALVE.out * S, 9);
    expect(out.shadow).toBeGreaterThan(inn.shadow);
    expect(out.bar.x + out.bar.w / 2).toBeCloseTo(out.collar[0], 9); // the bar across its shaft
    expect(out.bar.x).toBeGreaterThan(out.disc[0] + out.disc[2]); // the disc beside it, clear
  });

  it('centres each disc and T together on the switch line', () => {
    const p = valveGeometry(300, 0, S, false);
    const [l, , r] = extent({ ...p, shadow: 0 });
    expect((l + r) / 2).toBeCloseTo(300, 9);
  });
});

describe('Bf 110 C valves: room on the panel (D199)', () => {
  const rows = (name) => {
    const [x, ein, aus] = L.switches[name];
    return [true, false].flatMap((pushed) => [extent(valveGeometry(x, ein, S, pushed)), extent(valveGeometry(x, aus, S, pushed))]);
  };
  const compassLeft = L.dials.compass[0] - L.dials.compass[3];

  it('keeps both controls between the lever box and the compass and course box', () => {
    for (const name of ['gear', 'flaps']) {
      for (const [l, , r] of rows(name)) {
        expect(l, name).toBeGreaterThan(L.boxes.levers[2]);
        expect(r, name).toBeLessThan(Math.min(compassLeft, L.boxes.course[0]));
      }
    }
  });

  it('keeps the Fahrwerk pair under its lights and over the Achtung placard, the Landeklappe pair under that and over its label', () => {
    for (const [name, above, below] of [['gear', 'gearLights', 'achtung'], ['flaps', 'achtung', 'klappeLabel']]) {
      for (const [, t, , b] of rows(name)) {
        expect(t, name).toBeGreaterThan(L.boxes[above][3]);
        expect(b, name).toBeLessThan(L.boxes[below][1]);
      }
    }
  });

  it('keeps every valve on the plate, inside the panel\'s outline, pulled out or pushed in', () => {
    for (const name of ['gear', 'flaps']) {
      for (const [l, t, r, b] of rows(name)) {
        for (const corner of [[l, t], [r, t], [l, b], [r, b]]) expect(inside(corner), `${name} ${corner}`).toBe(true);
      }
    }
  });

  it('keeps each EIN valve clear of the AUS valve below it', () => {
    for (const name of ['gear', 'flaps']) {
      const [x, ein, aus] = L.switches[name];
      const einBottom = extent(valveGeometry(x, ein, S, false))[3];
      const ausTop = extent(valveGeometry(x, aus, S, true))[1];
      expect(einBottom, name).toBeLessThan(ausTop);
    }
  });
});
