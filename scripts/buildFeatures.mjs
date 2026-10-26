// npm run build:features: the towns, built-up areas and rivers on the map, from Natural Earth 1:10m (public domain: "Crediting the
// authors is unnecessary", D51). Fetches the GeoJSON files from Natural Earth's own repository, keeps what lies inside
// the map's extent, and writes src/world/mapFeatures.js. Run it again only if the extent changes.
import { writeFileSync } from 'node:fs';
import { MAP_EXTENT } from '../src/world/mapExtent.js';

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
const { north, south, west, east } = MAP_EXTENT;
const inside = ([lon, lat]) => lon >= west && lon <= east && lat >= south && lat <= north;
const round = (v) => Math.round(v * 1e5) / 1e5;

async function load(name) {
  const res = await fetch(`${BASE}/${name}.geojson`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res.json();
}

const places = await load('ne_10m_populated_places_simple');
const towns = places.features
  .filter((f) => inside(f.geometry.coordinates))
  .map((f) => ({
    name: f.properties.name,
    lon: round(f.geometry.coordinates[0]),
    lat: round(f.geometry.coordinates[1]),
    population: f.properties.pop_max,
  }))
  .sort((a, b) => b.population - a.population);

// River lines: split into the runs that lie inside the extent.
const rivers = [];
for (const name of ['ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe']) {
  for (const f of (await load(name)).features) {
    const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const line of lines) {
      let run = [];
      for (const p of line) {
        if (inside(p)) run.push([round(p[0]), round(p[1])]);
        else if (run.length) {
          if (run.length > 1) rivers.push({ name: f.properties.name, points: run });
          run = [];
        }
      }
      if (run.length > 1) rivers.push({ name: f.properties.name, points: run });
    }
  }
}

// Built-up areas: Natural Earth's urban area outlines (modern extents) touching the map, as rings of [lon, lat].
const urban = [];
for (const f of (await load('ne_10m_urban_areas')).features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = poly[0];
    if (ring.some(inside)) urban.push(ring.map(([lon, lat]) => [Math.round(lon * 1e4) / 1e4, Math.round(lat * 1e4) / 1e4]));
  }
}

writeFileSync('src/world/mapFeatures.js', `// Written by scripts/buildFeatures.mjs: towns and rivers inside the map, from Natural Earth 1:10m (public domain,
// D51). Positions are longitude and latitude in degrees; population is Natural Earth's modern maximum, used only to
// size each town.
export const TOWNS = ${JSON.stringify(towns, null, 0).replace(/},{/g, '},\n  {')};

export const RIVERS = ${JSON.stringify(rivers)};

// Built-up areas (Natural Earth urban areas, modern extents): rings of [lon, lat].
export const URBAN = ${JSON.stringify(urban)};
`);
console.log(`towns: ${towns.length} (${towns.map((t) => t.name).join(', ')}); river runs: ${rivers.length}; built-up areas: ${urban.length}`);
