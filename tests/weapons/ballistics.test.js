// Bullet drop and travel time against the sourced range tables (Phase 5 acceptance, D67): the .303 Mk VII against the
// Hythe table (S37), the 7.92 mm and the MG FF/M's 117 g shell against Rechlin's firing tables (S41). Velocities within
// 2%, times of flight within 2% (the Hythe table's times are given to 0.1 s only), drops within 10%.
import { describe, it, expect } from 'vitest';
import { ballistics } from '../../src/aircraft/ammunition.js';
import { flightTable, stepRound } from '../../src/weapons/ballistics.js';

const YD = 0.9144;
const FT = 0.3048;
const within = (value, ref, share) => Math.abs(value - ref) <= share * Math.abs(ref);

const TABLES = {
  mk7: {
    unit: YD,
    // [range, remaining velocity (m/s), time (s), drop (m)]; drop is range x tan(elevation) from the table's elevation.
    rows: [[100, 2230 * FT, 0.2, 0.08], [200, 2030 * FT, 0.3, 0.37], [300, 1840 * FT, 0.4, 0.88], [400, 1660 * FT, 0.6, 1.6],
      [500, 1500 * FT, 0.8, 2.53], [600, 1360 * FT, 1.0, 3.98]],
    timeTolerance: 0.1, // s: the table's resolution
  },
  mg17: {
    unit: 1,
    rows: [[100, 715, 0.132, 0.1], [200, 624, 0.281, 0.4], [300, 538, 0.453, 0.9], [400, 460, 0.654, 1.8], [500, 396, 0.889, 3.2],
      [600, 348, 1.159, 5.1]],
  },
  mgffm: {
    unit: 1,
    rows: [[100, 533, 0.179, 0.15], [200, 487, 0.376, 0.65], [300, 446, 0.59, 1.57], [400, 409, 0.825, 2.98], [500, 376, 1.08, 4.98],
      [600, 349, 1.356, 7.67]],
  },
};

describe('ballistics against the range tables', () => {
  for (const [key, t] of Object.entries(TABLES)) {
    describe(key, () => {
      const flight = flightTable(ballistics[key], t.rows.map(([r]) => r * t.unit));
      t.rows.forEach(([range, v, time, drop], i) => {
        it(`at ${range} ${t.unit === 1 ? 'm' : 'yd'}: speed, time of flight and drop`, () => {
          const f = flight[i];
          expect(within(f.speed, v, 0.02), `speed ${f.speed.toFixed(1)} vs ${v.toFixed(1)}`).toBe(true);
          if (t.timeTolerance) expect(Math.abs(f.time - time), `time ${f.time.toFixed(3)} vs ${time}`).toBeLessThanOrEqual(t.timeTolerance);
          else expect(within(f.time, time, 0.02), `time ${f.time.toFixed(3)} vs ${time}`).toBe(true);
          if (range >= 300) expect(within(f.drop, drop, 0.1), `drop ${f.drop.toFixed(2)} vs ${drop}`).toBe(true);
        });
      });
    });
  }

  it('slows less in the thin air at height (the tables are for sea level)', () => {
    const [low] = flightTable(ballistics.mg17, [400]);
    const [high] = flightTable(ballistics.mg17, [400], { altitude: 6000 });
    expect(high.speed).toBeGreaterThan(low.speed + 30);
  });

  it('falls under gravity when fired straight up, and comes back down', () => {
    const p = { x: 0, y: 1000, z: 0 };
    const v = { x: 0, y: 400, z: 0 };
    let top = 0;
    for (let t = 0; t < 60 && p.y >= 1000; t += 0.01) {
      stepRound(ballistics.mk7, p, v, 0.01);
      top = Math.max(top, p.y);
    }
    expect(top).toBeGreaterThan(1500);
    expect(p.y).toBeLessThan(1000);
  });
});
