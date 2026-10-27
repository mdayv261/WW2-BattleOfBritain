// AI skill levels (Phase 6, D76, D79): Novice, Regular and Ace. These are game-design settings, not aircraft data: they
// set how quickly and how well an AI pilot or gunner sees, decides and handles the controls, never what the aircraft can
// do (that is the flight model's, the same as the player's).
//   reaction     s: the other aircraft are seen as they were this long ago
//   aimError     rad: how far off a pilot's or gunner's aim wanders (a slowly changing error)
//   stickTime    s: the shortest time the stick, rudder or throttle can be moved from one end to the other
//   gShare       share of the aircraft's damage g limit (ac.limits.g.damage) the pilot will pull
//   buffet       stall share of a wing at which the pilot eases off the pull (the buffet he feels)
//   fireRange    m: the pilot opens fire within this range
//   drumFactor   multiplies the drum-change time of an experienced gunner (common.gunners.drumChange, D78)

export const SKILLS = {
  novice: { name: 'Novice', reaction: 0.6, aimError: 0.012, stickTime: 0.45, gShare: 0.7, buffet: 0.05, fireRange: 250, drumFactor: 2.0 },
  regular: { name: 'Regular', reaction: 0.35, aimError: 0.006, stickTime: 0.3, gShare: 0.85, buffet: 0.12, fireRange: 350, drumFactor: 1.4 },
  ace: { name: 'Ace', reaction: 0.2, aimError: 0.0025, stickTime: 0.2, gShare: 1.0, buffet: 0.25, fireRange: 400, drumFactor: 1.0 },
};

export const SKILL_ORDER = ['novice', 'regular', 'ace'];

/** The skill after `key`, in turn (key 8). */
export const nextSkill = (key) => SKILL_ORDER[(SKILL_ORDER.indexOf(key) + 1) % SKILL_ORDER.length];
