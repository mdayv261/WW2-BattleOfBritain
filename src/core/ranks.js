// Ranks (Phase 7 checkpoint 3, D229): a single-player career earns rank by its kills only (D16). Each side has five
// officers' ranks (the product owner's choice), set side by side as the game's steps, not as a claim that the two
// sides' ranks were equal:
//   RAF: the Air Force List, August 1940 (S44): Pilot Officers, Flying Officers, Flight Lieutenants, Squadron Leaders,
//     Wing Commanders.
//   Luftwaffe: TM-E 30-451 (S45), par. 32d (the Air Force wears the Army's insignia of rank) and Plate VII: Leutnant,
//     Oberleutnant, Hauptmann, Major, Oberstleutnant.
// The kills each rank needs, and a shared kill counting half, are game design (D229): neither air force promoted its
// pilots by their scores.

/** The weighted kills each step needs (game design, D229). */
export const RANK_STEPS = [0, 2, 5, 10, 20];
/** What a shared kill counts for (game design, D229); damaged enemies count nothing. */
export const SHARED_WEIGHT = 0.5;

const NAMES = {
  RAF: ['Pilot Officer', 'Flying Officer', 'Flight Lieutenant', 'Squadron Leader', 'Wing Commander'], // S44
  Luftwaffe: ['Leutnant', 'Oberleutnant', 'Hauptmann', 'Major', 'Oberstleutnant'], // S45
};

/** Each side's ranks, lowest first: [{ name, kills }]. */
export const RANKS = Object.fromEntries(
  Object.entries(NAMES).map(([side, names]) => [side, names.map((name, i) => ({ name, kills: RANK_STEPS[i] }))]),
);

/** A record's weighted kills: { kills, shared } → kills + shared × SHARED_WEIGHT. */
export const weightedKills = ({ kills = 0, shared = 0 }) => kills + shared * SHARED_WEIGHT;

/** The rank a record of `side` holds: { index, name, kills }. */
export function rankOf(side, record) {
  const score = weightedKills(record);
  const ranks = RANKS[side];
  let index = 0;
  while (index + 1 < ranks.length && score >= ranks[index + 1].kills) index += 1;
  return { index, ...ranks[index] };
}

/** The next rank up and the weighted kills still to go: { name, kills, toGo }, or null at the top. */
export function nextRank(side, record) {
  const next = RANKS[side][rankOf(side, record).index + 1];
  return next ? { ...next, toGo: next.kills - weightedKills(record) } : null;
}
