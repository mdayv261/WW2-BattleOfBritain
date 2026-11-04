// The slip balls (D214): the Luftwaffe turn indicator's (Bf 109 and Bf 110) and the Bf 110 course box's swing away from
// the sideways push the pilot feels, so a skid to the right (right rudder, wings level) sends them left.
import { describe, it, expect } from 'vitest';
import { lwBallAngle, lwTurnBank } from '../../src/ui/lwFlightDials.js';
import { courseBall, courseTubeAt, COURSE_TUBE } from '../../src/ui/bf110Boxes.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

/** sideG after a second of half right (+) or left (-) rudder, wings level, in the air. */
function skid(id, yaw) {
  const sim = new Simulation(aircraftById[id], 'air');
  sim.input.yaw = yaw;
  for (let t = 0; t < 1; t += 1 / 120) sim.step(1 / 120);
  return instrumentReadings(sim).sideG;
}

describe('slip balls (D214)', () => {
  it('feels a push to the right in a skid to the right, and to the left in a skid to the left', () => {
    for (const id of ['bf110c4', 'bf109e4']) {
      expect(skid(id, 0.5), id).toBeGreaterThan(0.05);
      expect(skid(id, -0.5), id).toBeLessThan(-0.05);
    }
  });

  it('swings the turn indicator\'s ball left in a skid to the right, right in a skid to the left, centred when balanced', () => {
    expect(lwBallAngle(skid('bf109e4', 0.5))).toBeLessThan(0);
    expect(lwBallAngle(skid('bf110c4', -0.5))).toBeGreaterThan(0);
    expect(lwBallAngle(0)).toBeCloseTo(0, 12);
    expect(lwBallAngle(1)).toBe(lwBallAngle(0.25)); // held at the tube's end
  });

  it('draws the turn indicator\'s ball left of centre for a push to the right, right of it for a push to the left', () => {
    const ballX = (sideG) => {
      const balls = [];
      const g = new Proxy({}, {
        get: (t, p) => (p === 'arc' ? (x, y, r) => { if (t.fillStyle === '#5b5e61') balls.push(x); }
          : p in t ? t[p] : String(p).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}),
        set: (t, p, v) => { t[p] = v; return true; },
      });
      lwTurnBank(g, 100, 100, 50, 0, sideG);
      return balls[0];
    };
    expect(ballX(0)).toBeCloseTo(100, 9);
    expect(ballX(0.2)).toBeLessThan(100);
    expect(ballX(-0.2)).toBeGreaterThan(100);
  });

  it('moves the course box\'s ball the same way, to the ends of its tube at a quarter g', () => {
    expect(courseBall(skid('bf110c4', 0.5))).toBeLessThan(0);
    expect(courseBall(skid('bf110c4', -0.5))).toBeGreaterThan(0);
    expect(courseBall(0)).toBeCloseTo(0, 12);
    expect(courseBall(0.25)).toBe(-1);
    expect(courseBall(-0.5)).toBe(1);
  });

  it('runs the course box\'s tube from its ends down to its sagging middle, the ball riding on it', () => {
    expect(courseTubeAt(0)).toEqual(COURSE_TUBE.left);
    expect(courseTubeAt(1)).toEqual(COURSE_TUBE.right);
    const [mx, my] = courseTubeAt(0.5);
    expect(mx).toBeCloseTo(0.5, 9);
    expect(my).toBeGreaterThan(COURSE_TUBE.left[1]); // lower in the middle: a ball tube, not a bubble's
  });

  it('agrees with the RAF and generic slip indicators, which already swung the right way', () => {
    // dials.js and rafBlindFlying.js take -sideG / 0.25, + to the right, as lwBallAngle and courseBall now do.
    expect(Math.sign(lwBallAngle(0.1))).toBe(Math.sign(-0.1 / 0.25));
  });
});
