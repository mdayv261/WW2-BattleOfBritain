// The Bf 110 C panel after the product owner's pictures (D106): the variometer's scale; every dial, plate and knob inside
// the traced outline, none touching; the panel below the guns' line on every screen; each engine on its own gauges; the
// ammunition counter, the Ein/Aus switches and lights, the radiator switches, the trim indicator, the rev counter to
// 3,600 rpm and the fuel gauge working; the old added displays gone; the luminous dials (D105); and the flying
// instruments as the product owner arranged them (D108).
import { describe, it, expect } from 'vitest';
import { lwVarioAngle } from '../../src/ui/lwFlightDials.js';
import { lwRpmAngle, RPM_110 } from '../../src/ui/luftwaffeDials.js';
import { BF110_PANEL, bf110Panel } from '../../src/ui/bf110Panel.js';
import { ammoFractions, switchPosition, gearLightState, AMMO_COLUMNS } from '../../src/ui/bf110Fittings.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { LUMINOUS, INK, HAND, paint } from '../../src/ui/lwStyle.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const DEG = Math.PI / 180;
const clockwise = (a) => ((a / DEG) % 360 + 360) % 360;
const L = BF110_PANEL;
const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [2560, 1203]];
const readings = (over = {}) => ({ ...instrumentReadings(new Simulation(aircraftById.bf110c4, 'air')), ...over });

/** Whether a picture point lies inside the panel's outline. */
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
const squares = Object.entries(L.dials).map(([name, [x, y, , h]]) => [name, [x - h, y - h, x + h, y + h]]);
const overlap = ([al, at, ar, ab], [bl, bt, br, bb]) => al < br && bl < ar && at < bb && bt < ab;

/** A canvas that records lettering with its colour. */
function recorder() {
  const texts = [];
  return new Proxy({}, {
    get: (t, p) => (p === 'texts' ? texts : p === 'fillText' ? (s) => texts.push({ s: String(s), c: t.fillStyle })
      : p in t ? t[p] : String(p).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}),
    set: (t, p, v) => { t[p] = v; return true; },
  });
}
const draw = (v = readings()) => {
  const g = recorder();
  bf110Panel(g, 1000, 0, 40, v);
  return g;
};

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

describe('Bf 110 C panel layout (D106)', () => {
  it('puts every dial, plate and knob inside the traced outline, no two dials or plates touching', () => {
    for (const [name, [l, t, r, b]] of squares) for (const c of [[l, t], [r, t], [l, b], [r, b]]) expect(inside(c), name).toBe(true);
    for (const [name, [l, t, r, b]] of Object.entries(L.boxes)) for (const c of [[l, t], [r, t], [l, b], [r, b]]) expect(inside(c), name).toBe(true);
    for (const [name, [x, y]] of Object.entries(L.knobs)) expect(inside([x, y]), name).toBe(true);
    const plates = Object.entries(L.boxes).filter(([n]) => n !== 'recess');
    const all = [...squares, ...plates];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        const inRecess = (n) => n === 'stripCompass';
        if (inRecess(all[i][0]) || inRecess(all[j][0])) continue;
        expect(overlap(all[i][1], all[j][1]), `${all[i][0]} / ${all[j][0]}`).toBe(false);
      }
    }
  });

  it('stands below the guns\' line on every screen, at least as large as the RAF panel\'s dials allow', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      expect(L.height * r, `${w}x${h}`).toBeLessThanOrEqual(0.45 * h + 1e-6);
      expect(L.width * r, `${w}x${h}`).toBeLessThanOrEqual(0.96 * w + 1e-6);
    }
  });
});

describe('Bf 110 C panel instruments (D106)', () => {
  it('shows each engine on its own gauges: a stopped left engine reads on the left only', () => {
    const sim = new Simulation(aircraftById.bf110c4);
    sim.plane.engines[0].omega = 0;
    sim.plane.engines[1].omega = 2000 * UNIT.RPM;
    const v = instrumentReadings(sim);
    expect(v.engines[0].rpm).toBeCloseTo(0, 6);
    expect(v.engines[1].rpm).toBeCloseTo(2000, 6);
  });

  it('reads the rev counters to 3,600 rpm, as photographed', () => {
    expect(clockwise(lwRpmAngle(800, RPM_110))).toBeCloseTo(202.5, 6);
    expect(clockwise(lwRpmAngle(3600, RPM_110))).toBeCloseTo(157.5, 6);
    const g = draw();
    expect(g.texts.filter((t) => t.s === '36')).toHaveLength(2);
  });

  it('drops each ammunition counter tape as its guns fire: left MG 17s, MG FF, right MG 17s', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    expect(ammoFractions(instrumentReadings(sim))).toEqual([1, 1, 1]);
    sim.armament.find((x) => x.id === 'cannonLeft').rounds = 0;
    sim.armament.find((x) => x.id === 'mg17UpperLeft').rounds = 500;
    expect(ammoFractions(instrumentReadings(sim))).toEqual([0.75, 0.5, 1]);
    expect(AMMO_COLUMNS.flat().sort()).toEqual(Object.keys(aircraftById.bf110c4.guns).sort());
  });

  it('turns the Landeklappe and Fahrwerk switches to Aus with the flaps and undercarriage down, Ein with them up', () => {
    expect(switchPosition.flaps({ flapSelected: 0 })).toBe(0);
    expect(switchPosition.flaps({ flapSelected: 0.5 })).toBe(1);
    expect(switchPosition.gear({ gearSelected: false })).toBe(0);
    expect(switchPosition.gear({ gearSelected: true })).toBe(1);
  });

  it('lights EIN red with the undercarriage up, AUS green with it down, none while it moves', () => {
    expect(gearLightState({ gearUp: true, gearDown: false })).toEqual({ ein: true, aus: false });
    expect(gearLightState({ gearUp: false, gearDown: true })).toEqual({ ein: false, aus: true });
    expect(gearLightState({ gearUp: false, gearDown: false })).toEqual({ ein: false, aus: false });
  });

  it('reads the fuel gauge from the front left main tank, 375 L full (S24), and the radiator from key O', () => {
    expect(readings().fuelSelected).toEqual({ litres: 375, capacity: 375 });
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.input.radiator = 1;
    expect(instrumentReadings(sim).radiatorOpen).toBe(true);
  });

  it('letters the panel\'s words; the old flap, undercarriage and trim displays are gone', () => {
    const words = new Set(draw().texts.map((t) => t.s));
    for (const w of ['Landeklappe', 'Fahrwerk', 'Ein', 'Aus', 'EIN', 'AUS', 'Umschalter', 'Schalter f. Kühlkl.', 'Zu', 'Auf',
      '+', '0', '−', 'Liter']) {
      expect(words.has(w), w).toBe(true);
    }
    for (const w of ['OBEN', 'UNTEN', 'GEAR', 'KLAPPEN', 'ELEVATOR TRIM', 'TAKEOFF']) expect(words.has(w), w).toBe(false);
    // The "00 00" instrument, the "4 MG / 2 MG" strip and the "Umschalterstellung" strip are gone (D108).
    for (const w of ['00', 'MG', 'Umschalterstellung', 'links', 'rechts']) expect(words.has(w), w).toBe(false);
  });
});

