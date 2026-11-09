// The player's careers (Phase 7 checkpoint 3, D229): one for each side, { kills, shared, missions }, kept in the
// browser's storage so they last between visits. Only missions add to them, never the test flight; a mission counts
// once its results show, however it ended (the product owner: being lost doesn't cost the career anything). Storage
// that is missing, blocked or holds something unreadable just gives fresh careers; the game carries on without saving.

import { rankOf } from './ranks.js';

export const CAREER_KEY = 'bob1940.career';
const SIDES = ['RAF', 'Luftwaffe'];

const fresh = () => ({ kills: 0, shared: 0, missions: 0 });
const count = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

/** The page's localStorage, or null where there is none or it can't be reached. */
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export class Career {
  /** `storage`: anything with getItem and setItem (localStorage, or a stand-in in the tests); null keeps it in memory. */
  constructor(storage = browserStorage()) {
    this.storage = storage;
    this.sides = this.load();
  }

  load() {
    let saved = null;
    try {
      saved = JSON.parse(this.storage?.getItem(CAREER_KEY) ?? 'null');
    } catch {
      saved = null;
    }
    return Object.fromEntries(SIDES.map((side) => {
      const s = saved?.[side];
      return [side, s ? { kills: count(s.kills), shared: count(s.shared), missions: count(s.missions) } : fresh()];
    }));
  }

  save() {
    try {
      this.storage?.setItem(CAREER_KEY, JSON.stringify(this.sides));
    } catch {
      // Storage full or blocked: the career lasts until the page is closed.
    }
  }

  /** A side's record: { kills, shared, missions }. */
  of(side) {
    return this.sides[side];
  }

  /** Adds a mission's results (src/core/mission.js missionResults) to `side`'s career: { before, after, promoted }. */
  record(side, results) {
    const s = this.sides[side];
    const before = rankOf(side, s);
    s.kills += results.kills;
    s.shared += results.shared;
    s.missions += 1;
    this.save();
    const after = rankOf(side, s);
    return { before, after, promoted: after.index > before.index };
  }

  /** Both careers back to the start. */
  reset() {
    this.sides = Object.fromEntries(SIDES.map((side) => [side, fresh()]));
    this.save();
  }
}
