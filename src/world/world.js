// The worlds a flight can start in: { terrain, starts(side) }.
//   flatWorld - the Phase 2 aerodrome on level ground (the tests' world, D28);
//   realWorld - the map of south-east England and the Pas-de-Calais (D51), each side starting at its home airfield.
// starts(side) gives the three start positions: ground (on the field's southern edge facing north), approach
// (1,000 ft above the field about 5 km south, heading north) and air (1,500 m over the field).

import { airfieldTerrain, STARTS, AIRFIELD } from './airfield.js';
import { airfieldNamed, HOME } from './airfields.js';

const APPROACH_HEIGHT = 305; // m: 1,000 ft above the field
const APPROACH_DISTANCE = 5000; // m: out from the field's centre
const AIR_ALTITUDE = 1500; // m above sea level (the Phase 1 start)

export const flatWorld = {
  terrain: airfieldTerrain,
  starts: () => ({ ...STARTS, air: { x: 0, z: 0, altitude: AIR_ALTITUDE, heading: 0 } }),
};

/** The real map, given its terrain (src/world/terrain.js). */
export function realWorld(terrain) {
  return {
    terrain,
    starts(side) {
      const home = airfieldNamed(HOME[side]);
      const level = terrain.fieldLevel(home.name);
      return {
        ground: { x: home.x, z: home.z + AIRFIELD.size / 2 - 60, heading: 0 },
        approach: { x: home.x, z: home.z + APPROACH_DISTANCE, altitude: level + APPROACH_HEIGHT, heading: 0 },
        air: { x: home.x, z: home.z, altitude: Math.max(AIR_ALTITUDE, level + 1000), heading: 0 },
      };
    },
  };
}
