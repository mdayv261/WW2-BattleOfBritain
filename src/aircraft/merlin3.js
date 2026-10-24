// Rolls-Royce Merlin III (Hurricane I and Spitfire I). Every value has a row, keyed by its path, in
// docs/AIRCRAFT_DATA.md, section "Rolls-Royce Merlin III". SI units: W, Pa, rad/s, m, s.
import { UNIT } from '../core/constants.js';

export const merlin3 = {
  id: 'merlin3',
  name: 'Rolls-Royce Merlin III',
  fuelSystem: 'carburettor', // cuts out under negative g (negativeG below)
  refSpeed: 3000 * UNIT.RPM, // crankshaft speed of the power curves
  // Constant-boost (cb) and full-throttle (ft) power against altitude, at refSpeed, read from the
  // "Merlin Engines - Max. Powers Level Flight" chart. Pairs are [altitude m, power W].
  ratings: {
    normal: {
      map: 144417, // +6 1/4 lb/sq in boost, absolute
      cb: [[0, 653233], [4846, 766579]],
      ft: [[0, 653233], [4846, 766579], [6096, 662181], [7370, 554801]],
    },
    emergency: {
      map: 184062, // +12 lb/sq in boost, absolute (100-octane fuel, boost cut-out pulled)
      cb: [[0, 885146], [2659, 977613]],
      ft: [[0, 885146], [2659, 977613], [4846, 766579], [6096, 662181], [7370, 554801]],
    },
  },
  idleMap: 39000, // closed-throttle manifold pressure
  rpmPowerExponent: 0, // power hardly changes with rpm at constant boost
  mapSpeedExponent: 1, // full-throttle height falls about 2,000 ft per 200 rpm
  // Negative-g cut-out of the float carburettor.
  negativeG: { threshold: 0, delay: 0.15, cutTime: 0.2, recoverDelay: 1.0, recoverTime: 1.0 },
  maxSpeed: 3000 * UNIT.RPM, // combat limit
};
