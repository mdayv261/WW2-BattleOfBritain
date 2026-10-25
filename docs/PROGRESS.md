# Progress

Read this at the start of every session.

## Current status (24 Oct 2026)

Phase 0 (foundations and research) is done. The product owner reviewed it and answered the Phase 0 questions (D14).
Phase 0 is signed off. The game is live at https://mdayv261.github.io/WW2-BattleOfBritain/ (repository
https://github.com/mdayv261/WW2-BattleOfBritain). **Phase 1 checkpoint 1 (physics core and validation) is done
locally**, and **checkpoint 2 (a flyable test version) is done locally**. Checkpoint 3 (handling checks and tuning) is
next. Nothing from Phase 1 has been pushed yet.

## Phase 1 checkpoint 2: flyable test version (25 Oct 2026)

**Done:**
- **Spitfire blade-width correction** (product owner's decision, D24): the climb now matches N3171 within 3%. The
  ceiling is still 7% low.
- **Flyable test version** (`npm run dev`):
  - keyboard flying with ramped stick inputs;
  - basic joystick support, with a check panel (J) showing the raw axes and an editable mapping;
  - a stand-in shape for each aircraft and a chase camera (V switches to a fixed camera behind);
  - a flight strip in each side's units, and the F3 debug overlay;
  - help (H), pause (P), restart (R), and aircraft choice (1-3).
- **Balanced start (D25):** throttle, attitude and trim are solved with the full model. Hands-off, the aircraft drift
  less than 8° of bank in 30 s.
- **Checked in Chrome:** the Spitfire and Bf 109 flown with the keyboard (roll, throttle to +6.2 lb, a 2.5 g pull), the
  109 in km/h, metres and ata, the joystick panel and the camera switch. No console errors.
- **Tests:** 321 pass.

**How to try it:**
1. In the project folder, run `npm run dev`, then open the address it prints in Chrome.
2. Click the page once, then press any key to close the help.
3. **Spitfire:** fly with the arrow keys. W/S for throttle; Q for +12 lb boost; E/D for rpm.
   - Push the nose sharply down: the engine cuts out (ENGINE CUT on the strip).
4. **Press 3 for the Bf 109.**
   - Push down: the engine keeps running.
   - E/D change the pitch by hand (watch the rpm); A switches the automatic pitch on.
5. **Press F3** for the readings.
6. **Joystick:** the default mapping is the product owner's Extreme 3D Pro on the Mac (25 Oct 2026): stick axes 0
   and 1, twist axis 5, throttle slider axis 6 (−1 idle, +1 full). J shows the axes; "Reset to default" applies this
   mapping if an older one was saved.

**Known issues:**
- Away from the start speed the aircraft slowly roll and yaw from engine torque, as real ones did. Trim covers pitch
  only (rudder trim comes in Phase 2).
- With a joystick connected, the keyboard's stick keys are overridden by the joystick.
- There is no ground: touching the sea ends the flight (R restarts).
- The stand-in shapes are boxes; the real models come in Phase 4.

## Phase 1 checkpoint 1: physics core and validation (24 Oct 2026)

**Done:**
- **Research for Phase 1** (AIRCRAFT_DATA.md):
  - NACA Report 640 full-scale propeller data (S30): thrust curves traced by pixel measurement; efficiency curves.
  - NACA Spitfire VA stall report (S31): power-off and power-on maximum lift.
  - Merlin III and DB 601A power curves, read from their charts (the DB chart's altitude scale is not linear).
- **Physics code** (`src/physics/`):
  - `atmosphere.js` and `rigidBody.js` (adapted from Dawn Patrol, approved, D18);
  - `aero.js`: half-wing aerodynamics with stall, slats and slipstream (D19);
  - `engine.js`: supercharged engines with boost control, ram air and the negative-g cut-out (D20);
  - `propeller.js`: NACA 640 coefficients, governor and manual pitch (D21);
  - `controls.js`: stick force limits, flaps, undercarriage, trim, slats;
  - `flightModel.js`: the complete aircraft stepped at 120 Hz;
  - `performance.js` and `validation.js`: steady-state performance.
- **Data files** (`src/aircraft/`): the three fighters, both engines, the propeller data, common parameters and the
  validation cases. Every number has a keyed row in AIRCRAFT_DATA.md, and a new test (`tests/aircraftCode.test.js`)
  fails if code and document disagree.
- **Tools:** `npm run validate` (prints model against source) and `npm run calibrate` (fits the three calibrated
  quantities, D22).
- **Results** (docs/FLIGHT_VALIDATION.md): 46 of 52 sourced checks within tolerance.
  - All level speeds within 5%; the Spitfire's within 1%.
  - All stalls within 1.5%; the roll checks within 0.2%.
- **Tests:** 316 pass (`npm test`, about 35 s). The build works.

**Known issues (reported, not tuned away):**
1. **Spitfire:** climbs 5-10% slower than N3171; ceiling 7% low. Likely cause: the NACA test propeller's narrower
   blades (D21).
2. **Bf 109:** climbs 8-16% slower than Messerschmitt's specification, but within 4% of the Rechlin figure.
3. **Bf 109 drag coefficient (0.0273)** is high, a result of calibrating to 460 km/h.
4. **Handling values are first estimates:** stability, damping, elevator and rudder power, rigging, slats, inertia.
   Checkpoint 3 tests and tunes them, then you fly.
5. **Nothing is flyable in the browser yet** (checkpoint 2).

**Decision made:** the product owner chose to fit the Spitfire blade-width correction (D24).

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
- **He 111:** keep searching, including the Imperial War Museum records. Use Wikipedia only to find its sources (D15).

## He 111 search (24 Oct 2026)

- **Imperial War Museums:** no He 111 records are online. Three items would need a visit or a copy request:
  - an RAE 1940 report on a captured He 111 H (LBY K. 70191);
  - Nowarra's "Heinkel He 111: A Documentary History" (LBY 81/2079);
  - Air Ministry files on German engines, including the Jumo 211 (Documents.13462).
- **Wikipedia:** its specifications are for the later H-16 and come from printed books that are not online.
- **Found and recorded (AIRCRAFT_DATA.md S28, S29):**
  - the Luftwaffe's October 1940 weapons manual for the He 111 H: every gun position, its mount, and its drums;
  - a Soviet 1943 report on the later H-6 and H-11: dimensions, weights, speeds, climb, ceiling and turn time,
    recorded as close-variant data and as an upper reference.
- **Still missing for the H-3:** engine sub-type, wing area, weights, performance, bomb load, airscrew and gun arcs.
  Needed by Phase 3.
- **Bf 110 in multiplayer:** yes, with an AI rear gunner.
- **Single player:** the player may fly the Luftwaffe side.
- **RAF radar:** gives bearing only.
- **Controls:** Logitech Extreme 3D Pro joystick and keyboard.
- **Markings:** generic RAF and Luftwaffe.
- **Multiplayer server:** the same Cloudflare set-up as Dawn Patrol.

## Decisions made by the product owner, second round (24 Oct 2026, D16)

- **Multiplayer server:** a separate Worker on Dawn Patrol's Cloudflare account.
- **Markings:** the swastika on Luftwaffe tails.
- **Bf 110 rear gun:** in single player the player can swap to the rear gun while an AI pilot flies.
- **Map:** real map data.
- **Modes:** one realistic mode with optional assists.
- **Units:** each side's own.
- **Cockpits:** 3D cockpits.
- **Ranks:** based on kills only.

Confirmed the same day (D17):
- only single-player kills count towards ranks;
- basic map data that needs no licence (public domain only);
- RAF aircraft get a transparent radar screen with enemy blips and a 360° compass ring.

All Phase 0 questions are answered. **Phase 0 is complete; Phase 1 started on 24 Oct 2026 (in planning).**

## He 111 search (24 Oct 2026)

- **Imperial War Museums:** no He 111 records are online. Three items would need a visit or a copy request:
  - an RAE 1940 report on a captured He 111 H (LBY K. 70191);
  - Nowarra's "Heinkel He 111: A Documentary History" (LBY 81/2079);
  - Air Ministry files on German engines, including the Jumo 211 (Documents.13462).
- **Wikipedia:** its specifications are for the later H-16 and come from printed books that are not online.
- **Found and recorded (AIRCRAFT_DATA.md S28, S29):**
  - the Luftwaffe's October 1940 weapons manual for the He 111 H: every gun position, its mount, and its drums;
  - a Soviet 1943 report on the later H-6 and H-11: dimensions, weights, speeds, climb, ceiling and turn time,
    recorded as close-variant data and as an upper reference.
- **Still missing for the H-3:** engine sub-type, wing area, weights, performance, bomb load, airscrew and gun arcs.
  Needed by Phase 3.
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

- **Phase 0: Foundations and research.** Done and signed off (24 Oct 2026).
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
