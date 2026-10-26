// Written by scripts/buildTerrain.mjs: the layout of public/data/terrain.bin. Source: USGS GMTED2010, 7.5 arc-second
// mean elevation (public domain, D51). Heights in metres; NODATA marks the sea.
export const TERRAIN_GRID = {
  cols: 1440, rows: 528,
  lon0: -0.49909722222222186, // longitude of the westernmost column's centre (degrees)
  lat0: 51.64881944444445, // latitude of the northernmost row's centre (degrees)
  dLon: 0.0020833333333333333, dLat: 0.0020833333333333333, // spacing (degrees)
  nodata: -32768,
  file: 'data/terrain.bin',
};
