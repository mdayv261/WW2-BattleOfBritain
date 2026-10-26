// Engine levers for the twins (Phase 3). The keyboard and joystick move one set of levers (input.throttle, input.rpm,
// input.pitchSwitch); the engines the pilot has selected follow those levers' positions, so both engines move together,
// or one alone while the other holds its setting. Following the position (not the movement) keeps a joystick's
// throttle slider and the engines in step (D49). Engines can also be stopped and started (L, which also works on the
// single-engine fighters) and an airscrew feathered. The per-engine values go in input.engines
// (src/physics/powerplant.js).
//
//   K  select the engines the levers move: both, left, right
//   L  stop or start the selected engines (every aircraft: the single engine of a fighter)
//   M  feather the selected engine's airscrew, or unfeather it

import { clamp } from '../physics/interp.js';

export const ENGINE_CHOICES = ['both', 0, 1];
export const ENGINE_NAMES = { both: 'both engines', 0: 'left engine', 1: 'right engine' };

/** Lever state for an aircraft with `count` engines, all starting from the shared levers. */
export function createTwinLevers(input, count) {
  input.engines = Array.from({ length: count }, () => ({
    throttle: input.throttle, rpm: input.rpm, pitchSwitch: 0, failed: false, feather: false,
  }));
  return { selected: 'both' };
}

const isSelected = (state, i) => state.selected === 'both' || state.selected === i;

/** Sets the selected engines to the levers' positions (call after the keyboard and joystick). */
export function applyTwinLevers(state, input) {
  input.engines.forEach((e, i) => {
    const on = isSelected(state, i);
    if (on) {
      e.throttle = clamp(input.throttle, 0, 1);
      e.rpm = clamp(input.rpm, 0, 1);
    }
    e.pitchSwitch = on ? input.pitchSwitch : 0;
  });
}

/**
 * Moves the selection on: both, left, right, both. With one engine selected the keyboard levers start from that
 * engine's setting, so it does not jump (a joystick slider, being a real lever, sets it to where the slider is).
 * Returns the selection's name.
 */
export function selectNextEngine(state, input) {
  state.selected = ENGINE_CHOICES[(ENGINE_CHOICES.indexOf(state.selected) + 1) % ENGINE_CHOICES.length];
  if (input && state.selected !== 'both') {
    input.throttle = input.engines[state.selected].throttle;
    input.rpm = input.engines[state.selected].rpm;
  }
  return ENGINE_NAMES[state.selected];
}

/**
 * Starts or stops engines (L, every aircraft, D49): a single engine, or on a twin the engines the levers are set to
 * (both, left or right). If any of them is running they all stop; otherwise they all start, unfeathered. `state` is
 * the twin lever state, or null for a single-engine aircraft. Returns { text, started: [engine indices] }.
 */
export function toggleRunning(state, input) {
  const all = input.engines.map((_, i) => i);
  const targets = !state || state.selected === 'both' ? all : [state.selected];
  const stop = targets.some((i) => !input.engines[i].failed);
  for (const i of targets) {
    input.engines[i].failed = stop;
    if (!stop) input.engines[i].feather = false;
  }
  const who = !state ? 'Engine' : state.selected === 'both' ? 'Both engines' : capital(ENGINE_NAMES[state.selected]);
  return { text: `${who} ${stop ? 'stopped' : 'started'}`, started: stop ? [] : targets };
}

/** Feathers the selected engine's airscrew, or unfeathers it. Returns a message for the pilot. */
export function toggleFeather(state, input) {
  if (state.selected === 'both') return 'Select one engine first (K)';
  const e = input.engines[state.selected];
  e.feather = !e.feather;
  return `${capital(ENGINE_NAMES[state.selected])} ${e.feather ? 'feathering' : 'unfeathering'}`;
}

const capital = (s) => s[0].toUpperCase() + s.slice(1);
