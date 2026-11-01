// The Hurricane's and Spitfire's front cockpit frames (D99, D100), as the product owner's pictures (#26, #28): the
// armoured windscreen's posts on the coaming either side of the GM 2 and clear of it, its top over the glass; the
// Spitfire's bows and the Hurricane's outer windscreen frame outside the panel; the Spitfire's struts; the Hurricane's
// coaming, sills and interior; no part crossing a dial; and in the 3D view the nose, wings and windscreen hidden while the
// front view shows, the airscrew kept with its spinner hidden and not shifted.
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { RAF_FRAMES, windscreenPath, bowX, outerPath, coamingY, coamingMid, sillX, drawRafInterior } from '../../src/ui/rafFrame.js';
import { SPITFIRE_PANEL, P, placer } from '../../src/ui/rafPanel.js';
import { SIGHT, sightPlacement } from '../../src/ui/reflectorSight.js';
import { panelRadius } from '../../src/ui/instruments.js';
import { aircraftById } from '../../src/aircraft/index.js';

const AXIS = 946;
const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259]];
const OUTLINE = SPITFIRE_PANEL.outline.map(([u, v]) => [AXIS + u * 82, 31 + v * 82]);

/** Whether a picture point lies inside the panel's outline. */
function inPanel([px, py]) {
  let hit = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i, i += 1) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Distance from a point to a segment. */
function toSegment([px, py], [ax, ay], [bx, by]) {
  const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
}
const clearOfDials = (pts, width) => Object.entries(SPITFIRE_PANEL.dials).every(([, [x, y, , bezel]]) =>
  pts.slice(1).every((p, i) => toSegment([x, y], pts[i], p) > bezel + width / 2));

for (const id of ['spitfire', 'hurricane']) {
  const F = RAF_FRAMES[id];
  describe(`${id} front frame (D99)`, () => {
    it('stands the windscreen\'s posts on the coaming either side of the GM 2, clear of it on every screen', () => {
      const path = windscreenPath(F);
      expect(path[0][1]).toBeCloseTo(coamingY(AXIS - F.windscreen.half, F), 6);
      expect(path[path.length - 1][1]).toBeCloseTo(coamingY(AXIS + F.windscreen.half, F), 6);
      for (const [w, h] of SCREENS) {
        const r = panelRadius(SPITFIRE_PANEL, w, h);
        const p = sightPlacement(w, h);
        const widest = Math.max(SIGHT.glass.w / 2, SIGHT.top.w / 2, SIGHT.brackets.x + SIGHT.brackets.w + 10) * p.k;
        const inner = ((F.windscreen.half - F.windscreen.width / 2) / 82) * r;
        expect(inner, `${w}x${h}`).toBeGreaterThan(widest);
        // The arch's inside clears the top of the glass.
        const top = h - (SPITFIRE_PANEL.height * r + 6) + P(AXIS, F.windscreen.top + F.windscreen.width / 2)[1] * r;
        expect(top, `${w}x${h}`).toBeLessThan(p.glass.y);
      }
    });

    it('keeps the windscreen frame clear of every dial, the outer frame outside the panel', () => {
      expect(clearOfDials(windscreenPath(F), F.windscreen.width)).toBe(true);
      for (const s of [-1, 1]) {
        for (let y = 60; y <= 1010; y += 50) {
          if (F.bows) expect(inPanel([bowX(F.bows, s, y), y]), `${id} bow ${s} ${y}`).toBe(false);
          if (F.sills) expect(inPanel([sillX(F, s, y), y]), `${id} sill ${s} ${y}`).toBe(false);
        }
      }
      if (F.outer) {
        // The outer frame's legs stand on the coaming's ends, outside the panel, and rise above the armoured windscreen.
        const path = outerPath(F);
        expect(path[0]).toEqual([AXIS - F.outer.foot, F.coaming.ends]);
        expect(F.outer.foot).toBe(F.coaming.half);
        for (const [x, y] of path) if (y > 31) expect(inPanel([x, y]), `${x},${y}`).toBe(false);
        expect(F.outer.top).toBeLessThan(F.windscreen.top);
      }
    });

    if (F.struts) {
      it('joins the struts from the windscreen\'s arch to the bows', () => {
        for (const s of F.struts) {
          const spring = F.windscreen.top + F.windscreen.half;
          expect(Math.abs(Math.hypot(s.from[0], s.from[1] - spring) - F.windscreen.half)).toBeLessThan(F.windscreen.width);
          expect(bowX(F.bows, -1, s.toY)).toBeLessThan(AXIS - s.from[0]);
        }
      });
    }
  });
}

