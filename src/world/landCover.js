// What covers each cell of the terrain grid, for the scenery (D51): built-up areas from Natural Earth's urban outlines
// (src/world/mapFeatures.js), rasterised onto the grid once. Everything else is drawn as farmland and woods in the
// render code.
import { TERRAIN_GRID } from './terrainGrid.js';
import { URBAN } from './mapFeatures.js';

/** True if (lon, lat) is inside the ring of [lon, lat] points (even-odd rule). */
export function insideRing(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

let mask = null;

/** A Uint8Array over the grid: 1 where the cell's centre is in a built-up area. */
export function urbanMask() {
  if (mask) return mask;
  const { cols, rows, lon0, lat0, dLon, dLat } = TERRAIN_GRID;
  mask = new Uint8Array(cols * rows);
  for (const ring of URBAN) {
    const lons = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    const c0 = Math.max(0, Math.floor((Math.min(...lons) - lon0) / dLon));
    const c1 = Math.min(cols - 1, Math.ceil((Math.max(...lons) - lon0) / dLon));
    const r0 = Math.max(0, Math.floor((lat0 - Math.max(...lats)) / dLat));
    const r1 = Math.min(rows - 1, Math.ceil((lat0 - Math.min(...lats)) / dLat));
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        if (insideRing(ring, lon0 + c * dLon, lat0 - r * dLat)) mask[r * cols + c] = 1;
      }
    }
  }
  return mask;
}
