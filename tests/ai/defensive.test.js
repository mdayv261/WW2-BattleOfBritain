// The defensive pilot (Phase 7 checkpoint 7, D234), who flies the player's Bf 110 while the player mans the rear gun:
// an attacker in the rear half is turned towards dead astern, under 2 g; one below brings a descent; with no enemy he
// holds heading and height; on an escort mission he keeps station on the raid's leader.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { swapSeat } from '../../src/core/crewSeat.js';
import { anglesOf } from '../../src/weapons/mounts.js';
import { spawnRaid } from '../../src/core/raid.js';
import { common } from '../../src/aircraft/common.js';
import { fighter } from '../../src/dev/duels.js';
import { DEFENCE } from '../../src/ai/defensive.js';

const DT = 1 / 120;

/** A Bf 110 on the gun, with a Hurricane held at `rel` (body axes of the 110 at the start, m), flying alongside. */
function attacked(rel) {
  const sim = new Simulation(aircraftById.bf110c4, 'air');
  swapSeat(sim);
  const body = sim.plane.body;
  const at = rel.clone().applyQuaternion(body.quaternion).add(body.position);
  const heading = Math.atan2(body.velocity.x, -body.velocity.z);
  const enemy = fighter(sim, 'hurricane', 'regular', 'RAF', at, heading, { speed: body.velocity.length() });
  enemy.pilot.fly = () => {}; // it holds its course
  return { sim, enemy };
}

/** The enemy's azimuth (rad, from the nose) and elevation as seen from the 110. */
const bearing = (sim, enemy) => anglesOf(enemy.plane.body.position.clone().sub(sim.plane.body.position)
  .applyQuaternion(sim.plane.body.quaternion.clone().invert()));

describe('the defensive pilot', () => {
  it('turns an attacker on the rear quarter towards dead astern, never above 2 g', () => {
    const { sim, enemy } = attacked(new Vector3(-500, 50, 500)); // behind and to the right
    const before = Math.PI - Math.abs(bearing(sim, enemy).az);
    let worstG = 0;
    for (let i = 0; i < 120 * 8; i += 1) {
      sim.step(DT);
      worstG = Math.max(worstG, sim.plane.last.loadFactor);
    }
    const after = Math.PI - Math.abs(bearing(sim, enemy).az);
    expect(after).toBeLessThan(before * 0.6);
    expect(worstG).toBeLessThan(DEFENCE.gMax + 0.3);
  });

  it('descends towards an attacker below the gun\'s arc, closing the height between them', () => {
    const { sim, enemy } = attacked(new Vector3(-600, -150, 0));
    const y0 = sim.plane.body.position.y;
    const below = () => sim.plane.body.position.y - enemy.plane.body.position.y;
    const before = below();
    for (let i = 0; i < 120 * 6; i += 1) sim.step(DT);
    expect(sim.plane.body.position.y).toBeLessThan(y0 - 30);
    expect(below()).toBeLessThan(before - 30);
  });

  it('never descends below 1,000 m above the ground for an attacker below, and keeps clear of the ground', () => {
    const { sim } = attacked(new Vector3(-600, -150, 0));
    sim.plane.body.position.y = DEFENCE.floor + 50;
    sim.others[0].plane.body.position.y = DEFENCE.floor - 100; // still below and behind
    const y0 = sim.plane.body.position.y;
    let lowest = y0;
    for (let i = 0; i < 120 * 20; i += 1) {
      sim.step(DT);
      lowest = Math.min(lowest, sim.plane.body.position.y);
    }
    expect(lowest).toBeGreaterThan(DEFENCE.floor - 100);
    expect(sim.crashed).toBe(false);
  });

  it('with no enemy, holds heading and height', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    swapSeat(sim);
    const v0 = sim.plane.body.velocity.clone().setY(0).normalize();
    const y0 = sim.plane.body.position.y;
    for (let i = 0; i < 120 * 30; i += 1) sim.step(DT);
    expect(Math.abs(sim.plane.body.position.y - y0)).toBeLessThan(50);
    expect(sim.plane.body.velocity.clone().setY(0).normalize().angleTo(v0)).toBeLessThan(0.05);
  });

  it('on an escort mission, keeps the escort\'s station on the raid\'s leader', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    sim.plane.body.position.x += 100000; // far from the raid at first...
    const raid = spawnRaid(sim, { target: 'Lympne', bombers: 3, escorts: 0, altitude: 4000 });
    // ...then placed 3 km off the escort's station.
    const lead = raid.bombers[0].plane.body;
    const fwd = lead.velocity.clone().setY(0).normalize();
    const station = () => lead.position.clone().addScaledVector(fwd, -common.formations.escort.behind)
      .add(new Vector3(0, common.formations.escort.above, 0));
    sim.plane.body.position.copy(station()).add(new Vector3(0, 0, 3000));
    sim.plane.body.velocity.copy(lead.velocity);
    sim.escortRaid = raid;
    swapSeat(sim);
    for (let i = 0; i < 120 * 120; i += 1) sim.step(DT);
    expect(sim.plane.body.position.distanceTo(station())).toBeLessThan(1000);
  });
});
