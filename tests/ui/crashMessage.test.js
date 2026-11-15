// The message line after a crash says what happens next (D251): the results in a mission, R in the test flight, and the
// respawn countdown in a match. It had said "press R to restart" in a mission, where R does nothing.
import { describe, it, expect } from 'vitest';
import { Hud } from '../../src/ui/hud.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';

const crashed = () => {
  const sim = new Simulation(aircraftById.spitfire, 'air');
  sim.step(1 / 120);
  sim.crashed = true;
  sim.crashCause = 'Shot down';
  return sim;
};
const message = (sim, kind) => Hud.prototype.messageFor.call(Object.create(Hud.prototype), sim, kind);

describe('the message after a crash', () => {
  it('in a mission, the results follow; in the test flight, R restarts; in a match, the respawn', () => {
    expect(message(crashed(), 'mission')).toBe('Shot down — the results follow');
    expect(message(crashed(), 'test')).toBe('Shot down — press R to restart');
    const sim = crashed();
    sim.net = { respawnText: () => 'back in the air in 8 s' };
    expect(message(sim, 'multiplayer')).toBe('Shot down — back in the air in 8 s');
  });
});
