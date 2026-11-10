// The player's settings (Phase 7 checkpoint 6, D232), kept in the browser's storage: the sound volume, the graphics
// level, the modern HUD in the cockpit, and the assists (each off unless switched on, D16). Storage that is missing,
// blocked or holds something unreadable gives the defaults, and the game carries on without saving (as the career,
// src/core/career.js). Sound on or off keeps its own key (D231).

import { browserStorage } from './career.js';
import { NO_ASSISTS } from './assists.js';

export const SETTINGS_KEY = 'bob1940.settings';
export const GRAPHICS_LEVELS = ['low', 'medium', 'high'];

export const DEFAULT_SETTINGS = Object.freeze({ volume: 80, graphics: 'high', hudInCockpit: false, assists: NO_ASSISTS });

/** A settings object made sound: every field present and of the right kind, else its default. */
export function cleanSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const volume = Number(s.volume);
  return {
    volume: Number.isFinite(volume) ? Math.min(100, Math.max(0, Math.round(volume))) : DEFAULT_SETTINGS.volume,
    graphics: GRAPHICS_LEVELS.includes(s.graphics) ? s.graphics : DEFAULT_SETTINGS.graphics,
    hudInCockpit: s.hudInCockpit === true,
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
