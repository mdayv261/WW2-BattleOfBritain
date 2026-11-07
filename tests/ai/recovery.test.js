// The AI pilot out of trouble (D216): he recovers from a spin with the usual recovery, eases the stick back (not
// further forward) at a negative stall, and pulls out of a dive near the ground even when his goal points up.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { stepAircraft } from '../../src/physics/flightModel.js';
import { start, run, stallEas } from '../../src/dev/flightTests.js';
import { createHands, fly } from '../../src/ai/pilot.js';
import { keepClear } from '../../src/ai/basic.js';
import { SKILLS } from '../../src/ai/skill.js';

const DT = 1 / 120;

/** Level flight ahead, at his skill's share of the g limit: the goal he flies once the spin is over. */
const levelAhead = (plane, skill) => ({
  direction: plane.body.velocity.clone().setY(0).normalize(),
  gMax: plane.ac.limits.g.damage * SKILLS[skill].gShare,
  speed: 110,
});

describe('spin recovery', () => {
  for (const [id, side] of [['hurricane', -1], ['spitfire', -1], ['spitfire', 1], ['bf109e4', -1], ['bf110c4', -1]]) {
    it(`${id}: a Regular recovers from a ${side < 0 ? 'left' : 'right'} spin within a turn and climbs away`, () => {
      const ac = aircraftById[id];
      const { plane, input } = start(ac, { eas: 1.25 * stallEas(ac), throttle: 0 });
      run(plane, input, 6, (t, p, i) => { // into a developed spin, as the spin tests enter it
        i.throttle = 0;
        i.pitch = 1;
        i.yaw = side;
      });
      const craft = { plane, input };
      const hands = createHands(SKILLS.regular);
      let turns = 0;
      let checked = 0;
      let usual = 0;
      let closing = 1;
      let recognised = null;
      let stopped = null;
      let climbing = false;
      for (let t = 0; t < 20; t += DT) {
        fly(craft, hands, levelAhead(plane, 'regular'), DT);
        const r = -plane.body.angularVelocity.y;
        if (hands.spin && recognised === null) recognised = t;
        // While it still spins pulling, once his hands have had time to move (rudder across, stick forward): the usual
        // recovery, full rudder against the rotation and the stick eased forward; the throttle closing.
        if (hands.spin && t - recognised > 1.5 * SKILLS.regular.stickTime && Math.abs(r) > 0.6 && plane.last.alpha > 0.2) {
          checked += 1;
          if (input.yaw * r < -0.9 * Math.abs(r) && input.pitch < 0) usual += 1;
        }
        if (hands.spin) closing = Math.min(closing, input.throttle);
        if (recognised !== null && stopped === null && !hands.spin) stopped = t;
        if (stopped === null) turns += (Math.abs(r) * DT) / (2 * Math.PI);
        if (stopped !== null && plane.body.velocity.y > 0) climbing = true;
        stepAircraft(plane, input, DT);
      }
      expect(recognised).toBeLessThanOrEqual(SKILLS.regular.reaction + DT);
      expect(stopped).not.toBeNull();
      expect(turns).toBeLessThan(1);
      if (checked) expect(usual / checked).toBeGreaterThan(0.95);
      expect(closing).toBeLessThan(0.05);
      expect(climbing).toBe(true);
    });
  }

  it('does not take a hard turn with the ball in the middle for a spin', () => {
    const ac = aircraftById.spitfire;
    const { plane, input } = start(ac, { eas: 120, altitude: 3000 });
    const craft = { plane, input };
    const hands = createHands(SKILLS.ace);
    for (let t = 0; t < 15; t += DT) {
      // Straight off to the right, level: a long, hard turn at his full pull.
      const right = new Vector3(Math.cos(t), 0, Math.sin(t));
      fly(craft, hands, { direction: right, gMax: ac.limits.g.damage, throttle: 1 }, DT);
      expect(hands.spin).toBeFalsy();
      stepAircraft(plane, input, DT);
    }
  });
});

describe('the negative stall', () => {
  it('a Novice stalled pushing eases the stick back and unstalls, rather than pushing on into a tumble', () => {
    const ac = aircraftById.spitfire;
    const { plane, input } = start(ac, { eas: 1.3 * stallEas(ac), throttle: 1 });
    // Shoved forward until the wing stalls the negative way.
    run(plane, input, 1.6, (t, p, i) => { i.pitch = -1; });
    expect(plane.last.alpha).toBeLessThan(0);
    expect(Math.max(plane.last.stalledLeft, plane.last.stalledRight)).toBeGreaterThan(SKILLS.novice.buffet);
    const craft = { plane, input };
    const hands = createHands(SKILLS.novice);
    const goal = { direction: plane.body.velocity.clone().setY(0).normalize(), gMax: 4, throttle: 1 };
    let unstalled = null;
    for (let t = 0; t < 4; t += DT) {
      fly(craft, hands, goal, DT);
      stepAircraft(plane, input, DT);
      if (unstalled === null && plane.last.alpha > 0) unstalled = t;
    }
    expect(unstalled).not.toBeNull();
    expect(unstalled).toBeLessThan(2);
    expect(plane.last.loadFactor).toBeGreaterThan(0);
  });
});

describe('keeping clear of the ground', () => {
  const sim = { world: { terrain: { surfaceAt: () => ({ height: 0 }) } } };
  const craft = (y, vy) => ({
    plane: { body: { position: new Vector3(0, y, 0), velocity: new Vector3(0, vy, -120) } },
    ac: { limits: { g: { damage: 9 } } },
  });
  const upward = { direction: new Vector3(0, 0.5, -1).normalize(), gMax: 4, fireMg: true };

  it('pulls out of a dive near the ground even while his goal points up (a target above him)', () => {
    const goal = keepClear(craft(400, -60), sim, upward);
    expect(goal).not.toBe(upward);
    expect(goal.gMax).toBeGreaterThan(4);
    expect(goal.fireMg).toBe(false);
  });

  it('leaves a goal that points up alone once he is climbing', () => {
    expect(keepClear(craft(250, 20), sim, upward)).toBe(upward);
  });

  it('leaves the goal alone high enough above the ground', () => {
    expect(keepClear(craft(3000, -60), sim, upward)).toBe(upward);
  });
});
