// International Standard Atmosphere: temperature, pressure, density and speed of sound against
// altitude, valid from below sea level to 20 km.
// Adapted from Dawn Patrol's src/physics/atmosphere.js (approved by the product owner, D18).

import { G, ISA } from '../core/constants.js';

const MIN_ALT = -1000;
const MAX_ALT = 20000;

// Pressure at the top of the troposphere (computed once).
const TROPO_TEMP = ISA.T0 - ISA.LAPSE * ISA.TROPOPAUSE;
const P_TROPOPAUSE = ISA.P0 * Math.pow(TROPO_TEMP / ISA.T0, G / (ISA.R * ISA.LAPSE));

/** altitude: metres above sea level. Returns { temperature K, pressure Pa, density kg/m^3, soundSpeed m/s }. */
export function atmosphere(altitude) {
  const h = Math.min(MAX_ALT, Math.max(MIN_ALT, altitude));
  let temperature;
  let pressure;
  if (h <= ISA.TROPOPAUSE) {
    temperature = ISA.T0 - ISA.LAPSE * h;
    pressure = ISA.P0 * Math.pow(temperature / ISA.T0, G / (ISA.R * ISA.LAPSE));
  } else {
    temperature = ISA.T_STRATO;
    pressure = P_TROPOPAUSE * Math.exp((-G * (h - ISA.TROPOPAUSE)) / (ISA.R * temperature));
  }
  const density = pressure / (ISA.R * temperature);
  const soundSpeed = Math.sqrt(ISA.GAMMA * ISA.R * temperature);
  return { temperature, pressure, density, soundSpeed };
}

/** The altitude (m) at which the standard atmosphere has this pressure (Pa); troposphere only. */
export function altitudeForPressure(pressure) {
  return (ISA.T0 / ISA.LAPSE) * (1 - Math.pow(pressure / ISA.P0, (ISA.R * ISA.LAPSE) / G));
}

/** Air density relative to sea level. */
export function densityRatio(altitude) {
  return atmosphere(altitude).density / ISA.RHO0;
}

/** Indicated (equivalent) airspeed for a true airspeed at an altitude, ignoring instrument error. */
export function equivalentAirspeed(trueSpeed, altitude) {
  return trueSpeed * Math.sqrt(densityRatio(altitude));
}

/** True airspeed for an equivalent airspeed at an altitude. */
export function trueAirspeed(equivalentSpeed, altitude) {
  return equivalentSpeed / Math.sqrt(densityRatio(altitude));
}
