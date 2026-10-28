// The fixed rigging (D25, D73, D84): each aircraft flies straight hands-off at the air start, which is at full throttle
// and full rpm, level at the speed that power holds (the power the product owner usually flies at, D84), and the
// rigging in its data is what the full flight model needs for that, so a later change to the engines, airscrews or
// aerodynamics that upsets the balance fails here.
import { describe, it, expect } from 'vitest';
import { aircraftList } from '../../src/aircraft/index.js';
import { solveRig, handsOffDrift } from '../../src/dev/rigging.js';
import { Simulation, fullPowerSpeed } from '../../src/core/simulation.js';

const DEG = Math.PI / 180;

describe('hands-off at the full-power air start (1,500 m)', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: holds its bank within 2° and its heading within 3° for 30 s, no stick or rudder`, () => {
      const { bank, heading } = handsOffDrift(ac, 30);
      expect(Math.abs(bank)).toBeLessThan(2 * DEG);
      expect(Math.abs(heading)).toBeLessThan(3 * DEG);
    });

    it(`${ac.id}: starts at full throttle and full rpm, at the speed that holds level, and keeps it`, () => {
      const sim = new Simulation(ac, 'air');
      expect(sim.input.throttle).toBe(1);
      expect(sim.input.rpm).toBe(1);
      const v0 = fullPowerSpeed(ac);
      expect(sim.plane.body.velocity.length()).toBeCloseTo(v0, 3);
      for (let t = 0; t < 10; t += 1 / 120) sim.step(1 / 120);
      expect(Math.abs(sim.plane.body.velocity.length() - v0)).toBeLessThan(2);
      expect(Math.abs(sim.plane.body.position.y - 1500)).toBeLessThan(30);
    });

    it(`${ac.id}: its rigging matches a fresh solve (run npm run fit:rig after changing the flight model)`, () => {
      const rig = solveRig(ac);
      expect(ac.aero.rollRig).toBeCloseTo(rig.rollRig, 5);
      expect(Math.abs(ac.aero.rollRig - rig.rollRig)).toBeLessThan(0.02 * Math.abs(rig.rollRig));
      expect(Math.abs(ac.aero.yawRig - rig.yawRig)).toBeLessThan(0.02 * Math.abs(rig.yawRig));
    });
  }
});
