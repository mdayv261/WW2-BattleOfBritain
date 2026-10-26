// The aircraft models (D54): each is built from its flight data at the right size, its moving parts follow the
// control surfaces, the gear and the engines, and it carries its national markings.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { aircraftList } from '../../src/aircraft/index.js';
import { buildAircraftModel } from '../../src/render/models/aircraftModel.js';
import { DESIGNS } from '../../src/render/models/designs.js';

const surfaces = (over = {}) => ({ elevator: 0, aileron: 0, rudder: 0, flaps: 0, gear: 1, ...over });
const plane = (ac, over, omega = 0) => ({ surfaces: surfaces(over), engines: (ac.engines ? [0, 1] : [0]).map(() => ({ omega })) });

/** The world-space bounding box of the meshes in a group (markings excluded), after an update. */
function size(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3();
  object.traverse((o) => {
    if (o.isMesh && !o.userData.marking && o.geometry.type !== 'CircleGeometry') box.expandByObject(o, true);
  });
  return box.getSize(new THREE.Vector3());
}

/** The world position of a part's first mesh vertex: shows whether it has moved. */
function tipOf(object) {
  object.updateMatrixWorld(true);
  let mesh;
  object.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
  const p = mesh.geometry.attributes.position;
  return new THREE.Vector3(p.getX(p.count - 1), p.getY(p.count - 1), p.getZ(p.count - 1)).applyMatrix4(mesh.matrixWorld);
}

const YELLOW = new THREE.Color(0xe0b02a);

/** The world-space centres of the yellow-painted triangles in an object (vertex-coloured meshes only). */
function yellowTriangles(object) {
  object.updateMatrixWorld(true);
  const centres = [];
  object.traverse((o) => {
    const colour = o.isMesh && o.geometry.attributes.color;
    if (!colour) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i += 3) {
      const yellow = Math.abs(colour.getX(i) - YELLOW.r) + Math.abs(colour.getY(i) - YELLOW.g) + Math.abs(colour.getZ(i) - YELLOW.b) < 1e-3;
      if (!yellow) continue;
      const c = new THREE.Vector3();
      for (let k = 0; k < 3; k += 1) c.add(new THREE.Vector3().fromBufferAttribute(p, i + k));
      centres.push(c.divideScalar(3).applyMatrix4(o.matrixWorld));
    }
  });
  return centres;
}

/** The number of vertex-coloured triangles in an object. */
function triangleCount(object) {
  let n = 0;
  object.traverse((o) => { if (o.isMesh && o.geometry.attributes.color) n += o.geometry.attributes.position.count / 3; });
  return n;
}

