// The real terrain for the physics and the scenery (D51): heights from the GMTED2010 grid (public/data/terrain.bin,
// laid out in src/world/terrainGrid.js), the sea where the grid has none, and each airfield levelled.
//
// createTerrain(heights) gives the same interface as the Phase 2 aerodrome (src/world/airfield.js):
//   surfaceAt(x, z) -> { height (m), water (bool), tyre }, plus heightAt(x, z) and gridHeight(x, z) for the scenery.

import { TERRAIN_GRID } from './terrainGrid.js';
import { toLatLon } from './geo.js';
import { AIRFIELDS } from './airfields.js';
import { common } from '../aircraft/common.js';

const FLAT = 750; // m: radius levelled flat round an airfield's centre (its 1,000 m square fits inside)
const BLEND = 1500; // m: radius at which the levelling has blended back into the land
const LOWEST_FIELD = 2; // m: an airfield is never lower than this

const BEYOND_FADE = 10000; // m: beyond the map's edge the edge's land carries on, sinking to sea level over this

const smooth = (t) => t * t * (3 - 2 * t);

/** Terrain from the grid's heights (an Int16Array, north row first). */
export function createTerrain(heights) {
  const { cols, rows, lon0, lat0, dLon, dLat, nodata } = TERRAIN_GRID;
  // Beyond the map's edge the edge row or column carries on (so the land does not end in a cliff), its height fading.
  const cell = (r, c) => heights[Math.min(rows - 1, Math.max(0, r)) * cols + Math.min(cols - 1, Math.max(0, c))];
  const cellMetres = dLat * 111195; // about one cell (m), for the fade beyond the edge
  /** The grid's height (m, sea 0) and whether the nearest cell is sea, at a world position. */
  const sample = (x, z) => {
    const { lat, lon } = toLatLon(x, z);
    const fc = (lon - lon0) / dLon;
    const fr = (lat0 - lat) / dLat;
    const c = Math.floor(fc);
    const r = Math.floor(fr);
    const tc = fc - c;
    const tr = fr - r;
    const h = (rr, cc) => Math.max(0, cell(rr, cc) === nodata ? 0 : cell(rr, cc));
    const height = (h(r, c) * (1 - tc) + h(r, c + 1) * tc) * (1 - tr) + (h(r + 1, c) * (1 - tc) + h(r + 1, c + 1) * tc) * tr;
    const water = cell(Math.round(fr), Math.round(fc)) === nodata;
    const outside = Math.max(0, -fr, fr - (rows - 1), -fc * Math.cos((lat * Math.PI) / 180), (fc - (cols - 1)) * Math.cos((lat * Math.PI) / 180));
    const fade = outside > 0 ? Math.max(0, 1 - (outside * cellMetres) / BEYOND_FADE) : 1;
    return { height: height * fade, water };
  };

  // Each airfield's level: the grid's height at its centre.
  const fields = AIRFIELDS.map((a) => ({ x: a.x, z: a.z, level: Math.max(LOWEST_FIELD, sample(a.x, a.z).height) }));

  /** The land's height (m) with the airfields levelled, and whether it is sea. */
  const ground = (x, z) => {
    const s = sample(x, z);
    for (const f of fields) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d >= BLEND) continue;
      const w = d <= FLAT ? 1 : 1 - smooth((d - FLAT) / (BLEND - FLAT));
      return { height: s.height + (f.level - s.height) * w, water: d <= FLAT ? false : s.water };
    }
    return s;
  };

  return {
    surfaceAt: (x, z) => {
      const g = ground(x, z);
      return { height: g.water ? 0 : g.height, water: g.water, tyre: common.grass };
    },
    heightAt: (x, z) => ground(x, z).height,
    gridHeight: (x, z) => sample(x, z).height,
    fieldLevel: (name) => fields[AIRFIELDS.findIndex((a) => a.name === name)].level,
    /** True within the levelled ground of an airfield (where nothing else is built). */
    onAirfield: (x, z) => fields.some((f) => Math.hypot(x - f.x, z - f.z) < BLEND),
  };
}

/** Loads the grid in the browser and makes the terrain. */
export async function loadTerrain(base = '/') {
  const res = await fetch(`${base}${TERRAIN_GRID.file}`);
  if (!res.ok) throw new Error(`terrain: ${res.status}`);
  return createTerrain(new Int16Array(await res.arrayBuffer()));
}
