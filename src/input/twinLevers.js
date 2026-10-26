// Engine levers for the twins (Phase 3). The keyboard and joystick move one set of levers (input.throttle, input.rpm,
// input.pitchSwitch); this module passes their movement on to the engines the pilot has selected, so both engines
// move together, or one alone, as with a pair of real throttle levers. Each engine can also be cut (to practise an
// engine failure) and its airscrew feathered. The per-engine values go in input.engines (src/physics/powerplant.js).
//
//   K  select the engines the levers move: both, left, right
//   L  cut the selected engine, or restart it
//   M  feather the selected engine's airscrew, or unfeather it

import { clamp } from '../physics/interp.js';

export const ENGINE_CHOICES = ['both', 0, 1];
export const ENGINE_NAMES = { both: 'both engines', 0: 'left engine', 1: 'right engine' };

/** Lever state for an aircraft with `count` engines, all starting from the shared levers. */
export function createTwinLevers(input, count) {
  input.engines = Array.from({ length: count }, () => ({
    throttle: input.throttle, rpm: input.rpm, pitchSwitch: 0, failed: false, feather: false,
  }));
  return { selected: 'both', last: { throttle: input.throttle, rpm: input.rpm } };
}

const isSelected = (state, i) => state.selected === 'both' || state.selected === i;

/** Passes this frame's lever movement on to the selected engines (call after the keyboard and joystick). */
export function applyTwinLevers(state, input) {
  const dThrottle = input.throttle - state.last.throttle;
  const dRpm = input.rpm - state.last.rpm;
  input.engines.forEach((e, i) => {
    const on = isSelected(state, i);
    if (on) {
      e.throttle = clamp(e.throttle + dThrottle, 0, 1);
      e.rpm = clamp(e.rpm + dRpm, 0, 1);
    }
    e.pitchSwitch = on ? input.pitchSwitch : 0;
  });
  state.last.throttle = input.throttle;
  state.last.rpm = input.rpm;
}

/** Moves the selection on: both, left, right, both. Returns its name. */
export function selectNextEngine(state) {
  state.selected = ENGINE_CHOICES[(ENGINE_CHOICES.indexOf(state.selected) + 1) % ENGINE_CHOICES.length];
  return ENGINE_NAMES[state.selected];
}

/**
 * Cuts the selected engine, or restarts it if it was cut. With both selected nothing happens (an engine failure is
 * one engine). Returns a message for the pilot.
 */
export function toggleCut(state, input) {
  if (state.selected === 'both') return 'Select one engine first (K)';
  const e = input.engines[state.selected];
  e.failed = !e.failed;
  return `${capital(ENGINE_NAMES[state.selected])} ${e.failed ? 'cut' : 'restarted'}`;
}

/** Feathers the selected engine's airscrew, or unfeathers it. Returns a message for the pilot. */
export function toggleFeather(state, input) {
  if (state.selected === 'both') return 'Select one engine first (K)';
  const e = input.engines[state.selected];
  e.feather = !e.feather;
  return `${capital(ENGINE_NAMES[state.selected])} ${e.feather ? 'feathering' : 'unfeathering'}`;
}

const capital = (s) => s[0].toUpperCase() + s.slice(1);
