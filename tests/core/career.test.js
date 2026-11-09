// The player's careers (Phase 7 checkpoint 3, D229): one per side, kept in the browser's storage; a mission's kills
// add to its side only; storage that is missing, broken or full never stops the game.
import { describe, it, expect } from 'vitest';
import { Career, CAREER_KEY } from '../../src/core/career.js';

/** A stand-in for localStorage. */
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

const results = (kills, shared = 0) => ({ kills, shared });

describe('the career', () => {
  it('starts both sides at nothing, and adds a mission to its own side only', () => {
    const c = new Career(fakeStorage());
    expect(c.of('RAF')).toEqual({ kills: 0, shared: 0, missions: 0 });
    const r = c.record('RAF', results(1, 1));
    expect(c.of('RAF')).toEqual({ kills: 1, shared: 1, missions: 1 });
    expect(c.of('Luftwaffe')).toEqual({ kills: 0, shared: 0, missions: 0 });
    expect([r.before.name, r.after.name, r.promoted]).toEqual(['Pilot Officer', 'Pilot Officer', false]);
  });

  it('reports a promotion, and a mission with no kills still counts as a mission', () => {
    const c = new Career(fakeStorage());
    c.record('Luftwaffe', results(1));
    const r = c.record('Luftwaffe', results(1));
    expect([r.before.name, r.after.name, r.promoted]).toEqual(['Leutnant', 'Oberleutnant', true]);
    c.record('Luftwaffe', results(0));
    expect(c.of('Luftwaffe').missions).toBe(3);
  });

  it('is saved and read back through the storage, and reset clears both sides', () => {
    const storage = fakeStorage();
    new Career(storage).record('RAF', results(3, 2));
    const again = new Career(storage);
    expect(again.of('RAF')).toEqual({ kills: 3, shared: 2, missions: 1 });
    again.reset();
    expect(new Career(storage).of('RAF')).toEqual({ kills: 0, shared: 0, missions: 0 });
  });

  it('starts afresh from unreadable or nonsense storage, and carries on when storage throws', () => {
    expect(new Career(fakeStorage({ [CAREER_KEY]: '{not json' })).of('RAF').kills).toBe(0);
    const odd = new Career(fakeStorage({ [CAREER_KEY]: JSON.stringify({ RAF: { kills: -4, shared: 'x', missions: 2.7 } }) }));
    expect(odd.of('RAF')).toEqual({ kills: 0, shared: 0, missions: 2 });
    expect(odd.of('Luftwaffe')).toEqual({ kills: 0, shared: 0, missions: 0 });
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    const c = new Career(broken);
    expect(() => c.record('RAF', results(2))).not.toThrow();
    expect(c.of('RAF').kills).toBe(2);
    expect(new Career(null).of('Luftwaffe').missions).toBe(0);
  });
});
