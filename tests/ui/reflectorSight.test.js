// The RAF's GM 2 reflector sight drawn square-on in front of the panel (D87): its glass on the guns' line and its foot
// on the panel's plain top centre on every screen, clear of the voltmeter; the reticle where the guns' line falls, its
// ring the sight's mils at the camera's field of view, drawn only on the glass; shown only for the RAF looking ahead.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { sightPlacement, boresight, showSight, drawSight, SIGHT } from '../../src/ui/reflectorSight.js';
import { SPITFIRE_PANEL, P } from '../../src/ui/rafPanel.js';
import { panelRadius } from '../../src/ui/instruments.js';
import { aircraftById } from '../../src/aircraft/index.js';

const SCREENS = [[1548, 784], [1920, 1080], [1280, 720], [2560, 1259], [2560, 1203]];

/** A canvas that records lettering, arcs and clipping, in order. */
function recorder() {
  const log = [];
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'log') return log;
      if (prop === 'fillText') return (t, x, y) => log.push({ op: 'text', t: String(t), x, y });
      if (prop === 'arc') return (x, y, r) => log.push({ op: 'arc', x, y, r, colour: target.strokeStyle });
      if (prop === 'clip') return () => log.push({ op: 'clip' });
      if (prop === 'restore') return () => log.push({ op: 'restore' });
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

describe('GM 2 reflector sight placement (D87)', () => {
  it('centres its glass on the middle of the view and stands its foot on the panel above the blind-flying dials', () => {
    for (const [w, h] of SCREENS) {
      const p = sightPlacement(w, h);
      const { glass } = p;
      expect(glass.x + glass.w / 2, `${w}x${h}`).toBeCloseTo(w / 2, 6);
      expect(glass.y + glass.h / 2, `${w}x${h}`).toBeCloseTo(h / 2, 6);
      // The foot: on the panel, below its top and above the airspeed and horizon bezels.
      const r = panelRadius(SPITFIRE_PANEL, w, h);
      const top = h - (SPITFIRE_PANEL.height * r + 6);
      expect(p.foot).toBeGreaterThan(top);
      expect(p.foot).toBeLessThanOrEqual(top + ((414 - 31) / 82) * r + 1e-6);
      // Clear of the voltmeter, to its right.
      const widest = Math.max(SIGHT.top.w / 2, SIGHT.arms.x + 32 + SIGHT.arms.w, SIGHT.block.w / 2);
      expect(p.x + widest * p.k).toBeLessThan(w / 2 + ((1155 - 946) / 82) * r);
    }
    expect(P(946, 410)[0]).toBeCloseTo(0, 9); // the foot stands on the panel's centre line
  });

  it('makes the glass big enough for the reticle\'s ring at the cockpit\'s field of view', () => {
    for (const [w, h] of SCREENS) {
      const { glass } = sightPlacement(w, h);
      const ring = (h / 2 / Math.tan((70 * Math.PI) / 360)) * Math.tan(aircraftById.spitfire.sight.ringMils / 2000);
      expect(glass.h, `${w}x${h}`).toBeGreaterThan(2.2 * ring);
      expect(glass.w, `${w}x${h}`).toBeGreaterThan(2.2 * ring);
    }
  });
});

describe('GM 2 reticle (D87)', () => {
  it('falls where the guns point, its ring the sight\'s mils at the camera\'s field of view', () => {
    const camera = new THREE.PerspectiveCamera(70, 1600 / 900, 0.1, 5000);
    camera.position.set(0, 0, 0);
    camera.lookAt(1, 0, 0);
    const ahead = boresight(camera, new THREE.Quaternion(), 1600, 900, 100);
    expect(ahead.x).toBeCloseTo(800, 3);
    expect(ahead.y).toBeCloseTo(450, 3);
    expect(ahead.ring).toBeCloseTo((450 / Math.tan((35 * Math.PI) / 180)) * Math.tan(0.05), 6);
    // Nose 2° up: the guns' line rises on the screen.
    const up = boresight(camera, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 2 * Math.PI / 180), 1600, 900, 100);
    expect(up.y).toBeLessThan(450 - 15);
    expect(boresight(camera, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), 1600, 900, 100)).toBeNull();
  });

  it('is drawn only on the glass, at the guns\' line, with the scale rings\' lettering', () => {
    const g = recorder();
    const p = sightPlacement(1920, 1080);
    drawSight(g, p, { x: 965, y: 545, ring: 40 });
    const clip = g.log.findIndex((e) => e.op === 'clip');
    const ring = g.log.findIndex((e) => e.op === 'arc' && e.r === 40);
    const restore = g.log.findIndex((e, i) => i > clip && e.op === 'restore');
    expect(clip).toBeGreaterThan(-1);
    expect(ring).toBeGreaterThan(clip);
    expect(ring).toBeLessThan(restore);
    expect(g.log[ring].x).toBe(965);
    expect(g.log[ring].y).toBe(545);
    const words = new Set(g.log.filter((e) => e.op === 'text').map((e) => e.t));
    for (const w of ['RANGE', 'YARDS', 'BASE', 'FEET', '100', '1.5']) expect(words.has(w), w).toBe(true);
  });
});

describe('when the GM 2 shows (D87)', () => {
  const sim = (id, jumper = null) => ({ ac: aircraftById[id], playerJumper: jumper });
  const rig = (inCockpit, lookingAway) => ({ inCockpit, lookingAway });

  it('shows in the RAF fighters\' cockpits looking ahead; not looking away, outside, in the Luftwaffe aircraft or after bailing out', () => {
    expect(showSight(sim('spitfire'), rig(true, false))).toBe(true);
    expect(showSight(sim('hurricane'), rig(true, false))).toBe(true);
    expect(showSight(sim('spitfire'), rig(true, true))).toBe(false);
    expect(showSight(sim('spitfire'), rig(false, false))).toBe(false);
    expect(showSight(sim('bf109e4'), rig(true, false))).toBe(false);
    expect(showSight(sim('bf110c4'), rig(true, false))).toBe(false);
    expect(showSight(sim('spitfire', {}), rig(true, false))).toBe(false);
  });
});
