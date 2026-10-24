// Daimler-Benz DB 601A (Bf 109 E-4, Bf 110 C-4). Every value has a row, keyed by its path, in
// docs/AIRCRAFT_DATA.md, section "Daimler-Benz DB 601A". SI units: W, Pa, rad/s, m, s.
import { UNIT } from '../core/constants.js';

export const db601a = {
  id: 'db601a',
  name: 'Daimler-Benz DB 601A',
  fuelSystem: 'injection', // direct fuel injection: no negative-g cut-out
  refSpeed: 2400 * UNIT.RPM,
  // 5-minute rating (1.30 ata) power against altitude at 2400 rpm, from the October 1940 engine
  // manual, Bild 6, scaled to the manual's table values at 0 and 4.5 km. [altitude m, power W].
  ratings: {
    normal: {
      map: 127486, // 1.30 ata, absolute
      cb: [[0, 728144], [500, 736031], [1000, 752176], [1500, 766119], [2000, 781568], [2100, 783918],
        [2500, 773991], [3000, 763426], [3500, 755821], [4000, 751185], [4500, 750209]],
      ft: [[0, 728144], [500, 736031], [1000, 752176], [1500, 766119], [2000, 781568], [2100, 783918],
        [2500, 773991], [3000, 763426], [3500, 755821], [4000, 751185], [4500, 750209], [5000, 707014],
        [5500, 666741], [6000, 626468], [7000, 553380], [8000, 483276], [9000, 423612], [10000, 369169],
        [11000, 316963]],
    },
  },
  zeroPowerMap: 29420, // 0.30 ata: manifold pressure at which the net power would fall to zero
  idleMap: 34323, // 0.35 ata, closed throttle
  rpmPowerExponent: 0.5, // fitted to the manual's 30-minute and continuous ratings
  mapSpeedExponent: 1, // the full-throttle 2200 rpm line sits below the 2400 rpm line in proportion
  negativeG: null,
  maxSpeed: 2400 * UNIT.RPM, // 5-minute limit
};
