// Basic joystick support through the Gamepad API (Logitech Extreme 3D Pro). Stick, twist rudder and
// throttle slider. Phase 2 adds the hat and buttons; Phase 8 the full rebinding screen.
//
// Axis numbers differ between browsers and systems, so the mapping is editable in the joystick panel
// (J) and kept in this browser's storage. The stick and rudder are used as soon as a joystick is
// connected; the throttle slider only after it is first moved, so a parked slider does not snap the
// throttle away from the keyboard setting.

import { clamp } from '../physics/interp.js';

const STORAGE_KEY = 'bob1940.joystick';
const DEADZONE = 0.05;

// Mapping of the product owner's Extreme 3D Pro in Chrome on macOS, as read in the joystick panel
// (25 Oct 2026): stick X axis 0, stick Y axis 1, twist axis 5, throttle slider axis 6 (-1 idle, +1 full).
export const DEFAULT_MAPPING = {
  roll: { axis: 0, invert: false },
  pitch: { axis: 1, invert: false }, // pulling back gives +1 on this axis
  yaw: { axis: 5, invert: false },
  throttle: { axis: 6, invert: false },
};

function loadMapping() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.roll && saved.pitch && saved.yaw && saved.throttle) return saved;
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

  /** Writes stick, rudder and (once moved) throttle into the control input. */
  update(input) {
    if (!this.poll()) return false;
    input.roll = clamp(shape(this.read('roll')), -1, 1);
    input.pitch = clamp(shape(this.read('pitch')), -1, 1);
    input.yaw = clamp(shape(this.read('yaw')), -1, 1);
    const slider = this.read('throttle');
    if (this.throttleStart === null) this.throttleStart = slider;
    if (Math.abs(slider - this.throttleStart) > 0.05) this.throttleLive = true;
    if (this.throttleLive) input.throttle = clamp((slider + 1) / 2, 0, 1);
    return true;
  }
}
