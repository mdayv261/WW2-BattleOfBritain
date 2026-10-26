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
  // Temperature and speed limits (Phase 5, src/physics/cooling.js). °C, °C per m.
  heat: {
    coolantLimit: 115, // outlet limit at sea level (estimate, D61: 6 °C below the boiling curve, not found)
    coolantLapse: 0.003, // fall of that limit with height (estimate: as water's boiling point, about 3 °C per km)
    oilLimit: 105, // outlet, at most briefly 105-110 °C (manual p. 47)
    overRev: 2500 * UNIT.RPM, // diving limit, 30 s (manual p. 47)
  },
  // Fuel and oil pressures for the cockpit gauge (Pa, gauge pressure). Not modelled physically: with the engine
  // turning, the gauge reads the running values below, scaled down at low rpm.
  pressures: {
    oilLow: 215746, // 2.2 kg/cm²: minimum at 2400 rpm
    oilNormal: [245166, 490333], // 2.5-5 kg/cm²: take-off limits
    oilRunning: 392266, // 4 kg/cm²
    oilFullScale: 980665, // 10 kg/cm²
    fuelLow: 78453, // 0.8 kg/cm²
    fuelNormal: [117680, 176520], // 1.2-1.8 kg/cm²
    fuelRunning: 147100, // 1.5 kg/cm²
    fuelFullScale: 294200, // 3 kg/cm²
  },
};
