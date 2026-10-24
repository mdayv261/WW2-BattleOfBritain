# Design Decisions

Each entry records what was decided, why, and when. Newest entries go at the bottom.

---

## D1. Toolchain and versions (24 Oct 2026, Phase 0)

**Decision:**
- Tools: Vite 8.3.4 (dev server and build), Three.js 0.186.1 (3D) and Vitest 5.0.3 (tests).
- Node: 25.9.0 on the Mac; Node 24 on GitHub's build machine.
- Versions are pinned to exact numbers in `package.json`, with no `^` ranges.

**Why:**
- The spec fixes the tools.
- These exact versions already build and test successfully on this Mac (Dawn Patrol). Vite 8.3.5
  and Vitest 5.0.5 are a few days old and offer nothing we need yet.
- Exact pins mean a later `npm install` cannot silently change how the physics behaves under tests
  we trust. Upgrades will be deliberate and logged here.

**Note:** Vitest 5.0.3 lists Node 22, 24 and 26 as supported, not the odd-numbered Node 25 on the
Mac. npm prints a warning on install, but the tests run normally. The published build is made on
Node 24, which is supported.

**Licences:** Three.js, Vite and Vitest are MIT-licensed. No other assets are used. All visuals are
generated in code.

## D2. Module map (24 Oct 2026, Phase 0)

```
src/
  core/      fixed-step loop, shared maths helpers                     (Phase 0)
  render/    Three.js scene, cameras, aircraft meshes, effects         (scene in Phase 0)
  physics/   rigid body, atmosphere (ISA), aerodynamics, engines, superchargers, propellers, ground
  aircraft/  DATA FILES ONLY: one per aircraft; every constant traceable to docs/AIRCRAFT_DATA.md
  input/     keyboard, mouse, joystick -> a ControlInput object
  weapons/   guns, cannon, convergence, ballistics, ammunition, flexible gun mounts
  damage/    component damage and its effect on the flight model
  ai/        pilots and gunners -> the same ControlInput as the player
  world/     terrain, coast, sea, sky, clouds, airfields
  ui/        menus, instruments, HUD, F3 debug overlay
  audio/     Web Audio engine, guns, wind
  mp/, net/  multiplayer (Phase 9): shared server code / browser networking
tests/       one test file per module
scripts/     command-line tools (npm run validate)
```

A folder is created only when its phase begins, so the repository never holds empty scaffolding.

## D3. Data flow (24 Oct 2026, Phase 0)

```
keyboard/mouse/joystick ─┐
                         ├─> ControlInput { pitch, roll, yaw, throttle, rpm, flaps, gear, fire, ... }
AI pilot ────────────────┘            │
                                      v
              fixed physics step (120 Hz): aerodynamics, engines, damage, ground
                                      │
                                      v
          simulation state (position, quaternion, velocity, angular velocity, engines, ...)
                         │                                 │
                         v                                 v
         render: blends the previous and          audio, HUD, debug overlay
         current state, draws the frame           read the same state
```

**Rules that follow from this:**
1. **The same code path for everyone.** The player and every AI pilot produce the same
   `ControlInput` and run through the same physics code. This enforces the spec rule that the AI
   gets no extra speed, turn rate or perfect aim. AI gunners likewise drive the same gun-mount
   model a human would.
2. **Physics stays independent.** It never imports `render`, `ui` or `audio`, and never touches the
   web page. This lets the same physics run in Node: in the tests, and in the Phase 9 multiplayer
   server.
3. **State flows downward only.** Rendering and audio read the state; they never change it.

## D4. Fixed physics time step (24 Oct 2026, Phase 0)

**Decision:**
- Physics runs at 120 Hz (dt = 1/120 s).
- Each frame, `FixedStepLoop` (`src/core/fixedStepLoop.js`) adds the real elapsed time to an
  accumulator and runs as many whole steps as fit.
- The leftover fraction, `alpha`, goes to the renderer for smooth motion.
- At most 8 steps run per frame. If the limit is hit, the backlog is dropped.

