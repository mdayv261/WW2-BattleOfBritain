// The Phase 2 test world (D28): a generic 1940 grass aerodrome on level farmland, with the coast a few
// kilometres to the south. The real map and airfields arrive in Phase 4.
//
// World axes (D5): +X east, -Z north, +Y up, metres; the aerodrome's centre is the origin. Everything is at
// sea level; land and sea differ only in what touching them means (D28).

import { common } from '../aircraft/common.js';

export const AIRFIELD = {
  size: 1000, // m: the square of mown grass (a typical fighter station of 1940 was 1,000-1,200 yd across)
  coastZ: 4000, // m: the coastline runs east-west this far south of the centre; sea beyond it
};

const GRASS = Object.freeze({ height: 0, water: false, tyre: common.grass });
const SEA = Object.freeze({ height: 0, water: true, tyre: common.grass });

/** The terrain the physics asks: level land north of the coast, sea south of it. */
export const airfieldTerrain = {
  surfaceAt: (x, z) => (z > AIRFIELD.coastZ ? SEA : GRASS),
};

/** True inside the mown square of the aerodrome. */
export const onAirfield = (x, z) => Math.abs(x) <= AIRFIELD.size / 2 && Math.abs(z) <= AIRFIELD.size / 2;

/**
 * Starting positions. With no wind modelled, take-offs and landings are made northwards across the
 * field, so the ground start is near its southern edge facing north and the approach comes in from the
 * south, over the coast.
 */
export const STARTS = {
  ground: { x: 0, z: AIRFIELD.size / 2 - 60, heading: 0 },
  approach: { x: 0, z: AIRFIELD.size / 2 + 5000, altitude: 305, heading: 0 }, // 1,000 ft, about 5 km out
};