describe('aircraft models', () => {
  for (const ac of aircraftList) {
    describe(ac.id, () => {
      const model = buildAircraftModel(ac, DESIGNS[ac.id]);
      model.update(plane(ac), 0);

      it('has a design', () => expect(DESIGNS[ac.id]).toBeDefined());

      it('spans the wing and runs the length of the aircraft within 5%', () => {
        const s = size(model.group);
        expect(Math.abs(s.z - ac.geometry.span) / ac.geometry.span).toBeLessThan(0.05);
        expect(Math.abs(s.x - ac.geometry.length) / ac.geometry.length).toBeLessThan(0.05);
      });

      it('keeps the fuselage, canopy and tail in a group the cockpit view can hide', () => {
        expect(model.group.getObjectByName('fuselage')).toBeDefined();
      });

      it('moves its ailerons, elevators, rudders and flaps with the controls', () => {
        for (const name of ['aileron', 'elevator', 'rudder', 'flap']) {
          const parts = model.movers.filter((m) => m.name === name);
          expect(parts.length, name).toBeGreaterThan(0);
          const before = parts.map((m) => tipOf(m.pivot));
          model.update(plane(ac, { aileron: 1, elevator: 1, rudder: 1, flaps: 1 }), 0);
          parts.forEach((m, i) => expect(tipOf(m.pivot).distanceTo(before[i]), name).toBeGreaterThan(0.02));
          model.update(plane(ac), 0);
        }
      });

      it('raises its ailerons on opposite sides: right stick lifts the right aileron', () => {
        model.update(plane(ac, { aileron: 1 }), 0);
        const right = model.movers.find((m) => m.name === 'aileron' && m.side === 1);
        const left = model.movers.find((m) => m.name === 'aileron' && m.side === -1);
        const rest = buildAircraftModel(ac, DESIGNS[ac.id]);
        rest.update(plane(ac), 0);
        const restRight = rest.movers.find((m) => m.name === 'aileron' && m.side === 1);
        const restLeft = rest.movers.find((m) => m.name === 'aileron' && m.side === -1);
        expect(tipOf(right.pivot).y).toBeGreaterThan(tipOf(restRight.pivot).y);
        expect(tipOf(left.pivot).y).toBeLessThan(tipOf(restLeft.pivot).y);
        model.update(plane(ac), 0);
      });

      it('lowers the flaps trailing edge down', () => {
        const flap = model.movers.find((m) => m.name === 'flap' && m.side === 1);
        const up = tipOf(flap.pivot).y;
        model.update(plane(ac, { flaps: 1 }), 0);
        expect(tipOf(flap.pivot).y).toBeLessThan(up);
        model.update(plane(ac), 0);
      });

      it('folds the undercarriage up with the gear', () => {
        const down = model.legs.map((l) => tipOf(l.pivot).y);
        model.update(plane(ac, { gear: 0 }), 0);
        model.legs.forEach((l, i) => expect(tipOf(l.pivot).y).toBeGreaterThan(down[i] + 0.3));
        model.update(plane(ac), 0);
      });

      it('shows propeller blades when stopped and a disc at speed', () => {
        expect(model.screws.length).toBe(ac.engines ? 2 : 1);
        model.update(plane(ac, {}, 0), 0.01);
        for (const s of model.screws) expect(s.blades.visible).toBe(true);
        model.update(plane(ac, {}, (2600 * 2 * Math.PI) / 60), 0.01);
        for (const s of model.screws) {
          expect(s.blades.visible).toBe(false);
          expect(s.disc.material.opacity).toBeGreaterThan(0);
        }
        const outside = model.screws[0].disc.material.opacity;
        model.update(plane(ac, {}, (2600 * 2 * Math.PI) / 60), 0.01, { inside: true });
        expect(model.screws[0].disc.material.opacity).toBeLessThan(outside / 2); // faint from the cockpit
      });

      it('carries its national markings', () => {
        const kinds = DESIGNS[ac.id].markings(ac).map((m) => m.kind);
        const wanted = ac.side === 'RAF' ? ['roundelB', 'roundelA1', 'finFlash'] : ['balkenkreuz', 'swastika'];
        for (const k of wanted) expect(kinds, k).toContain(k);
        let marks = 0;
        model.group.traverse((o) => { if (o.userData.marking) marks += 1; });
        expect(marks).toBe(kinds.length);
      });

      it(ac.id === 'bf109e4' ? 'has a yellow cowling, wingtips and rudder, and nothing else yellow (D56)' : 'has no yellow (D56)', () => {
        const yellow = yellowTriangles(model.group);
        if (ac.id !== 'bf109e4') {
          expect(yellow.length).toBe(0);
          return;
        }
        const rudder = model.movers.find((m) => m.name === 'rudder');
        expect(yellowTriangles(rudder.pivot).length).toBe(triangleCount(rudder.pivot));
        const { noseFrom, tipsFrom } = DESIGNS[ac.id].yellow;
        expect(yellow.some((c) => c.x > noseFrom + 1 && Math.abs(c.z) < 0.5)).toBe(true); // the cowling
        expect(yellow.some((c) => c.z > tipsFrom + 0.3)).toBe(true); // right wingtip
        expect(yellow.some((c) => c.z < -tipsFrom - 0.3)).toBe(true); // left wingtip
        // Elsewhere stays camouflaged: the rear fuselage, the wing roots and the tailplane.
        expect(yellow.every((c) => c.x > noseFrom - 0.01 || Math.abs(c.z) > tipsFrom - 0.01 || c.x < -4.3)).toBe(true);
      });
    });
  }
});
