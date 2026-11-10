// Tracer streaks (D67, D234): each is drawn trailing back along its round's path for a moment's flight, but never back
// past the muzzle it left, so a tracer just fired starts at the gun (the Bf 110's MG 15 included), not over the aircraft.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ProjectileView } from '../../src/render/projectiles.js';

/** The tracer streak drawn for one round: [head, tail]. */
function streak(round) {
  const view = new ProjectileView(new THREE.Scene());
  view.update({ live: [round] });
  const a = view.tracers.geometry.attributes.position.array;
  return [new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(a[3], a[4], a[5])];
}

describe('tracer streaks', () => {
  const start = new THREE.Vector3(100, 2000, 50);
  const v = new THREE.Vector3(-650, 0, 0);

  it('a round just fired: the streak runs from the round back to the muzzle, no further', () => {
    const p = start.clone().addScaledVector(v, 0.008); // 5 m out
    const [head, tail] = streak({ kind: 'tracer792', age: 0.008, p, v, start });
    expect(head.distanceTo(p)).toBeLessThan(1e-3);
    expect(tail.distanceTo(start)).toBeLessThan(1e-3);
  });

  it('further out, the streak is its usual length behind the round', () => {
    const p = start.clone().addScaledVector(v, 0.2);
    const [head, tail] = streak({ kind: 'tracer792', age: 0.2, p, v, start });
    expect(head.distanceTo(tail)).toBeCloseTo(650 * 0.025, 1);
  });
});
