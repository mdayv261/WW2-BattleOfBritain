// Making an AI pilot for a role (Phase 6, D79, D81, D83): fighters and escorts fly src/ai/fighter.js's tactics, bombers
// src/ai/bomber.js's routes and formations.

import { FighterPilot } from './fighter.js';
import { BomberPilot } from './bomber.js';

/** An AI pilot: role 'fighter', 'escort' (keeps station until enemies come near its bombers) or 'bomber'. */
export const createPilot = (options) => (options.role === 'bomber' ? new BomberPilot(options) : new FighterPilot(options));
