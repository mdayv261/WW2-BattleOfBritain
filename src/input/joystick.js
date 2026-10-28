// Joystick support through the Gamepad API (Logitech Extreme 3D Pro): stick, twist rudder, throttle
// slider, the hat (to look around) and buttons (elevator trim, brakes, flaps, undercarriage, view). Phase 8
// adds the full rebinding screen.
//
// Axis numbers differ between browsers and systems, so the mapping is editable in the joystick panel
// (J) and kept in this browser's storage. The stick and rudder are used as soon as a joystick is
// connected; the throttle slider only after it is first moved in each flight, so a parked slider does not snap the
// throttle away from the keyboard setting or the start's (D84).
//
// Neutral calibration (D70): a stick whose axis does not read 0 when centred (the product owner's twist read 0.15
// hands off) can have its centre set in the panel, for axes 0-5. The axis then reads 0 there and still reaches ±1 at
// full travel each way.
//
// Sensitivity (D71): roll, pitch and rudder each have a response curve, output = sign(x)·|x|^k after the dead zone.
// A lower sensitivity softens small stick movements; full stick always gives full control, so no aircraft loses any
// control travel.
//
// Dead zone (D72): each flight axis has its own band around neutral that gives no input (5% unless chosen), for a
// stick that does not settle in the same place each time it is let go (the product owner's twist rests anywhere from
// 0.00 to 0.17). Outside the band the travel is stretched, so full stick still gives full control.

import { clamp } from '../physics/interp.js';
import { stepFlaps } from './keyboard.js';

const STORAGE_KEY = 'bob1940.joystick';
const DEADZONE = 0.05; // the default dead zone
export const DEADZONES = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3]; // dead zone choices for the flight axes (D72)
export const CALIBRATED_AXES = [0, 1, 2, 3, 4, 5]; // the stick, twist and spare axes; not the slider (6) or hat (9)
// Sensitivity choices for the flight-control axes: the curve's exponent k (feel choices, not aircraft data).
export const SENSITIVITIES = [['Very high', 0.6], ['High', 0.8], ['Normal', 1], ['Low', 1.5], ['Lower', 2], ['Lowest', 2.5]];
export const FLIGHT_AXES = ['roll', 'pitch', 'yaw'];

// Mapping of the product owner's Extreme 3D Pro in Chrome on macOS, as set in the joystick panel
// (25 Oct 2026): stick X axis 0, stick Y axis 1, twist axis 5, throttle slider axis 6 (reversed), hat axis 9.
// Buttons are numbered from 0 here, one less than the number the J panel shows (the number printed on the
// stick). By the panel's numbers: trim nose up 5, trim nose down 3, flaps up 4, flaps down 6, brakes 12,
// undercarriage 11, cockpit view 10; the trigger (1) fires the machine guns and the thumb button (2) the cannon (D67);
// button 8, held, bails out (D80).
export const MAPPING_VERSION = 4;
export const DEFAULT_MAPPING = {
  version: MAPPING_VERSION,
  roll: { axis: 0, invert: false, curve: 1, deadzone: DEADZONE },
  pitch: { axis: 1, invert: false, curve: 1, deadzone: DEADZONE }, // pulling back gives +1 on this axis
  yaw: { axis: 5, invert: false, curve: 1, deadzone: DEADZONE },
  throttle: { axis: 6, invert: true },
  hat: { axis: 9 },
  buttons: { trimUp: 4, trimDown: 2, flapsUp: 3, flapsDown: 5, brake: 11, gear: 10, view: 9, fireMg: 0, fireCannon: 1, bailOut: 7 },
  centres: {}, // the reading of each calibrated axis at its neutral, by axis number (D70)
};

/**
 * A raw axis reading made to read 0 at its centre c: each side is stretched separately, so full travel still reaches
 * -1 and +1.
 */
export function centred(v, c = 0) {
  if (!c) return v;
  return v >= c ? (v - c) / (1 - c) : (v - c) / (1 + c);
}

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
      // Mappings saved before the version 2 button layout keep their axes but take the new hat and buttons; later ones
      // keep their buttons and gain any added since (the firing buttons in version 3, bail out in version 4).
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

/** An axis reading with a dead zone of `dz` about its neutral: 0 inside, the rest of the travel stretched to ±1. */
export const shape = (v, dz = DEADZONE) => (Math.abs(v) < dz ? 0 : Math.sign(v) * ((Math.abs(v) - dz) / (1 - dz)));

/** A flight-control input (-1 to 1, after the dead zone) through the sensitivity curve of exponent k. */
export const sensitivity = (v, k = 1) => Math.sign(v) * Math.abs(v) ** k;

export class Joystick {
  constructor() {
    this.mapping = loadMapping();
    this.pad = null;
    this.throttleLive = false;
    this.throttleStart = null;
    this.wasPressed = {};
    this.output = { roll: 0, pitch: 0, yaw: 0 }; // what the flight controls last received, for the panel
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

  /** A raw axis's reading, calibrated to its stored neutral. */
  axis(i) {
    const v = this.pad?.axes[i] ?? 0;
    return CALIBRATED_AXES.includes(i) ? centred(v, this.mapping.centres?.[i]) : v;
  }

  read(name) {
    const m = this.mapping[name];
    const v = this.axis(m.axis);
    return m.invert ? -v : v;
  }

  /** Takes an axis's present reading (hands off) as its neutral, and saves it (kept within ±0.9, so each side keeps
   * some travel to stretch). */
  setCentre(i) {
    const v = this.pad?.axes[i];
    if (v === undefined || !CALIBRATED_AXES.includes(i)) return;
    this.mapping.centres = { ...this.mapping.centres, [i]: Math.max(-0.9, Math.min(0.9, v)) };
    this.saveMapping();
  }

  /** Removes every stored neutral, and saves. */
  clearCentres() {
    this.mapping.centres = {};
    this.saveMapping();
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
    // A new flight (a restart, start or aircraft makes a new input) keeps its own throttle until the slider is moved
    // again (D84): a slider parked away from it does not snap the start out of trim.
    if (input !== this.flight) {
      this.flight = input;
      this.throttleLive = false;
      this.throttleStart = null;
    }
    for (const name of FLIGHT_AXES) {
      const m = this.mapping[name];
      input[name] = sensitivity(clamp(shape(this.read(name), m.deadzone ?? DEADZONE), -1, 1), m.curve ?? 1);
      this.output[name] = input[name];
    }
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
    if (this.held('bailOut')) input.bailOut = true;
    return { hat: hatDirection(this.pad.axes[this.mapping.hat.axis]), view: this.pressed('view') };
  }
}
