// Typing in a text box (the Multiplayer screen's name and room code, D245): the keys are the box's, not the aircraft's,
// and the browser's typing is not stopped.
import { describe, it, expect } from 'vitest';
import { Keyboard, typing } from '../../src/input/keyboard.js';

const key = (code, target) => {
  const e = { code, target, repeat: false, metaKey: false, ctrlKey: false, shiftKey: false, stopped: false };
  e.preventDefault = () => { e.stopped = true; };
  return e;
};

describe('typing in a text box', () => {
  it('knows a text box from the rest of the page', () => {
    expect(typing(key('KeyA', { tagName: 'INPUT', type: 'text' }))).toBe(true);
    expect(typing(key('KeyA', { tagName: 'INPUT', type: 'number' }))).toBe(true);
    expect(typing(key('KeyA', { tagName: 'TEXTAREA' }))).toBe(true);
    expect(typing(key('KeyA', { tagName: 'INPUT', type: 'checkbox' }))).toBe(false);
    expect(typing(key('KeyA', { tagName: 'CANVAS' }))).toBe(false);
    expect(typing(key('KeyA', null))).toBe(false);
  });

  it('a key typed in a box neither flies the aircraft nor is stopped; elsewhere it flies as before', () => {
    const kb = new Keyboard(null);
    const box = { tagName: 'INPUT', type: 'text' };
    for (const code of ['KeyM', 'Space', 'Backspace', 'ArrowLeft']) {
      const e = key(code, box);
      kb.keyDown(e);
      expect(e.stopped, code).toBe(false);
    }
    expect(kb.down.size).toBe(0);
    expect(kb.pressed.size).toBe(0);
    const e = key('Space', { tagName: 'CANVAS' });
    kb.keyDown(e);
    expect(e.stopped).toBe(true);
    expect(kb.down.has('Space')).toBe(true);
  });
});
