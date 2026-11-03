// The Bf 110 C panel after the product owner's picture (#34, D140): the variometer's scale; every dial, plate and knob
// inside the outline, none touching; the dial radius kept, so the Bf 109's instruments keep their size; the lowest row
// and the Preßluft gauge half below the screen's foot (D129); each engine on its own gauges; the round counter for the
// two cannon; the outside air thermometer; the Ein/Aus switches and lights (D114); the radiator switches and fuel gauge;
// the placards' sourced figures; the items removed; and the luminous dials (D105).
import { describe, it, expect } from 'vitest';
import { lwVarioAngle } from '../../src/ui/lwFlightDials.js';
import { lwRpmAngle, RPM_110 } from '../../src/ui/luftwaffeDials.js';
import { BF110_PANEL, AXIS, bf110Panel, panelTop110, placer } from '../../src/ui/bf110Panel.js';
import { switchPosition, gearLightState, tBar, T_STEM, GEAR_LAMPS } from '../../src/ui/bf110Fittings.js';
import { cannonCounter, airTempAngle, coolantAngle, pressluftReading, pressluftAngle } from '../../src/ui/bf110Gauges.js';
import { achtungLines, divePlacardLines, textPlacard } from '../../src/ui/bf110Placards.js';
import { instrumentReadings, panelRadius } from '../../src/ui/instruments.js';
import { atmosphere } from '../../src/physics/atmosphere.js';
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

