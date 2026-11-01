// The Hurricane's and Spitfire's front cockpit frames (D99, D100), as the product owner's pictures (#26, #28): the
// armoured windscreen's posts on the coaming either side of the GM 2 and clear of it, its top over the glass; the
// Spitfire's bows and the Hurricane's outer windscreen frame outside the panel; the Spitfire's struts; the Hurricane's
// coaming, sills and interior; no part crossing a dial; and in the 3D view the nose, wings and windscreen hidden while the
// front view shows, the airscrew kept with its spinner hidden and not shifted.
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { RAF_FRAMES, RAF_AIM, windscreenPath, archPoint, outerPath, coamingY, coamingLine, coamingPoint, legFoot, legX, sillX, panelTopY, drawRafInterior } from '../../src/ui/rafFrame.js';
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
          if (y > legFoot(F, s)[1]) expect(inPanel([sillX(F, s, y), y]), `${id} sill ${s} ${y}`).toBe(false);
        }
      }
      {
        // The outer frame's legs stand on the coaming's ends, outside the panel, and rise above the armoured windscreen.
        const path = outerPath(F);
        expect(path[0]).toEqual(legFoot(F, -1));
        expect(path[path.length - 1]).toEqual(legFoot(F, 1));
        for (const [x, y] of path) if (y > 31) expect(inPanel([x, y]), `${x},${y}`).toBe(false);
        expect(F.outer.top).toBeLessThan(F.windscreen.top);
      }
    });

    if (F.struts) {
      it('raises the struts from the armoured windscreen\'s round top out to the outer legs (D102)', () => {
        for (const st of F.struts) {
          for (const side of [-1, 1]) {
            const [ax, ay] = archPoint(F, side, st.angle);
            expect(Math.hypot(ax - AXIS, ay - (F.windscreen.top + F.windscreen.half))).toBeCloseTo(F.windscreen.half, 6);
            const lx = legX(F, side, st.toY);
            expect(side * (lx - ax)).toBeGreaterThan(0); // outward
            expect(st.toY).toBeLessThan(ay); // rising
          }
        }
      });
    }
  });
}

describe('Hurricane frame refined (D100, D101)', () => {
  const F = RAF_FRAMES.hurricane;

  it('has thinner frames and a windshield 25% lower than D100\'s, the outer crown on a 2560 x 1259 screen', () => {
    expect(F.outer.width).toBeLessThan(96);
    expect(F.windscreen.width).toBeLessThan(100);
    expect(F.coaming.width).toBeLessThan(112);
    expect(F.sills.width).toBeLessThan(135);
    expect(F.windscreen.top).toBeGreaterThan(31 + (-1033 - 31) * 0.75); // at least 25% lower
    expect(F.windscreen.half).toBeLessThan(416); // posts brought in (D101)
    expect(F.outer.top).toBeGreaterThan(31 + (-1340 - 31) * 0.75); // the crown shortened further
    // The outer legs lean in about 15° from their feet to the crown's springing.
    const [fx, fy] = legFoot(F, -1);
    expect(Math.atan2(AXIS - F.outer.half - fx, fy - F.outer.spring) * 180 / Math.PI).toBeCloseTo(15, -1);
    // The crown still clears the armoured windscreen's top.
    expect(F.outer.top + F.outer.width / 2).toBeLessThan(F.windscreen.top - F.windscreen.width / 2);
    const [w, h] = [2560, 1259];
    const r = panelRadius(SPITFIRE_PANEL, w, h);
    const top = h - (SPITFIRE_PANEL.height * r + 6) + P(AXIS, F.outer.top - F.outer.width / 2)[1] * r;
    expect(top).toBeGreaterThan(0);
  });

  it('runs the side panes\' frames from the armoured posts to the outer legs, between the coaming and the springing', () => {
    for (const r of F.rails) {
      expect(r.y).toBeLessThan(coamingY(AXIS - F.windscreen.half, F));
      expect(r.y).toBeGreaterThan(F.outer.spring);
      expect(AXIS + F.windscreen.half).toBeLessThan(legX(F, 1, r.y) - F.outer.width / 2);
    }
  });

  it('wraps the coaming close round the panel\'s arched top, its legs standing on it', () => {
    // Each point of the band's middle line lies outside the panel, half the band's width (less its overlap) from the edge.
    const toOutline = (q) => Math.min(...OUTLINE.slice(1).map((o, i) => toSegment(q, OUTLINE[i], o)));
    for (const p of coamingLine(F)) {
      expect(inPanel(p), String(p)).toBe(false);
      expect(toOutline(p)).toBeCloseTo(F.coaming.width / 2 - F.coaming.overlap, -1);
    }
    expect(panelTopY(AXIS)).toBeCloseTo(31, 6);
    expect(coamingPoint(F, AXIS, 1)[1]).toBeCloseTo(31 - F.coaming.width + F.coaming.overlap, 6); // its top edge over the sight
    for (const s of [-1, 1]) expect(legFoot(F, s)[1]).toBeCloseTo(coamingY(AXIS + s * F.outer.foot, F), 9);
  });

  it('angles the sills in at the Bf 109\'s slope from the legs\' feet, outward and down', () => {
    expect(F.sills.slope).toBeCloseTo(1.156, 9);
    const [fx, fy] = legFoot(F, -1);
    expect(sillX(F, -1, fy)).toBeCloseTo(fx, 9);
    expect(sillX(F, -1, fy + 100)).toBeCloseTo(fx - 115.6, 6);
    expect(sillX(F, 1, legFoot(F, 1)[1] + 100)).toBeGreaterThan(legFoot(F, 1)[0]);
  });

  it('raises the guns\' line so the GM 2\'s glass stands above the coaming, the reticle centred in it, on every screen', () => {
    expect(RAF_AIM.hurricane).toBe(0.45);
    expect(RAF_AIM.spitfire).toBe(0.45); // as the Hurricane (D102)
    for (const [w, h] of SCREENS) {
      const r = panelRadius(SPITFIRE_PANEL, w, h);
      const p = sightPlacement(w, h, RAF_AIM.hurricane);
      const coamingTop = h - (SPITFIRE_PANEL.height * r + 6) + P(AXIS, coamingPoint(F, AXIS, 1)[1])[1] * r;
      expect(p.glass.y + p.glass.h, `${w}x${h}`).toBeLessThan(coamingTop);
      expect(p.glass.y + p.glass.h / 2).toBeCloseTo(RAF_AIM.hurricane * h, 6);
      const inner = ((F.windscreen.half - F.windscreen.width / 2) / 82) * r;
      expect(inner, `${w}x${h}`).toBeGreaterThan(p.glass.w / 2);
    }
  });

  it('draws the fuselage sides and interior for both RAF fighters (D102), nothing without a frame', () => {
    let fills = 0;
    let frame;
    // Count the fills in the interior's and side walls' colours (the frames' rivets are fills too).
    const g = new Proxy({}, { get: (t, p) => (p === 'fill' ? () => { if ([frame?.interiorColour, frame?.wallColour].includes(t.fillStyle)) fills += 1; } : p in t ? t[p] : () => {}), set: (t, p, v) => { t[p] = v; return true; } });
    for (frame of [F, RAF_FRAMES.spitfire]) {
      fills = 0;
      drawRafInterior(g, placer(1000, 0, 40), frame);
      expect(fills).toBe(3); // the interior and two side walls
    }
    fills = 0;
    drawRafInterior(g, placer(1000, 0, 40), undefined);
    expect(fills).toBe(0);
  });
});

