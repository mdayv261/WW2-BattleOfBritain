// Key bindings (Phase 8 checkpoint 1, D238; GAME_SPEC §5: every control rebindable). Each action the keyboard does has
// an id, a label, a group, whether it is held or pressed, and its keys; a key is a KeyboardEvent code with an optional
// Shift ("Shift+KeyF"). The defaults are the keys the game has always used, so nothing changes until the player
// rebinds. The player's keys are kept in the browser's storage; anything unreadable, or two actions on one key, gives
// the defaults. Not rebindable: Esc (the pause menu, and the browser's own release of the mouse) and the test flight's
// test keys (aircraft 1-5, R, N, 6-0, 9: test tools).

import { browserStorage } from '../core/career.js';

export const KEYS_KEY = 'bob1940.keys';
const VERSION = 1;

/** Every rebindable action: [id, label, group, kind ('hold' or 'press'), default keys]. */
const LIST = [
  ['pitchDown', 'Stick forward (nose down)', 'Flight', 'hold', ['ArrowUp']],
  ['pitchUp', 'Stick back (nose up)', 'Flight', 'hold', ['ArrowDown']],
  ['rollLeft', 'Roll left', 'Flight', 'hold', ['ArrowLeft']],
  ['rollRight', 'Roll right', 'Flight', 'hold', ['ArrowRight']],
  ['yawLeft', 'Rudder left', 'Flight', 'hold', ['KeyZ']],
  ['yawRight', 'Rudder right', 'Flight', 'hold', ['KeyX']],
  ['trimUp', 'Elevator trim nose up', 'Flight', 'hold', ['KeyT']],
  ['trimDown', 'Elevator trim nose down', 'Flight', 'hold', ['KeyG']],
  ['rudderTrimLeft', 'Rudder trim left', 'Flight', 'hold', ['Comma']],
  ['rudderTrimRight', 'Rudder trim right', 'Flight', 'hold', ['Period']],
  ['flapsDown', 'Flaps down a stop', 'Flight', 'press', ['KeyF']],
  ['flapsUp', 'Flaps up a stop', 'Flight', 'press', ['Shift+KeyF']],
  ['gear', 'Undercarriage', 'Flight', 'press', ['KeyU']],
  ['brakes', 'Brakes (hold)', 'Flight', 'hold', ['KeyB']],
  ['throttleUp', 'Throttle open', 'Engine', 'hold', ['KeyW']],
  ['throttleDown', 'Throttle close', 'Engine', 'hold', ['KeyS']],
  ['rpmUp', 'rpm lever up / pitch finer', 'Engine', 'hold', ['KeyE']],
  ['rpmDown', 'rpm lever down / pitch coarser', 'Engine', 'hold', ['KeyD']],
  ['radiator', 'Radiator open / shut', 'Engine', 'press', ['KeyO']],
  ['boost', '+12 lb boost cut-out (RAF)', 'Engine', 'press', ['KeyQ']],
  ['autoPitch', 'Automatic pitch (Bf 109)', 'Engine', 'press', ['KeyA']],
  ['pitchSwitch', 'Pitch switch Automatik / Hand (Bf 110)', 'Engine', 'press', ['Shift+KeyP']],
  ['engineSelect', 'Engines the levers move (twins)', 'Engine', 'press', ['KeyK']],
  ['engineStart', 'Start / stop engine', 'Engine', 'press', ['KeyL']],
  ['feather', 'Feather (twins)', 'Engine', 'press', ['KeyM']],
  ['fireMg', 'Fire machine guns', 'Weapons', 'hold', ['Space']],
  ['fireCannon', 'Fire cannon', 'Weapons', 'hold', ['Enter', 'NumpadEnter']],
  ['cockpit', 'Cockpit / outside view', 'Views', 'press', ['KeyC']],
  ['outside', 'Next outside view', 'Views', 'press', ['KeyV']],
  ['instruments', 'Instruments on / off', 'Views', 'press', ['KeyI']],
  ['lookLeft', 'Look left (hold)', 'Views', 'hold', ['Numpad4']],
  ['lookRight', 'Look right (hold)', 'Views', 'hold', ['Numpad6']],
  ['lookBack', 'Look behind (hold)', 'Views', 'hold', ['Numpad2']],
  ['lookUp', 'Look up (hold)', 'Views', 'hold', ['Numpad8']],
  ['seat', 'Bf 110: pilot / rear gun', 'Game', 'press', ['Tab']],
  ['bailOut', 'Bail out (hold 1 s)', 'Game', 'hold', ['Backspace']],
  ['target', 'Next target (F3)', 'Game', 'press', ['KeyY']],
  ['physicsPause', 'Freeze the flight', 'Game', 'press', ['KeyP']],
  ['help', 'This key list', 'Game', 'press', ['KeyH']],
  ['joystickPanel', 'Joystick panel', 'Game', 'press', ['KeyJ']],
  ['strip', 'Text readout', 'Game', 'press', ['F2']],
  ['debug', 'Debug overlay', 'Game', 'press', ['F3']],
  ['radar', 'Radar (RAF)', 'Game', 'press', ['F4']],
];