describe('Bf 110 C panel layout after #34 (D140)', () => {
  it('puts every dial, plate and knob inside the outline, no two dials or plates touching', () => {
    for (const [name, [l, t, r, b]] of squares) for (const c of [[l, t], [r, t], [l, b], [r, b]]) expect(inside(c), name).toBe(true);
    for (const [name, [l, t, r, b]] of Object.entries(L.boxes)) for (const c of [[l, t], [r, t], [l, b], [r, b]]) expect(inside(c), name).toBe(true);
    for (const [name, [x, y]] of Object.entries(L.knobs)) expect(inside([x, y]), name).toBe(true);
    // The manifold pressure gauges stand in their recess; the knob of the Heizung placard sits on it, as photographed.
    const plates = Object.entries(L.boxes).filter(([n]) => n !== 'ataBox');
    const all = [...squares, ...plates];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        expect(overlap(all[i][1], all[j][1]), `${all[i][0]} / ${all[j][0]}`).toBe(false);
      }
    }
    for (const n of ['ataLeft', 'ataRight']) {
      const [x, y, , o] = L.dials[n];
      const [l, t, r, b] = L.boxes.ataBox;
      expect(x - o > l && x + o < r && y - o > t && y + o < b, n).toBe(true);
    }
  });

  it('makes the course box as wide as the repeater compass\'s mounting, under it (D159)', () => {
    const [x, , , o] = L.dials.compass;
    const [l, , r] = L.boxes.course;
    expect(l).toBeCloseTo(x - o, 6);
    expect(r).toBeCloseTo(x + o, 6);
  });

  it('keeps the dial radius on screen as before (D106), so the Bf 109\'s instruments keep their size; fits every screen', () => {
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      expect(r, `${w}x${h}`).toBeCloseTo((0.45 * h) / ((475 - 57) / 30 + 0.1), 6);
      expect(L.width * r, `${w}x${h}`).toBeLessThanOrEqual(0.96 * w + 1e-6);
    }
  });

  it('stands the turn and bank on the axis, under the Revi, with the airspeed indicator and climb indicator either side', () => {
    expect(L.dials.turn[0]).toBe(AXIS);
    expect(L.dials.airspeed[0]).toBeLessThan(AXIS);
    expect(L.dials.climb[0]).toBeGreaterThan(AXIS);
    for (const n of ['airspeed', 'climb']) expect(L.dials[n][1]).toBe(L.dials.turn[1]); // one row, levelled
  });

  it('sits low enough that the coolant thermometers\' bottoms touch the screen\'s foot (D141)', () => {
    expect(L.sink).toBeGreaterThan(0);
    const bottom = ([, y, , o]) => y + o;
    expect(bottom(L.dials.tempLeft)).toBe(bottom(L.dials.tempRight));
    for (const [w, h] of SCREENS) {
      const r = panelRadius(L, w, h);
      const at = placer(w / 2, panelTop110(h, r), r);
      for (const name of ['tempLeft', 'tempRight']) {
        const [, y, face, outer] = at.dial(L.dials[name]);
        expect(y + outer, `${w}x${h} ${name}`).toBeCloseTo(h, 6); // the mounting's foot on the screen's foot
        expect(y + face * 1.2, `${w}x${h} ${name}`).toBeCloseTo(h, 6); // and the green ring's
      }
      // The radiator switches and the tank selector are now below the screen; the Preßluft gauge is all on it.
      const [, py, , po] = at.dial(L.dials.pressluft);
      expect(py + po, 'pressluft').toBeLessThan(h);
      for (const name of ['radiatorLeft', 'selector', 'radiatorRight']) {
        expect(at.dial(L.dials[name])[1] - at.dial(L.dials[name])[3], name).toBeGreaterThan(h);
      }
    }
  });

  it('stands the Preßluft gauge below the airscrew lever box, between its Fahrwerk and Landeklappe labels (D141)', () => {
    const [x, y, , o] = L.dials.pressluft;
    const [ll, , lr, lb] = L.boxes.levers;
    expect(y - o).toBeGreaterThan(lb);
    expect(x).toBeGreaterThan(ll);
    expect(x).toBeLessThan(lr);
    expect(x - o).toBeGreaterThan(L.boxes.fahrwerkLabel[2]);
    expect(x + o).toBeLessThan(L.boxes.klappeLabel[0]);
  });

  it('runs the left edge from about 10 mm left of the clock\'s foot straight through the lever box\'s corner (D154)', () => {
    const O = L.outline;
    const clockBottom = L.dials.clock[1] + L.dials.clock[3];
    const clockLeft = L.dials.clock[0] - L.dials.clock[3];
    const [ll, lt] = L.boxes.levers;
    const j = O.findIndex(([x, y], k) => k > 0 && O[k - 1][0] === x && O[k - 1][1] > y && y > 57); // the far left edge's top
    const [touch, start, step] = [O[j], O[j + 1], O[j + 2]];
    // The lever box's top left corner on the straight edge from the start to the touch (D155).
    expect((ll - start[0]) * (touch[1] - start[1]) - (lt - start[1]) * (touch[0] - start[0])).toBeCloseTo(0, 6);
    expect(touch[1]).toBeGreaterThan(lt);
    expect(Math.abs(start[1] - clockBottom)).toBeLessThan(3); // level with the clock's foot
    expect(clockLeft - start[0]).toBeGreaterThan(30); // about 10 mm left of its corner on a 2560 px screen
    expect(clockLeft - start[0]).toBeLessThan(40);
    expect(step[1]).toBe(start[1]); // a level step back under the clock's bracket
    for (const [, [x, y, , o]] of Object.entries(L.dials)) { // the straight edge clear of every dial
      if (y + o < start[1] || y - o > lt) continue;
      const edge = ll + ((start[0] - ll) * (lt - Math.min(lt, Math.max(start[1], y - o)))) / (lt - start[1]);
      expect(x - o).toBeGreaterThan(edge);
    }
  });

  it('mounts the clock directly in the panel: nothing rises above the top edge, the bracket gone (D156)', () => {
    expect(Math.min(...L.outline.map(([, y]) => y))).toBe(57);
    const [x, y, , o] = L.dials.clock;
    expect(y - o).toBeGreaterThan(57); // inside the panel below its top edge
    expect(x - o).toBeGreaterThan(Math.min(...L.outline.filter(([, oy]) => oy === 57).map(([ox]) => ox)));
    expect(L.above * 30).toBeLessThan(2);
  });

});

