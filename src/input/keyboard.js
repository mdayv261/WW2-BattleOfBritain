// Keyboard flying. Stick and pedal inputs ramp while a key is held and re-centre when released; levers move while held.
// Every key is the player's to choose (Phase 8, D238: src/input/bindings.js); these are the defaults:
//
//   Arrow up / down      stick forward (nose down) / back (nose up)
//   Arrow left / right   roll
//   Z / X                rudder left / right
//   W / S                throttle up / down
//   E / D                RAF: propeller rpm lever up / down.  Bf 109: pitch finer (rpm up) / coarser
//   T / G                elevator trim nose up / nose down (at each aircraft's own trim speed)
//   , / .                rudder trim left / right (Spitfire, Bf 110, He 111)
//   B (hold)             brakes; with rudder, the brake on that side (D28)
//   F / Shift+F          flaps down / up one stop (the Spitfire's go straight down or up)
//   U  undercarriage   O  radiator   Q  +12 lb boost cut-out (RAF)   A  engine assist (Bf 109)
//   Shift+P              Bf 110: airscrew pitch control switch, Automatik / Hand (D188; P alone pauses)
//   Backspace (hold 1 s)  bail out (D80)

import { clamp } from '../physics/interp.js';
import { Bindings, comboOf } from './bindings.js';

const STICK_RATE = 2.5; // full deflection in 0.4 s
const CENTRE_RATE = 4;
export const LEVER_RATE = 0.4; // full travel in 2.5 s
const RUDDER_TRIM_RATE = 0.25; // full travel in 8 s

/**
 * Moves the flap selector one stop down (+1) or up (-1). The Spitfire's lever has only up and down (S33),
 * so either key reverses it.
 */
export function stepFlaps(ac, selected, direction) {
  const stops = ac.controls.flapStops;
  if (stops === 1) return selected > 0.5 ? 0 : 1;
  const at = Math.round(clamp(Number(selected) || 0, 0, 1) * stops);
  return clamp(at + direction, 0, stops) / stops;
}

/**
 * Is a key event aimed at a text box (a name or room code being typed, D245)? Then it is the box's: the aircraft's
 * keys don't act on it and the browser's typing is not stopped.
 */
export function typing(e) {
  const t = e?.target;
  if (!t || typeof t !== 'object') return false;
  if (t.isContentEditable) return true;
  const tag = String(t.tagName ?? '').toLowerCase();
  if (tag === 'textarea') return true;
  return tag === 'input' && !['button', 'checkbox', 'radio', 'range', 'submit'].includes(String(t.type ?? 'text').toLowerCase());
}

export class Keyboard {
  /** `bindings`: the player's keys (src/input/bindings.js); `target`: where key events come from (null in the tests). */
  constructor(target = window, bindings = new Bindings()) {
    this.bindings = bindings;
    this.down = new Set();
    this.pressed = new Set(); // key combinations pressed since the last update (for toggles)
    if (!target) return;
    target.addEventListener('keydown', (e) => this.keyDown(e));
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  /**
   * A key pressed. With Shift held a press is its own combination ("Shift+KeyF" for flaps up, "Shift+KeyP" for the
   * Bf 110's pitch switch, D188), so it does not also act as the plain key.
   */
  keyDown(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || typing(e)) return;
    this.down.add(e.code);
    const shift = e.shiftKey || this.down.has('ShiftLeft') || this.down.has('ShiftRight');
    this.pressed.add(comboOf({ code: e.code, shiftKey: shift }));
    if (e.code.startsWith('Arrow') || ['Space', 'Enter', 'Backspace', 'Tab'].includes(e.code)) e.preventDefault?.();
  }

  /** Whether a key combination is held: its key, with Shift held if it names Shift. */
  holds(key) {
    if (!key.startsWith('Shift+')) return this.down.has(key);
    return this.down.has(key.slice(6)) && (this.down.has('ShiftLeft') || this.down.has('ShiftRight'));
  }

  /** Whether an action's key is held. */
  held(id) {
    return this.bindings.of(id).some((k) => this.holds(k));
  }

  /** True once for each press of an action's key. */
  tookAction(id) {
    let had = false;
    for (const k of this.bindings.of(id)) if (this.took(k)) had = true;
    return had;
  }

  /** An axis from two actions' keys: -1, 0 or +1. */
  axisOf(neg, pos) {
    return (this.held(pos) ? 1 : 0) - (this.held(neg) ? 1 : 0);
  }

  /** True once for each press of a key. */
  took(code) {
    const had = this.pressed.has(code);
    this.pressed.delete(code);
    return had;
  }

  axis(neg, pos) {
    return (this.down.has(pos) ? 1 : 0) - (this.down.has(neg) ? 1 : 0);
  }

  /** Moves a stick input toward the keys' demand, or back to centre. */
  static ramp(value, demand, dt) {
    if (demand !== 0) return clamp(value + demand * STICK_RATE * dt, -1, 1);
    const back = CENTRE_RATE * dt;
    return Math.abs(value) <= back ? 0 : value - Math.sign(value) * back;
  }

  /** Applies held keys and toggles to the control input for one frame of dt seconds. */
  update(input, ac, dt) {
    input.pitch = Keyboard.ramp(input.pitch, this.axisOf('pitchDown', 'pitchUp'), dt);
    input.roll = Keyboard.ramp(input.roll, this.axisOf('rollLeft', 'rollRight'), dt);
    input.yaw = Keyboard.ramp(input.yaw, this.axisOf('yawLeft', 'yawRight'), dt);
    input.throttle = clamp(input.throttle + this.axisOf('throttleDown', 'throttleUp') * LEVER_RATE * dt, 0, 1);
    input.trim = clamp(input.trim + this.axisOf('trimDown', 'trimUp') * (2 / ac.controls.trimTime) * dt, -1, 1);
    input.rudderTrim = clamp((input.rudderTrim ?? 0) + this.axisOf('rudderTrimLeft', 'rudderTrimRight') * RUDDER_TRIM_RATE * dt, -1, 1);
    input.brake = this.held('brakes') ? 1 : 0;
    // Guns (D67): the machine guns (all eight on the RAF fighters) and the cannon.
    input.fireMg = this.held('fireMg');
    input.bailOut = this.held('bailOut'); // held for 1 s to bail out (src/core/bailout.js, D80)
    input.fireCannon = this.held('fireCannon');
    const rpmKeys = this.axisOf('rpmDown', 'rpmUp');
    if (ac.propeller.type === 'constantSpeed') {
      input.rpm = clamp(input.rpm + rpmKeys * LEVER_RATE * dt, 0, 1);
      input.pitchSwitch = 0;
    } else {
      input.pitchSwitch = -rpmKeys; // finer pitch = higher rpm
    }
    if (this.tookAction('flapsDown')) input.flaps = stepFlaps(ac, input.flaps, 1);
    if (this.tookAction('flapsUp')) input.flaps = stepFlaps(ac, input.flaps, -1);
    if (this.tookAction('gear')) input.gear = input.gear ? 0 : 1;
    if (this.tookAction('radiator')) input.radiator = input.radiator ? 0 : 1;
    if (this.tookAction('boost') && ac.side === 'RAF') input.emergency = !input.emergency;
    if (this.tookAction('autoPitch') && ac.propeller.type === 'manualPitch') input.engineAssist = !input.engineAssist;
    // The Bf 110's pitch control switch (D188): Automatik is the automatic pitch (the engine assist, which holds the
    // rpm), Hand the pitch set with E / D.
    if (this.tookAction('pitchSwitch') && ac.propeller.type === 'manualPitch' && ac.engines) input.engineAssist = !input.engineAssist;
  }
}
