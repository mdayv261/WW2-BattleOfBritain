// Frame-rate meter for the F3 overlay (Phase 4 acceptance: a steady 60 fps). Averages over half a second, and keeps the
// longest frame of the last second, because a single stutter matters as much as the average. The frame rate stops at
// the screen's refresh rate, so it also shows the work each frame takes (physics, scene and drawing commands, averaged):
// the headroom below the 16.7 ms a 60 fps frame allows.

const WINDOW = 0.5; // s: the average's window
const WORST_WINDOW = 1; // s: the longest frame is the longest in this window

export class FrameRate {
  constructor() {
    this.fps = 0;
    this.worstMs = 0;
    this._time = 0;
    this._frames = 0;
    this._recent = []; // [time, frame length] for the last WORST_WINDOW seconds
    this._clock = 0;
    this.workMs = 0;
  }

  /** Records how long one frame's work took (ms), smoothed. */
  work(ms) {
    this.workMs += (ms - this.workMs) * 0.05;
  }

  /** Records one frame of length dt (s, not clamped). */
  tick(dt) {
    this._clock += dt;
    this._time += dt;
    this._frames += 1;
    if (this._time >= WINDOW) {
      this.fps = this._frames / this._time;
      this._time = 0;
      this._frames = 0;
    }
    this._recent.push([this._clock, dt]);
    while (this._recent.length && this._recent[0][0] < this._clock - WORST_WINDOW) this._recent.shift();
    this.worstMs = Math.max(...this._recent.map(([, d]) => d)) * 1000;
  }

  /** The overlay line, with the renderer's draw calls and triangles if given. */
  text(info) {
    const draw = info ? `   ${info.render.calls} draws  ${(info.render.triangles / 1000).toFixed(0)}k triangles` : '';
    return `Frame rate ${this.fps.toFixed(0)} fps   longest ${this.worstMs.toFixed(0)} ms   work ${this.workMs.toFixed(1)} ms${draw}`;
  }
}
