// Keyboard flying for the test version. Stick and pedal inputs ramp while a key is held and re-centre when
// released; levers move while held. Phase 8 makes every key rebindable.
//
//   Arrow up / down      stick forward (nose down) / back (nose up)
//   Arrow left / right   roll
//   Z / X                rudder left / right
//   W / S                throttle up / down
//   E / D                RAF: propeller rpm lever up / down.  Bf 109: pitch finer (rpm up) / coarser
//   T / G                elevator trim nose up / nose down (at each aircraft's own trim speed)
//   , / .                rudder trim left / right (Spitfire only)
//   B (hold)             brakes; with rudder, the brake on that side (D28)
//   F / Shift+F          flaps down / up one stop (the Spitfire's go straight down or up)
//   U  undercarriage   O  radiator   Q  +12 lb boost cut-out (RAF)   A  engine assist (Bf 109)

import { clamp } from '../physics/interp.js';

const STICK_RATE = 2.5; // full deflection in 0.4 s
const CENTRE_RATE = 4;
const LEVER_RATE = 0.4; // full travel in 2.5 s
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

export class Keyboard {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set(); // keys pressed since the last update (for toggles)
    target.addEventListener('keydown', (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      this.down.add(e.code);
      this.pressed.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
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
    input.pitch = Keyboard.ramp(input.pitch, this.axis('ArrowUp', 'ArrowDown'), dt);
    input.roll = Keyboard.ramp(input.roll, this.axis('ArrowLeft', 'ArrowRight'), dt);
    input.yaw = Keyboard.ramp(input.yaw, this.axis('KeyZ', 'KeyX'), dt);
    input.throttle = clamp(input.throttle + this.axis('KeyS', 'KeyW') * LEVER_RATE * dt, 0, 1);
    input.trim = clamp(input.trim + this.axis('KeyG', 'KeyT') * (2 / ac.controls.trimTime) * dt, -1, 1);
    input.rudderTrim = clamp((input.rudderTrim ?? 0) + this.axis('Comma', 'Period') * RUDDER_TRIM_RATE * dt, -1, 1);
    input.brake = this.down.has('KeyB') ? 1 : 0;
    const rpmKeys = this.axis('KeyD', 'KeyE');
    if (ac.propeller.type === 'constantSpeed') {
      input.rpm = clamp(input.rpm + rpmKeys * LEVER_RATE * dt, 0, 1);
      input.pitchSwitch = 0;
    } else {
      input.pitchSwitch = -rpmKeys; // finer pitch = higher rpm
    }
    if (this.took('KeyF')) {
      const shift = this.down.has('ShiftLeft') || this.down.has('ShiftRight');
      input.flaps = stepFlaps(ac, input.flaps, shift ? -1 : 1);
    }
    if (this.took('KeyU')) input.gear = input.gear ? 0 : 1;
    if (this.took('KeyO')) input.radiator = input.radiator ? 0 : 1;
    if (this.took('KeyQ') && ac.side === 'RAF') input.emergency = !input.emergency;
    if (this.took('KeyA') && ac.propeller.type === 'manualPitch') input.engineAssist = !input.engineAssist;
  }
}
