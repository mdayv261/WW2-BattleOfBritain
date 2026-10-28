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
//   sighting     m: how far off he spots another aircraft (not under his own tail) (D81)
//   notice       chance he notices an enemy settling on his tail (checked every NOTICE_EVERY s) (D81)
//   minSpeed     m/s: in a turning fight he won't pull so hard as to slow below this (0: he bleeds his speed away)
//   stay         s: how long he will fight on out-matched, with enemies behind him, before he breaks off for home
//   gunRange     m: an air gunner opens fire within this range (D83)

export const SKILLS = {
  novice: {
    name: 'Novice', reaction: 0.6, aimError: 0.012, stickTime: 0.45, gShare: 0.7, buffet: 0.05, fireRange: 250, drumFactor: 2.0,
    sighting: 2500, notice: 0.3, minSpeed: 0, stay: 10, gunRange: 450,
  },
  regular: {
    name: 'Regular', reaction: 0.35, aimError: 0.006, stickTime: 0.3, gShare: 0.85, buffet: 0.12, fireRange: 350, drumFactor: 1.4,
    sighting: 4000, notice: 0.7, minSpeed: 75, stay: 20, gunRange: 550,
  },
  ace: {
    name: 'Ace', reaction: 0.2, aimError: 0.0025, stickTime: 0.2, gShare: 1.0, buffet: 0.25, fireRange: 400, drumFactor: 1.0,
    sighting: 5500, notice: 1.0, minSpeed: 90, stay: 40, gunRange: 650,
  },
};

export const SKILL_ORDER = ['novice', 'regular', 'ace'];

/** The skill after `key`, in turn (key 8). */
export const nextSkill = (key) => SKILL_ORDER[(SKILL_ORDER.indexOf(key) + 1) % SKILL_ORDER.length];
