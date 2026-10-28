// Formations (Phase 6, D78, D81): the places each aircraft keeps from its leader, with the spacing of D78 (the escort's
// from S38, the rest estimates): the RAF vic of three and line astern, the Luftwaffe Rotte and Schwarm, the He 111
// Kette. In a fight a wingman leaves his place to cover his leader from behind and to one side.

import { common } from '../aircraft/common.js';

const F = common.formations;
// Places in each formation: { side (m, + right), back (m), up (m) } from the leader.
export const FORMATIONS = {
  single: [{}],
  rotte: [{}, { side: F.rotte.side, back: F.rotte.back }],
  schwarm: [{}, { side: F.rotte.side, back: F.rotte.back }, { side: -F.schwarm.side, back: F.rotte.back / 2 },
    { side: -F.schwarm.side - F.rotte.side, back: F.rotte.back * 1.5 }],
  vic: [{}, { side: -F.vic.side, back: F.vic.back }, { side: F.vic.side, back: F.vic.back }],
  lineAstern: [{}, { back: F.lineAstern.back }, { back: 2 * F.lineAstern.back }, { back: 3 * F.lineAstern.back }],
  kette: [{}, { side: -F.kette.side, back: F.kette.back }, { side: F.kette.side, back: F.kette.back }],
};

/** Where a wingman covers his leader in a fight (game design, D81): behind him on his quarter, a little higher. */
export const COVER = { back: 200, side: 150, up: 50 };
