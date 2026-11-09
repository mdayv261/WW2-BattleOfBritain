// Ranks (Phase 7 checkpoint 3, D229): five officers' ranks for each side, named from S44 (the Air Force List, August
// 1940) and S45 (TM-E 30-451), earned by weighted kills: a kill counts 1, a shared kill half.
import { describe, it, expect } from 'vitest';
import { RANKS, RANK_STEPS, SHARED_WEIGHT, rankOf, nextRank, weightedKills } from '../../src/core/ranks.js';

describe('ranks', () => {
  it('each side has five officers\' ranks, as sourced, on the same rising steps', () => {
    expect(RANKS.RAF.map((r) => r.name)).toEqual(['Pilot Officer', 'Flying Officer', 'Flight Lieutenant', 'Squadron Leader', 'Wing Commander']);
    expect(RANKS.Luftwaffe.map((r) => r.name)).toEqual(['Leutnant', 'Oberleutnant', 'Hauptmann', 'Major', 'Oberstleutnant']);
    for (const side of ['RAF', 'Luftwaffe']) expect(RANKS[side].map((r) => r.kills)).toEqual(RANK_STEPS);
    expect(RANK_STEPS[0]).toBe(0);
    for (let i = 1; i < RANK_STEPS.length; i += 1) expect(RANK_STEPS[i]).toBeGreaterThan(RANK_STEPS[i - 1]);
  });

  it('a shared kill counts half; a career is promoted exactly at each step', () => {
    expect(SHARED_WEIGHT).toBe(0.5);
    expect(weightedKills({ kills: 1, shared: 3 })).toBe(2.5);
    expect(rankOf('RAF', { kills: 0, shared: 0 }).name).toBe('Pilot Officer');
    expect(rankOf('RAF', { kills: 1, shared: 1 }).name).toBe('Pilot Officer'); // 1.5
    expect(rankOf('RAF', { kills: 2, shared: 0 }).name).toBe('Flying Officer');
    expect(rankOf('Luftwaffe', { kills: 4, shared: 1 }).name).toBe('Oberleutnant'); // 4.5
    expect(rankOf('Luftwaffe', { kills: 4, shared: 2 }).name).toBe('Hauptmann'); // 5
    expect(rankOf('RAF', { kills: 500, shared: 0 }).name).toBe('Wing Commander');
  });

  it('gives the next rank and the kills still to go, none at the top', () => {
    expect(nextRank('RAF', { kills: 3, shared: 1 })).toEqual({ name: 'Flight Lieutenant', kills: 5, toGo: 1.5 });
    expect(nextRank('Luftwaffe', { kills: 0, shared: 0 })).toEqual({ name: 'Oberleutnant', kills: 2, toGo: 2 });
    expect(nextRank('Luftwaffe', { kills: 20, shared: 0 })).toBeNull();
  });
});
