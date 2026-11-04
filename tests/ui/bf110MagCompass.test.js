// The Bf 110 C's magnetic compass on its bracket at the panel's top right (#36, D203): its card, its place and its size.
import { describe, it, expect } from 'vitest';
import { cardMarks, bracketArm, MAG } from '../../src/ui/bf110MagCompass.js';
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
/** How far a point is from the outline's nearest edge. */
function toEdge([px, py]) {
  const pts = L.outline;
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [ax, ay] = pts[j];
    const [bx, by] = pts[i];
    const k = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
    best = Math.min(best, Math.hypot(px - ax - k * (bx - ax), py - ay - k * (by - ay)));
  }
  return best;
}

describe('Bf 110 C magnetic compass: on its bracket in the right corner (D203)', () => {
  const [l, t, r, b] = L.boxes.magCompass;
  const half = (r - l) / 2 / (1 + MAG.bracket);

  it('is 20% larger than first drawn: a case 132 of #34\'s pixels square (was 110)', () => {
    expect(2 * half).toBeCloseTo(132 * 0.46, 6);
    expect(r - l).toBeCloseTo(b - t, 9); // square
  });

  it('stands in the right corner: its bracket\'s top right corner at the sloping edge, its foot above the rev counter', () => {
    expect(inside([r, t])).toBe(true);
    expect(toEdge([r, t])).toBeLessThan(3 * 0.46); // within 3 of #34's pixels of the edge
    expect(b).toBeLessThan(L.cards.rpmRight[1]); // clear of the right rev counter's correction card
    expect(b).toBeLessThan(L.dials.rpmRight[1] - L.dials.rpmRight[3]);
    expect(l).toBeGreaterThan(L.boxes.heizung[2]);
  });

  it('keeps the bracket\'s arm on the plate, reaching the right edge', () => {
    const arm = bracketArm((l + r) / 2, (t + b) / 2, half);
    for (const p of arm) expect(inside(p), String(p)).toBe(true);
    expect(Math.min(toEdge(arm[1]), toEdge(arm[2]))).toBeLessThan(6 * 0.46);
  });
});
