// The Bf 110 C's labels between the flying instruments, each centred under the dial above it (D206).
import { describe, it, expect } from 'vitest';
import { BF110_PANEL } from '../../src/ui/bf110Panel.js';
import { ACHTUNG, achtungLines, achtungPlacard } from '../../src/ui/bf110Placards.js';
import { LEVER_TRAVEL, LEVER_LABELS, LEVER_KNOB } from '../../src/ui/bf110Fittings.js';

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

  it('draws the flaps\' section above the undercarriage\'s (D210), the rule between them, the flaps\' section taller', () => {
    const texts = [];
    const lines = [];
    const g = new Proxy({}, {
      get: (t, p) => (p === 'fillText' ? (s, x, y) => texts.push([s, y]) : p === 'lineTo' ? (x, y) => lines.push(y)
        : p in t ? t[p] : () => {}),
      set: (t, p, val) => { t[p] = val; return true; },
    });
    achtungPlacard(g, { x: 0, y: 0, w: 112, h: 140 }, { pilotCard: { flapLimit: 250 } });
    const rule = lines[0];
    expect(rule).toBeGreaterThan(70); // the flaps' section, above it, the taller
    expect(texts.filter(([, y]) => y < rule).map(([w]) => w)).toEqual(achtungLines({ pilotCard: { flapLimit: 250 } }).flaps);
    expect(texts.filter(([, y]) => y > rule).map(([w]) => w)).toEqual(achtungLines({ pilotCard: { flapLimit: 250 } }).gear);
  });

  it('shortens the airscrew lever box 10 mm from its foot, its top kept (D209)', () => {
    const [l, t, r, b] = L.boxes.levers;
    const K = 0.46;
    expect((855 - 465 - (b - t) / K) * 0.619).toBeCloseTo(43, 6); // 43 screen px, 10 mm
    expect(t).toBeCloseTo(57 + (465 - 132) * K, 9);
    expect(r - l).toBeCloseTo(200 * K, 9);
  });

  it('keeps each pitch lever\'s knob clear of its größer and kleiner labels in the shorter box (D209)', () => {
    const [, t, , b] = L.boxes.levers;
    const h = b - t;
    const knob = (LEVER_KNOB * 30) / 2; // its radius in the layout's units
    const half = (LEVER_LABELS.size * h) / 2; // a label's half-height
    expect(LEVER_TRAVEL[0] * h - knob).toBeGreaterThan(LEVER_LABELS.groesser * h + half);
    expect(LEVER_TRAVEL[1] * h + knob).toBeLessThan(LEVER_LABELS.kleiner * h - half);
    expect(LEVER_LABELS.groesser * h - half).toBeGreaterThan(0.37 * h); // below the Hand plate
  });

  it('adds a Fahrwerk label 1 mm below the lever box\'s foot, its right edge in line (D211)', () => {
    const [, , lr, lb] = L.boxes.levers;
    const [gl, gt, gr, gb] = L.boxes.gearLabel;
    const [fl, ft, fr, fb] = L.boxes.fahrwerkLabel;
    expect(gr).toBeCloseTo(lr, 9);
    expect(((gt - lb) / 0.46) * 0.619).toBeCloseTo(4.3, 6); // 1 mm: 4.3 screen px
    expect(gr - gl).toBeCloseTo(1.5 * (fr - fl), 9); // 1.5 times the first label's size
    expect(gb - gt).toBeCloseTo(1.5 * (fb - ft), 9);
    expect(gb).toBeLessThan(L.dials.pressluft[1] - L.dials.pressluft[3]); // clear of the Preßluft gauge below
  });

  it('sets the Preßluft gauge 5 mm from the Fahrwerk and Landeklappe labels either side (D212)', () => {
    const [x, , , o] = L.dials.pressluft;
    const mm = (d) => ((d / 0.46) * 0.619) / 4.3; // layout units to mm on the product owner's screen
    expect(mm(x - o - L.boxes.fahrwerkLabel[2])).toBeCloseTo(5, 6);
    expect(mm(L.boxes.klappeLabel[0] - (x + o))).toBeCloseTo(5, 6);
    expect(L.boxes.fahrwerkLabel[2] - L.boxes.fahrwerkLabel[0]).toBeCloseTo(70 * 0.46, 9); // its size kept
  });

  describe('the knurled emergency hand-wheels under the Fahrwerk and Landeklappe labels (D213)', () => {
    const wheels = [['gearAirWheel', 'fahrwerkLabel', 0], ['flapAirWheel', 'klappeLabel', 6 * 0.46]];
    /** Whether a layout point lies inside the panel's outline. */
    const inside = ([px, py]) => {
      let hit = false;
      const pts = L.outline;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };

    it('makes each 44 mm across in life, the airspeed indicator\'s face taken as 80 mm', () => {
      for (const [k] of wheels) expect(2 * L.knobs[k][2], k).toBeCloseTo((44 / 80) * 2 * L.dials.airspeed[2], 9);
    });

    it('stands each 1 mm below its label, centred under it (the Landeklappe one 6 px left to stay on the plate)', () => {
      for (const [k, label, shift] of wheels) {
        const [x, y, r] = L.knobs[k];
        const [l, , rt, b] = L.boxes[label];
        expect(x, k).toBeCloseTo((l + rt) / 2 - shift, 9);
        expect((((y - r - b) / 0.46) * 0.619)).toBeCloseTo(4.3, 6); // 1 mm: 4.3 screen px
      }
    });

    it('keeps each wheel on the plate and clear of the Preßluft gauge\'s mounting', () => {
      const [px, py, , po] = L.dials.pressluft;
      for (const [k] of wheels) {
        const [x, y, r] = L.knobs[k];
        for (let a = 0; a < 360; a += 5) {
          const p = [x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180)];
          expect(inside(p), `${k} ${a}`).toBe(true);
          expect(Math.abs(p[0] - px) > po || Math.abs(p[1] - py) > po, `${k} ${a}`).toBe(true);
        }
      }
    });
  });
});
