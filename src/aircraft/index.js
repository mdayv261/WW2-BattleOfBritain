// The aircraft the player can fly in Phase 1, and the engines they use.
import { spitfire } from './spitfire.js';
import { hurricane } from './hurricane.js';
import { bf109e4 } from './bf109e4.js';
import { merlin3 } from './merlin3.js';
import { db601a } from './db601a.js';

export const aircraftList = [hurricane, spitfire, bf109e4];
export const engines = { merlin3, db601a };
export const aircraftById = Object.fromEntries(aircraftList.map((a) => [a.id, a]));
export const engineFor = (ac) => engines[ac.engine];
