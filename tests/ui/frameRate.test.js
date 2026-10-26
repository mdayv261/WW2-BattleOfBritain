// The F3 frame-rate meter: the average over half a second and the longest frame of the last second.
import { describe, it, expect } from 'vitest';
import { FrameRate } from '../../src/ui/frameRate.js';

describe('frame-rate meter', () => {
  it('reads 60 fps for steady 60 Hz frames', () => {
    const f = new FrameRate();
    for (let i = 0; i < 120; i += 1) f.tick(1 / 60);
    expect(f.fps).toBeCloseTo(60, 0);
    expect(f.worstMs).toBeCloseTo(16.7, 0);
  });

  it('shows a single stutter as the longest frame, then forgets it after a second', () => {
    const f = new FrameRate();
    for (let i = 0; i < 60; i += 1) f.tick(1 / 60);
    f.tick(0.1);
    expect(f.worstMs).toBeCloseTo(100, 0);
    for (let i = 0; i < 70; i += 1) f.tick(1 / 60);
    expect(f.worstMs).toBeLessThan(20);
  });

  it('writes the overlay line with the draw calls and triangles', () => {
    const f = new FrameRate();
    for (let i = 0; i < 60; i += 1) f.tick(1 / 50);
    for (let i = 0; i < 300; i += 1) f.work(4);
    expect(f.text({ render: { calls: 312, triangles: 845000 } }))
      .toBe('Frame rate 50 fps   longest 20 ms   work 4.0 ms   312 draws  845k triangles');
  });
});