**Why:**
- Equal small steps keep the integration stable and repeatable.
- A slow laptop draws fewer frames, but the aircraft fly identically.
- The cap stops a slow frame causing more catch-up work, then an even slower frame.

**Determinism:** physics uses no wall-clock time and no unseeded random numbers. Tests give the same
result on every run, and the Phase 9 server can reproduce a browser's flight exactly.

## D5. Units and coordinate frames (24 Oct 2026, Phase 0)

**Decision:**
- SI units everywhere internally: metres, kilograms, seconds, newtons, pascals, kelvin, radians.
  Display conversion only, by side:
  - RAF: mph, feet, boost in lb/sq in;
  - Luftwaffe: km/h, metres, ata.
- **World frame** (matches Three.js): +Y up, metres. -Z is north, +X is east.
- **Body frame:** +X forward (nose), +Y up, +Z out of the right wing. Right-handed.
- **Orientation:** a unit quaternion (never Euler angles), renormalised each step.

**Why:**
- One unit system removes a whole class of conversion bugs.
- Matching Three.js axes means no frame flip between the simulation and the renderer.
- Each side's cockpit showed its own units, so the display follows the period instruments.

## D6. Use of Three.js maths in physics (24 Oct 2026, Phase 0)

**Decision:** `physics/` may import only the maths classes from Three.js (`Vector3`, `Quaternion`,
`Matrix3`, `Matrix4`), nothing that touches rendering.

**Why:** they work in plain Node, so the tests and the multiplayer server need no browser. We avoid
writing and testing our own vector library.

## D7. Aircraft constants live in data files (24 Oct 2026, Phase 0)

**Decision:** every physical constant sits in `src/aircraft/<name>.js`, with a comment pointing to
its row in `docs/AIRCRAFT_DATA.md`. Code never contains a literal such as `22.48` for a wing area.
The files are created in Phase 1, when the first physics code needs them. Phase 1 adds a test that
every data-file value matches its row in AIRCRAFT_DATA.md.

**Why:**
- The project rules say so.
- The product owner can see every number in one place.
- An estimate can be tuned without touching the logic.

## D8. Source policy (24 Oct 2026, Phase 0)

**Decision:**
- **Allowed sources:**
  - museum records;
  - period test reports (A&AEE, RAE, Rechlin, and the Air Fighting Development Unit);
  - Pilot's Notes (Air Publications) and Luftwaffe handbooks (*Flugzeug-Handbuch*,
    *Betriebsanleitung*, *Ersatzteilliste*);
  - published reference books;
  - NACA/NASA reports.
- **Not allowed:** Wikipedia, Reddit, forums and game-company pages.
- **Scans of period documents on archive websites:** many period documents survive online only as
  scans on such sites (for example wwiiaircraftperformance.org and kurfurst.org). These are allowed
  on the following terms, which the product owner approved on 24 Oct 2026:
  - the source entry names the original document (title, report number, date), and gives the site
    only as where the scan was read;
  - values are rated **medium** unless a second independent source agrees;
  - the site owners' own articles, summaries and opinions are **never** a source.
- **Recording:** every value in `docs/AIRCRAFT_DATA.md` carries a value, a unit, the original
  figure, a source ID and a confidence rating (high, medium, estimate). Estimates give a reason.
  Anything not found goes under "Open research gaps" with no value.
- **Enforcement:** `tests/aircraftData.test.js` fails if a row has a missing field, an unknown
  source, or an estimate without a reason.

**Why:**
- The spec makes authenticity the top priority and forbids silent invention.
- For 1940 aircraft the best evidence is period test reports, and most of them are online only as
  scans. Citing the document itself keeps the trail checkable.
- Making the rule a failing test means it cannot erode over time.

## D9. Aircraft variants modelled (24 Oct 2026, Phase 0)

**Decision:** each aircraft is modelled as it was in mid-August 1940. The RAF configuration below
was chosen by the product owner on 24 Oct 2026.

