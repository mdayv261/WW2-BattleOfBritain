// The room server, as Cloudflare runs it (Phase 9, D244): the front door (frontDoor.js) and the Room Durable Object
// (room.js), with the map's heights bundled in (wrangler.toml's Data rule turns the .bin into an ArrayBuffer). Kept
// apart so the tests can load the other two without the bundler.

import { Room, useTerrain } from './room.js';
import { handle } from './frontDoor.js';
import terrainBytes from '../public/data/terrain.bin';

useTerrain(terrainBytes);

export { Room };
export default { fetch: (request, env) => handle(request, env) };
