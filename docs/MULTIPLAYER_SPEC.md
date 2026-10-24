# Multiplayer Specification: RAF against Luftwaffe (outline)

Status: **outline only (Phase 0, 24 Oct 2026).** The full design is written and agreed with the
product owner at the start of Phase 9. Nothing here is built yet. Open points are marked
**(to decide)**.

## 1. Goal and rules
- **Players:** 2 to 4 human players in a private room. No AI aircraft in multiplayer.
- **Teams:** RAF (Hurricane Mk I, Spitfire Mk I) against Luftwaffe (Bf 109 E-4; the Bf 110 C-4
  **to decide**, because its rear gun is AI-manned). Each player picks a side, then a fighter of
  that side. Uneven teams (1 v 2, 1 v 3) are allowed.
- **No bombers:** the He 111 is not in multiplayer.
- **Rooms:** private, for family and friends. The host creates a room and shares a short code; the
  others join with the code. There is no public lobby, no accounts and no stored personal data.
- **Fair physics:** the same validated flight model runs for every aircraft. No player gains an
  advantage by editing their own copy of the game.
- **Single player:** unchanged by multiplayer.

## 2. Approach
- **An authoritative room server on Cloudflare Workers + Durable Objects:** one Durable Object per
  room.
  - It runs the flight model, the guns and the hits for every aircraft.
  - Browsers send only their controls.
- **Separate from Dawn Patrol's server:** its own Worker, its own name (**to decide**, proposed
  `bob1940-mp`) and its own protocol version.
- **Why this approach** (to be re-checked against Cloudflare's limits in Phase 9):
  - it is the only approach where no player, the host included, can cheat by editing their copy;
  - nobody gets a host's zero-delay advantage;
  - the host can leave without ending the match;
  - no relay service is needed;
  - the free plan needs no card.
- **The game itself** stays on GitHub Pages.

## 3. Network design (headings; detail in Phase 9)
- **Ticks:** the server steps every aircraft at 120 Hz with the same simulation code as the
  browser.
- **Browser to server:** controls stamped with their tick number, clamped to legal ranges.
- **Server to browser:** state snapshots, about 30 a second; compact binary.
- **Your own aircraft:** predicted in the browser, then corrected smoothly from the server's state.
- **Other aircraft:** drawn slightly in the past, smoothed between snapshots.
- **Hits:** decided by the server, with lag compensation up to a capped delay (value **to decide**).
- **Twin-engine aircraft (if the Bf 110 is allowed):** per-engine state, plus the server-run rear
  gunner.

## 4. Rooms, lobby and match
- **Room code:** short, with look-alike characters left out.
- **Lobby:** names, sides, aircraft, a ready flag.
- **Host settings (to decide):** start height, score limit, time limit, friendly fire, structural
  damage, and possibly the time of day within daylight.
- **Match:** a countdown, then team scores and a clock, a results screen, and back to the lobby.
- **Respawn:** a delay, then an air start behind your own side of the Channel (**to decide**:
  delay, height, and whether airfield starts are offered).

## 5. Disconnects
- **A player drops out:** their place is kept briefly, so a reload rejoins.
- **The host leaves:** the host role passes on; the match continues.
- **The server is lost:** the page says so and returns to the menu.
- **Version check:** an old cached page is asked to reload.

## 6. Privacy
- No accounts.
- A display name is held only in the room's memory.
- Logging is off on the server.

## 7. Accounts, costs and permissions
- **Testing on the Mac:** `wrangler dev`; no account needed.
- **Cloudflare account:** created by the product owner. Possibly the same free account as Dawn
  Patrol (**to decide**).
- **Permission each time:** every deployment to Cloudflare and every push to GitHub. No spending
  without permission.

## 8. Code layout (planned)
- `src/mp/`: shared by the server and the tests (protocol, room logic, match simulation, scoring).
- `src/net/`: in the browser (connection, prediction, smoothing).
- `server/`: the Worker and the Durable Object, with its own `package.json` and `wrangler.toml`.
- Rule: multiplayer code must not change `src/physics/` or `src/aircraft/`.

## 9. Testing (planned)
- **Automated:**
  - message encoding;
  - prediction against the server;
  - smoothing;
  - hit decisions at a given delay;
  - scoring and lobby rules;
  - clamping of out-of-range controls;
  - a whole simulated match over a simulated bad network.
- **By hand:** several browser windows on one Mac against a local server, then family on different
  home networks against a Cloudflare test deployment.
