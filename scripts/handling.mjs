// npm run handling: prints the scripted handling measurements for each aircraft (tuning aid).
import { aircraftList } from '../src/aircraft/index.js';
import { stallTest, spinTest, rollTest, hardPull, swingTest, stallEas } from '../src/dev/flightTests.js';
import { UNIT } from '../src/core/constants.js';

const f = (o) => Object.entries(o).filter(([, v]) => typeof v === 'number' || typeof v === 'boolean')
  .map(([k, v]) => `${k} ${typeof v === 'number' ? v.toFixed(2) : v}`).join(', ');
for (const ac of aircraftList) {
  console.log(`\n${ac.name}  (power-off stall ${(stallEas(ac) / UNIT.MPH).toFixed(0)} mph IAS at 2000 m)`);
  console.log('  stall      ', f(stallTest(ac)));
  console.log('  spin left  ', f(spinTest(ac, -1)));
  console.log('  spin right ', f(spinTest(ac, 1)));
  console.log('  roll 230mph', f(rollTest(ac, 230 * UNIT.MPH, 3048)));
  console.log('  roll 1.1Vs ', f(rollTest(ac, 1.1 * stallEas(ac), 2000)));
  console.log('  pull 220mph', f(hardPull(ac, 220 * UNIT.MPH)));
  console.log('  pull 350mph', f(hardPull(ac, 350 * UNIT.MPH)));
  console.log('  swing      ', f(swingTest(ac)));
}
