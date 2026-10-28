// Making an AI pilot for a role (Phase 6, D79, D81): fighters and escorts fly src/ai/fighter.js's tactics; bombers fly
// the first behaviours of src/ai/basic.js until checkpoint 4 gives them routes and gunners.

import { createBasicPilot } from './basic.js';
import { FighterPilot } from './fighter.js';

/** An AI pilot: role 'fighter', 'escort' (keeps station until enemies come near its bombers) or 'bomber'. */
export const createPilot = (options) => (options.role === 'bomber' ? createBasicPilot(options) : new FighterPilot(options));
