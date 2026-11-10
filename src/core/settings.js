// The player's settings (Phase 7 checkpoint 6, D232), kept in the browser's storage: the sound volume and the engines'
// volume within it (D234), the graphics level, the modern HUD in the cockpit, the enemy pointers (D235), and the
// assists (each off unless switched on, D16). Storage that is missing, blocked or holds something unreadable gives the defaults, and the game carries on
// without saving (as the career, src/core/career.js). Sound on or off keeps its own key (D231).

import { browserStorage } from './career.js';
import { NO_ASSISTS } from './assists.js';

export const SETTINGS_KEY = 'bob1940.settings';
export const GRAPHICS_LEVELS = ['low', 'medium', 'high'];

export const DEFAULT_SETTINGS = Object.freeze({
  volume: 80, engineVolume: 25, graphics: 'high', hudInCockpit: false, enemyPointers: true, assists: NO_ASSISTS,
});

/** A settings object made sound: every field present and of the right kind, else its default. */
export function cleanSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const percent = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.min(100, Math.max(0, Math.round(Number(v)))) : d);
  return {
    volume: percent(s.volume, DEFAULT_SETTINGS.volume),
    engineVolume: percent(s.engineVolume, DEFAULT_SETTINGS.engineVolume), // the engines' share (D234: 25% by default)
    graphics: GRAPHICS_LEVELS.includes(s.graphics) ? s.graphics : DEFAULT_SETTINGS.graphics,
    hudInCockpit: s.hudInCockpit === true,
    enemyPointers: s.enemyPointers !== false, // the red arrowheads for enemies within 5 km (D235): on unless switched off
    assists: Object.fromEntries(Object.keys(NO_ASSISTS).map((k) => [k, s.assists?.[k] === true])),
  };
}

export class Settings {
  /** `storage`: anything with getItem and setItem (localStorage, or a stand-in in the tests); null keeps them in memory. */
  constructor(storage = browserStorage()) {
    this.storage = storage;
    let saved = null;
    try {
      saved = JSON.parse(this.storage?.getItem(SETTINGS_KEY) ?? 'null');
    } catch {
      saved = null;
    }
    this.values = cleanSettings(saved);
  }

  /** Changes some settings ({ key: value }, or { assists: { name: on } }) and saves them. */
  set(changes) {
    const assists = { ...this.values.assists, ...(changes.assists ?? {}) };
    this.values = cleanSettings({ ...this.values, ...changes, assists });
    try {
      this.storage?.setItem(SETTINGS_KEY, JSON.stringify(this.values));
    } catch {
      // Storage full or blocked: the settings last until the page is closed.
    }
    return this.values;
  }
}