| Aircraft | Variant and configuration |
|---|---|
| Hurricane Mk I | Merlin III, metal-skinned wings, Rotol constant-speed propeller, 100-octane fuel, +12 lb/sq in emergency boost |
| Spitfire Mk I | Merlin III, constant-speed propeller, 100-octane fuel, +12 lb/sq in emergency boost |
| Bf 109 E-4 | DB 601A (or Aa, see AIRCRAFT_DATA.md), VDM propeller, 87-octane fuel |
| Bf 110 C-4 | 2 × DB 601A, VDM propellers |
| He 111 H-3 | 2 × Jumo 211D (AI only) |

**Time limit on +12 lb/sq in:** the question put to the product owner said "5 minutes". The 1940 sources found so far
(A.P. 1565A, A.P. 1590B/J.2-W) say only "short periods" in an emergency. On 24 Oct 2026 the product owner decided
there is no fixed limit (D14).

**Hurricane airscrew:** new Hurricane Is were delivered with Rotol constant-speed airscrews by June 1940. Conversion of the
older de Havilland two-pitch airscrews was not to start before mid-September 1940 (MAP letter of 29 Jun 1940, source
S10). So in mid-August both kinds were in service. The Rotol is modelled.

**Why:**
- This is the typical front-line equipment at the height of the battle.
- The constant-speed propeller and 100-octane fuel changed the climb and low-level speed of the RAF
  fighters noticeably, compared with the two-pitch, 87-octane aircraft of early July.

## D10. Independence from Dawn Patrol (24 Oct 2026, Phase 0)

**Decision:**
- What is reused from Dawn Patrol is its documents' structure and its working process: phases with
  acceptance tests, the data table format, and decisions logged here.
- No code is copied. All Phase 0 code is written fresh.
- If a Dawn Patrol module looks worth adapting later, the product owner is asked first, one module
  at a time, and the approval is recorded here.

**Why:** the product owner's rule. It keeps this project's code reviewable on its own terms. WW2
aircraft also differ (supercharged engines, constant-speed propellers, twin engines, flexible guns),
so much of the WW1 code would not fit unchanged anyway.

## D11. Phase 0 scene (24 Oct 2026, Phase 0)

**Decision:** the placeholder scene has:
- a shader-drawn sky dome, shading from a pale hazy horizon to a deeper blue overhead;
- distance haze (fog);
- a sea plane in Channel grey-blue;
- a 100 m strip of white cliff with downland on top, 3 km ahead of a camera at 300 m;
- a sun light plus a sky light;
- a title.

**Why:**
- It proves the toolchain, the renderer and the fixed-step loop end to end, both locally and on
  GitHub Pages.
- The cliff gives the eye a sense of scale.
- The real world replaces it in Phase 4.

## D12. Publishing pipeline (24 Oct 2026, Phase 0)

**Decision:** `.github/workflows/deploy.yml` runs on every push to `main`, and can also be started by
hand.
- **Steps:** install (`npm ci`), test (`npm test`), build (`npm run build`), upload `dist`, deploy
  to GitHub Pages.
- **Actions used:** the current major versions (checkout v7, setup-node v7 with Node 24,
  configure-pages v6, upload-pages-artifact v5, deploy-pages v5). These run on Node 24, so they
  avoid the Node 20 deprecation warnings that Dawn Patrol's workflow shows.
- **Base path:** `vite.config.js` sets the base path to `/WW2-BattleOfBritain/`, to match the Pages
  address.
- **Permission:** creating the repository and every push need the product owner's permission.

**Why:** a failing test stops the deployment, so a broken version is never published.

## D13. Project rules (24 Oct 2026, Phase 0)

**Decision:** CLAUDE.md holds the product owner's rules exactly as given on 24 Oct 2026. They add
these to the Dawn Patrol set:
- `npm run validate` as a standing command;
- display units by side;
- the source list, including period test reports, and the exclusion of game-company pages;
- flagging every deviation from published figures;
- separation from Dawn Patrol's code;
- no pushing, deploying, account creation or spending without permission each time.

**Phase 0 note:** `npm run validate` exists from Phase 0 (`scripts/validate.mjs`). With no flight
models yet it only reports that there is nothing to validate. Phase 1 builds the real comparison.

