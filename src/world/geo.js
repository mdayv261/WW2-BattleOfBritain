// Latitude and longitude to the world's flat x and z (D51): an equirectangular projection centred on the map, with the
// world axes of D5 (+X east, -Z north, metres). Over the map's 3 degrees of longitude the east-west scale changes by
// about 1% from the centre, which the game ignores.
import { MAP_EXTENT } from './mapExtent.js';

const R = 6371000; // m: mean Earth radius
const RAD = Math.PI / 180;

export const MAP_CENTRE = {
  lat: (MAP_EXTENT.north + MAP_EXTENT.south) / 2,
  lon: (MAP_EXTENT.west + MAP_EXTENT.east) / 2,
};
const EAST = R * Math.cos(MAP_CENTRE.lat * RAD) * RAD; // m per degree of longitude
const NORTH = R * RAD; // m per degree of latitude

/** World { x, z } (m) of a latitude and longitude (degrees). */
export function toWorld(lat, lon) {
  return { x: (lon - MAP_CENTRE.lon) * EAST, z: -(lat - MAP_CENTRE.lat) * NORTH };
}

/** Latitude and longitude (degrees) of a world position. */
export function toLatLon(x, z) {
  return { lat: MAP_CENTRE.lat - z / NORTH, lon: MAP_CENTRE.lon + x / EAST };
}
