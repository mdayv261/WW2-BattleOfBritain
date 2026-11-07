// Skill tells (Phase 6 checkpoint 5, D217), in the match-ups the game has: an RAF Ace does more damage to the same
// Regular Bf 109 than an RAF Novice does, over six seeded duels with each side starting 1,000 m higher in turn. Measured
// in hits given less hits taken: most duels end undecided after three minutes, so wins alone are too few to tell.
// The Bf 109's side is not yet tested: at any skill it lands almost no hits on a +12 lb RAF fighter (D217, open).
import { describe, it, expect } from 'vitest';
import { duel, EDGE } from '../../src/dev/duels.js';

const SEEDS = [1, 2, 3, 4, 5, 6];

/** Hits the RAF `id` at `skill` gives a Regular Bf 109, less the hits it takes, over SEEDS. */
const netHits = (id, skill) => SEEDS.reduce((sum, seed) => {
  const d = duel(id, skill, 'bf109e4', 'regular', seed, { up: seed % 2 ? EDGE : -EDGE });
  return sum + d.hitsOnB - d.hitsOnA;
}, 0);

describe('skill tells', () => {
  for (const id of ['spitfire', 'hurricane']) {
    it(`a ${id} Ace does more damage to a Regular Bf 109 than a ${id} Novice`, () => {
      const ace = netHits(id, 'ace');
      expect(ace).toBeGreaterThan(0);
      expect(ace).toBeGreaterThan(netHits(id, 'novice'));
    });
  }
});
