// Enemy pointers (D235): one per enemy within 5 km, placed by its bearing from the aircraft's heading (0 dead ahead,
// ±1 dead astern, - to the left), marked above or below, the nearest marked and listed last; no friends, nothing lost.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { spawnWingmen } from '../../src/core/wingmen.js';
import { fighter } from '../../src/dev/duels.js';
import { enemyPointers, POINTER_RANGE } from '../../src/core/enemyPointers.js';

/** A Spitfire flying north (its start), and a Bf 109 placed `ahead` m forward, `right` m right and `up` m up of it. */
function withEnemy(ahead, right, up = 0) {
  const sim = new Simulation(aircraftById.spitfire, 'air');
  const { body } = sim.plane;
  const nose = new Vector3(1, 0, 0).applyQuaternion(body.quaternion).setY(0).normalize();
  const rightward = new Vector3(-nose.z, 0, nose.x);
  const at = body.position.clone().addScaledVector(nose, ahead).addScaledVector(rightward, right).add(new Vector3(0, up, 0));
  const enemy = fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', at, 0);
  return { sim, enemy };
}

describe('the enemy pointers', () => {
  it('place an enemy by its bearing: dead ahead 0, 90° right 0.5, 90° left -0.5, dead astern ±1', () => {
    expect(enemyPointers(withEnemy(2000, 0).sim)[0].x).toBeCloseTo(0, 2);
    expect(enemyPointers(withEnemy(0, 2000).sim)[0].x).toBeCloseTo(0.5, 2);
    expect(enemyPointers(withEnemy(0, -2000).sim)[0].x).toBeCloseTo(-0.5, 2);
    expect(Math.abs(enemyPointers(withEnemy(-2000, 1).sim)[0].x)).toBeCloseTo(1, 2);
  });

  it('mark an enemy above or below, and show none beyond 5 km', () => {
    expect(enemyPointers(withEnemy(1000, 0, 300).sim)[0].above).toBe(true);
    expect(enemyPointers(withEnemy(1000, 0, -300).sim)[0].above).toBe(false);
    expect(POINTER_RANGE).toBe(5000);
    expect(enemyPointers(withEnemy(5200, 0).sim)).toHaveLength(0);
  });

  it('leave out friends, and enemies lost or abandoned; mark the nearest and list it last', () => {
    const { sim, enemy } = withEnemy(3000, 0);
    spawnWingmen(sim, 2);
    const near = fighter(sim, 'hurricane', 'regular', 'Luftwaffe', sim.plane.body.position.clone().add(new Vector3(0, 0, 800)), 0);
    const list = enemyPointers(sim);
    expect(list).toHaveLength(2);
    expect(list.at(-1).nearest).toBe(true);
    expect(list.at(-1).range).toBeCloseTo(800, -1);
    expect(list[0].nearest).toBe(false);
    near.abandoned = true;
    enemy.plane.damage.failed = { cause: 'test' };
    expect(enemyPointers(sim)).toHaveLength(0);
  });

  it('a Luftwaffe pilot is pointed at the RAF', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    fighter(sim, 'spitfire', 'regular', 'RAF', sim.plane.body.position.clone().add(new Vector3(0, 0, 1500)), 0);
    expect(enemyPointers(sim)).toHaveLength(1);
  });
});
