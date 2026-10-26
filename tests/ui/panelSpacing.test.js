// The Luftwaffe panels' instruments sit with the same gap between every pair of neighbouring mountings and plates,
// none touching or overlapping (product owner, D44).
import { describe, it, expect } from 'vitest';
import { BF109_LAYOUT, GAP as GAP109 } from '../../src/ui/bf109Panel.js';
import { BF110_LAYOUT, GAP as GAP110 } from '../../src/ui/bf110Panel.js';

/** Boxes { name, x, y, hw, hh } of every mounting (square: its half-width; round: 1.2 times the face) and plate. */
function boxes(L, plates) {
  const out = Object.entries(L.dials).map(([name, [x, y, face, half]]) => {
    const h = half || face * 1.2;
    return { name, x, y, hw: h, hh: h };
  });
  for (const [name, p] of plates) {
    out.push({ name, x: (p.from[0] + p.to[0]) / 2, y: (p.from[1] + p.to[1]) / 2, hw: (p.to[0] - p.from[0]) / 2, hh: (p.to[1] - p.from[1]) / 2 });
  }
  return out;
}

/** Clearance between two boxes: the larger of the horizontal and vertical gaps (negative when they overlap). */
const clearance = (a, b) => Math.max(Math.abs(a.x - b.x) - a.hw - b.hw, Math.abs(a.y - b.y) - a.hh - b.hh);

const PANELS = [
  ['Bf 109', GAP109, boxes(BF109_LAYOUT, [['flaps', BF109_LAYOUT.flaps], ['gear lever', BF109_LAYOUT.gearLever], ['gear lamps', BF109_LAYOUT.gearLamps], ['ammo counter', BF109_LAYOUT.ammo]])],
  ['Bf 110', GAP110, boxes(BF110_LAYOUT, [['flaps', BF110_LAYOUT.flaps], ['gear', BF110_LAYOUT.gear],
    ...BF110_LAYOUT.plates.map((p, i) => [`plate ${i}`, p])])],
];

describe('panel spacing (D44)', () => {
  for (const [panel, gap, items] of PANELS) {
    it(`${panel}: no two instruments or plates touch`, () => {
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          expect(clearance(items[i], items[j]), `${items[i].name} / ${items[j].name}`).toBeGreaterThan(gap - 0.5);
        }
      }
    });

    it(`${panel}: each one's nearest neighbour is the same ${gap}-pixel gap away`, () => {
      for (const a of items) {
        const nearest = Math.min(...items.filter((b) => b !== a).map((b) => clearance(a, b)));
        expect(nearest, a.name).toBeCloseTo(gap, 0);
      }
    });
  }
});
