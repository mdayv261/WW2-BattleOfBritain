// Key bindings (Phase 8 checkpoint 1, D238): the defaults are the game's own keys; a key rebound drives its action in
// flight; a key in use is swapped, never doubled; the keys survive a reload, and bad storage gives the defaults; Shift
// combinations are their own keys; joystick buttons swap too.
import { describe, it, expect } from 'vitest';
import { Bindings, ACTIONS, KEYS_KEY, keyLabel } from '../../src/input/bindings.js';
import { Keyboard } from '../../src/input/keyboard.js';
import { assignButton, JOY_BUTTONS } from '../../src/ui/controlsScreen.js';
import { DEFAULT_MAPPING } from '../../src/input/joystick.js';
import { aircraftById } from '../../src/aircraft/index.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

/** A keyboard on its own bindings, fed key events directly. */
function keyboard(bindings = new Bindings(fakeStorage())) {
  const kb = new Keyboard(null, bindings);
  const send = (code, shiftKey = false) => kb.keyDown({ code, shiftKey, repeat: false });
  return { kb, bindings, tap: (code, shift) => { send(code, shift); kb.down.delete(code); }, hold: (code) => send(code), let: (code) => kb.down.delete(code) };
}

const input = () => ({ pitch: 0, roll: 0, yaw: 0, throttle: 0.5, trim: 0, rpm: 1, flaps: 0, gear: 1, radiator: 0 });

describe('key bindings', () => {
  it('start as the game\'s own keys, every key used once', () => {
    const b = new Bindings(fakeStorage());
    expect(b.of('pitchUp')).toEqual(['ArrowDown']);
    expect(b.of('flapsUp')).toEqual(['Shift+KeyF']);
    expect(b.of('fireCannon')).toEqual(['Enter', 'NumpadEnter']);
    expect(b.of('seat')).toEqual(['Tab']);
    const all = ACTIONS.flatMap((a) => b.of(a.id));
    expect(new Set(all).size).toBe(all.length);
    expect(keyLabel('Shift+KeyF')).toBe('Shift+F');
    expect(keyLabel('Numpad4')).toBe('Num 4');
  });

  it('a key rebound drives its action in flight, and the old key no longer does', () => {
    const { kb, bindings, tap, hold } = keyboard();
    bindings.bind('gear', 'KeyG'); // G was elevator trim down: swapped, trim down now on U
    expect(bindings.of('trimDown')).toEqual(['KeyU']);
    const i = input();
    tap('KeyG');
    kb.update(i, aircraftById.spitfire, 1 / 60);
    expect(i.gear).toBe(0);
    hold('KeyU');
    kb.update(i, aircraftById.spitfire, 1 / 60);
    expect(i.gear).toBe(0); // U is trim now, not the undercarriage
    expect(i.trim).toBeLessThan(0);
  });

  it('a key in use is swapped, never bound twice; Esc and Shift alone can\'t be bound', () => {
    const b = new Bindings(fakeStorage());
    expect(b.bind('fireMg', 'KeyW')).toBe('throttleUp');
    expect(b.of('fireMg')).toEqual(['KeyW']);
    expect(b.of('throttleUp')).toEqual(['Space']);
    expect(b.bind('fireMg', 'Escape')).toBeNull();
    expect(b.of('fireMg')).toEqual(['KeyW']);
    const all = ACTIONS.flatMap((a) => b.of(a.id));
    expect(new Set(all).size).toBe(all.length);
  });

  it('Shift combinations are their own keys: Shift+F raises the flaps, F lowers them', () => {
    const { kb, tap } = keyboard();
    const i = input();
    tap('KeyF');
    kb.update(i, aircraftById.bf109e4, 1 / 60);
    expect(i.flaps).toBe(0.25);
    tap('KeyF', true);
    kb.update(i, aircraftById.bf109e4, 1 / 60);
    expect(i.flaps).toBe(0);
  });

  it('survive a reload; a reset restores the defaults; bad or clashing storage gives the defaults', () => {
    const storage = fakeStorage();
    new Bindings(storage).bind('radar', 'KeyR');
    expect(new Bindings(storage).of('radar')).toEqual(['KeyR']);
    const again = new Bindings(storage);
    again.reset();
    expect(new Bindings(storage).of('radar')).toEqual(['F4']);
    expect(new Bindings(fakeStorage({ [KEYS_KEY]: '{oops' })).of('radar')).toEqual(['F4']);
    const clashing = JSON.stringify({ version: 1, keys: { radar: ['KeyW'] } }); // W is the throttle's
    expect(new Bindings(fakeStorage({ [KEYS_KEY]: clashing })).of('radar')).toEqual(['F4']);
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    expect(() => new Bindings(broken).bind('radar', 'KeyR')).not.toThrow();
  });

  it('a joystick button given to an action swaps with the action that had it', () => {
    const mapping = structuredClone(DEFAULT_MAPPING);
    const gear = mapping.buttons.gear;
    expect(assignButton(mapping, 'fireMg', gear)).toBe('gear');
    expect(mapping.buttons.fireMg).toBe(gear);
    expect(mapping.buttons.gear).toBe(DEFAULT_MAPPING.buttons.fireMg);
    for (const name of Object.values(JOY_BUTTONS)) expect(name in DEFAULT_MAPPING.buttons).toBe(true);
  });
});