## D14. Product owner's decisions after the Phase 0 review (24 Oct 2026, Phase 0)

**Decisions:**
1. **GitHub:** create the public repository `mdayv261/WW2-BattleOfBritain`, push, and publish with GitHub Pages.
2. **+12 lb/sq in emergency boost:** no fixed time limit.
   - The 1940 sources say only "short periods" and give no minutes.
   - The engine's normal heat model applies; no wear penalty is invented.
3. **Bf 109 E level speed:** calibrate to the Luftwaffe data sheet, 460 km/h at sea level (AIRCRAFT_DATA.md S16).
   The manufacturer's 500 km/h (S17) is recorded as the other published figure.
4. **Close variants accepted:**
   - NACA Spitfire VA and Hurricane II data for wing geometry, stall and roll;
   - Bf 109 E-3 data for the E-4, and Bf 110 C-2 data for the C-4, with the armour weight added once found.
5. **He 111 H-3:** keep searching period documents and museum records, including the Imperial War Museum's.
   No estimates yet.
6. **Bf 110 in multiplayer:** allowed, with its rear gun manned by the AI. This is the one AI element in otherwise
   human-only multiplayer.
7. **Luftwaffe side in single player:** the player may fly for the Luftwaffe, including escort missions.
8. **RAF radar information:** RAF players get the bearing of an incoming raid only; no height, numbers or range.
9. **Controls:** the Logitech Extreme 3D Pro joystick with the keyboard are the primary controls.
10. **Markings:** typical generic RAF and Luftwaffe markings, not particular squadrons or pilots.
11. **Multiplayer server:** use the same Cloudflare set-up as Dawn Patrol's multiplayer. Whether this means sharing
    Dawn Patrol's Worker or a separate Worker on the same account is to be confirmed. It matters because the
    original brief said the server should be separate from Dawn Patrol's.

**Why:** the product owner's answers to the Phase 0 questions. Points 2 and 3 settle the two deviations flagged in
Phase 0.

