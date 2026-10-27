// Solves each aircraft's fixed rigging (aero.rollRig against engine torque, aero.yawRig against slipstream swirl) so it
// flies straight hands-off at the air start (D25, D73), and shows the hands-off drift over 30 s before and after.
// Copy the printed values into src/aircraft/<id>.js and the matching rows of docs/AIRCRAFT_DATA.md.
//   npm run fit:rig

import { aircraftList } from '../src/aircraft/index.js';
import { solveRig, handsOffDrift } from '../src/dev/rigging.js';

const deg = (r) => `${((r * 180) / Math.PI).toFixed(2)}°`;
const round = (v) => Number(v.toPrecision(4));

for (const ac of aircraftList) {
  const before = handsOffDrift(ac);
  const old = { rollRig: ac.aero.rollRig, yawRig: ac.aero.yawRig };
  const rig = solveRig(ac);
  const fitted = { rollRig: round(rig.rollRig), yawRig: round(rig.yawRig) };
  Object.assign(ac.aero, fitted);
  const after = handsOffDrift(ac);
  Object.assign(ac.aero, old);
  console.log(`${ac.id}: rollRig ${fitted.rollRig} (was ${old.rollRig}), yawRig ${fitted.yawRig} (was ${old.yawRig})`);
  console.log(`  hands-off for 30 s: bank ${deg(before.bank)} -> ${deg(after.bank)}, heading ${deg(before.heading)} -> ${deg(after.heading)}`);
}
