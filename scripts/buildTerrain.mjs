// npm run build:terrain: builds the map's height grid from USGS GMTED2010 (7.5 arc-second mean elevation, public
// domain, D51). Only the rows the map needs are fetched from the two source tiles, with HTTP range requests, and a
// minimal reader for their uncompressed GeoTIFF layout. Writes public/data/terrain.bin (16-bit signed metres, north
// row first, west column first; -32768 where the source has no land, i.e. the sea) and src/world/terrainGrid.js (its
// size, position and source). Run it again only if the map's extent changes.
import { writeFileSync, mkdirSync } from 'node:fs';
import { MAP_EXTENT } from '../src/world/mapExtent.js';

const BASE = 'https://edcintl.cr.usgs.gov/downloads/sciweb1/shared/topo/downloads/GMTED/Global_tiles_GMTED/075darcsec/mea';
const TILES = [
  { url: `${BASE}/W030/50N030W_20101117_gmted_mea075.tif`, west: -30, east: 0 },
  { url: `${BASE}/E000/50N000E_20101117_gmted_mea075.tif`, west: 0, east: 30 },
];
const NODATA = -32768;

async function range(url, from, to) {
  const res = await fetch(url, { headers: { Range: `bytes=${from}-${to}` } });
  if (res.status !== 206) throw new Error(`${url}: expected a partial response, got ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** The tile's layout from its TIFF directory: size, strips, georeferencing. Little-endian, one image. */
async function readLayout(url) {
  const head = await range(url, 0, 15);
  if (head.toString('ascii', 0, 2) !== 'II' || head.readUInt16LE(2) !== 42) throw new Error(`${url}: not a little-endian TIFF`);
  const ifd = head.readUInt32LE(4);
  const dir = await range(url, ifd, ifd + 120000);
  const at = (offset) => offset - ifd;
  const count = dir.readUInt16LE(0);
  const tags = {};
  for (let i = 0; i < count; i += 1) {
    const e = 2 + i * 12;
    const tag = dir.readUInt16LE(e);
    const type = dir.readUInt16LE(e + 2);
    const n = dir.readUInt32LE(e + 4);
    const size = { 3: 2, 4: 4, 12: 8 }[type] ?? 1;
    const inline = n * size <= 4;
    const ptr = inline ? e + 8 : at(dir.readUInt32LE(e + 8));
    const read = (k) => (type === 3 ? dir.readUInt16LE(ptr + 2 * k) : type === 4 ? dir.readUInt32LE(ptr + 4 * k) : dir.readDoubleLE(ptr + 8 * k));
    tags[tag] = type === 2 ? dir.toString('ascii', ptr, ptr + n - 1) : Array.from({ length: n }, (_, k) => read(k));
  }
  const layout = {
    width: tags[256][0], height: tags[257][0], bits: tags[258][0], compression: tags[259][0],
    rowsPerStrip: tags[278][0], stripOffsets: tags[273], format: tags[339]?.[0],
    dLon: tags[33550][0], dLat: tags[33550][1], cornerLon: tags[33922][3], cornerLat: tags[33922][4],
  };
  if (layout.bits !== 16 || layout.compression !== 1 || layout.rowsPerStrip !== 1 || layout.format !== 2) {
    throw new Error(`${url}: expected uncompressed signed 16-bit rows, one per strip`);
  }
  return layout;
}

const { north, south, west, east } = MAP_EXTENT;
const tiles = [];
for (const t of TILES) tiles.push({ ...t, layout: await readLayout(t.url) });
const { dLon, dLat } = tiles[0].layout;

// Output rows and columns: the source pixel centres inside the extent.
const centre = (corner, step, i) => corner + (i + 0.5) * step;
const firstRow = Math.ceil((tiles[0].layout.cornerLat - north) / dLat - 0.5);
const lastRow = Math.floor((tiles[0].layout.cornerLat - south) / dLat - 0.5);
const rows = lastRow - firstRow + 1;
const columns = []; // [tile index, column] for each output column, west to east
for (const [ti, t] of tiles.entries()) {
  for (let c = 0; c < t.layout.width; c += 1) {
    const lon = centre(t.layout.cornerLon, dLon, c);
    if (lon >= west && lon <= east && lon >= t.west && lon < t.east) columns.push([ti, c]);
  }
}
const cols = columns.length;
const grid = new Int16Array(rows * cols);
for (const [ti, t] of tiles.entries()) {
  const { stripOffsets, width } = t.layout;
  const from = stripOffsets[firstRow];
  const to = stripOffsets[lastRow] + width * 2 - 1;
  console.log(`tile ${ti}: rows ${firstRow}-${lastRow}, ${((to - from + 1) / 1e6).toFixed(1)} MB`);
  const data = await range(t.url, from, to);
  for (let r = 0; r < rows; r += 1) {
    const rowStart = stripOffsets[firstRow + r] - from;
    columns.forEach(([cti, c], k) => {
      if (cti === ti) grid[r * cols + k] = data.readInt16LE(rowStart + c * 2);
    });
  }
}

// The source gives the sea as 0 m. Sea cells are the cells at or below 0 m joined to the map's edge (the Channel, the
// North Sea and the Thames estuary); they become NODATA. Low land below sea level elsewhere (marsh) stays land at 0 m.
const sea = new Uint8Array(rows * cols);
const queue = [];
const push = (r, c) => {
  const i = r * cols + c;
  if (r < 0 || c < 0 || r >= rows || c >= cols || sea[i] || grid[i] > 0) return;
  sea[i] = 1;
  queue.push(i);
};
for (let c = 0; c < cols; c += 1) {
  push(0, c);
  push(rows - 1, c);
}
for (let r = 0; r < rows; r += 1) {
  push(r, 0);
  push(r, cols - 1);
}
while (queue.length) {
  const i = queue.pop();
  const r = Math.floor(i / cols);
  const c = i % cols;
  push(r + 1, c);
  push(r - 1, c);
  push(r, c + 1);
  push(r, c - 1);
}
for (let i = 0; i < grid.length; i += 1) grid[i] = sea[i] ? NODATA : Math.max(0, grid[i]);

const lon0 = centre(tiles[columns[0][0]].layout.cornerLon, dLon, columns[0][1]);
const lat0 = centre(tiles[0].layout.cornerLat, -dLat, firstRow);
mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/terrain.bin', Buffer.from(grid.buffer));
const land = grid.reduce((n, h) => n + (h !== NODATA ? 1 : 0), 0);
const highest = grid.reduce((m, h) => Math.max(m, h), NODATA);
writeFileSync('src/world/terrainGrid.js', `// Written by scripts/buildTerrain.mjs: the layout of public/data/terrain.bin. Source: USGS GMTED2010, 7.5 arc-second
// mean elevation (public domain, D51). Heights in metres; NODATA marks the sea.
export const TERRAIN_GRID = {
  cols: ${cols}, rows: ${rows},
  lon0: ${lon0}, // longitude of the westernmost column's centre (degrees)
  lat0: ${lat0}, // latitude of the northernmost row's centre (degrees)
  dLon: ${dLon}, dLat: ${dLat}, // spacing (degrees)
  nodata: ${NODATA},
  file: 'data/terrain.bin',
};
`);
console.log(`terrain: ${cols} x ${rows}, ${((100 * land) / grid.length).toFixed(1)}% land, highest ${highest} m`);
