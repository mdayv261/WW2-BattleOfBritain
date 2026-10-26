// The aircraft in the test version (Phase 3 adds the Bf 110 and the He 111), and the engines they use.
import { spitfire } from './spitfire.js';
import { hurricane } from './hurricane.js';
import { bf109e4 } from './bf109e4.js';
import { bf110c4 } from './bf110c4.js';
import { he111h } from './he111h.js';
import { merlin3 } from './merlin3.js';
import { db601a } from './db601a.js';
import { jumo211f } from './jumo211f.js';

export const aircraftList = [hurricane, spitfire, bf109e4, bf110c4, he111h];
export const engines = { merlin3, db601a, jumo211f };
export const aircraftById = Object.fromEntries(aircraftList.map((a) => [a.id, a]));
export const engineFor = (ac) => engines[ac.engine];
