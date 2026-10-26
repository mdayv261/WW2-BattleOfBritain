// Phase 4 checkpoint 1: the map (D51) - projection, the GMTED2010 grid, land and sea, airfields, starts.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { toWorld, toLatLon, MAP_CENTRE } from '../../src/world/geo.js';
import { MAP_EXTENT } from '../../src/world/mapExtent.js';
import { TERRAIN_GRID } from '../../src/world/terrainGrid.js';
import { createTerrain } from '../../src/world/terrain.js';
import { AIRFIELDS, HOME, airfieldNamed } from '../../src/world/airfields.js';
import { realWorld } from '../../src/world/world.js';
import { urbanMask, insideRing } from '../../src/world/landCover.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

const bytes = readFileSync(new URL('../../public/data/terrain.bin', import.meta.url));
const heights = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
const terrain = createTerrain(heights);
const at = (lat, lon) => {
  const { x, z } = toWorld(lat, lon);
  return terrain.surfaceAt(x, z);
};

describe('projection', () => {
  it('puts the map centre at the origin and round-trips latitude and longitude', () => {
    const origin = toWorld(MAP_CENTRE.lat, MAP_CENTRE.lon);
    expect(Math.abs(origin.x) + Math.abs(origin.z)).toBe(0);
    for (const [lat, lon] of [[51.13, 1.31], [50.95, 1.86], [51.5, -0.12]]) {
      const { x, z } = toWorld(lat, lon);
      const back = toLatLon(x, z);
      expect(back.lat).toBeCloseTo(lat, 9);
      expect(back.lon).toBeCloseTo(lon, 9);
    }
  });

  it('has north as -z and east as +x, about 111 km to a degree of latitude', () => {
    const north = toWorld(MAP_CENTRE.lat + 1, MAP_CENTRE.lon);
    expect(north.z).toBeCloseTo(-111195, -2);
    expect(toWorld(MAP_CENTRE.lat, MAP_CENTRE.lon + 1).x).toBeGreaterThan(60000);
  });
});

describe('terrain grid (GMTED2010)', () => {
  it('matches its layout and covers the extent', () => {
    const { cols, rows, lon0, lat0, dLon, dLat } = TERRAIN_GRID;
    expect(heights.length).toBe(cols * rows);
    expect(lat0).toBeCloseTo(MAP_EXTENT.north, 2);
    expect(lat0 - (rows - 1) * dLat).toBeCloseTo(MAP_EXTENT.south, 2);
    expect(lon0).toBeCloseTo(MAP_EXTENT.west, 2);
    expect(lon0 + (cols - 1) * dLon).toBeCloseTo(MAP_EXTENT.east, 2);
  });

  it('has the Channel and the Thames estuary as sea, Calais and the cliff tops as land', () => {
    expect(at(51.0, 1.4).water).toBe(true);
    expect(at(51.5, 0.8).water).toBe(true);
    expect(at(50.95, 1.86).water).toBe(false);
    expect(at(51.14, 1.36).height).toBeGreaterThan(80); // the cliffs east of Dover
    expect(at(50.925, 1.72).height).toBeGreaterThan(80); // Cap Blanc-Nez
  });

  it('carries the land on beyond the map edge, sinking to sea level', () => {
    const edge = at(51.64, -0.3);
    const beyond = at(51.64 + 0.2, -0.3); // about 22 km north of the edge
    expect(edge.water).toBe(false);
    expect(beyond.height).toBe(0);
  });
});

describe('airfields', () => {
  it('lie on land, inside the map, each levelled across its square', () => {
    for (const a of AIRFIELDS) {
      expect(a.lat, a.name).toBeGreaterThan(MAP_EXTENT.south);
      expect(a.lat, a.name).toBeLessThan(MAP_EXTENT.north);
      const centre = terrain.surfaceAt(a.x, a.z);
      expect(centre.water, a.name).toBe(false);
      for (const [dx, dz] of [[450, 450], [-450, 450], [450, -450], [-450, -450]]) {
        expect(terrain.surfaceAt(a.x + dx, a.z + dz).height, a.name).toBeCloseTo(centre.height, 6);
      }
    }
  });

  it('gives each side a home field on its own side of the Channel', () => {
    expect(airfieldNamed(HOME.RAF).side).toBe('RAF');
    expect(airfieldNamed(HOME.Luftwaffe).side).toBe('Luftwaffe');
    expect(airfieldNamed(HOME.RAF).z).toBeLessThan(airfieldNamed(HOME.Luftwaffe).z); // England is north
  });

  it('starts a flight at rest on the home field\'s grass, and in the air above it', () => {
    const world = realWorld(terrain);
    for (const ac of [aircraftById.spitfire, aircraftById.bf109e4]) {
      const sim = new Simulation(ac, 'ground', world);
      for (let k = 0; k < 240; k += 1) sim.step(1 / 120);
      expect(sim.crashed, ac.id).toBe(false);
      expect(sim.plane.ground.touching).toEqual([true, true, true]);
      const field = airfieldNamed(HOME[ac.side]);
      expect(Math.hypot(sim.plane.body.position.x - field.x, sim.plane.body.position.z - field.z)).toBeLessThan(500);
      const air = new Simulation(ac, 'air', world);
      expect(air.plane.body.position.y - terrain.fieldLevel(field.name)).toBeGreaterThan(900);
    }
  });
});

describe('built-up areas (Natural Earth urban outlines)', () => {
  it('rasterise onto the grid, London among them', () => {
    const mask = urbanMask();
    expect(mask.reduce((n, v) => n + v, 0)).toBeGreaterThan(1000);
    const { cols, lon0, lat0, dLon, dLat } = TERRAIN_GRID;
    const r = Math.round((lat0 - 51.507) / dLat);
    const c = Math.round((-0.128 - lon0) / dLon);
    expect(mask[r * cols + c]).toBe(1);
  });

  it('tests points against a ring', () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    expect(insideRing(square, 0.5, 0.5)).toBe(true);
    expect(insideRing(square, 1.5, 0.5)).toBe(false);
  });
});
