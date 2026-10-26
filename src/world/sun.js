// The sun's position for a date and time over the map (D53), from the standard low-precision solar formulas (the
// NOAA solar calculator's approximations: declination and equation of time from the day of the year). Good to about
// half a degree, plenty for lighting.
//   The default is 15 August 1940, 14:00 GMT (15:00 British Summer Time), in the middle of the battle; the mission
//   screen will set the time of day (Phase 7).

import { MAP_CENTRE } from './geo.js';

const RAD = Math.PI / 180;

export const DEFAULT_SKY_TIME = { year: 1940, month: 8, day: 15, hoursUtc: 14 };

/** Day of the year (1 January = 1). */
function dayOfYear({ year, month, day }) {
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
}

/**
 * The sun's elevation and azimuth (degrees; azimuth clockwise from north) at a time ({ year, month, day, hoursUtc })
 * and place (degrees).
 */
export function sunPosition(time = DEFAULT_SKY_TIME, lat = MAP_CENTRE.lat, lon = MAP_CENTRE.lon) {
  const g = ((2 * Math.PI) / 365) * (dayOfYear(time) - 1 + (time.hoursUtc - 12) / 24); // fractional year (rad)
  const declination = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g)); // minutes
  const solarMinutes = time.hoursUtc * 60 + equationOfTime + 4 * lon;
  const hourAngle = (solarMinutes / 4 - 180) * RAD;
  const phi = lat * RAD;
  const cosZenith = Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const elevation = 90 - zenith / RAD;
  // Azimuth from north, clockwise.
  const az = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi));
  const azimuth = (az / RAD + 180 + 360) % 360;
  return { elevation, azimuth, declination: declination / RAD };
}

/** Unit vector toward the sun in world axes (D5: +X east, +Y up, -Z north). */
export function sunDirection(time = DEFAULT_SKY_TIME) {
  const { elevation, azimuth } = sunPosition(time);
  const e = elevation * RAD;
  const a = azimuth * RAD;
  return { x: Math.sin(a) * Math.cos(e), y: Math.sin(e), z: -Math.cos(a) * Math.cos(e) };
}
