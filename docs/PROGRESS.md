# Progress

Read this at the start of every session.

## Current status (24 Oct 2026)

Phase 0 (foundations and research) is done. The product owner reviewed it and answered the Phase 0 questions (D14).
With the product owner's permission, the GitHub repository is being created and the game published to
https://mdayv261.github.io/WW2-BattleOfBritain/. The He 111 search continues.

## Phase 0: Foundations and research

**Done:**
- **CLAUDE.md:** the product owner's rules, word for word (D13).
- **Documents in `docs/`:**
  - GAME_SPEC.md: the full specification;
  - DECISIONS.md: D1-D13;
  - AIRCRAFT_DATA.md: the research record;
  - MULTIPLAYER_SPEC.md: an outline only;
  - this file.
- **Project skeleton:**
  - Vite 8.3.4, Three.js 0.186.1 and Vitest 5.0.3, pinned exactly (D1);
  - base path `/WW2-BattleOfBritain/` for GitHub Pages;
  - a placeholder scene: hazy sky, Channel sea, a strip of white cliff, a title (D11);
  - a 120 Hz fixed-step loop (D4);
  - `npm run validate` (it reports "no flight models yet" until Phase 1).
- **Publishing:** `.github/workflows/deploy.yml` runs the tests, builds, and deploys to GitHub Pages on each push to
  `main` (D12).
- **Tests:** 16 pass (`npm test`).
  - `fixedStepLoop.test.js` (5): the step rate, the leftover fraction, the catch-up cap, bad inputs.
  - `aircraftData.test.js` (11): the source policy as a test. Every data row needs a unit, the original figure, known
    sources and a confidence rating. Every estimate needs a reason. "High" needs two sources or a museum record. Every
    listed source must be used.
