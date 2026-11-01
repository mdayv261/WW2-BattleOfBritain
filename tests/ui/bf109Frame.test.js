// The Bf 109's front cockpit frame (D90), as the product owner's picture of the front view (#24): the coaming's lip
// arching over the panel's top meets the windscreen posts' feet and clears the clock; the posts and side frames clear
// every dial and the side frames pass outside both plates; the guns' line raised by a lens shift (D93); and while the front view
// shows, the 3D windscreen, nose, wings and airscrew are hidden, showing again when the pilot looks round.
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { FRAME, archAngles, archPoint, sideX, postX } from '../../src/ui/bf109Frame.js';
import { BF109_PANEL, BF109_AIM, plateTop } from '../../src/ui/bf109Panel.js';
import { aircraftById } from '../../src/aircraft/index.js';

const L = BF109_PANEL;
const TOP = 227; // the upper plate's top on the picture

/** Distance from a point to the line through a and b (picture pixels). */
function distance([px, py], [ax, ay], [bx, by]) {
  return Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / Math.hypot(bx - ax, by - ay);
}

describe('Bf 109 front frame (D90)', () => {
  it('meets the windscreen posts\' feet with the coaming lip\'s inner edge, the lip over the plate\'s top', () => {
    const [t0, t1] = archAngles();
    const inner = (t) => archPoint(t, FRAME.arch.thick / 2);
    for (const [t, foot] of [[t0, FRAME.posts.feet[0]], [t1, FRAME.posts.feet[1]]]) {
      expect(inner(t)[0]).toBeCloseTo(foot[0], 0);
      expect(Math.abs(inner(t)[1] - foot[1])).toBeLessThan(2);
    }
    const peak = inner(1.5 * Math.PI);
    expect(peak[1]).toBeLessThanOrEqual(TOP);
    expect(peak[1]).toBeGreaterThan(TOP - 5);
  });

  it('keeps the lip clear of the clock\'s mounting', () => {
    const [cx, cy, , outer] = L.dials.clock;
    for (let x = cx - outer; x <= cx + outer; x += 4) {
      const t = 2 * Math.PI - Math.acos((x - FRAME.arch.cx) / (FRAME.arch.a - FRAME.arch.thick / 2));
      expect(archPoint(t, FRAME.arch.thick / 2)[1], String(x)).toBeLessThanOrEqual(cy - outer + 1);
    }
  });

  it('keeps the posts and side frames clear of every dial, the side frames outside both plates', () => {
    const y0 = FRAME.posts.feet[0][1];
    for (const side of [-1, 1]) {
      const sideLine = [[sideX(side, y0), y0], [sideX(side, y0 + 1000), y0 + 1000]];
      const postLine = [[postX(side, y0), y0], [postX(side, y0 - 1000), y0 - 1000]];
      for (const [name, [x, y, , outer]] of Object.entries(L.dials)) {
        expect(distance([x, y], ...sideLine), `${name} / side`).toBeGreaterThan(outer + FRAME.sides.width / 2);
        if (y < y0) expect(distance([x, y], ...postLine), `${name} / post`).toBeGreaterThan(outer + FRAME.posts.width / 2);
      }
      // The plates' wings and every placard, switch and box lie between the side frames, clear of the bars (the bars
      // pass over the upper plate's shoulders, as in the picture).
      for (const [x, y] of [...L.upper, ...L.lower].filter(([, py]) => py > 400)) {
        expect(side * (sideX(side, y) - x), `${x},${y}`).toBeGreaterThan(FRAME.sides.width / 2);
      }
      for (const [name, [l, t, r, b]] of Object.entries(L.boxes)) {
        for (const [x, y] of [[l, t], [r, t], [l, b], [r, b]].filter(([, py]) => py > y0)) {
          expect(side * (sideX(side, y) - x), name).toBeGreaterThan(FRAME.sides.width / 2);
        }
      }
    }
  });

  it('stands on the panel\'s top, the whole panel on the foot of the screen', () => {
    expect(plateTop(1259, 49)).toBeCloseTo(1259 - L.height * 49, 9);
  });
});

describe('the 3D cockpit while the front frame shows (D90)', () => {
  let TestView;
  beforeAll(async () => {
    // The 3D reticle draws on a canvas: a stand-in that accepts any drawing call.
    const ctx = new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => ({ addColorStop() {} })), set: (t, p, v) => { t[p] = v; return true; } });
    globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
    ({ TestView } = await import('../../src/render/testView.js'));
  });

  const view = (id) => {
    const v = new TestView({ add() {}, remove() {} }, new THREE.PerspectiveCamera(70, 2, 0.1, 1000));
    v.setAircraft(aircraftById[id]);
    return v;
  };

  it('hides the Bf 109\'s 3D windscreen, nose, wings and airscrew looking ahead, and shows them looking round', () => {
    const v = view('bf109e4');
    v.showSight2D(true);
    v.showParts(true);
    expect(v.cockpit.visible).toBe(false);
    expect(v.model.getObjectByName('wingLeft').visible).toBe(false);
    expect(v.model.getObjectByName('wingRight').visible).toBe(false);
    expect(v.aircraft.screws[0].group.visible).toBe(false);
    v.showSight2D(false); // looking round
    v.showParts(true);
    expect(v.cockpit.visible).toBe(true);
    expect(v.model.getObjectByName('wingLeft').visible).toBe(true);
    expect(v.aircraft.screws[0].group.visible).toBe(true);
  });

  it('raises the guns\' line to BF109_AIM of the screen in the Bf 109 cockpit by a lens shift, the middle in others (D93)', () => {
    const v = view('bf109e4');
    expect(v.rig.aim).toBe(BF109_AIM);
    expect(view('spitfire').rig.aim).toBe(0.5);
    const cam = v.rig.camera;
    cam.position.set(0, 0, 0);
    cam.lookAt(1, 0, 0);
    v.rig.shiftPicture(v.rig.aim);
    cam.updateMatrixWorld();
    const ahead = new THREE.Vector3(100, 0, 0).project(cam);
    expect((1 - ahead.y) / 2).toBeCloseTo(BF109_AIM, 6); // the fraction of the screen's height from its top
    expect(cam.fov).toBe(70); // no change of field of view
    v.rig.shiftPicture(0.5);
    expect(new THREE.Vector3(100, 0, 0).project(cam).y).toBeCloseTo(0, 6);
  });

  it('keeps a lost wing hidden, and leaves the Spitfire\'s view as it was', () => {
    const v = view('bf109e4');
    v.lost = new Set(['wingLeft']);
    v.showSight2D(false);
    v.showParts(true);
    expect(v.model.getObjectByName('wingLeft').visible).toBe(false);
    const s = view('spitfire');
    s.showSight2D(true);
    s.showParts(true);
    expect(s.cockpit.visible).toBe(true);
    expect(s.model.getObjectByName('wingLeft').visible).toBe(true);
  });
});
