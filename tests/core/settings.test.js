// The player's settings (Phase 7 checkpoint 6, D232): the defaults (every assist off, D16), kept in the browser's
// storage, and storage that is missing, broken or full never stopping the game.
import { describe, it, expect } from 'vitest';
import { Settings, SETTINGS_KEY, DEFAULT_SETTINGS, cleanSettings } from '../../src/core/settings.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

describe('the settings', () => {
  it('start with every assist off, High graphics, no HUD in the cockpit and the volume at 80%', () => {
    const s = new Settings(fakeStorage());
    expect(s.values).toEqual({ volume: 80, engineVolume: 25, graphics: 'high', hudInCockpit: false, enemyPointers: true, mouseFlight: false, mouseSensitivity: 'medium', assists: { autoRudder: false, stallWarning: false, gWarning: false, engineManagement: false } });
    expect(cleanSettings(null)).toEqual(s.values);
    expect(DEFAULT_SETTINGS.assists.autoRudder).toBe(false);
  });

  it('are saved and read back, one assist changed without touching the others', () => {
    const storage = fakeStorage();
    const s = new Settings(storage);
    s.set({ volume: 35, graphics: 'low', engineVolume: 60, enemyPointers: false });
    s.set({ assists: { autoRudder: true } });
    s.set({ assists: { gWarning: true } });
    const again = new Settings(storage);
    expect(again.values.volume).toBe(35);
    expect(again.values.engineVolume).toBe(60);
    expect(again.values.enemyPointers).toBe(false);
    expect(again.values.graphics).toBe('low');
    expect(again.values.assists).toEqual({ autoRudder: true, stallWarning: false, gWarning: true, engineManagement: false });
  });

  it('fall back to the defaults for nonsense, unreadable or blocked storage', () => {
    const odd = new Settings(fakeStorage({ [SETTINGS_KEY]: JSON.stringify({ volume: 400, graphics: 'ultra', hudInCockpit: 'yes', assists: { autoRudder: 1 } }) }));
    expect(odd.values).toMatchObject({ volume: 100, graphics: 'high', hudInCockpit: false });
    expect(odd.values.assists.autoRudder).toBe(false);
    expect(new Settings(fakeStorage({ [SETTINGS_KEY]: '{oops' })).values.volume).toBe(80);
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    const s = new Settings(broken);
    expect(() => s.set({ volume: 10 })).not.toThrow();
    expect(s.values.volume).toBe(10);
  });
});
