// Junkers Jumo 211F-1 (He 111 H-6/H-11, close variant for the H-3, D40). Every value has a row, keyed by its path,
// in docs/AIRCRAFT_DATA.md, section "Junkers Jumo 211F-1". SI units: W, Pa, rad/s, m, s.
//
// No power curve of the engine was found. The Soviet test (S29) gives the rated power at 5,500 m; the other points
// of the two-speed supercharger's curve are fitted (`npm run calibrate`) to S29's level speeds at 0, 2,500 and
// 4,000 m, so those three speeds are calibration points and the other heights are checks.
import { UNIT } from '../core/constants.js';

export const jumo211f = {
  id: 'jumo211f',
  name: 'Junkers Jumo 211F-1',
  fuelSystem: 'injection', // direct fuel injection: no negative-g cut-out
  refSpeed: 2400 * UNIT.RPM,
  ratings: {
    normal: {
      map: 122583, // 1.25 ata, absolute
      // Constant-boost power: low supercharger gear to its full-throttle height, then the high gear's lower line.
      cb: [[0, 664522], [2200, 769486], [5800, 750209]],
      // Full throttle: up to the low gear's full-throttle height, down to the gear change, up again in high gear.
      ft: [[0, 664522], [2200, 769486], [3200, 720574], [5800, 750209]],
    },
  },
  zeroPowerMap: 29420, // 0.30 ata, as the DB 601A
  idleMap: 34323, // 0.35 ata, closed throttle
  rpmPowerExponent: 0.5,
  mapSpeedExponent: 1,
  negativeG: null,
  maxSpeed: 2600 * UNIT.RPM, // take-off rating
  // Temperature and speed limits (Phase 5). No Jumo 211 limits found: the DB 601A's are used (estimate, D62).
  heat: {
    coolantLimit: 115,
    coolantLapse: 0.003,
    oilLimit: 105,
    overRev: 2700 * UNIT.RPM, // estimate: 100 rpm over the take-off rating, as the DB 601A's diving limit over its own
  },
};
