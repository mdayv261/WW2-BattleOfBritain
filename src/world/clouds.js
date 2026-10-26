// Where the fair-weather cumulus are (D53): a seeded scatter of clouds over the map and a margin round it, each a
// cluster of blobs. Kept apart from the drawing so it can be tested (and, later, used by the AI and the radar).
//   Each blob: { x, y, z } its centre (m), { rx, ry, rz } its radii (m), turn (rad about the vertical).

import { MAP_EXTENT } from './mapExtent.js';
import { toWorld } from './geo.js';

export const CLOUD_LAYER = {
  baseLow: 1000, baseHigh: 1500, // m: the range of cloud bases
  topHigh: 2500, // m: the highest tops
  count: 420, // clouds over the map and its margin (about three-eighths cover where they are)
  margin: 30000, // m beyond the map's edges
};

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** The blobs of every cloud. */
export function cloudField(seed = 1940) {
  const rand = seeded(seed);
  const nw = toWorld(MAP_EXTENT.north, MAP_EXTENT.west);
  const se = toWorld(MAP_EXTENT.south, MAP_EXTENT.east);
  const { baseLow, baseHigh, topHigh, count, margin } = CLOUD_LAYER;
  const blobs = [];
  for (let k = 0; k < count; k += 1) {
    const cx = nw.x - margin + rand() * (se.x - nw.x + 2 * margin);
    const cz = nw.z - margin + rand() * (se.z - nw.z + 2 * margin);
    const base = baseLow + rand() * (baseHigh - baseLow);
    const width = 500 + rand() * 1300;
    const depth = Math.min(topHigh - base, 300 + rand() * 900);
    const parts = 4 + Math.floor(rand() * 7);
    for (let p = 0; p < parts; p += 1) {
      const rx = width * (0.25 + rand() * 0.25);
      const rz = rx * (0.7 + rand() * 0.5);
      const ry = Math.min(depth * (0.35 + rand() * 0.35), rx * 0.8);
      // Flat bottoms at the base, the bigger blobs in the middle and higher.
      const along = (rand() - 0.5) * width;
      const across = (rand() - 0.5) * width * 0.6;
      const y = base + ry * (0.85 + rand() * 0.6 * (1 - Math.abs(along) / width));
      blobs.push({
        x: cx + along, y: Math.min(y, topHigh - ry), z: cz + across, rx, ry, rz, turn: rand() * Math.PI,
      });
    }
  }
  return blobs;
}
