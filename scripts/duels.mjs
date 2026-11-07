// npm run duels: does skill tell? (Phase 6 checkpoint 5, D216, D217). Seeded one-against-one AI fights on the full
// flight model (src/dev/duels.js), in the match-ups the game has: each skill of one type against a Regular of the
// other side, each side starting 1,000 m higher in turn. The varied pilot's score (wins - losses) should rise from
// Novice to Regular to Ace in every group.

import { duelSeries } from '../src/dev/duels.js';
import { SKILLS } from '../src/ai/skill.js';

const SEEDS = 20;
const LEVELS = ['novice', 'regular', 'ace'];
const name = (k) => SKILLS[k].name.padEnd(7);

/** Wins, losses, draws and score of `id` at `skill` against a Regular `foe` (the RAF fighter is always A). */
function row(id, skill, foe, raf) {
  const s = raf ? duelSeries(id, skill, foe, 'regular', SEEDS) : duelSeries(foe, 'regular', id, skill, SEEDS);
  const [won, lost] = raf ? [s.a, s.b] : [s.b, s.a];
  return { won, lost, draws: s.draws, score: won - lost, time: s.time };
}

console.log(`Each skill against a Regular of the other side, ${SEEDS} seeded fights each, each side higher in turn`);
console.log('(the varied pilot\'s wins / losses / draws, score, mean fight length):');
const groups = [
  ['bf109e4', 'spitfire', false], ['bf109e4', 'hurricane', false],
  ['spitfire', 'bf109e4', true], ['hurricane', 'bf109e4', true],
];
let separated = 0;
for (const [id, foe, raf] of groups) {
  console.log(`\n  ${id} against a Regular ${foe}:`);
  const scores = LEVELS.map((skill) => {
    const r = row(id, skill, foe, raf);
    console.log(`    ${name(skill)} ${String(r.won).padStart(2)} / ${String(r.lost).padStart(2)} / ${String(r.draws).padStart(2)}   score ${String(r.score).padStart(3)}   ${r.time.toFixed(0)} s`);
    return r.score;
  });
  const rises = scores[0] < scores[1] && scores[1] < scores[2];
  if (rises) separated += 1;
  console.log(`    ${rises ? 'rises Novice < Regular < Ace' : 'DOES NOT rise Novice < Regular < Ace'}`);
}
console.log(`\n${separated} of ${groups.length} groups separate the skills.`);

console.log(`\nFor interest, at Regular, ${SEEDS} fights each (RAF wins / Luftwaffe wins / draws):`);
for (const [raf, lw] of [['spitfire', 'bf110c4'], ['hurricane', 'bf110c4']]) {
  const s = duelSeries(raf, 'regular', lw, 'regular', SEEDS);
  console.log(`  ${raf.padEnd(9)} v ${lw.padEnd(8)}  ${s.a} / ${s.b} / ${s.draws}`);
}
