// The Bf 110 C's labels between the flying instruments, each centred under the dial above it (D206).
import { describe, it, expect } from 'vitest';
import { BF110_PANEL } from '../../src/ui/bf110Panel.js';
import { ACHTUNG, achtungLines, achtungPlacard } from '../../src/ui/bf110Placards.js';

const L = BF110_PANEL;
const mid = ([l, , r]) => (l + r) / 2;

describe('Bf 110 C labels between the flying instruments (D206)', () => {
  it('centres the dive placard under the airspeed indicator, Umschaltwarnung under the turn and slip, the window under the climb', () => {
    for (const [label, dial] of [['dive', 'airspeed'], ['umschalt', 'turn'], ['window', 'climb']]) {
      expect(mid(L.boxes[label]), label).toBeCloseTo(L.dials[dial][0], 9);
    }
  });

  it('keeps each label\'s size and height, and the Umschaltwarnung lamps either side of their placard as before', () => {
    const K = 0.46;
    expect(L.boxes.dive[2] - L.boxes.dive[0]).toBeCloseTo(120 * K, 9);
    expect(L.boxes.umschalt[2] - L.boxes.umschalt[0]).toBeCloseTo(153 * K, 9);
    expect(L.boxes.window[2] - L.boxes.window[0]).toBeCloseTo(80 * K, 9);
    const [l, , r] = L.boxes.umschalt;
    expect(l - L.knobs.umschaltLeft[0]).toBeCloseTo(16 * K, 9);
    expect(L.knobs.umschaltRight[0] - r).toBeCloseTo(16 * K, 9);
  });

  it('keeps the window above the altimeter, on its centre line too', () => {
    expect(mid(L.boxes.window)).toBeCloseTo(L.dials.altimeter[0], 9);
  });

  it('levels the Fahrwerk label under the lever box with the Landeklappe label (D207)', () => {
    const [, ft, , fb] = L.boxes.fahrwerkLabel;
    const [, kt, , kb] = L.boxes.klappeLabel;
    expect(ft).toBeCloseTo(kt, 9);
    expect(fb).toBeCloseTo(kb, 9);
    expect(ft).toBeGreaterThan(L.boxes.levers[3]); // still below the lever box
  });

  it('letters the Achtung placard 1.5 times larger, its ten lines fitting its height (D208)', () => {
    expect(ACHTUNG.font).toBeCloseTo(1.5 * 0.0504, 9);
    const { gear, flaps } = achtungLines({ pilotCard: { flapLimit: 250 } });
    const [, t, , b] = L.boxes.achtung;
    const ems = (gear.length + flaps.length) * ACHTUNG.line + 4 * ACHTUNG.pad;
    expect(ems * ACHTUNG.font * (b - t)).toBeLessThanOrEqual(b - t);
    // Chrome's widths at 100 px (D208): every line fits 0.92 of the widened placard at the new font.
    const width = { 'Achtung Fahrwerk': 878, 'bei Geschwindig-': 831, 'keit über 250 km/St': 928, 'nicht betätigen': 715,
      Achtung: 400, 'Landeklappe muß': 853, vollständig: 518, 'eingefahren sein': 789 };
    const [l, , r] = L.boxes.achtung;
    for (const s of [...gear, ...flaps]) expect((width[s] / 100) * ACHTUNG.font * (b - t), s).toBeLessThan(0.92 * (r - l));
  });

  it('widens the Achtung placard to fill the gap between the lever box and the course box, centred on the valves', () => {
    const [l, , r] = L.boxes.achtung;
    expect(mid(L.boxes.achtung)).toBeCloseTo(L.switches.gear[0], 9);
    expect(l).toBeGreaterThan(L.boxes.levers[2]);
    expect(r).toBeLessThan(L.boxes.course[0]);
    expect(r - l).toBeCloseTo(112 * 0.46, 9);
  });

  it('draws both sections with the rule between them, the flaps\' section taller', () => {
    const texts = [];
    const lines = [];
    const g = new Proxy({}, {
      get: (t, p) => (p === 'fillText' ? (s, x, y) => texts.push([s, y]) : p === 'lineTo' ? (x, y) => lines.push(y)
        : p in t ? t[p] : () => {}),
      set: (t, p, val) => { t[p] = val; return true; },
    });
    achtungPlacard(g, { x: 0, y: 0, w: 112, h: 140 }, { pilotCard: { flapLimit: 250 } });
    const rule = lines[0];
    expect(rule).toBeLessThan(70); // the flaps' section, below it, the taller
    expect(texts.filter(([, y]) => y < rule)).toHaveLength(4);
    expect(texts.filter(([, y]) => y > rule)).toHaveLength(6);
  });
});
