// Joystick support through the Gamepad API (Logitech Extreme 3D Pro): stick, twist rudder, throttle
// slider, the hat (to look around) and buttons (elevator trim, brakes, flaps, undercarriage, view). Phase 8
// adds the full rebinding screen.
//
// Axis numbers differ between browsers and systems, so the mapping is editable in the joystick panel
// (J) and kept in this browser's storage. The stick and rudder are used as soon as a joystick is
// connected; the throttle slider only after it is first moved, so a parked slider does not snap the
// throttle away from the keyboard setting.

import { clamp } from '../physics/interp.js';
import { stepFlaps } from './keyboard.js';

const STORAGE_KEY = 'bob1940.joystick';
const DEADZONE = 0.05;

// Mapping of the product owner's Extreme 3D Pro in Chrome on macOS, as set in the joystick panel
// (25 Oct 2026): stick X axis 0, stick Y axis 1, twist axis 5, throttle slider axis 6 (reversed), hat axis 9.
// Buttons are numbered from 0 here, one less than the number the J panel shows (the number printed on the
// stick). By the panel's numbers: trim nose up 5, trim nose down 3, flaps up 4, flaps down 6, brakes 12,
// undercarriage 11, cockpit view 10; the trigger (1) fires the machine guns and the thumb button (2) the cannon (D67).
export const MAPPING_VERSION = 3;
export const DEFAULT_MAPPING = {
  version: MAPPING_VERSION,
  roll: { axis: 0, invert: false },
  pitch: { axis: 1, invert: false }, // pulling back gives +1 on this axis
  yaw: { axis: 5, invert: false },
  throttle: { axis: 6, invert: true },
  hat: { axis: 9 },
  buttons: { trimUp: 4, trimDown: 2, flapsUp: 3, flapsDown: 5, brake: 11, gear: 10, view: 9, fireMg: 0, fireCannon: 1 },
};

/**
 * Direction of a hat reported as one axis: -1 is up, then each step of 2/7 turns 45 degrees clockwise;
 * values beyond about 1.1 mean the hat is centred. Returns 0 (up) to 7 (up-left), or null.
 */
export function hatDirection(v) {
  if (v === undefined || Math.abs(v) > 1.1) return null;
  return ((Math.round((v + 1) * 3.5) % 8) + 8) % 8;
}

function loadMapping() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.roll && saved.pitch && saved.yaw && saved.throttle) {
      const mapping = { ...structuredClone(DEFAULT_MAPPING), ...saved };
      // Mappings saved before the version 2 button layout keep their axes but take the new hat and buttons; version 2
      // mappings keep their buttons and gain the firing buttons (version 3).
      const version = saved.version ?? 1;
      if (version < 2) {
        mapping.hat = structuredClone(DEFAULT_MAPPING.hat);
        mapping.buttons = structuredClone(DEFAULT_MAPPING.buttons);
      } else if (version < MAPPING_VERSION) {
        mapping.buttons = { ...structuredClone(DEFAULT_MAPPING.buttons), ...saved.buttons };
      }
      mapping.version = MAPPING_VERSION;
      return mapping;
    }
  } catch {
    // storage blocked or corrupt: use the defaults
  }
  return structuredClone(DEFAULT_MAPPING);
}

const shape = (v) => (Math.abs(v) < DEADZONE ? 0 : Math.sign(v) * ((Math.abs(v) - DEADZONE) / (1 - DEADZONE)));

export class Joystick {
  constructor() {
    this.mapping = loadMapping();
    this.pad = null;
    this.throttleLive = false;
    this.throttleStart = null;
    this.wasPressed = {};
  }

  saveMapping() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mapping));
    } catch {
      // storage blocked: the mapping lasts for this visit only
    }
  }

  /** The first connected gamepad, refreshed each frame (Chrome hands out snapshots). */
  poll() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const pad = pads[0] ?? null;
    if (!pad) {
      this.pad = null;
      this.throttleLive = false;
      this.throttleStart = null;
      return null;
    }
    this.pad = pad;
    return pad;
  }

  read(name) {
    const m = this.mapping[name];
    const v = this.pad?.axes[m.axis] ?? 0;
    return m.invert ? -v : v;
  }

  /** True while a mapped button is held. */
  held(name) {
    return !!this.pad?.buttons[this.mapping.buttons[name]]?.pressed;
  }

  /** True once for each press of a mapped button. */
  pressed(name) {
    const now = this.held(name);
    const was = this.wasPressed[name];
    this.wasPressed[name] = now;
    return now && !was;
  }

  /**
   * Writes stick, rudder, (once moved) throttle, elevator trim (while its buttons are held, at the aircraft's
   * own trim speed), brakes, flaps and undercarriage into the control input, for a frame of dt seconds.
   * Returns null with no joystick, else { hat: direction or null, view: true on a press of the view button }.
   */
  update(input, ac, dt = 0) {
    if (!this.poll()) return null;
    input.roll = clamp(shape(this.read('roll')), -1, 1);
    input.pitch = clamp(shape(this.read('pitch')), -1, 1);
    input.yaw = clamp(shape(this.read('yaw')), -1, 1);
    const slider = this.read('throttle');
    if (this.throttleStart === null) this.throttleStart = slider;
    if (Math.abs(slider - this.throttleStart) > 0.05) this.throttleLive = true;
    if (this.throttleLive) input.throttle = clamp((slider + 1) / 2, 0, 1);
    const trim = (this.held('trimUp') ? 1 : 0) - (this.held('trimDown') ? 1 : 0);
    if (trim) input.trim = clamp((input.trim ?? 0) + trim * (2 / ac.controls.trimTime) * dt, -1, 1);
    if (this.held('brake')) input.brake = 1;
    if (this.pressed('flapsDown')) input.flaps = stepFlaps(ac, input.flaps, 1);
    if (this.pressed('flapsUp')) input.flaps = stepFlaps(ac, input.flaps, -1);
    if (this.pressed('gear')) input.gear = input.gear ? 0 : 1;
    // Triggers add to the keyboard's (Space, Enter): either fires.
    if (this.held('fireMg')) input.fireMg = true;
    if (this.held('fireCannon')) input.fireCannon = true;
    return { hat: hatDirection(this.pad.axes[this.mapping.hat.axis]), view: this.pressed('view') };
  }
}
