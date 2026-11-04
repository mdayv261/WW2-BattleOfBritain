// The Bf 110 C's magnetic compass on its bracket at the panel's top right (#36, D203): its card, its place and its size.
import { describe, it, expect } from 'vitest';
import { cardMarks, MAG } from '../../src/ui/bf110MagCompass.js';
import { BF110_PANEL } from '../../src/ui/bf110Panel.js';

const L = BF110_PANEL;

describe('Bf 110 C magnetic compass: the card (D203)', () => {
  it('shows the heading under the lubber line', () => {
    for (const h of [0, 90, 215, 270]) {
      const under = cardMarks(h).find((m) => Math.abs(m.dx) < 1e-9);
      if (h % 5 === 0) expect(under?.deg, String(h)).toBe(h);
    }
  });

  it('runs its figures up to the left, as #36 (27, 24, 21 from left to right)', () => {
    const figs = cardMarks(240).filter((m) => m.kind === 'figure').sort((a, b) => a.dx - b.dx).map((m) => m.deg);
    expect(figs).toEqual([270, 240, 210]);
  });

  it('wraps through north and shows only the window\'s span either side of the line', () => {
    const marks = cardMarks(355);
    expect(marks.map((m) => m.deg)).toContain(0);
    expect(marks.map((m) => m.deg)).toContain(330);
    for (const m of marks) expect(Math.abs(m.dx)).toBeLessThanOrEqual(1);
    expect(marks.length).toBe((2 * MAG.span) / 5 + 1);
  });

  it('moves the card right to left as the aircraft turns right', () => {
    const at = (h) => cardMarks(h).find((m) => m.deg === 90).dx;
    expect(at(80)).toBeLessThan(0); // 90 just left of the line before the turn reaches it
    expect(at(100)).toBeGreaterThan(0);
  });
});

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

describe('Bf 110 C magnetic compass: on its bracket next to the Heizung placard (D203)', () => {
  const [l, t, r, b] = L.magCompass;
  const half = (r - l) / 2 / (1 + MAG.bracket);
  const overlap = ([al, at, ar, ab], [bl, bt, br, bb]) => al < br && bl < ar && at < bb && bt < ab;

  it('is 20% then 25% larger than first drawn: a case 165 of #34\'s pixels square (first 110)', () => {
    expect(2 * half).toBeCloseTo(110 * 1.2 * 1.25 * 0.46, 6);
    expect(r - l).toBeCloseTo(b - t, 9); // square
  });

  it('stands next to the Heizung placard, its foot just above the right rev counter\'s correction card', () => {
    const [, ht, hr, hb] = L.boxes.heizung;
    expect(l - hr).toBeGreaterThan(0);
    expect(l - hr).toBeLessThan(2); // 3 of #34's pixels
    expect(t).toBeLessThan(hb); // level with the placard
    expect(b).toBeGreaterThan(ht);
    expect(L.cards.rpmRight[1] - b).toBeGreaterThan(0);
    expect(L.cards.rpmRight[1] - b).toBeLessThan(2); // 4 of #34's pixels
  });

  it('covers no instrument, plate or card', () => {
    const squares = Object.entries(L.dials).map(([name, [x, y, , h]]) => [name, [x - h, y - h, x + h, y + h]]);
    for (const [name, box] of [...squares, ...Object.entries(L.boxes), ...Object.entries(L.cards)]) {
      expect(overlap([l, t, r, b], box), name).toBe(false);
    }
  });

  it('keeps its case\'s left side and foot on the plate; only the top right corner overhangs the edge onto the frame', () => {
    const [cx, cy] = [(l + r) / 2, (t + b) / 2];
    for (const p of [[cx - half, cy - half], [cx - half, cy + half], [cx + half, cy + half]]) expect(inside(p), String(p)).toBe(true);
    expect(inside([r, t])).toBe(false);
  });
});
