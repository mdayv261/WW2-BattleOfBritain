// Phase 4 checkpoint 2: the sun's position and the cloud layer (D53).
import { describe, it, expect } from 'vitest';
import { sunPosition, sunDirection, DEFAULT_SKY_TIME } from '../../src/world/sun.js';
import { cloudField, CLOUD_LAYER } from '../../src/world/clouds.js';

describe('sun', () => {
  it('stands due south at local noon, at 90 - latitude + declination', () => {
    const noon = sunPosition({ year: 1940, month: 8, day: 15, hoursUtc: 12.01 }, 51.1, 1.0); // solar noon at 1°E, equation of time about -4.5 min
    expect(noon.azimuth).toBeCloseTo(180, 0);
    expect(noon.declination).toBeCloseTo(14, 0); // mid-August
    expect(noon.elevation).toBeCloseTo(90 - 51.1 + noon.declination, 0);
  });

  it('rises in the east-north-east and sets in the west-north-west in August', () => {
    const morning = sunPosition({ year: 1940, month: 8, day: 15, hoursUtc: 6 }, 51.1, 1.0);
    const evening = sunPosition({ year: 1940, month: 8, day: 15, hoursUtc: 18 }, 51.1, 1.0);
    expect(morning.azimuth).toBeGreaterThan(70);
    expect(morning.azimuth).toBeLessThan(95);
    expect(evening.azimuth).toBeGreaterThan(265);
    expect(evening.azimuth).toBeLessThan(290);
    expect(morning.elevation).toBeGreaterThan(5);
  });

  it('points the default afternoon sun south-west and high, as a unit vector in world axes', () => {
    const d = sunDirection(DEFAULT_SKY_TIME);
    expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 9);
    expect(d.y).toBeGreaterThan(0.6); // about 46 degrees up
    expect(d.x).toBeLessThan(0); // west
    expect(d.z).toBeGreaterThan(0); // south (+z)
  });
});

describe('cloud layer', () => {
  const blobs = cloudField();

  it('keeps every cloud between its base and the tops', () => {
    for (const b of blobs) {
      expect(b.y - b.ry).toBeGreaterThan(CLOUD_LAYER.baseLow - 0.2 * b.ry);
      expect(b.y + b.ry).toBeLessThanOrEqual(CLOUD_LAYER.topHigh + 1e-6);
    }
  });

  it('is the same every time', () => {
    expect(cloudField()).toEqual(blobs);
    expect(blobs.length).toBeGreaterThan(CLOUD_LAYER.count * 4);
  });
});
