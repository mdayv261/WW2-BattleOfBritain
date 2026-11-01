// The pilot's speed cards (D91): the sourced figures where found and the product owner's otherwise, in each side's units;
// lettered on the Spitfire and Hurricane panel left of the GM 2, clear of every part of the sight on any screen, and on the
// Bf 109 panel in the deviation card's place.
import { describe, it, expect } from 'vitest';
import { pilotCard } from '../../src/ui/speedCard.js';
import { SPITFIRE_PANEL, P, rafPanel } from '../../src/ui/rafPanel.js';
import { BF109_PANEL, bf109Panel } from '../../src/ui/bf109Panel.js';
import { SIGHT, sightPlacement } from '../../src/ui/reflectorSight.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

const values = (id) => pilotCard(aircraftById[id], aircraftById[id].side === 'RAF').entries.map((e) => Number(e.value));

/** A canvas that records lettering. */
function recorder() {
  const texts = [];
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'texts') return texts;
      if (prop === 'fillText') return (t) => texts.push(String(t));
      if (prop in target) return target[prop];
      if (String(prop).startsWith('create')) return () => ({ addColorStop() {} });
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

describe('pilot\'s speed card figures (D91)', () => {
  it('Spitfire: stall 78 and 68 (S4), take-off 81 (product owner), best climb 140 (S4), approach 85 mph (S33)', () => {
    expect(values('spitfire')).toEqual([78, 68, 81, 140, 85]);
  });

  it('Hurricane: stall 87 and 70 (S12), take-off 81 (product owner), best climb 164 (S2), approach 70 mph (product owner)', () => {
    expect(values('hurricane')).toEqual([87, 70, 81, 164, 70]);
  });

  it('Bf 109: stall 150 and 100 (S20), take-off 120 (product owner), best climb 250 (S15), approach 145 km/h (S32)', () => {
    expect(values('bf109e4')).toEqual([150, 100, 120, 250, 145]);
    const card = pilotCard(aircraftById.bf109e4, false);
    expect(card.unit).toBe('km/h');
    expect(card.entries.map((e) => e.label)).toEqual(['Stall, no flap', 'Stall, flap 40°', 'Take-off, flap 20°', 'Best ROC', 'Final approach']);
  });

  it('is not on the aircraft without one', () => {
    expect(pilotCard(aircraftById.bf110c4, false)).toBeNull();
  });
});

describe('pilot\'s speed card on the panels (D91)', () => {
  it('is lettered on the Spitfire panel and the Bf 109 panel, the deviation card gone', () => {
    const g = recorder();
    rafPanel(g, 1000, 0, 40, instrumentReadings(new Simulation(aircraftById.spitfire, 'air')));
    for (const w of ['SPEEDS', 'M.P.H. I.A.S.', 'Stall, flaps up', '78', 'Take-off', '81', 'Best ROC', '140', 'Final approach', '85']) {
      expect(g.texts, w).toContain(w);
    }
    const h = recorder();
    bf109Panel(h, 1000, 0, 40, instrumentReadings(new Simulation(aircraftById.bf109e4, 'air')));
    for (const w of ['SPEEDS', 'km/h', 'Stall, flap 40°', '100', 'Take-off, flap 20°', '250', '145']) expect(h.texts, w).toContain(w);
    expect(BF109_PANEL.boxes.deviation).toBeUndefined();
  });

  it('stands left of the GM 2, clear of every part of the sight on every screen', () => {
    const parts = [
      [SIGHT.block.w / 2, 0, SIGHT.block.h], [SIGHT.base.w / 2, ...SIGHT.base.y], [SIGHT.range.w / 2, ...SIGHT.range.y],
      [SIGHT.wheels.x + SIGHT.wheels.w, ...SIGHT.wheels.y], [-SIGHT.bracket.x[0], ...SIGHT.bracket.y],
      [SIGHT.collar.w / 2, ...SIGHT.collar.y], [SIGHT.cone.w[1] / 2, ...SIGHT.cone.y], [SIGHT.top.w / 2, ...SIGHT.top.y],
      [SIGHT.glass.w / 2, ...SIGHT.glass.y], [SIGHT.brackets.x + SIGHT.brackets.w + 10, SIGHT.brackets.foot, SIGHT.brackets.top],
    ];
    for (const [w, h] of [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [2560, 1203]]) {
      const r = panelRadius(SPITFIRE_PANEL, w, h);
      const top = h - (SPITFIRE_PANEL.height * r + 6);
      const [l, t, rt, b] = SPITFIRE_PANEL.boxes.speedCard;
      const card = { left: w / 2 + P(l, t)[0] * r, top: top + P(l, t)[1] * r, right: w / 2 + P(rt, b)[0] * r, bottom: top + P(rt, b)[1] * r };
      expect(card.right, `${w}x${h}`).toBeLessThan(w / 2);
      const p = sightPlacement(w, h);
      for (const [half, y0, y1] of parts) {
        const part = { left: p.x - half * p.k, top: p.foot - y1 * p.k, bottom: p.foot - y0 * p.k };
        const overlaps = card.right > part.left && card.top < part.bottom && part.top < card.bottom;
        expect(overlaps, `${w}x${h}: part from ${y0} to ${y1}`).toBe(false);
      }
    }
  });
});
