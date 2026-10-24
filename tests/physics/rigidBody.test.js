import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { createState, stepRigidBody } from '../../src/physics/rigidBody.js';

const none = () => new Vector3();

describe('rigid body', () => {
  it('accelerates a mass by F/m', () => {
    const s = createState();
    for (let i = 0; i < 120; i += 1) {
      stepRigidBody(s, { force: new Vector3(10, 0, 0), moment: none(), momentum: none(), mass: 2, inertia: { x: 1, y: 1, z: 1 } }, 1 / 120);
    }
    expect(s.velocity.x).toBeCloseTo(5, 6);
    expect(s.position.x).toBeCloseTo(2.5, 1);
  });

  it('keeps the quaternion unit length and conserves angular momentum in free tumbling', () => {
    const s = createState();
    s.angularVelocity.set(0.3, 2, 0.1);
    const inertia = { x: 5000, y: 15000, z: 9000 };
    const h0 = new Vector3(5000 * 0.3, 15000 * 2, 9000 * 0.1).applyQuaternion(s.quaternion).length();
    for (let i = 0; i < 1200; i += 1) {
      stepRigidBody(s, { force: none(), moment: none(), momentum: none(), mass: 1, inertia }, 1 / 120);
    }
    const w = s.angularVelocity;
    const h1 = new Vector3(inertia.x * w.x, inertia.y * w.y, inertia.z * w.z).applyQuaternion(s.quaternion).length();
    expect(s.quaternion.length()).toBeCloseTo(1, 9);
    expect(Math.abs(h1 - h0) / h0).toBeLessThan(0.02);
  });

  it('precesses when a spinning rotor is pitched (gyroscopic effect)', () => {
    const s = createState();
    s.angularVelocity.set(0, 0, 0.5); // pitching nose up
    const momentum = new Vector3(5000, 0, 0); // rotor spinning about the nose axis
    stepRigidBody(s, { force: none(), moment: none(), momentum, mass: 1, inertia: { x: 3000, y: 9000, z: 7000 } }, 1 / 120);
    expect(Math.abs(s.angularVelocity.y)).toBeGreaterThan(1e-3); // a yaw rate appears
  });
});
