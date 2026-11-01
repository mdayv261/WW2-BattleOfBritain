// The Bf 109 E panel after the product owner's pictures of a restored panel (D89): dial scales read as on the
// photographed instruments; every dial, plate and knob on the restored panel's upper or lower plate (#17, #23), none
// touching;
// the Revi in front of the panel's top clear of the dials; the placards' words; the undercarriage selector following the
// lever; no ammunition counter, flap, trim or GEAR displays; looking down slides the whole panel into view.
import { describe, it, expect } from 'vitest';
import { lwAirspeedAngle, lwRpmAngle, lwAtaAngle, lwFuelAngle } from '../../src/ui/luftwaffeDials.js';
import { BF109_PANEL, GLASS_ABOVE, P, bf109Panel, lookDownShift } from '../../src/ui/bf109Panel.js';
import { selectorPosition } from '../../src/ui/bf109Lower.js';
import { REVI, reviPlacement } from '../../src/ui/reviSight.js';
import { SPITFIRE_PANEL } from '../../src/ui/rafPanel.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { HAT_LOOKS } from '../../src/render/cameras.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;
const L = BF109_PANEL;
const PX = 45;
const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [2560, 1203]];

/** Whether a picture point lies inside an outline (picture pixels). */
function inside([px, py], pts) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const onPanel = (p) => inside(p, L.upper) || inside(p, L.lower);

/** Every dial's mounting or bezel as a square [left, top, right, bottom], and every plate, in picture pixels. */
const dialSquares = Object.entries(L.dials).map(([name, [x, y, , outer]]) => [name, [x - outer, y - outer, x + outer, y + outer]]);
const plates = Object.entries(L.boxes);
const overlap = ([al, at, ar, ab], [bl, bt, br, bb]) => al < br && bl < ar && at < bb && bt < ab;

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
const readings = (over = {}) => ({ ...instrumentReadings(new Simulation(aircraftById.bf109e4, 'air')), ...over });

describe('Bf 109 dial scales (as photographed)', () => {
  it('airspeed (Fl. 22231 drawing): rests at six o\'clock, 200 km/h at about eight, 400 just left of twelve, rising to 750', () => {
    expect(clockwise(lwAirspeedAngle(0))).toBeCloseTo(180, 6);
    expect(clockwise(lwAirspeedAngle(200))).toBeCloseTo(245, 6);
    expect(clockwise(lwAirspeedAngle(400))).toBeCloseTo(347, 6);
    for (let v = 0; v < 750; v += 10) expect(lwAirspeedAngle(v + 10)).toBeGreaterThan(lwAirspeedAngle(v));
  });

  it('rev counter (#17, D89): 600 at about half past seven, 2,000 at twelve, 3,400 at about half past four', () => {
    expect(clockwise(lwRpmAngle(600))).toBeCloseTo(202.5, 6);
    expect(clockwise(lwRpmAngle(2000))).toBeCloseTo(0, 6);
    expect(clockwise(lwRpmAngle(3400))).toBeCloseTo(157.5, 6);
  });

  it('manifold pressure: 1.2 ata at twelve, 0.8 at nine', () => {
    expect(clockwise(lwAtaAngle(1.2))).toBeCloseTo(0, 6);
    expect(clockwise(lwAtaAngle(0.8))).toBeCloseTo(270, 6);
  });

  it('fuel contents: empty at the left of the upper scale, the 400-litre tank full at its right (S16, S17)', () => {
    expect(lwFuelAngle(0, 400) / DEG).toBeCloseTo(-100, 6);
    expect(lwFuelAngle(400, 400) / DEG).toBeCloseTo(100, 6);
    expect(readings().fuelTanks).toEqual([{ litres: 400, capacity: 400 }]);
    expect(readings().rpmLimit).toBeCloseTo(2400, 6); // the red mark: the 5-minute and take-off limit (S15, S18)
  });
});