describe('Spitfire frame, as the Hurricane\'s with #29\'s differences (D102)', () => {
  const S = RAF_FRAMES.spitfire;
  const H = RAF_FRAMES.hurricane;
  const lean = (F) => Math.atan2(F.coaming.half - F.outer.half, legFoot(F, 1)[1] - F.outer.spring) * 180 / Math.PI;

  it('shares the Hurricane\'s coaming, sills and raised GM 2; its armoured windscreen narrower and lower', () => {
    expect(S.windscreen.half).toBeLessThan(H.windscreen.half);
    expect(S.windscreen.top).toBeGreaterThan(H.windscreen.top);
    expect(S.coaming).toEqual(H.coaming);
    expect(S.sills).toEqual(H.sills);
    expect(RAF_AIM.spitfire).toBe(RAF_AIM.hurricane);
  });

  it('leans the outer legs in about 20 degrees, more than the Hurricane\'s, to a flat top bar clear above the armoured windscreen', () => {
    expect(lean(S)).toBeCloseTo(20, -1);
    expect(lean(S)).toBeGreaterThan(lean(H));
    expect(S.outer.flat).toBe(true);
    expect(S.outer.spring + S.outer.width / 2).toBeLessThan(S.windscreen.top - S.windscreen.width / 2);
    // The legs stay clear of the armoured windscreen's round top all the way up.
    const spring = S.windscreen.top + S.windscreen.half;
    const outerEdge = S.windscreen.half + S.windscreen.width / 2;
    for (let y = spring; y >= S.outer.spring; y -= 10) {
      const archX = Math.sqrt(Math.max(0, outerEdge ** 2 - (spring - y) ** 2));
      expect(legX(S, 1, y) - S.outer.width / 2 - AXIS, String(y)).toBeGreaterThan(archX);
    }
  });

  it('rounds the top bar\'s corners: no point of the frame at the sharp corner (product owner, D102)', () => {
    const path = outerPath(S);
    for (const side of [-1, 1]) {
      const corner = [AXIS + side * S.outer.half, S.outer.spring];
      const nearest = Math.min(...path.map(([x, y]) => Math.hypot(x - corner[0], y - corner[1])));
      expect(nearest).toBeGreaterThan(S.outer.corner * 0.2);
    }
    expect(path[0]).toEqual(legFoot(S, -1));
    expect(path[path.length - 1]).toEqual(legFoot(S, 1));
  });

  it('carries the rear-view mirror on the top bar\'s centre; the Hurricane has none', () => {
    expect(S.mirror.w).toBeGreaterThan(0);
    expect(H.mirror).toBeUndefined();
    expect(H.rails).toBeDefined();
    expect(S.rails).toBeUndefined();
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
      expect(v.rig.aim).toBe(RAF_AIM[id] ?? 0.5); // raised for the Hurricane (D101)
      v.showSight2D(false);
      v.showParts(true, { width: 2560, height: 1259 });
      expect(v.cockpit.visible).toBe(true);
      expect(v.model.getObjectByName('wingLeft').visible).toBe(true);
      expect(v.aircraft.screws[0].spinner.visible).toBe(true);
    });
  }
});