describe('Bf 110 luminous dials (D105)', () => {
  it('draws all but the fuel gauge\'s markings and hands in luminous yellow, and restores the colours', () => {
    const g = draw();
    const colourOf = (s) => g.texts.filter((t) => t.s === s).map((t) => t.c);
    for (const w of ['km/h', 'U/min', 'ata', 'm/s', 'DREHT', '12', 'Kühl.']) expect(colourOf(w).every((c) => c === LUMINOUS), w).toBe(true);
    expect(colourOf('Liter')).toEqual([INK]); // the fuel gauge stays white
    expect(paint).toEqual({ ink: INK, hand: HAND });
  });
});

describe('Bf 110 C flying instruments as the product owner arranged them (D108)', () => {
  const D = L.dials;
  const left = ([x, , , o]) => x - o;
  const right = ([x, , , o]) => x + o;
  const foot = ([, y, , o]) => y + o;

  it('stands the Patin compass, turn and bank and climb indicator side by side, their bottoms aligned', () => {
    const upper = [D.compass, D.turn, D.climb];
    for (let i = 1; i < upper.length; i += 1) {
      expect(left(upper[i])).toBeGreaterThan(right(upper[i - 1]));
      expect(foot(upper[i])).toBeCloseTo(foot(upper[0]), 9);
    }
    expect(D.counter).toBeUndefined();
    expect(L.boxes.mgStrip).toBeUndefined();
    expect(L.boxes.umschalter).toBeUndefined();
  });

  it('stands the strip compass, horizon, airspeed indicator and altimeter side by side below, their bottoms aligned', () => {
    const lower = [D.stripCompass, D.horizon, D.airspeed, D.altimeter];
    for (let i = 1; i < lower.length; i += 1) {
      expect(left(lower[i])).toBeGreaterThan(right(lower[i - 1]));
      expect(foot(lower[i])).toBeCloseTo(foot(lower[0]), 9);
    }
    expect(D.stripCompass[1] - D.stripCompass[3]).toBeGreaterThan(foot(D.compass)); // below the upper row
    expect(D.horizon.slice(2)).toEqual(D.compass.slice(2)); // the Patin compass's size
    expect(D.airspeed[0]).toBeLessThan(D.climb[0]); // below the climb indicator, a little to its left
    expect(D.climb[0] - D.airspeed[0]).toBeLessThan(D.climb[3]);
    expect(L.knobs.setAirspeed[0]).toBe(D.airspeed[0]);
    expect(L.knobs.setAltimeter[0]).toBe(D.altimeter[0]);
  });
});

describe('Bf 110 C airscrew pitch indicators (D109)', () => {
  it('shows each engine\'s blade angle on its own indicator above its rev counter, in luminous paint', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.plane.engines[1].beta += 5 * Math.PI / 180;
    const v = instrumentReadings(sim);
    expect(v.engines[1].pitchClock.minutes).not.toBeCloseTo(v.engines[0].pitchClock.minutes, 3);
    for (const side of ['Left', 'Right']) {
      expect(L.dials[`pitch${side}`][0]).toBeCloseTo(L.dials[`rpm${side}`][0], -2); // above its rev counter
      expect(L.dials[`pitch${side}`][1]).toBeLessThan(L.dials[`rpm${side}`][1]);
    }
    const g = draw(v);
    expect(g.texts.filter((t) => t.s === 'Luftschrauben-')).toHaveLength(2);
    expect(g.texts.filter((t) => t.s === 'stellung').every((t) => t.c === LUMINOUS)).toBe(true);
    expect(g.texts.some((t) => t.s === 'Kraftst.')).toBe(false); // the fuel and oil pressure gauges are gone
  });
});
