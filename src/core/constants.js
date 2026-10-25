// Universal constants and unit conversions (SI). These are properties of the world, not of any one
// aircraft; aircraft numbers live in src/aircraft/. Conversions are used only for display and for
// turning sourced figures into SI.

export const G = 9.80665; // standard gravity, m/s^2

// International Standard Atmosphere (ISA).
export const ISA = {
  T0: 288.15, // sea-level temperature, K
  P0: 101325, // sea-level pressure, Pa
  RHO0: 1.225, // sea-level density, kg/m^3
  LAPSE: 0.0065, // temperature drop per metre in the troposphere, K/m
  R: 287.05287, // specific gas constant for dry air, J/(kg K)
  GAMMA: 1.4, // ratio of specific heats
  TROPOPAUSE: 11000, // m, top of the lapse-rate layer
  T_STRATO: 216.65, // K, constant-temperature layer above the tropopause
};

// Unit conversions: multiply a value in the named unit to get SI.
export const UNIT = {
  FT: 0.3048, // m
  YD: 0.9144, // m
  MPH: 0.44704, // m/s
  KMH: 1 / 3.6, // m/s
  LB: 0.45359237, // kg
  LBF: 4.4482216152605, // N
  HP: 745.6998715822702, // W (imperial horsepower)
  PS: 735.49875, // W (metric horsepower)
  RPM: (2 * Math.PI) / 60, // rad/s
  DEG: Math.PI / 180, // rad
  PSI: 6894.757293168, // Pa (lb/sq in, as in RAF boost)
  ATA: 98066.5, // Pa (technische Atmosphäre, as on Luftwaffe boost gauges)
  GALLON: 4.54609e-3, // m^3 (Imperial gallon)
};
