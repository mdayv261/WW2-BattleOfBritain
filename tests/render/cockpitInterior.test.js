// The 3D cockpit round the pilot (Phase 7 checkpoint 6b, D233): side walls up to the sill, a seat with a headrest, a
// floor and a bulkhead behind the seat, for each flyable aircraft, inside its fuselage; and the rear deck from the
// bulkhead to the tail, below the eye, standing in for the model's own fuselage as seen from the cockpit.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { DESIGNS, sectionAt } from '../../src/render/models/designs.js';
import { buildCockpitInterior } from '../../src/render/cockpitInterior.js';

const FLYABLE = ['hurricane', 'spitfire', 'bf109e4', 'bf110c4'];

describe('the 3D cockpit interior', () => {
  for (const id of FLYABLE) {
    it(`${id}: walls, seat, floor and bulkhead, all inside the fuselage round the pilot`, () => {
      const ac = aircraftById[id];
      const design = DESIGNS[id];
      const { group, clipX, sill, halfWidth } = buildCockpitInterior(ac, design);
      expect(group.children.length).toBeGreaterThan(10);
      // The sill is below the eye, and the walls inside the fuselage's skin at the eye.
      expect(sill).toBeLessThan(ac.eye.y);
      expect(sill).toBeGreaterThan(ac.eye.y - 0.5); // the Bf 110's, under its tall glazing, is lowest
      const skin = sectionAt(design, (design.nose - ac.eye.x) / ac.geometry.length).w;
      expect(halfWidth).toBeLessThan(skin);
      expect(halfWidth).toBeGreaterThan(0.2);
      // Everything but the rear deck lies within the fuselage's width, and between the bulkhead and the panel.
      const deck = group.getObjectByName('rearDeck');
      group.remove(deck);
      const bounds = new THREE.Box3().setFromObject(group);
      expect(bounds.max.z).toBeLessThanOrEqual(skin + 0.01);
      expect(bounds.min.z).toBeGreaterThanOrEqual(-skin - 0.01);
      expect(bounds.min.x).toBeGreaterThan(clipX - 0.1);
      expect(bounds.max.x).toBeLessThan(ac.eye.x + 0.7);
      // The bulkhead, and the clipping plane with it, sits just behind the seat and the pilot's head.
      expect(clipX).toBeLessThan(ac.eye.x - 0.3);
      expect(clipX).toBeGreaterThan(ac.eye.x - 0.6);
      // The rear deck runs from the bulkhead to the tail, its top below the eye so the view astern passes over it.
      const d = new THREE.Box3().setFromObject(deck);
      expect(d.max.y).toBeLessThan(ac.eye.y - 0.03);
      expect(d.max.x).toBeCloseTo(clipX, 1);
      expect(d.min.x).toBeLessThan(design.nose - 0.95 * ac.geometry.length);
    });
  }

  it('the AI-only He 111 has no cockpit to sit in (D28)', () => {
    expect(aircraftById.he111h.cockpit).toBe(false);
  });
});
