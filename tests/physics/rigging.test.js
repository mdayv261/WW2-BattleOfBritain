// The fixed rigging (D25, D73): each aircraft flies straight hands-off at the air start, as a rigger sets a real
// aircraft for its cruise, and the rigging in its data is what the full flight model needs for that, so a later change
// to the engines, airscrews or aerodynamics that upsets the balance fails here.
import { describe, it, expect } from 'vitest';
import { aircraftList } from '../../src/aircraft/index.js';
import { solveRig, handsOffDrift } from '../../src/dev/rigging.js';

const DEG = Math.PI / 180;

describe('hands-off at the air start (1,500 m, 110 m/s)', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: holds its bank within 2° and its heading within 3° for 30 s, no stick or rudder`, () => {
      const { bank, heading } = handsOffDrift(ac, 30);
      expect(Math.abs(bank)).toBeLessThan(2 * DEG);
      expect(Math.abs(heading)).toBeLessThan(3 * DEG);
    });

    it(`${ac.id}: its rigging matches a fresh solve (run npm run fit:rig after changing the flight model)`, () => {
      const rig = solveRig(ac);
      expect(ac.aero.rollRig).toBeCloseTo(rig.rollRig, 5);
      expect(Math.abs(ac.aero.rollRig - rig.rollRig)).toBeLessThan(0.02 * Math.abs(rig.rollRig));
      expect(Math.abs(ac.aero.yawRig - rig.yawRig)).toBeLessThan(0.02 * Math.abs(rig.yawRig));
    });
  }
});
