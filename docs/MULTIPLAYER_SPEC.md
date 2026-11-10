# Multiplayer Specification: RAF against Luftwaffe

Status: **design, Phase 9 (10 Nov 2026, D243-D245).** Built and tested so far:
- checkpoint 1: the shared core in `src/mp/`;
- checkpoint 2: the room server in `server/`, run on this Mac;
- checkpoint 3: the browser side, `src/net/` and the screens.
The Cloudflare deployment (checkpoint 4) follows.
The design is Dawn Patrol's working multiplayer, adapted for 1940 with the product owner's approval (§9).

## 1. Goal and rules
- **Players:** 2 to 4 human players in a private room, joined by a code.
- **Teams:**
  - RAF: Hurricane Mk I, Spitfire Mk I;
  - Luftwaffe: Bf 109 E-4, Bf 110 C-4.
  Each player picks a side, then a fighter of that side. Uneven teams (1 v 2, 1 v 3) are allowed. No He 111.
- **AI only in the Bf 110, for the seat its player is not in** (product owner, 10 Nov 2026):
  - with the player at the controls, the server's AI gunner mans the rear MG 15 (`src/ai/gunner.js`, Regular);
  - with the player on the rear gun (Tab, as in single player, D234), the server's defensive AI pilot flies
    (`src/ai/defensive.js`), and the player's aim and trigger work the gun.
  The AI's rounds and kills count as the player's. There are no other AI aircraft or crew.
- **No accounts, no stored personal data.** Single player is unchanged.
- **Fair physics:** the server runs the same validated flight model for every aircraft and decides every hit.
- **Aids:** each player uses their own settings (assists, enemy pointers, mouse flying, and the RAF radar for RAF
  players). The host doesn't control them.

## 2. Approach
- **An authoritative room server:** a separate Worker, `bob1940-mp`, on Dawn Patrol's existing Cloudflare account
  (D16), with one Durable Object per room. Browsers send only their controls.
