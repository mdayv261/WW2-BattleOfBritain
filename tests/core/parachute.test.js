// Parachutes (D80, S42): free fall settles at 130 mph; the canopy opens a count of three plus 1.6 s after leaving and
// brings a man down at about 16 ft/s at sea level (faster in thinner air); he lands on the ground or in the sea, and one
// who leaves too low hits the ground before his canopy is open.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { createJumper, stepJumper } from '../../src/core/parachute.js';
import { common } from '../../src/aircraft/common.js';

const DT = 1 / 120;
const P = common.parachute;
const land = { surfaceAt: () => ({ height: 0, water: false }) };
const sea = { surfaceAt: () => ({ height: 0, water: true }) };
const jumper = (y, vx = 0) => createJumper({ position: new Vector3(0, y, 0), velocity: new Vector3(vx, 0, 0) });
const fall = (j, t, terrain = land) => { for (let s = 0; s < t; s += DT) stepJumper(j, DT, terrain); };

describe('parachute', () => {
  it('free fall approaches 58 m/s (130 mph) and no faster, the air slowing his forward speed', () => {
    const j = jumper(6000, 100);
    j.time = -1000; // keep the ripcord unpulled
    fall(j, 30);
    const speed = j.velocity.length();
    expect(speed).toBeLessThan(P.freeFallMax * 1.4); // high up the air is thinner: faster
    expect(Math.abs(j.velocity.x)).toBeLessThan(5);
    const low = jumper(1500);
    low.time = -1000;
    low.velocity.set(0, -P.freeFallMax, 0);
    fall(low, 1);
    expect(-low.velocity.y).toBeLessThanOrEqual(P.freeFallMax * Math.sqrt(1.2) + 0.5);
    expect(-low.velocity.y).toBeGreaterThan(P.freeFallMax * 0.97);
  });

  it('the canopy opens a count of three plus 1.6 s after leaving', () => {
    const j = jumper(2000);
    fall(j, P.pullDelay - 0.05);
    expect(j.state).toBe('falling');
    fall(j, 0.1 + P.openTime / 2);
    expect(j.state).toBe('opening');
    fall(j, P.openTime / 2 + 0.05);
    expect(j.state).toBe('open');
  });

  it('comes down at about 4.9 m/s near the ground, faster high up', () => {
    const low = jumper(300);
    fall(low, 25);
    expect(-low.velocity.y).toBeCloseTo(P.canopyRate, 0);
    const high = jumper(6000);
    fall(high, 30);
    expect(-high.velocity.y).toBeGreaterThan(P.canopyRate * 1.2);
  });

  it('lands on the ground, or in the sea', () => {
    const a = jumper(400);
    fall(a, 120);
    expect(a.state).toBe('landed');
    expect(a.position.y).toBe(0);
    const b = jumper(400);
    fall(b, 120, sea);
    expect(b.state).toBe('sea');
  });

  it('leaving too low, he hits the ground before his canopy is open', () => {
    const j = jumper(60);
    fall(j, 30);
    expect(j.state).toBe('killed');
  });
});
