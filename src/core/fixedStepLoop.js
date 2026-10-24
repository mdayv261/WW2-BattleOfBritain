// Fixed time step loop (DECISIONS.md D4).
//
// The physics always advances in equal steps of `stepSeconds` (1/120 s), however fast or slow the
// screen refreshes. Each frame hands in the real time that has passed; the loop runs as many whole
// steps as that time allows and keeps the remainder for the next frame. `alpha` (0 to 1) is how far
// the clock has got towards the next step, so the renderer can blend the last two physics states.

export const PHYSICS_RATE_HZ = 120;

export class FixedStepLoop {
  /**
   * @param {object} options
   * @param {(dt: number) => void} options.step  advances the simulation by one step of dt seconds
   * @param {number} [options.stepSeconds]       length of one step (default 1/120 s)
   * @param {number} [options.maxStepsPerFrame]  catch-up limit, so a slow frame cannot snowball
   */
  constructor({ step, stepSeconds = 1 / PHYSICS_RATE_HZ, maxStepsPerFrame = 8 }) {
    this.step = step;
    this.stepSeconds = stepSeconds;
    this.maxStepsPerFrame = maxStepsPerFrame;
    this.accumulator = 0;
    this.alpha = 0;
    this.totalSteps = 0;
  }

  /**
   * Runs the steps owed for `elapsedSeconds` of real time. Returns the number of steps run.
   * If more than `maxStepsPerFrame` are owed (a hidden tab, a long pause), the backlog is dropped
   * so the game carries on from now instead of freezing while it catches up.
   */
  advance(elapsedSeconds) {
    if (!(elapsedSeconds > 0)) return 0;
    this.accumulator += elapsedSeconds;

    let steps = 0;
    while (this.accumulator >= this.stepSeconds && steps < this.maxStepsPerFrame) {
      this.step(this.stepSeconds);
      this.accumulator -= this.stepSeconds;
      steps += 1;
    }
    if (this.accumulator >= this.stepSeconds) this.accumulator = 0;

    this.totalSteps += steps;
    this.alpha = this.accumulator / this.stepSeconds;
    return steps;
  }
}