describe('Bf 110 C panel instruments (D106, D140)', () => {
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
    expect(draw().texts.filter((t) => t.s === '36')).toHaveLength(2);
  });

  it('counts each cannon\'s rounds on the round counter, its lamp lit when its drum is empty', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    expect(cannonCounter(instrumentReadings(sim))).toEqual([{ rounds: 60, empty: false }, { rounds: 60, empty: false }]);
    sim.armament.find((x) => x.id === 'cannonLeft').rounds = 0;
    sim.armament.find((x) => x.id === 'cannonRight').rounds = 23;
    const v = instrumentReadings(sim);
    expect(cannonCounter(v)).toEqual([{ rounds: 0, empty: true }, { rounds: 23, empty: false }]);
    const words = draw(v).texts.map((t) => t.s);
    for (const w of ['00', '23', 'Durchladen']) expect(words, w).toContain(w);
  });

  it('reads the outside air temperature of the standard atmosphere at the aircraft\'s height', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    const v = instrumentReadings(sim);
    expect(v.airTemp).toBeCloseTo(atmosphere(sim.plane.last.altitude).temperature - 273.15, 9);
    expect(atmosphere(0).temperature - 273.15).toBeCloseTo(15, 6);
    expect(airTempAngle(0)).toBe(0); // 0 °C straight up
    expect(airTempAngle(40)).toBeCloseTo(-airTempAngle(-40), 9);
    expect(airTempAngle(-60)).toBe(airTempAngle(-40)); // held at the end of the scale
  });

  it('reads the Preßluft gauge 0 with the engines stopped and 150 kg/cm² with either running (D142)', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    for (const e of sim.plane.engines) e.omega = 0;
    expect(pressluftReading(instrumentReadings(sim))).toBe(0);
    sim.plane.engines[1].omega = 2200 * UNIT.RPM;
    expect(pressluftReading(instrumentReadings(sim))).toBe(150);
    sim.plane.engines[1].omega = 600 * UNIT.RPM; // starting: part way up
    const starting = pressluftReading(instrumentReadings(sim));
    expect(starting).toBeGreaterThan(0);
    expect(starting).toBeLessThan(150);
    expect(clockwise(pressluftAngle(0))).toBeCloseTo(225, 6); // at the scale's start, bottom left
    expect(clockwise(pressluftAngle(125))).toBeCloseTo(0, 6);
  });

  it('reads the coolant thermometers 40 to 120 °C, 80 straight up', () => {
    expect(coolantAngle(80)).toBe(0);
    expect(coolantAngle(120)).toBeCloseTo(-coolantAngle(40), 9);
    expect(draw().texts.filter((t) => t.s === '120').length).toBeGreaterThanOrEqual(2);
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

  it('houses the undercarriage lights in a round housing, all four lamps inside it (D157)', () => {
    const [l, top, r, b] = L.boxes.gearLights;
    expect(r - l).toBeCloseTo(b - top, 6); // a square box for a round housing
    expect(r - l).toBeCloseTo(2 * L.dials.counter[3], 6); // as wide as the round counter (D158)
    for (const [fx, fy] of GEAR_LAMPS.lamps) {
      expect(Math.hypot(fx, fy) + GEAR_LAMPS.radius * 1.15).toBeLessThan(0.94); // inside the rim, lens ring and all
    }
    const arcs = [];
    const g = new Proxy({}, {
      get: (t2, p) => (p === 'arc' ? (x, y, rad) => arcs.push(rad) : p in t2 ? t2[p]
        : String(p).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}),
      set: (t2, p, v) => { t2[p] = v; return true; },
    });
    bf110Panel(g, 1000, 0, 30, readings());
    expect(arcs.some((rad) => Math.abs(rad - (r - l) / 2) < 1e-6)).toBe(true); // the housing at 30 px per dial radius
  });

  it('reads the fuel gauge from the front left main tank, 375 L full (S24), and the radiator from key O', () => {
    expect(readings().fuelSelected).toEqual({ litres: 375, capacity: 375 });
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.input.radiator = 1;
    expect(instrumentReadings(sim).radiatorOpen).toBe(true);
  });

  it('shows each engine\'s blade angle on its own pitch indicator, kept beside the outside air thermometer (D109)', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.plane.engines[1].beta += 5 * DEG;
    const v = instrumentReadings(sim);
    expect(v.engines[1].pitchClock.minutes).not.toBeCloseTo(v.engines[0].pitchClock.minutes, 3);
    expect(L.dials.pitchLeft[0]).toBeGreaterThan(L.dials.airTemp[0]);
    const g = draw(v);
    expect(g.texts.filter((t) => t.s === 'Luftschrauben-')).toHaveLength(2);
  });
});

