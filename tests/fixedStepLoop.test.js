import { describe, it, expect } from 'vitest';
import { FixedStepLoop, PHYSICS_RATE_HZ } from '../src/core/fixedStepLoop.js';

function makeLoop(options = {}) {
  const steps = [];
  const loop = new FixedStepLoop({ step: (dt) => steps.push(dt), ...options });
  return { loop, steps };
}

describe('FixedStepLoop', () => {
  it('runs at 120 Hz by default', () => {
    const { loop } = makeLoop();
    expect(PHYSICS_RATE_HZ).toBe(120);
    expect(loop.stepSeconds).toBeCloseTo(1 / 120, 12);
  });

  it('runs one second of real time as 120 equal steps, whatever the frame rate', () => {
    for (const fps of [30, 60, 144]) {
      const { loop, steps } = makeLoop();
      for (let frame = 0; frame < fps; frame += 1) loop.advance(1 / fps);
      // Floating-point leftovers can hold back the very last step until the next frame.
      expect(steps.length).toBeGreaterThanOrEqual(119);
      expect(steps.length).toBeLessThanOrEqual(120);
      expect(steps.every((dt) => dt === loop.stepSeconds)).toBe(true);
    }
  });

  it('carries the leftover time forward and reports it as alpha', () => {
    const { loop, steps } = makeLoop();
    loop.advance(1.5 / 120);
    expect(steps.length).toBe(1);
    expect(loop.alpha).toBeCloseTo(0.5, 9);
    loop.advance(0.5 / 120);
    expect(steps.length).toBe(2);
    expect(loop.alpha).toBeCloseTo(0, 9);
  });

  it('caps the catch-up after a long pause and drops the backlog', () => {
    const { loop, steps } = makeLoop({ maxStepsPerFrame: 8 });
    expect(loop.advance(5)).toBe(8);
    expect(steps.length).toBe(8);
    expect(loop.accumulator).toBe(0);
    expect(loop.advance(1 / 120)).toBe(1);
  });

  it('ignores zero, negative and invalid elapsed times', () => {
    const { loop, steps } = makeLoop();
    for (const t of [0, -1, Number.NaN, undefined]) expect(loop.advance(t)).toBe(0);
    expect(steps.length).toBe(0);
  });
});