describe('Bf 109 panel layout (D89)', () => {
  it('puts every dial, plate, knob and bolt on the panel', () => {
    for (const [name, [x, y, , outer]] of Object.entries(L.dials)) {
      for (let k = 0; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2;
        expect(onPanel([x + Math.cos(a) * outer, y + Math.sin(a) * outer]), name).toBe(true);
      }
    }
    for (const [name, [l, t, r, b]] of plates) {
      for (const corner of [[l, t], [r, t], [l, b], [r, b]]) expect(onPanel(corner), name).toBe(true);
    }
    for (const [name, [x, y]] of Object.entries(L.knobs)) expect(onPanel([x, y]), name).toBe(true);
    for (const bolt of L.bolts) expect(onPanel(bolt), String(bolt)).toBe(true);
  });

  it('keeps every dial and plate clear of the others', () => {
    const all = [...dialSquares, ...plates];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) expect(overlap(all[i][1], all[j][1]), `${all[i][0]} / ${all[j][0]}`).toBe(false);
    }
  });

  it('keeps the Revi in front of the panel\'s top clear of every dial', () => {
    // The Revi's parts in picture pixels: its glass centre GLASS_ABOVE radii above the arch on the axis, as from the seat.
    const toPicture = ({ x: [x0, x1], y: [y0, y1] }) => [660 + x0 * PX, 227 + (y0 - GLASS_ABOVE) * PX, 660 + x1 * PX, 227 + (y1 - GLASS_ABOVE) * PX];
    for (const name of ['body', 'pad', 'lever', 'block', 'knob']) {
      for (const [dial, square] of dialSquares) expect(overlap(toPicture(REVI[name]), square), `${name} / ${dial}`).toBe(false);
    }
  });

  it('sits below the Revi\'s glass on every screen, the glass big enough for the reticle\'s ring', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const archTop = h - (L.height * r + 6);
      expect(archTop - h / 2, `${w}x${h}`).toBeGreaterThanOrEqual(GLASS_ABOVE * r - 6 - 1e-6);
      expect(L.width * r, `${w}x${h}`).toBeLessThanOrEqual(0.96 * w + 1e-6);
      // The reticle looking ahead, on the middle of the screen, with its lines' reach (src/ui/reticle.js) on the glass
      // and above the housing's dip, as photographed (#21).
      const { glass } = reviPlacement(w, h);
      expect(glass.x + glass.w / 2).toBeCloseTo(w / 2, 6);
      const ring = (h / 2 / Math.tan((70 * Math.PI) / 360)) * Math.tan(aircraftById.bf109e4.sight.ringMils / 2000);
      expect(glass.x, `${w}x${h}`).toBeLessThan(w / 2 - 1.22 * ring);
      expect(glass.y, `${w}x${h}`).toBeLessThan(h / 2 - 1.2 * ring);
      expect(glass.y + glass.h, `${w}x${h}`).toBeGreaterThan(h / 2 + ring);
    }
    expect(panelRadius(L, 2560, 1259)).toBeGreaterThan(45); // about the earlier panel's size, larger than the Spitfire's
  });

  it('uses the picture\'s positions: the Revi on the guns\' line right of the clock, its upper plate\'s raised middle round the clock', () => {
    expect(P(660, 227)).toEqual([0, 0]);
    expect(L.dials.clock[0]).toBeLessThan(660);
    const top = Math.min(...L.upper.map(([, y]) => y));
    const [cx, cy, , outer] = L.dials.clock;
    expect(cy - outer).toBeGreaterThan(top);
    // The wings either side reach out past the raised middle's shoulders, and the lower plate is wider still.
    const width = (pts) => Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
    expect(width(L.lower)).toBeGreaterThan(width(L.upper));
    expect(cx).toBeGreaterThan(Math.min(...L.upper.map(([x]) => x)));
  });
});

describe('Bf 109 panel drawing (D89)', () => {
  it('letters the placards that can be read on the picture, the selector and the instruments', () => {
    const g = recorder();
    bf109Panel(g, 1000, 0, 40, readings());
    for (const w of ['Landeklappen 250 km/h', 'Start', '20°', 'Landung', '40°', 'Achtung!', 'Staurohr', 'Reststand',
      'Notzug', 'für Fahrwerk', 'Handpumpe', 'Fahrwerk', 'Ein', 'Ruhe', 'Aus', 'UP', 'DN', 'Kühlstoff', 'Hell', 'SKK404-2', 'Liter',
      'U/min', 'EIN', 'AUS']) {
      expect(g.texts, w).toContain(w);
    }
  });

  it('has no ammunition counter, flap or trim display, or added undercarriage lamps', () => {
    const g = recorder();
    bf109Panel(g, 1000, 0, 40, readings());
    for (const w of ['KLAPPEN', 'ELEVATOR', 'GEAR', 'OBEN', 'UNTEN', 'MG 17', 'MG FF']) expect(g.texts, w).not.toContain(w);
    expect(L.flaps).toBeUndefined();
    expect(L.ammo).toBeUndefined();
  });

  it('turns the undercarriage selector to Ein with the lever up, Aus with it down', () => {
    expect(selectorPosition({ gearSelected: false })).toBe('Ein');
    expect(selectorPosition({ gearSelected: true })).toBe('Aus');
    const sim = new Simulation(aircraftById.bf109e4, 'ground');
    expect(selectorPosition(instrumentReadings(sim))).toBe('Aus');
  });
});

describe('looking down at the Bf 109 panel (D89)', () => {
  const [w, h] = [2560, 1259];
  const r = panelRadius(L, w, h);

  it('slides nothing looking ahead or up, and as far as a point ahead moves on the screen looking down', () => {
    expect(lookDownShift(0, 70, h, r)).toBe(0);
    expect(lookDownShift(0.3, 70, h, r)).toBe(0);
    const pitch = -0.1;
    expect(lookDownShift(pitch, 70, h, r)).toBeCloseTo((h / 2 / Math.tan(35 * DEG)) * Math.tan(0.1), 6);
  });

  it('stops with the whole panel in view, and never slides the RAF panel', () => {
    expect(lookDownShift(-0.7, 70, h, r)).toBeCloseTo((L.full - L.height) * r, 6);
    expect(lookDownShift(-0.7, 70, h, r, SPITFIRE_PANEL)).toBe(0);
  });

  it('shows the whole lower panel with the hat pushed forward; the hat pulled back looks behind (product owner, D89)', () => {
    expect(HAT_LOOKS[0].yaw).toBe(0);
    for (const [sw, sh] of SCREENS) {
      const sr = panelRadius(L, sw, sh);
      expect(lookDownShift(HAT_LOOKS[0].pitch, 70, sh, sr), `${sw}x${sh}`).toBeCloseTo((L.full - L.height) * sr, 6);
    }
    expect(Math.abs(HAT_LOOKS[4].yaw)).toBeGreaterThan(Math.PI / 2);
  });

  it('moves the Revi up with the panel', () => {
    const slide = lookDownShift(-0.2, 70, h, r);
    expect(reviPlacement(w, h, slide).y).toBeCloseTo(h / 2 - slide, 6);
  });
});