describe('Hurricane coaming, sills and interior (D100)', () => {
  const F = RAF_FRAMES.hurricane;

  it('curves the coaming across over the panel\'s top, its lower edge clear of the placards and dials below it', () => {
    expect(coamingMid(F.coaming, AXIS)).toBeCloseTo(F.coaming.top, 9);
    expect(coamingMid(F.coaming, AXIS - F.coaming.half)).toBeCloseTo(F.coaming.ends, 9);
    expect(coamingMid(F.coaming, AXIS) - F.coaming.width / 2).toBeLessThan(31); // over the panel's top
    const lower = (x) => coamingMid(F.coaming, x) + F.coaming.width / 2;
    for (const name of ['speedCard', 'flapPlacard', 'voltmeter', 'navLights', 'oxygen']) {
      const [l, t, r] = SPITFIRE_PANEL.boxes[name];
      expect(Math.max(lower(l), lower(r)), name).toBeLessThan(t);
    }
    for (const name of ['rpm', 'oxygenDelivery', 'oxygenSupply']) {
      const [x, y, , bezel] = SPITFIRE_PANEL.dials[name];
      expect(lower(x), name).toBeLessThan(y - bezel);
    }
  });

  it('runs the sills from the coaming\'s ends outward and down', () => {
    expect(sillX(F, -1, F.coaming.ends)).toBeCloseTo(AXIS - F.coaming.half, 9);
    expect(sillX(F, -1, F.coaming.ends + 100)).toBeLessThan(AXIS - F.coaming.half);
    expect(sillX(F, 1, F.coaming.ends + 100)).toBeGreaterThan(AXIS + F.coaming.half);
  });

  it('draws the fuselage sides and interior for the Hurricane only', () => {
    let fills = 0;
    const g = new Proxy({}, { get: (t, p) => (p === 'fill' ? () => { fills += 1; } : p in t ? t[p] : () => {}), set: (t, p, v) => { t[p] = v; return true; } });
    drawRafInterior(g, placer(1000, 0, 40), F);
    expect(fills).toBe(3); // the interior and two side walls
    fills = 0;
    drawRafInterior(g, placer(1000, 0, 40), RAF_FRAMES.spitfire);
    expect(fills).toBe(0);
  });
});

describe('Hurricane and Spitfire frames compared (D99)', () => {
  it('gives the Hurricane a taller windscreen than the Spitfire, inside an outer frame rather than bows', () => {
    expect(RAF_FRAMES.hurricane.windscreen.top).toBeLessThan(RAF_FRAMES.spitfire.windscreen.top);
    expect(RAF_FRAMES.hurricane.outer).toBeDefined();
    expect(RAF_FRAMES.spitfire.bows).toBeDefined();
    expect(RAF_FRAMES.bf109e4).toBeUndefined();
  });
});

describe('the RAF fighters\' 3D cockpit while the front frame shows (D99)', () => {
  let TestView;
  beforeAll(async () => {
    const ctx = new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => ({ addColorStop() {} })), set: (t, p, v) => { t[p] = v; return true; } });
    globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
    ({ TestView } = await import('../../src/render/testView.js'));
  });

  for (const id of ['spitfire', 'hurricane']) {
    it(`${id}: hides the nose, wings and windscreen looking ahead, keeps the airscrew unshifted without its spinner`, () => {
      const v = new TestView(new THREE.Scene(), new THREE.PerspectiveCamera(70, 2, 0.1, 1000));
      v.setAircraft(aircraftById[id]);
      v.showSight2D(true);
      v.showParts(true, { width: 2560, height: 1259 });
      expect(v.cockpit.visible).toBe(false);
      expect(v.model.getObjectByName('wingLeft').visible).toBe(false);
      expect(v.aircraft.screws[0].group.visible).toBe(true);
      expect(v.aircraft.screws[0].group.position.z).toBe(0);
      expect(v.aircraft.screws[0].spinner.visible).toBe(false);
      expect(v.rig.aim).toBe(0.5);
      v.showSight2D(false);
      v.showParts(true, { width: 2560, height: 1259 });
      expect(v.cockpit.visible).toBe(true);
      expect(v.model.getObjectByName('wingLeft').visible).toBe(true);
      expect(v.aircraft.screws[0].spinner.visible).toBe(true);
    });
  }
});