- **The game itself** stays on GitHub Pages.
- **Cost:** the room's step for four aircraft was measured at checkpoint 1 (§8).
- **Cloudflare's own limit pages** (read 10 Nov 2026):
  - a free-plan Worker gets 10 ms of CPU per request and 100,000 requests a day;
  - a Durable Object of the SQLite kind (the free plan's) gets 30 s of CPU per request or WebSocket message, and each
    message resets it. The same page also says Durable Objects follow the Workers plan's limits, so the deployment at
    checkpoint 4 is the real check;
  - a Worker may be 64 MiB uncompressed and must start within 1 s. This one is 2.1 MB (0.5 MB compressed), and its
    modules load in about 40 ms.

## 3. Network design
- **Ticks:** the server steps every aircraft at 120 Hz with the single-player simulation code (`stepAircraft`,
  `stepGuns`). The physics uses no random numbers; only hit damage does, on the server.
- **Browser to server (binary, 30 a second):**
  - four ticks of controls a message, each stamped with its tick, plus the player's "view tick" for lag compensation;
  - the controls are taken after the player's own assists, so the server needs none;
  - for the Bf 110: the seat, and on the gun, its aim and trigger;
  - each value is quantised and clamped to its legal range;
  - the server takes the controls for tick T at tick T. Late controls, and controls more than 1 s ahead, are dropped;
  - a tick with none repeats the last. After 1 s with none, the stick and rudder are centred and the throttle is kept.
- **Server to browser (binary, 30 a second):**
  - **your own aircraft:** its exact state (`src/mp/planeState.js`), so that the browser can predict on from it. This
    covers the body, control surfaces, trim, each engine's speed, pitch, slipstream, cut-out, heat and wear, ground
    contact, the fixed guns, and the damage record;
  - **the others:** 58 bytes each (position, orientation, velocity, engine rpm, flaps and gear, shots fired since the
    last snapshot, down or not);
  - "lead": how early your controls arrive, so the browser can keep its clock just ahead.
  A two-player snapshot is about 1 KB.
- **Prediction:** your own aircraft is flown in the browser, replayed from the server's state when the two differ,
  with corrections faded in over 0.15 s. A test (`tests/mp/matchSim.test.js`) shows a snapshot flown on locally with
  the same controls matches the server bit for bit.
- **Smoothing:** other aircraft are drawn 100 ms in the past (up to 200 ms on a jittery connection) and carried on for
  at most 0.5 s through a gap.
- **Hits:** decided by the server only. A round fired by a player whose screen showed the others at tick V is tested
  against them where they were then ("favour the shooter"), up to 0.4 s back. The AI gunner sees the present. Hits
  use the single-player hit zones and damage model.
- **Effects:** tracers, gun sounds and hit sparks are drawn by each browser from the snapshots:
  - your own guns fire at once, as you fly;
  - the others' guns fire, at their own rates and belts, the rounds the server reports;
  - the server's strikes show where they hit.
  No hit is decided in a browser.
- **Name tags** (product owner, 10 Nov 2026): every other player within 2 km shows a name and distance over their
  aircraft, team-mates in white and enemies in red.
- **In the page** (D245): the page's own Simulation flies your aircraft in a match, so the views, panels, sights,
  sounds, warnings, radar and pointers work as in single player. The others are single-player Crafts with no pilot.

## 4. Rooms, lobby and match
- **Room code:** 6 characters, without I, O, 0 or 1.
- **Lobby:**
  - names, teams, aircraft and ready flags;
  - joiners go to the smaller team (RAF on a tie) with its first fighter;
  - the first player is the host.
  The host's Start needs 2-4 players, all ready, and at least one on each side.
- **Host settings:**
  | Setting | Choices | Default |
  |---|---|---|
  | Start | Airfield apron, or air start at 8,000 ft 5 km from the enemy | Air |
  | Respawn | Airfield apron, or air spawn at 8,000 ft 5 km from the nearest enemy player | Air |
  | Time of day (UTC, 15 Aug 1940) | the daylight half-hours | 13:00 |
  | Score limit | 3, 5, 10, 20 | 5 |
  | Time limit | 5, 10, 15, 20 min | 10 |
  | Friendly fire | on, off | off |
  | Structural damage | on, off | on |
- **Where aircraft appear** (`src/mp/spawn.js`; the start and respawn settings are the product owner's, 10 Nov 2026):
  - **Apron:**
    - on the side's home airfield, at rest, side by side 30 m apart, as in single player's ground start;
    - RAF at Hawkinge and the Luftwaffe at Saint-Inglevert.
  - **Air start:**
    - the two teams face each other 5 km apart at 8,000 ft over mid-Channel;
    - team-mates are 300 m apart in line abreast, each opposite an enemy.
  - **Air respawn:**
    - at 8,000 ft, 5 km from the enemy player nearest the side's own coast;
    - on the own-coast side of that enemy, heading towards them;
    - with no enemy in the air, over the side's own coast, heading out.
- **Going down:**
  - an aircraft broken up, its pilot killed, crashed, or bailed out of (bail-out held 1 s) leaves the sky at once;
  - its pilot is back 10 s later, where the respawn setting says;
  - the last enemy to hit it in the last 15 s gets the kill. Going down with no recent enemy hit scores nothing.
- **The match ends:**
  - when a team reaches the score limit;
  - at the time limit (the higher score wins; equal is a draw);
  - when a team has had nobody in it for 30 s.
  The results show team scores and each player's kills, deaths, shots and hits. Everyone returns to the lobby after
  20 s.
- **No pause:** Esc opens Options / Leave match while the aircraft flies on.

## 5. Disconnects
- **A player drops out:**
  - their place is kept for 60 s, so a reload rejoins;
  - silence for 20 s counts as a drop.
- **The host leaves:** the host role passes on.
- **The server is lost:** the page says so and returns to the menu.
- **Version check:** a page with an old protocol version is asked to reload.

## 6. Privacy
- No accounts.
- A display name (16 characters at most, checked) is held only in the room's memory.
- Logging is off on the server.

## 7. Accounts, costs and permissions
- **Testing on the Mac:** `wrangler dev`, with no account needed.
- **Cloudflare account:** Dawn Patrol's existing free account (product owner, 24 Oct 2026).
- **Permission each time:** every deployment to Cloudflare and every push to GitHub. No spending.

## 8. Code layout and measurements
- **`src/mp/` (checkpoint 1; shared by the server and the tests):**
  - `netConfig.js`: every timing, limit and setting;
  - `roomCode.js`, `protocol.js`, `roomCore.js`: codes, lobby messages, the lobby;
  - `binary.js`: the binary messages;
  - `planeState.js`: an aircraft's exact state;
  - `spawn.js`: where aircraft appear;
  - `history.js`: a second of poses per aircraft;
  - `matchCombat.js`: rounds, hits, kill credit, score;
  - `matchSim.js`: the match.
- **`server/` (checkpoint 2):**
  - `worker.js`: the Worker, with the map's heights bundled in;
  - `frontDoor.js`: `/health`, `POST /rooms` and the room WebSocket, for the game's own pages only;
  - `room.js`: the Room Durable Object, holding the lobby, the sockets and the match timer;
  - `wrangler.toml`: Worker `bob1940-mp`, no logs.
  The npm scripts are `mp:setup` (installs wrangler 4.143.1 into server/), `mp:server` (runs it at
  http://localhost:8787) and `mp:smoke` (four scripted players).
- **`src/net/` (checkpoint 3):**
  - `connection.js`, `netSim.js`, `clock.js`, `serverUrl.js`, `mpClient.js`: the room connection, the test network,
    the clock and the client;
  - `prediction.js`, `interpolation.js`: your aircraft kept true to the server; the others drawn smoothly;
  - `netFlight.js`: a match in the page's Simulation;
  - `netCombat.js`, `remoteCraft.js`: the others' guns, strikes and wrecks;
  - `multiplayer.js`: the screens and the room.
  The shared tick is `src/mp/flyTick.js`. The screens are `src/ui/mpScreens.js`, `lobbyScreen.js`, `scoreLine.js` and
  `nameTags.js`.
- **Rule:** multiplayer code doesn't change `src/physics/` or `src/aircraft/`. The only single-player change is that
  `startPlane` (`src/core/simulation.js`) is exported and takes a start position. The validation output is unchanged.
- **CPU, measured on this Mac (Node), 10 Nov 2026:**
  - four aircraft (Spitfire and Hurricane against two Bf 110s with AI gunners) on the real map: 6 ms of CPU per
    simulated second;
  - the room's 16 ms call takes a median 0.08 ms and at most 2 ms, against the free plan's reported 10 ms per event.
  - Cloudflare's machines may be slower than this Mac; the margin is about five times.
  - The first air start of each fighter type on a server takes 100-200 ms to work out its full-power speed. The room
    works this out in the lobby, as fighters are chosen, so the match starts within about 40 ms.

## 9. Reused from Dawn Patrol (product owner's approval, 10 Nov 2026)
- **Copied unchanged:** `roomCode.js`.
- **Adapted:**
  - `protocol.js`: no loadouts;
  - `roomCore.js`: RAF and Luftwaffe teams and their fighters;
  - `history.js`: velocity recorded as well;
  - `binary.js`: this game's controls, engines and Bf 110 seat;
  - `matchSim.js`: this game's flight model, guns, and the Bf 110's AI seat;
  - `matchCombat.js`: this game's hit zones and damage;
  - `spawn.js`: apron and 8,000 ft air starts;
  - `netConfig.js`.
- **New:** `planeState.js`.
- **Adapted at checkpoint 2:**
  - `server/worker.js`, split into `worker.js` and `frontDoor.js`;
  - `server/room.js`: this game's map, the start and respawn settings, air starts prepared in the lobby;
  - `scripts/mpSmoke.mjs`: four players, with the Bf 110's rear gun;
  - `tests/mp/server.test.js` and `tests/mp/fakes.js`.
- **Copied at checkpoint 3:** `connection.js`, `netSim.js`, `clock.js`, `serverUrl.js`, `mpClient.js`, and their
  tests (`mpClient.test.js`, `netSim.test.js`).
- **Adapted at checkpoint 3:**
  - `prediction.js`, `interpolation.js`;
  - `netFlight.js`, `netCombat.js`, `multiplayer.js` (after Dawn Patrol's `attachMultiplayer.js`);
  - the screens (after Dawn Patrol's `src/ui/screens`);
  - `tests/mp/netHarness.js`.

## 10. Testing
- **Automated** (`tests/mp/`, 64 tests):
  - message encoding and clamping;
  - the lobby rules and host settings;
  - exact state capture;
  - starts and respawns;
  - the Bf 110 seat swap and the AI gunner;
  - hits at a given delay and the 0.4 s cap;
  - kill credit;
  - the three ways a match ends;
  - prediction matching the server;
  - a 20 s match over a network with 0-100 ms delay, 10% loss and reordering;
  - the room server: joining, rejoining, drops, the host passing on, bad messages, a match with its snapshots and
    controls, the apron start and a mid-match rejoin, the end of a match, and the front door's checks.
  - the browser against the server simulation over the test network: prediction exact with no delay and within 2 cm
    at 150 ms ping and 2% loss; the others drawn within 0.5 m of where they were; the Bf 110's rear gun; respawning;
  - the client, the test network, the score line and the name tags.
- **The smoke test** (`npm run mp:smoke` against `npm run mp:server`): four players in a real local server.
- **By hand:**
  - several Chrome windows on this Mac against the local server (checkpoint 3);
  - then the family on different home networks against a Cloudflare test deployment (checkpoint 4).