export const ACTIONS = LIST.map(([id, label, group, kind, keys]) => ({ id, label, group, kind, keys }));
export const GROUPS = ['Flight', 'Engine', 'Weapons', 'Views', 'Game'];
const byId = new Map(ACTIONS.map((a) => [a.id, a]));
/** Keys that can't be bound: Esc and the modifier keys themselves. */
export const RESERVED = new Set(['Escape', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);

const defaults = () => Object.fromEntries(ACTIONS.map((a) => [a.id, [...a.keys]]));

/** A key as the player reads it: "Shift+F", "↑", "Num 4", "Space". */
export function keyLabel(key) {
  const shift = key.startsWith('Shift+');
  const code = shift ? key.slice(6) : key;
  const names = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Comma: ',', Period: '.', Slash: '/', Semicolon: ';',
    Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Backquote: '`', Minus: '-', Equal: '=',
    NumpadEnter: 'Num Enter', Backspace: 'Backspace',
  };
  const name = names[code] ?? code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ');
  return shift ? `Shift+${name}` : name;
}

/** A key's combination from a keydown event: "Shift+KeyF", or "KeyF". */
export const comboOf = (e) => (e.shiftKey && !e.code.startsWith('Shift') ? `Shift+${e.code}` : e.code);

export class Bindings {
  /** `storage`: anything with getItem and setItem (localStorage, or a stand-in in the tests); null keeps them in memory. */
  constructor(storage = browserStorage()) {
    this.storage = storage;
    this.keys = this.load();
  }

  load() {
    try {
      const saved = JSON.parse(this.storage?.getItem(KEYS_KEY) ?? 'null');
      if (saved?.version === VERSION && saved.keys) {
        const keys = defaults();
        for (const [id, list] of Object.entries(saved.keys)) {
          if (byId.has(id) && Array.isArray(list) && list.every((k) => typeof k === 'string' && !RESERVED.has(k))) keys[id] = list;
        }
        if (!clash(keys)) return keys;
      }
    } catch {
      // unreadable or blocked: the defaults
    }
    return defaults();
  }

  save() {
    try {
      this.storage?.setItem(KEYS_KEY, JSON.stringify({ version: VERSION, keys: this.keys }));
    } catch {
      // storage full or blocked: the keys last until the page is closed
    }
  }

  /** The keys bound to an action. */
  of(id) {
    return this.keys[id] ?? [];
  }

  /** The action that already uses `key`, other than `except`; null if none. */
  user(key, except = null) {
    for (const [id, list] of Object.entries(this.keys)) if (id !== except && list.includes(key)) return id;
    return null;
  }

  /**
   * Binds `key` to action `id` (it then has that key alone). An action that already had the key takes `id`'s old keys
   * instead (a swap), so no key is ever bound twice. Returns the action swapped with, or null.
   */
  bind(id, key) {
    if (!byId.has(id) || RESERVED.has(key)) return null;
    const other = this.user(key, id);
    const old = this.keys[id];
    this.keys[id] = [key];
    if (other) this.keys[other] = old.filter((k) => k !== key);
    this.save();
    return other;
  }

  /** Every key back to the defaults. */
  reset() {
    this.keys = defaults();
    this.save();
  }
}

/** Whether two actions share a key. */
function clash(keys) {
  const seen = new Set();
  for (const list of Object.values(keys)) {
    for (const k of list) {
      if (seen.has(k)) return true;
      seen.add(k);
    }
  }
  return false;
}
