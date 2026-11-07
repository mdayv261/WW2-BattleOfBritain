// npm run duels: does skill tell? (Phase 6 checkpoint 5, D216-D218). Seeded one-against-one AI fights on the full
// flight model (src/dev/duels.js), in the match-ups the game has: each skill of one type against a Regular of the
// other side, each side starting 1,000 m higher in turn, at about 20,000 ft (HIGH), then low (2,000 m) for comparison.
// Each row gives the varied pilot's wins / losses / draws and the hits he gave and took; most fights end undecided
// after three minutes, so the hits tell skill more surely than the wins.

import { duelSeries, HIGH } from '../src/dev/duels.js';
import { SKILLS } from '../src/ai/skill.js';

const SEEDS = 20;
const LEVELS = ['novice', 'regular', 'ace'];
const GROUPS = [
  ['bf109e4', 'spitfire', false], ['bf109e4', 'hurricane', false],
  ['spitfire', 'bf109e4', true], ['hurricane', 'bf109e4', true],
];
const name = (k) => SKILLS[k].name.padEnd(7);
const pad = (n, w = 3) => String(n).padStart(w);

/** `id` at `skill` against a Regular `foe` (the RAF fighter is always A), at `altitude`. */
function row(id, skill, foe, raf, altitude) {
  const s = raf ? duelSeries(id, skill, foe, 'regular', SEEDS, { altitude }) : duelSeries(foe, 'regular', id, skill, SEEDS, { altitude });
  return raf ? { won: s.a, lost: s.b, draws: s.draws, given: s.hitsOnB, taken: s.hitsOnA }
    : { won: s.b, lost: s.a, draws: s.draws, given: s.hitsOnA, taken: s.hitsOnB };
}

/** The table at `altitude` (m, or the duels' default), with whether the hits rise from Novice to Ace in each group. */
function table(title, altitude) {
  console.log(`\n${title}: each skill against a Regular of the other side, ${SEEDS} fights each, each side higher in turn`);
  console.log('(the varied pilot\'s wins / losses / draws; hits given / taken):');
  for (const [id, foe, raf] of GROUPS) {
    console.log(`  ${id} against a Regular ${foe}:`);
    const net = LEVELS.map((skill) => {
      const r = row(id, skill, foe, raf, altitude);
      console.log(`    ${name(skill)} ${pad(r.won, 2)} / ${pad(r.lost, 2)} / ${pad(r.draws, 2)}   hits ${pad(r.given)} / ${pad(r.taken)}`);
      return r.given - r.taken;
    });
    console.log(`    net hits ${net[0] < net[1] && net[1] < net[2] ? 'rise' : 'DO NOT rise'} Novice < Regular < Ace`);
  }
}

table(`At ${HIGH} m`, HIGH);
table('Low, at 2,000 m, for comparison');

console.log(`\nFor interest, at Regular, at ${HIGH} m, ${SEEDS} fights each (RAF wins / Luftwaffe wins / draws):`);
for (const [raf, lw] of [['spitfire', 'bf110c4'], ['hurricane', 'bf110c4']]) {
  const s = duelSeries(raf, 'regular', lw, 'regular', SEEDS, { altitude: HIGH });
  console.log(`  ${raf.padEnd(9)} v ${lw.padEnd(8)}  ${s.a} / ${s.b} / ${s.draws}`);
}