**Still open:**
- the map area and data source;
- cockpits;
- modes and assists;
- units (CLAUDE.md already says each side's own);
- ranks;
- whether the player can man the Bf 110's rear gun;
- the swastika on Luftwaffe tails, under generic markings;
- the multiplayer Worker question above.

## D15. Wikipedia only as a pointer to sources (24 Oct 2026, Phase 0)

**Decision (product owner):** the "No Wikipedia" rule in CLAUDE.md stays. Wikipedia may be read to find the
documents and books it cites. Figures are recorded only from those sources that can actually be read. If a figure is
found nowhere else, it may come from Wikipedia, rated `estimate` and flagged to the product owner.

**Why:** the product owner pointed to Wikipedia's He 111 article. Its specification box is for the later H-16, not
the 1940 H-3, and every figure in it comes from printed books. Following the references keeps the source trail
checkable without lowering the standard for the other aircraft.

**First use:** the He 111 article led to printed books that are not online. A separate search of the Internet
Archive found two period documents, S28 and S29 in AIRCRAFT_DATA.md.

## D16. Product owner's remaining Phase 0 answers (24 Oct 2026, Phase 0)

**Decisions:**
1. **Multiplayer server:** a separate Cloudflare Worker for this game (proposed name `bob1940-mp`) on Dawn Patrol's
   existing Cloudflare account. This settles the open point in D14.
2. **Luftwaffe markings:** generic markings include the swastika on the tail, as on the real aircraft of 1940.
3. **Bf 110 rear gun in single player:** the player can swap between the pilot's seat and the rear gun. While the
   player mans the gun, an AI pilot flies the aircraft. In multiplayer the rear gun stays AI-manned (D14).
4. **Map:** the brief's area (south-east England, the Channel, the Pas-de-Calais) built from real map data. The data
   source and its licence, and the exact extent, are proposed in the Phase 4 plan.
5. **Modes:** one realistic mode with optional assists.
6. **Units:** each side's own units only, as in CLAUDE.md.
7. **Cockpits:** full 3D period cockpits for the four flyable aircraft.
8. **Ranks:** based on kills only. Only single-player kills count (confirmed by the product owner, 24 Oct 2026).

**Why:** the product owner's answers to the last Phase 0 questions. All Phase 0 questions are now answered.

## D17. Map data licence and the RAF radar display (24 Oct 2026, Phase 0)

**Decisions (product owner):**
1. **Map data:** use basic map data that needs no licence. That means public-domain data, such as Natural Earth
   coastlines, rivers and towns. The candidate sources are checked and named in the Phase 4 plan; nothing that
   needs attribution (such as OpenStreetMap, under ODbL) is used.
2. **RAF radar display:** RAF aircraft only.
   - A transparent radar screen with enemy blips and a 360° compass ring.
   - This supersedes the "bearing only" text information of D14, item 8.
   - Still to settle in the Phase 7 plan: whether a blip shows only the bearing (a blip on the compass ring) or the
     bearing and the distance.

**Why:** the product owner's instruction. Public-domain data avoids any licence or credit obligations.

---

# Phase 1 decisions (single-engine flight model)

## D18. Phase 1 scope choices (24 Oct 2026, Phase 1)

**Decisions (product owner):**
1. **Dawn Patrol modules approved for adapting (D10 procedure):**
   - `src/physics/atmosphere.js` (International Standard Atmosphere);
   - `src/physics/rigidBody.js` (six-degrees-of-freedom motion with the gyroscopic term).

   Both are generic, tested physics. No other Dawn Patrol code is used.
2. **Test flying in Phase 1:** keyboard plus basic Logitech Extreme 3D Pro joystick support (stick, twist rudder,
   throttle slider, trigger). Full mapping and rebinding stay in Phases 2 and 8.
3. **Bf 109 E propeller pitch:** manual by default, as in 1940. The pilot used a thumb switch with a clock-face
   pitch indicator (AIRCRAFT_DATA.md S15, S21). The optional engine-management assist sets it automatically.

**Why:** the product owner's answers when Phase 1 was planned. Adapting the two generic modules avoids rewriting
textbook physics. Manual pitch keeps the 109 as it was flown in August 1940.

## D19. Flight-model structure (24 Oct 2026, Phase 1 checkpoint 1)

**Decision:**
- **Rigid body:** six degrees of freedom at 120 Hz (`src/physics/rigidBody.js`, adapted from Dawn Patrol, D18). The
  gyroscopic term comes from the propeller's spin.
- **Wing as two halves (`src/physics/aero.js`).** Each half has its own angle of attack, changed by roll rate and, via
  dihedral, by sideslip. It also has its own local airspeed (changed by yaw rate) and, on the Bf 109, its own slat.
  This one model produces:
  - roll damping;
  - dihedral effect;
  - wing drop at the stall;
  - autorotation and spins;
  - yaw toward the dropping wing;
  - the 109's slat flick.

  Lift peaks at exactly the sourced maximum lift coefficient.
- **Slipstream.** Extra dynamic pressure behind the propeller (thrust ÷ disc area) acts on a share of the wing and on
  the tail. That share is fitted to the Spitfire's power-on stall.
- **Fixed rigging for torque and swirl.** Each aircraft is rigged so it flies straight hands-off at cruise. Away from
  cruise the pilot corrects, as in the real aircraft.

**Why:**
- The half-wing approach replaces several separate rules (stall bias, autorotation gain, slat asymmetry) with one
  physical mechanism.
- Fitting maximum lift exactly makes the stall speeds testable against NACA data.

## D20. Engine model (24 Oct 2026, Phase 1 checkpoint 1)

**Decision (`src/physics/engine.js`):**
- **Curves.** For each boost rating, two curves against altitude at the reference engine speed: constant boost, and
  full throttle.
- **Manifold pressure.** The pressure the supercharger can reach comes from the ratio of the two curves. The throttle
  demands a pressure; the boost control holds it while it can.
- **Power at a given pressure.**
  - Merlin: interpolated between the +6¼ and +12 lb curves. This implies about 33-36 kPa for zero power, which agrees
    with the DB 601's fitted 0.30 ata.
  - DB 601: in proportion above its zero-power pressure.
- **Engine speed.** Supercharger delivery is proportional to engine speed; power changes with speed by a sourced or
  fitted exponent:
  - Merlin: exponent 0, from N3171;
  - DB 601: exponent 0.5, fitted to the manual's ratings.
- **Above the charts.** The manifold pressure falls with outside pressure (fixed supercharger ratio).
- **Ram air.** Half the dynamic pressure is recovered at the intake. This is the mean of the values implied by the
  Spitfire (0.62) and the Hurricane (0.37).
- **Negative g.** The Merlin's carburettor cuts out under negative g after a short delay and recovers after a
  flooding delay. The DB 601 does not cut out.

**Why:** the data give power curves, not engine internals. This keeps the curves exact at their sourced points and
interpolates physically between them.

## D21. Propeller model from NACA Report 640 (24 Oct 2026, Phase 1 checkpoint 1)

**Decision (`src/physics/propeller.js`, data `src/aircraft/naca640.js`):**
- **Data.** All three fighters use the full-scale thrust and efficiency curves of NACA's 3-blade, 10 ft Clark Y
  propeller (S30), scaled to each propeller's diameter.
  - The thrust curves were traced from the report's figure by pixel measurement.
  - The efficiency curves were read by eye (about ±0.02).
  - The power coefficient is computed as CT × J ÷ efficiency.
- **Outside the measured range.** Blade angles beyond the measured 15-45° stretch the nearest curve so that the
  zero-thrust point moves at the measured rate.
- **Physical limits.** Efficiency is capped at the measured envelope peak (0.86), and a windmilling propeller cannot
  return more power than the air gives up.
- **Blade-angle control:**
  - Merlin aircraft: a governor holds the rpm the pilot sets.
  - Bf 109: the pilot drives the pitch with a thumb switch (D18), or the engine-management assist holds 2400 rpm.

**Why:** it is the best measured full-scale data found for 3-blade propellers of the period. It is an approximation:
the Rotol and VDM blades were wider and differently shaped. This is the likeliest cause of the Spitfire's slow climb
at altitude (FLIGHT_VALIDATION.md).

## D22. What is calibrated, and to what (24 Oct 2026, Phase 1 checkpoint 1)

**Decision:** only three kinds of value are fitted, each to one sourced figure (`npm run calibrate`). The results are
copied into the data files by hand and recorded in AIRCRAFT_DATA.md:
- **Zero-lift drag, to one level speed per aircraft:**
  - Spitfire: 354 mph at 18,900 ft (S4);
  - Hurricane: 316 mph at 17,750 ft (S1);
  - Bf 109: 460 km/h at sea level (S16, D14).
- **Aileron power:** to NACA's full-aileron roll (S13).
- **Share of the wing in the slipstream:** to the Spitfire's power-on stall (S31). The same share is used for all
  three aircraft.

Every other sourced figure is an independent check (FLIGHT_VALIDATION.md). The aileron stick-force factor is
calculated directly from NACA's 30 lb measurement.

**Why:** fitting one value to one figure keeps the rest of the comparison honest; tuning factors are not used to hide
deviations.

## D23. Corrections made while building the model (24 Oct 2026, Phase 1 checkpoint 1)

1. **Stalled-wing drag:** 1.3, not the 1.98 of an infinitely long flat strip. A wing of aspect ratio about 6 across
   the flow is nearer 1.2-1.3.
2. **Bf 109 closed-throttle pressure:** lowered from an estimated 0.50 to 0.35 ata. At 0.50 ata the "power off" stall
   still had about 200 PS.
3. **Stall speeds in the British trials:**
   - The A&AEE stall speeds for N3171 (78 and 68 mph, S4) match NACA's power-on stalls (77 and 69 mph, S31), not its
     power-off ones (90 and 80 mph).
   - The power-off NACA figures are used for maximum lift. The power-on figure calibrates the slipstream.