- **Aircraft research:** 27 sources, all named period documents, museum records or NACA reports. Main finds:
  - **Hurricane I:** Air Ministry data sheet and RAE chart (Merlin III); NACA flight tests of a Hurricane (stall, lift
    coefficients, roll rate, stick forces).
  - **Spitfire I:** A&AEE trials of N3171 with the Rotol constant-speed airscrew (speeds, climb, stall); RAE chart;
    NACA flight tests of a Spitfire VA (geometry, maximum lift 1.21, roll rate, stick forces).
  - **Merlin III:** +12 lb boost rules (A.P. 1590B, Pilot's Notes); a power chart (normal and +12 lb).
  - **Bf 109 E:** Luftwaffe handbook (16 Dec 1939) data sheet, loading plan, limits; Messerschmitt specification;
    A&AEE handling report (June 1940); British turning trial; the Luftwaffe's own comparison flights at Rechlin.
  - **DB 601A:** the Daimler-Benz manual of October 1940 (power at every rating and height).
  - **Bf 110 C:** Luftwaffe provisional data sheet; RAF flying instructions; AFDU tactical trial of a 110 captured in
    July 1940 (fuel, gun drums, rear-gun arcs, single-engine flight).
  - **He 111 H-3:** almost nothing in allowed sources (see the decisions below).
- **Checked in the browser:** the production build, served at `/WW2-BattleOfBritain/`, shows the scene and title with
  no console errors.

**How to check it yourself:**
1. In the project folder, run `npm install` (once), then `npm test`. You should see 16 tests pass.
2. Run `npm run dev` and open the address it prints. You should see a pale summer sky over a grey-blue sea, a thin
   white line of cliff on the horizon, and the title "Battle of Britain 1940 — Phase 0". Nothing moves yet.
3. Read `docs/AIRCRAFT_DATA.md`. The "Deviation note" under the Bf 109 and the "Open research gaps" table at the bottom
   are the parts that most need your eye.

**Deviations from published figures, flagged (also recorded in AIRCRAFT_DATA.md and DECISIONS.md):**
1. **Five-minute limit on +12 lb boost.**
   - My question to you on 24 Oct said "+12 lb emergency boost (5-minute limit)".
   - The 1940 sources found so far say only "short periods". The 5-minute figure is not yet sourced. That was my
     wording, not a source.
2. **Bf 109 E sea-level speed.**
   - The Luftwaffe data sheet gives 460 km/h. Messerschmitt's specification gives 500 km/h (±5%).
   - The Luftwaffe's own comparison suggests about 475 km/h.
3. **Variants and close variants.**
   - No E-4 or C-4 document was found, so E-3 and C-2 data are used.
   - The Spitfire and Hurricane geometry and handling come from NACA tests of a Spitfire VA and a Hurricane II, the
     same airframes with later engines.
4. **Merlin III power chart:** the issuing body is not named, so it is rated medium.
5. **Spitfire wingspan:** NACA measured 36 ft 11 in. The usual 36 ft 10 in was not found in an allowed source.
6. **Bf 110 against Hurricane speed:** the RAF trial and the Luftwaffe comparison disagree.

**Left (needs your decisions, below):**
- your review of the documents;
- permission to create the GitHub repository and push;
- the answers to the open questions.

**Known issues:**
- Vitest 5.0.3 officially supports Node 22, 24 and 26, not the Node 25 on this Mac. npm warns on install; tests run
  normally. GitHub builds with Node 24.
- The build warns that the JavaScript file is over 500 kB (Three.js). This is harmless now; it can be split later
  if load time matters.
- Some archive scans are only partly read: the RAE "Morgan" Bf 109 handling report, RAE 109 speed charts, Dowding's
  1 August 1940 Merlin letter. They are listed as gaps for Phase 1.

## Decisions made by the product owner (24 Oct 2026, D14)

- **GitHub:** create the public repository, push, and publish with Pages.
- **+12 lb boost:** no fixed time limit.
- **Bf 109 E:** calibrate to the Luftwaffe's 460 km/h at sea level.
- **Close variants:** accepted (Spitfire VA, Hurricane II, Bf 109 E-3, Bf 110 C-2).
- **He 111:** keep searching, including the Imperial War Museum records.
- **Bf 110 in multiplayer:** yes, with an AI rear gunner.
- **Single player:** the player may fly the Luftwaffe side.
- **RAF radar:** gives bearing only.
- **Controls:** Logitech Extreme 3D Pro joystick and keyboard.
- **Markings:** generic RAF and Luftwaffe.
- **Multiplayer server:** the same Cloudflare set-up as Dawn Patrol.

## Decisions still needed from the product owner

1. **Multiplayer Worker (Phase 9).** "The same Cloudflare server as Dawn Patrol" could mean either of two things:
   - (a) the same Cloudflare account, with a separate Worker for this game. This is my recommendation: an update or
     fault in one game cannot affect the other, and it costs nothing extra.
   - (b) one shared Worker serving both games.

   The original brief said "separate from the Dawn Patrol server", so please confirm which you meant.
2. **Swastika on Luftwaffe tails (Phase 4).** Generic markings normally include it historically, but German law and
   many app stores restrict it. Most historical games show a plain tail or the Balkenkreuz only. Please confirm.
3. **Can the player man the Bf 110's rear gun in single player (Phase 7)?**
4. **Map (Phase 4).**
   - Real coastline and towns from open map data (Natural Earth is public domain; OpenStreetMap needs a credit), or
     an invented coast in the right style?
   - How large: Dover to Calais only, or out to London and the Kent airfields?
5. **Modes (Phase 8).** One realistic mode with optional assists (as in Dawn Patrol), or realistic and arcade
   presets?
6. **Units shown (Phase 2).** Each side's own units, as in CLAUDE.md, or also a player setting?
7. **Cockpits (Phase 7).** Full 3D period cockpits for all four flyable aircraft, or simpler panels?
8. **Ranks or career.** Something like Dawn Patrol's Roll Call, or nothing?

## Phase list

Each phase's acceptance test is a proposal, agreed with the product owner when the phase starts.

- **Phase 0: Foundations and research.** Done locally; awaiting review.
  - Acceptance: the documents are reviewed, `npm test` passes, and the site deploys and shows the placeholder.
- **Phase 1: Single-engine flight model.** Hurricane I, Spitfire I and Bf 109 E-4.
  - Model: six degrees of freedom, standard atmosphere, lift and drag curves with stall and spin, supercharged
    engines with boost and rpm, constant-speed and VDM airscrews, Merlin negative-g cut-out, 109 slats.
  - Tools: `npm run validate`, the F3 debug overlay, a simple test camera.
  - Acceptance: validation against the sourced speeds, climbs and roll rates within agreed tolerances, every deviation
    documented.
- **Phase 2: Controls, cameras, ground.**
  - Keyboard and mouse (joystick if chosen), cockpit, chase and free-look cameras, taxiing, take-off, landing,
    basic instruments.
  - Acceptance: take off, fly a circuit and land each fighter without the debug panel.
- **Phase 3: Twin-engine aircraft.** Bf 110 C-4 and He 111 H-3.
  - Separate engines, asymmetric thrust, feathering.
  - Acceptance: validation as in Phase 1; single-engine behaviour matches the RAF reports.
- **Phase 4: World and visuals.**
  - South-east England, the Channel and the Pas-de-Calais; sky, haze and clouds; low-polygon models of all five
    aircraft built in code; markings.
  - Acceptance: a steady frame rate on the product owner's machine; each aircraft recognisable by its silhouette.
- **Phase 5: Weapons and damage.**
  - Brownings, MG 17s, MG FF cannon, MG 15; convergence, ballistics, ammunition, drums; armour, self-sealing tanks,
    coolant leaks, component damage fed into the flight model.
  - Acceptance: tests confirm bullet drop and travel time; damage visibly changes the flight.
- **Phase 6: AI pilots and gunners.**
  - Fighter AI on the player's flight model and controls; bomber formations; air gunners limited by their arcs,
    drums and g.
  - Acceptance: AI fights credibly at each skill level with no extra performance.
- **Phase 7: Missions and game loop.**
  - Menus, mission setup, dogfights and bomber missions, results; period cockpits, HUD and sound.
  - Acceptance: a full mission runs from the menu to the results and back without reloading.
- **Phase 8: Controls screen and assists.**
  - Rebinding of keys and joystick; assists and warnings.
  - Acceptance: rebindings work in flight and survive a reload; each assist visibly changes the flight.
- **Phase 9: Multiplayer.**
  - 2-4 players, RAF against Luftwaffe, private rooms with a code, fighters only, on an authoritative server on
    Cloudflare (docs/MULTIPLAYER_SPEC.md).
  - Acceptance: a family match on different home networks, with fair hits.
- **Phase 10: Polish and release 1.0.**
  - Performance, bug fixes, a player guide, final checks.
  - Acceptance: the product owner's sign-off on the release checklist.
