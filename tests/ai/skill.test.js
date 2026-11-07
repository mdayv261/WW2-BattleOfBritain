// Skill tells (Phase 6 checkpoint 5, D217, D218), in the match-ups the game has: an RAF Ace does more damage to the
// same Regular Bf 109 than an RAF Novice does, over six seeded duels with each side starting 1,000 m higher in turn.
// Measured in hits given less hits taken: most duels end undecided after three minutes, so wins alone are too few.
// The Spitfire fights at the duels' fighting height (HIGH, about 20,000 ft); the Hurricane low (2,000 m), since at
// HIGH its skills don't separate in the 20-fight table (D218). The Bf 109's side is not tested: at any skill it lands
// almost no hits on a +12 lb RAF fighter (D217, D218, open).
import { describe, it, expect } from 'vitest';
import { duel, EDGE, HIGH } from '../../src/dev/duels.js';

const SEEDS = [1, 2, 3, 4, 5, 6];

/** Hits the RAF `id` at `skill` gives a Regular Bf 109 at `altitude` (or the low default), less the hits it takes. */
const netHits = (id, skill, altitude) => SEEDS.reduce((sum, seed) => {
  const d = duel(id, skill, 'bf109e4', 'regular', seed, { up: seed % 2 ? EDGE : -EDGE, altitude });
  return sum + d.hitsOnB - d.hitsOnA;
}, 0);

describe('skill tells', () => {
  for (const [id, altitude, where] of [['spitfire', HIGH, 'at 20,000 ft'], ['hurricane', undefined, 'low down']]) {
    it(`a ${id} Ace does more damage to a Regular Bf 109 than a ${id} Novice, ${where}`, () => {
      const ace = netHits(id, 'ace', altitude);
      expect(ace).toBeGreaterThan(0);
      expect(ace).toBeGreaterThan(netHits(id, 'novice', altitude));
    });
  }
});