describe('Bf 110 C placards with the sourced figures (S24, D140)', () => {
  it('letters the dive limit 650 km/h and the undercarriage and flap limits 250 km/h, not the picture\'s 700 and 400', () => {
    const v = readings();
    expect(v.diveLimit).toBe(650);
    expect(divePlacardLines(v)).toEqual(['Maximale Sturzflug-', 'Geschwindigkeit', '650 km/h']);
    const { gear, flaps } = achtungLines(v);
    expect(gear.join(' ')).toContain('250 km/St');
    expect(flaps.join(' ')).toContain('250 km/St');
    const texts = draw(v).texts.map((t) => t.s);
    const words = texts.join(' | ');
    for (const w of ['650 km/h', 'Achtung Fahrwerk', 'Achtung Landeklappe', 'Umschaltwarnung', 'Heizung', 'SKK 404-2', 'Kurs',
      'Preßluft', 'Umschalter', 'Schalter f. Kühlkl.', 'Fahrgestell']) expect(words, w).toContain(w);
    for (const w of ['700 km/h', '400 km/St']) expect(texts.some((s) => s.includes(w)), w).toBe(false);
  });

  it('fits a placard\'s lettering inside its plate', () => {
    const g = recorder();
    const px = textPlacard(g, { x: 0, y: 0, w: 60, h: 20 }, ['Maximale Sturzflug-', 'Geschwindigkeit', '650 km/h']);
    expect(px * 3 * 1.3).toBeLessThanOrEqual(20);
    expect('Maximale Sturzflug-'.length * 0.6 * px).toBeLessThanOrEqual(60 * 0.9 + 1e-9);
  });
});

describe('Bf 110 C items taken off for #34 (D140)', () => {
  it('has no trim gauge, speed card, flap placard, strip compass, magnetos, hydraulic gauge or ammunition counter', () => {
    for (const n of ['trim', 'stripCompass', 'hydraulic']) expect(L.dials[n], n).toBeUndefined();
    for (const n of ['speedCard', 'placard', 'magnetos', 'ammo']) expect(L.boxes[n], n).toBeUndefined();
    const words = new Set(draw().texts.map((t) => t.s));
    for (const w of ['SPEEDS', 'NOSE', 'Achtung!', 'M1+2', 'Fahrwerk ', 'Kühlst.']) expect(words.has(w), w).toBe(false);
  });
});

describe('Bf 110 C flap and undercarriage levers (D114)', () => {
  it('ends each lever in an upright T: a stem rising to a bar across its top, clear of the box above it', () => {
    const rects = [];
    const bars = [];
    const g = new Proxy({}, {
      get: (t, p) => (p === 'fillRect' ? (...a) => rects.push(a) : p === 'roundRect' ? (...a) => bars.push(a) : p in t ? t[p] : () => {}),
      set: (t, p, v) => { t[p] = v; return true; },
    });
    tBar(g, 100, 200, 30);
    const [sx, sy, sw, sh] = rects[0]; // the stem: upright, from the foot up
    expect(sh).toBeGreaterThan(2 * sw);
    expect(sy + sh).toBeCloseTo(200, 9);
    const [bx, by, bw, bh] = bars[0]; // the bar: across, on the stem's top
    expect(bw).toBeGreaterThan(3 * bh);
    expect(by + bh / 2).toBeCloseTo(sy, 9);
    expect(bx + bw / 2).toBeCloseTo(sx + sw / 2, 9);
    // At Ein, each bar stays below the box above its switch.
    const PXR = 30;
    for (const [sw2, above] of [['gear', 'gearLights'], ['flaps', 'achtung']]) {
      const [, top] = L.switches[sw2];
      expect(top - T_STEM * PXR - 0.07 * PXR, sw2).toBeGreaterThan(L.boxes[above][3]);
    }
  });
});

describe('Bf 110 luminous dials (D105)', () => {
  it('draws all but the fuel gauge\'s markings and hands in luminous yellow, and restores the colours', () => {
    const g = draw();
    const colourOf = (s) => g.texts.filter((t) => t.s === s).map((t) => t.c);
    for (const w of ['km/h', 'U/min', 'ata', 'm/s', 'DREHT', '12', '°C']) {
      expect(colourOf(w).length, w).toBeGreaterThan(0);
      expect(colourOf(w).every((c) => c === LUMINOUS), w).toBe(true);
    }
    expect(colourOf('Liter')).toEqual([INK]); // the fuel gauge stays white
    expect(paint).toEqual({ ink: INK, hand: HAND });
  });
});
