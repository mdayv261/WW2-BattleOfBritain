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
7. **Cockpits:** full 3D period cockpits for the four flyable aircraft. (Updated by D224: the 2D panels stay as the
   forward view, with 3D cockpit sides, sills and rear added.)
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
   - Settled by D224: bearing only. Before that, still to settle in the Phase 7 plan: whether a blip shows only the bearing (a blip on the compass ring) or the
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

## D24. Spitfire propeller blade-width correction (25 Oct 2026, Phase 1 checkpoint 2)

**Decision (product owner):** fit a blade-width correction to the Spitfire's propeller.
- **What it is.** The NACA 640 thrust and power coefficients are both multiplied by `propeller.solidity` = 1.117:
  blades about 12% wider than the NACA test propeller's.
- **What it is fitted to:** N3171's time to 20,000 ft (S4), with the drag refitted alongside it.
- **Effect:** the Spitfire's climb now matches N3171 within 3% at every height, and its level speeds are unchanged.
  The ceiling stays 7% low and is reported.
- **Other aircraft:** the Hurricane and Bf 109 keep the NACA width (1.0). Their climbs are already within tolerance
  against the sources used.

**Why:** the product owner chose this over leaving the climb deviation. It is recorded as a tuning factor (estimate)
standing in for the Rotol's wider blades, whose real width was not found.

## D25. The Phase 1 test flight (25 Oct 2026, Phase 1 checkpoint 2)

**Decision:**
- **Starting conditions.** Each flight starts at 1,500 m and 110 m/s, heading north toward the cliffs. It starts at
  the throttle that holds that speed level, with the attitude and elevator trim solved with the full model (thrust
  and slipstream included), so it begins in balance.
- **Rigging.** The torque and swirl rigging of each aircraft is set to cancel exactly at that condition, as a rigger
  would set a real aircraft for its cruise. Away from it the pilot corrects.
- **Bf 109 pitch.** The 109 starts in manual pitch, as decided in D18. A switches the engine-management assist on.
- **Controls.** Keyboard and basic joystick only. The joystick panel (J) shows the raw axes and lets the axis
  mapping be changed, saved in the browser.
- **View.** A stand-in shape at the real span and length, a chase camera, and a mottled sea that follows the camera
  so speed and height can be judged.

**Why:**
- A start that is out of balance made every aircraft roll off within seconds. That would hide the real handling the
  product owner is asked to judge.
- Hands-off, the three aircraft now drift by under 8° of bank in 30 s.

## D26. Handling model changes from the checkpoint 3 checks (25 Oct 2026, Phase 1 checkpoint 3)

The first scripted test flights (`npm run handling`) contradicted the sources:
- violent stalls (the Spitfire rolled 147°), where NACA describes mild ones;
- the Bf 109 dropping its right wing, where S20 says left;
- unrecoverable, tumbling spins;
- too little sideslip in rolls;
- slats opening far too early.

**Changes, each tested against the evidence it addresses:**
1. **Two panels per wing half (inner and outer), with washout** (the Spitfire's 2.1° from S11; 1° estimated for the
   others). The root stalls first and the ailerons keep working, as NACA describes for both RAF fighters. The panel
   maxima are fitted so the whole wing still reaches the sourced maximum lift (stall speeds unchanged, within 1.5%).
2. **Gentler stall shape** (lift falls over about 4°, not 1.5°): these wings use 13-19% thick sections, which stall
   gradually.
3. **Consistent stalled flat-plate lift and drag** (normal force 1.3 × sin a). The earlier lift corresponded to 2.0.
4. **Nose-down moment from a stalled root**, as NACA observed: the lift of the stalled root acts near mid-chord.
5. **Extra roll damping when the outer wing is stalled** (tuning value). It turns a tumbling spin into a steady one.
6. **Net gyroscopic inertia reduced** (20-25 kg m², separate from the inertia that sets rpm changes). The Merlin's
   crankshaft turns the other way through its spur reduction gear.
7. **Bf 109 slats.**
   - The slats open just before the outer wing would stall without them, and raise its section maximum lift a little
     above the root's.
   - The panel maxima are fitted to the 1.47 (slats open) and 1.15 (closed) figures.
   - Uneven opening in hard turns then gives S21's flick.
8. **Documented wing-drop directions:** Hurricane left (S12), Bf 109 left (S20), Spitfire a mild right roll (S31,
   arising without a bias).
9. **Low-wing dihedral correction (−3°) and more adverse yaw.** Together they let the Spitfire match NACA's 18°
   sideslip in a full-aileron roll near the stall (S11) and the Hurricane its 64°/s roll at 230 mph (S13).
10. **Recalibration.**
    - The aileron power is now fitted in a time-stepped roll with the rudder fixed, as NACA flew it.
    - The RAF elevator force factors are fitted to NACA's 5.0 and 8.1 lb/g.
    - Drag, slipstream share and blade width were refitted. Level speeds and climbs are unchanged within 1%.
11. **Rigging and trim re-matched** to the start condition: hands-off drift under 2° in 30 s.

**Why:** the product owner's rules require handling to follow the sources and every estimate to be stated. Where
the sources are qualitative (stall direction, slat flick, heavy 109 controls), the tests check the direction or
ordering they describe.

**Not achieved (known deviations, FLIGHT_VALIDATION.md):**
- spins settle flat (60-80° angle of attack);
- the Spitfire's full-aileron roll is 15% below NACA once its 30 lb roll is matched;
- stall wing drops grow large if full back stick is held for several seconds past the stall.

## D27. Phase 1 signed off (25 Oct 2026)

The product owner flew the Phase 1 test version and signed Phase 1 off. This accepts:
- the acceptance test proposed in PROGRESS.md (speeds within 5%, climbs within 10%, ceilings within 5%, stalls within
  5 mph, rolls within 15%, the automated behaviour checks, and the product owner's own flight test);
- the known deviations recorded in FLIGHT_VALIDATION.md as they stand (Spitfire ceiling −7%, Hurricane mean-weight
  ceiling −5.6%, Bf 109 specification climbs 8-16% slow, Spitfire full-aileron roll −15%, flat spins, large wing drops
  with full back stick held past the stall).

They are not tuned away. They may be revisited if better sources are found.

## D28. Phase 2 plan and the ground model (25 Oct 2026, Phase 2 checkpoint 1)

**Product owner's choices for Phase 2 (25 Oct 2026):**
- a generic 1940 grass aerodrome (the real airfields come in Phase 4);
- a pilot's-eye view with a simple canopy frame and 2D dials (full 3D cockpits stay in Phase 7);
- one brake control plus rudder for all three aircraft;
- the mouse only looks around (mouse flying in Phase 8).

**Ground model** (`src/physics/ground.js`):
- **Wheels:** each wheel is its oleo and tyre together, a spring and damper acting up from the ground. The springs are
  set from the parked weight, and the wheel positions are measured from the sources' scaled drawings.
- **Tyres:** rolling resistance, slip-angle side force, and brakes, all capped by the tyre's grip.
- **Tailwheel:** castors freely (assumed for all three; not confirmed).
- **Crash points:** wingtips, nose, belly, rear fuselage and the propeller tip. Touching with any of them ends the
  flight with a named cause. Touching down faster than 3.5 m/s collapses the undercarriage.
- **Ground effect:** McCormick's approximation for induced drag, with the matching rise in lift slope.

**Brakes (deviation, product owner's choice):** the RAF relay-valve scheme (brake lever plus rudder, S33) is used for
all three. The Bf 109 really had toe brakes on each pedal (S20, S32); the Logitech stick has none.

**Tailwheel heights:** each is set so the parked aircraft sits at its sourced ground angle:
- Spitfire 11.2° (S11);
- Hurricane 10.2° (measured on S12's drawing);
- Bf 109 15.5° to the thrust line, which is 17° at the wing root (S32).

The centre of gravity's height is not stated anywhere, so it is assumed to lie on the thrust line.

**Low-speed floor:** below 15 m/s the aerodynamic angles and rotation terms are worked out as at 15 m/s.
- At walking pace the slipstream, not the free stream, sets the flow over the aircraft.
- Dividing by a near-zero airspeed had produced huge, unphysical forces in a ground loop.
- 15 m/s is below every Phase 1 test speed, so the signed-off flight results are unchanged.

**New sources:**
- **S32, the RAE "Morgan" report on the captured Bf 109 E-3:** drawings, centre of gravity, ground attitude and ground
  handling.
- **S33, the Spitfire I Pilot's Notes (A.P. 1565A) held by the Museum of Flight:** flaps, brakes, approach speeds,
  static run-up rpm, and the position-error table.

S32 also gives sourced values for several Phase 1 Bf 109 estimates (mean chord, dihedral, VDM pitch range, wing area).
They are listed as a gap: using them would mean recalibrating the 109, so it is the product owner's decision.

## D29. Validating take-offs and landings (25 Oct 2026, Phase 2 checkpoint 1)

A scripted test pilot (`src/dev/groundTests.js`) flies the sourced take-offs and landings. One technique is used for all
three aircraft, so the comparison is fair rather than tuned per type:
- **take-off:** rotate at 0.9 times the power-off stalling speed and climb out at the stalling speed;
- **landing:** approach at 1.2 times the flaps-down stalling speed, then a three-point touchdown, then braking as hard
  as keeps the tail down.

**Approach speeds and the airspeed indicator:** the period approach speeds are pilot's-indicator readings. The
Spitfire's Pilot's Notes add 10 mph near 100 mph (S33), so 1.2 times the NACA stalling speed is the same approach.

**Results:**
- **Within ±15%:**
  - the Hurricane's take-off and landing;
  - the Bf 109's landing;
  - the Spitfire's take-off run.
- **Outside:**
  - the Spitfire to 50 ft (+22%) and its landing run (+48%);
  - the Bf 109's ground run (-29%) and its distance to 20 m (-23%).

These are reported as deviations, not tuned away (FLIGHT_VALIDATION.md, items 10 and 11). The static run-up matches
S33: 2,700 rpm (2,650-2,700). With the brakes on, full throttle tips a Spitfire onto its nose, which agrees with
S33's two men on the tail.

## D30. Bf 109 estimates replaced with the RAE report (S32) and recalibrated (25 Oct 2026, Phase 2)

The product owner decided to use the RAE "Morgan" report's figures in place of Phase 1 estimates, and to
recalibrate. This reopens part of the signed-off Phase 1 Bf 109.

**Values now taken from S32:**
- mean chord 1.634 m (was 1.71 m);
- dihedral 5.75° (was 5°);
- no wing twist (was 1° of washout);
- fine pitch stop 22.5° (was 20°);
- maximum lift 1.4 clean and 1.9 with flaps, from stalls timed against a trailing static (was 1.47 from S20 and 2.06
  from S17). The pilot's indicator read about 20 mph low near the stall, which explains S20's low figures.

**Changed for better reasons, still estimates:**
- zero-lift angle -3.5°, from the S32 sections and the root set about 1.5° above the thrust line.

**Fitted to S32 (`npm run calibrate`):**
- **Slats:** they start to open at a wing lift coefficient of 0.865 (Table 4), giving 12.4°. They now respond to the
  outer wing's angle without the flaps' effect, so with the flaps down they open at a higher lift coefficient, as
  measured.
- **Aileron heaviness:** one-fifth aileron is all the pilot can reach at 400 mph (Table 5), with the common 30 lb pilot.
  S32's own stick forces are about twice NACA's for the Spitfire, so the deflection is used, not the force.
- **Aileron power:** S32 found the 109 and the Spitfire both took about 4 s to bank 45° at 400 mph. The model's
  Spitfire, with its aileron power from NACA, takes 1.2 s. So the 109 is fitted to match the Spitfire (0.0507), not the
  4 s, and the absolute time is a known deviation for both.
- **Drag:** refitted to 460 km/h: 0.0273 (was 0.0272).

**Not taken:**
- **Coarse pitch stop.** S32 gives 90° (fully feathering), but the NACA propeller data stop at 45°. Stretching them
  further gives an unphysical feathered propeller, so the model keeps 55°. Feathering is for Phase 3.
- **Wing span and area.** They stay at the German figures (S16, S17: two sources). S32's area is 174 sq ft, about 1.4%
  less.

**Results:**
- level speeds unchanged within 0.1%;
- climbs and ceiling within 0.5% of before;
- the S32 and S20 stalls within 2.5%;
- the take-off deviation smaller (ground run -25%, from -29%);
- the stall still drops the left wing;
- the slats open in a hard pull and stay shut in cruise;
- all six spins enter and recover.

**Test-script correction:** the spin test now applies rudder against the actual rotation. Asked for a right spin, the
109 drops its left wing (S20) and rolls the other way; the old script then held rudder that fed the real spin.

## D31. Take-off, landing and roll deviations accepted (25 Oct 2026, Phase 2)

The product owner accepted, as documented and not tuned away (FLIGHT_VALIDATION.md, items 10-12):
- the Spitfire's take-off to 50 ft (+22%) and landing run (+48%);
- the Bf 109's take-off (ground run -25%, to 20 m -20%);
- the RAE's 4 s to bank 45° at 400 mph against the model's 1.2 s.

## D32. Phase 2 checkpoint 2: aerodrome, views, instruments and controls (25 Oct 2026)

**Aerodrome** (`src/world/airfield.js`, `src/render/airfield.js`):
- a generic grass field 1,000 m square on level farmland, with boundary markers, a landing T, a windsock, three hangars
  and huts, and trees along the hedges;
- the coast 4 km to the south, beyond which touching the surface is a ditching;
- the chalk-cliff block is gone until Phase 4.

There is no wind, so take-offs and landings are made northwards.

**Starts** (N cycles them):
- on the ground near the southern edge with the engine idling (the default);
- on the approach at 1,000 ft about 5 km out, wheels and flaps up, at 1.5 times the stalling speed;
- in the air at 1,500 m (the Phase 1 start).

**Views:**
- the cockpit view (C) at each aircraft's eye position (AIRCRAFT_DATA.md);
- chase, fixed-behind and orbit views outside (V);
- the mouse looks around and the joystick hat looks in eight directions.

The cowling and windscreen frame are simple display shapes kept in the render code. They affect nothing in the physics,
so they are not aircraft data. They give a nose that hides the view ahead on the ground, as S20 describes for the 109.

**Instruments:** 2D dials in each side's units (I toggles them).
- **RAF:** the six blind-flying instruments, boost, rpm, undercarriage lamps and flaps.
- **Bf 109:** airspeed, altimeter, turn and bank (its only blind-flying instrument, S20), compass, ata, rpm, the
  propeller pitch clock, undercarriage and flaps.
- **RAF panel layout (product owner, from a photograph of a Spitfire I panel):**
  - the blind-flying panel as a plate in the middle, two rows of three: airspeed, artificial horizon and rate of climb
    above; altimeter, direction indicator and turn and slip below;
  - the engine instruments to the right: rpm above, boost below;
  - the undercarriage indicator and flap position to the left;
  - no captions, as on the real panel.

  Only instruments the model drives are shown. Oil, coolant and fuel gauges come with the engine-cooling and damage
  work.
- **Bf 109 E panel layout (product owner, from a photograph of a preserved E; used for appearance only):**
  - the propeller pitch clock at the top centre;
  - the altimeter above the airspeed indicator on the left;
  - the turn and bank indicator above the compass in the middle;
  - a gap for the gunsight placard, then the rpm gauge with the smaller ata gauge beside it;
  - the undercarriage and flap indicators on the left.
- **Period look (product owner, 25 Oct 2026):** black faces with white markings throughout. The artificial horizon is
  all black with a white bar, not coloured. The direction indicator shows a heading drum through a window, as the 1940
  directional gyro did, not a modern rotating card; the 109's compass is drawn the same way. The turn indicator has 0
  at twelve o'clock and marks for rate 1, 2 and 3 turns each side (3, 6 and 9 degrees a second).
- **RAF boost gauge:** an orange band from +12 to +14 lb/sq in marks the emergency boost (product owner's request).
- **RAF rev counter, after the product owner's photograph:** large numerals 10-40 (hundreds of rpm), smaller 15, 25
  and 35, a mark every 100 rpm, and "HUNDREDS OF R.P.M.". The photographed instrument runs to 50 over about 300°; the
  product owner set 10-40 over the same wide sweep (10 at seven o'clock, 25 at the top, 40 at five o'clock).
- **RAF blind-flying instruments, after the product owner's photograph of a Spitfire panel built with original
  instruments:**
  - **Artificial horizon:** a shaped window (shoulders and a dome over the centre), a white horizon bar, and a bank
    scale round the bottom marked 6 3 · 3 6, with a pointer turning with the bar.
  - **Climb indicator:** 0 at nine o'clock, to 4,000 ft/min each way, with white 2 and 4 and green 1 and 3. It is
    lettered CLIMB and DESCENT, plus "1000 FT/MIN", the units the product owner asked for earlier.
  - **Turn and slip:** the two-needle kind. The slip needle points up under green SIDE SLIP marks; the turn needle
    points down over green TURN marks numbered 2 and 4 each side (rates 1-4). The face has a large L and R.

  This replaces the earlier turn scale with 0 at twelve o'clock and rate 1-3 marks. The Bf 109 keeps that one.
- **RAF airspeed indicator, after the product owner's photograph:** a single needle going round twice. The outer
  ring is 60-240 mph (numbered 6-24, 160 at the top); the inner ring 240-400 mph (26-40, 360 at the top); about
  1.8° per mph, lettered "M.P.H.".
- **Altimeters, drawn after photographs supplied by the product owner (spitfirespares.co.uk):**
  - **RAF:** the altimeter Mk XIV, from the product owner's photograph of one:
    - cream numerals 0-9;
    - the lettering "100 FEET", "1000 FEET", "10000 FEET", "45,000 FT" and "ALT";
    - a curved millibar window at the bottom, set to 1013;
    - three hands: hundreds, thousands, and a thin dark hand for tens of thousands.

    The photograph confirms the millibar setting scale. An earlier version followed an American Pioneer altimeter.
  - **Bf 109:** the Fl 22316 "Höhe km": a single hand making one turn per 6 km, 0 at the bottom and 3 at the top, with
    the white millibar window under the 3. The model does not show more than one turn, so above 6 km the hand reads
    round again, as on the instrument.
- **Pitch clock:** 10 minutes per degree is from S32. Twelve o'clock at the fine stop is an assumption, since the zero
  is not stated.

**Controls:**
- **Keyboard:**
  - B brakes (with rudder for one side);
  - , and . rudder trim (Spitfire);
  - F and Shift+F flaps down and up one stop.
- **Joystick defaults, as the product owner set them in the J panel (25 Oct 2026), by the panel's numbers:**
  - 5 and 3: elevator trim nose up and nose down, while held, at each aircraft's own trim speed;
  - 4 and 6: flaps up and down a stop;
  - 12: brakes (while held);
  - 11: undercarriage;
  - 10: cockpit or outside view;
  - throttle slider: axis 6, reversed.
- **Hat:** looked for on axis 9. Every button and the hat axis can be changed in the J panel, which now lists buttons by
  their printed numbers. Mappings saved before this layout keep their axes but take the new buttons.

**Found in testing:** at full power from a standstill the propeller's slipstream swing needs about 70% rudder. With no
rudder, a castoring-tailwheel aircraft ground-loops and can tip onto a wingtip at walking pace. The swing directions
match S12 and S20; the amount of rudder is for the product owner's flight test to judge.

## D33. Reflector gunsights (25 Oct 2026, Phase 2)

**Since D87 (1 Nov 2026):** the RAF's GM 2 is drawn square-on in front of the panel while the pilot looks ahead, the
reticle seen only on its glass; the 3D sight shows when looking round. **Since D89:** the Bf 109's Revi is drawn the same
way and its reticle redrawn from the product owner's photograph. The product owner approved the GM 2's 100-mil ring
(1 Nov 2026); the Revi's ring stays a 100-mil estimate.

The product owner asked for the optical reflector gunsight in all aircraft. Each cockpit now has the sight body on the
coaming, with its glass, and a glowing reticle collimated along the aircraft's line of sight. It is drawn at a
distance so it stays fixed against the sky as the head turns.
- **Spitfire and Hurricane:** a Barr & Stroud GM 2 pattern: a ring, range bars either side of a central gap, a short
  post below and a centre dot.
- **Bf 109:** a Revi C/12C pattern: a ring crossed by horizontal and vertical lines, and a centre dot.

**Estimates:** no allowed source for the reticle sizes was found. Forum and dealer descriptions disagree (6 mils,
100 mils, "a Spitfire fills the ring at 300 m"). The ring is therefore drawn at 100 mils as a stated estimate, and the
sights' types and dimensions are an open research gap for Phase 5, when aiming depends on them. The line of sight is
taken as parallel to the thrust line through the pilot's eye.

**Bf 109 panel:** at the product owner's request the compass and the turn and bank indicator swapped places. The
compass is now above, in the middle row; the turn and bank below.

## D34. Flap position indicator (25 Oct 2026, Phase 2)

At the product owner's request each panel has a flap position indicator under the FLAPS (KLAPPEN) label. It is not a
period instrument: a track from up to fully down, the take-off and landing settings marked above it, and a pointer at
the flaps' position. The label no longer says UP or DOWN.

The settings are aircraft data (AIRCRAFT_DATA.md):
- **Spitfire:** up for take-off and fully down for landing (S33).
- **Hurricane:** fully down for landing (S12). Up for take-off is an assumption; no source found.
- **Bf 109:** 20° for take-off (S32) and fully down, marked 40°, for landing (S20, S32).

The flap travel in degrees (85°, 80°, 40°) moved into the aircraft data from the instrument code.

## D35. Phase 2 signed off (25 Oct 2026)

The product owner accepted Phase 2, which covers:
- taking off, flying a circuit and landing each fighter from the cockpit with the period instruments;
- take-off and landing distances within ±15% or accepted deviations (D31);
- the automated ground-handling checks;
- the controls (keyboard, joystick buttons and hat, mouse look), with no errors.

The known deviations stand as recorded in FLIGHT_VALIDATION.md (items 1-13). They may be revisited if better sources
are found.


## D36. Twin-engine physics and the Bf 110 flight model (25 Oct 2026, Phase 3 checkpoint 1)

**Engines as a list** (`src/physics/powerplant.js`):
- Each engine has its own position (its airscrew hub), rpm, blade angle and carburettor cut-out state, and can take its
  own throttle, rpm or pitch, failure and feather inputs (`input.engines[i]`); otherwise it uses the shared levers.
- Thrust acts at each hub, so a stopped engine gives yaw (and, through the slipstream, roll). Torque, swirl and
  gyroscopic effects are summed over the engines.
- Each engine's slipstream washes its own side of the wing; the tail feels the mean of the engines'.
- A single-engine fighter is a one-engine list on the thrust line. Every Phase 1 and 2 result is unchanged (`npm run
  validate` gives identical figures).
- **Reason:** one model for both kinds keeps the fighters exactly as signed off and lets the twins fail one engine.

**Feathering:** past the coarse stop the airscrew's thrust and torque fade to the feathered state (blades edge-on,
stopped, with only the drag of `featheredDragArea`), instead of stretching the NACA curves beyond 45° (which D30 found
unphysical). A failed engine has internal friction (`common.deadEngineFriction`, 0.1 of rated torque, an estimate),
which sets how hard a windmilling airscrew is driven and so its drag.

**Bf 110 data** (`src/aircraft/bf110c4.js`, AIRCRAFT_DATA.md):
- C-2 data from the Luftwaffe data sheet (S23) stand in for the C-4 (D14; the C-4's armour weight is a gap).
- **Fitted:** drag to 440 km/h at sea level (S23); flaps-down maximum lift to S23's landing speed taken as the stall
  (1.97, giving 1.47 clean with the Bf 109's measured flap increment).
- **Estimated:** no scaled drawing was found, so engine, wheel, eye and centre-of-gravity positions come from the overall
  dimensions; inertia by the radius-of-gyration method with twin-engine ratios; the slipstream share scaled from the
  fighters' fit by the discs' share of the span (0.24); the yaw powers chosen so that full rudder holds about 30° of
  sideslip and the rudder trimmer a third of that. Most other handling values are the Bf 109's.
- Both airscrews turn the same way (no handed DB 601s were found), so the right engine is the critical one.

**Single-engine checks** (`src/dev/twinTests.js`, `tests/physics/twinEngine.test.js`): a scripted pilot holds speed,
heading and wings level with rudder and trim after one engine stops. At 250 km/h the model climbs about 600 ft/min
feathered and 330 ft/min windmilling with span efficiency 0.8 (560 and 280 with 0.7, D37) (S25: climbs and holds height on either engine, much better feathered). The
minimum control speed is measured wings level, because the model has no side force from the rudder to balance a
banked aircraft; it comes out below the stall (no source).

**Deviations flagged** (FLIGHT_VALIDATION.md items 14-17): the climb shape against S23; the ground run-up rpm against
S24; S24's uncontrollable full-flap single-engine approach not reproduced; positions estimated.

## D37. Bf 110 span efficiency lowered to 0.7 (25 Oct 2026, product owner)

With the fighters' 0.8 the Bf 110 climbed 15% too quickly to 8 km and its ceiling was 11% above the data sheet's 9,500 m
(S23). The product owner chose 0.7. No source gives the value; the engine nacelles breaking up the wing's lift
distribution make a lower figure than a single-engine fighter's plausible. The drag was refitted (0.0264) and the
rigging recomputed. The climb to 4-8 km is now within 10% and the ceiling 6.6% high; the low-level climb is 17-23% slow
(FLIGHT_VALIDATION.md item 14).

## D38. Bf 109 panel redrawn after the product owner's photographs (25-26 Oct 2026)

**Superseded by D89 (1 Nov 2026):** the panel is now the restored panel of the product owner's later pictures.

The product owner asked for the Bf 109 panel to look like a photograph of a preserved panel. A first version followed a
photograph of a later Bf 109 panel; the product owner then supplied a photograph of a Bf 109 E panel, and the panel
now follows that one. It is drawn in its own module (`src/ui/bf109Panel.js`, dials in `src/ui/luftwaffeDials.js`)
with the photograph's grey outline, black square mountings and positions measured from the picture:
- **Centre tab:** the clock.
- **Upper row:** airspeed (km/h, round bezel), repeater compass (a card strip behind crossed lines, its figures running
  down to the right as photographed), manifold pressure (ata).
- **Lower row:** altimeter (one turn per km, a short hand for whole kilometres, millibar window), turn and bank
  (DREHT / HÄNGT, yellow ball tube), rev counter (U/min x 100, 600-3,000), and the airscrew pitch indicator
  (Luftschraubenstellung, S32's ten minutes to a degree).
- **Switches:** the airscrew pitch switch (Größer, Drehzahl, Kleiner, Handbetrieb) between the lower dials; the magneto
  switch at M1-2, a red push button and the pitot heater switch (Staurohr heiz) on the left.
- **Placards:** drawn as plates whose small print, too fine to read on the photograph, is shown as grey lines rather
  than invented.

**Added to the photograph:**
- the flap position indicator (D34) between the compass and the manifold pressure gauge, where the product owner placed
  it;
- the undercarriage lamps on a small black plate on the right-hand wing of the panel (the photograph shows no
  undercarriage indicator).

**Removed with the first version:** the climb indicator, fuel, oil and coolant gauges, ammeter and ball compass, which
are not on the E panel. The panel takes up to half the screen height (the RAF panel 40%) so the dials stay readable.

## D39. Bf 110 panel after the product owner's photograph; upright flap indicator on the Bf 109 (26 Oct 2026)

**The Bf 110 panel superseded by D106 (2 Nov 2026).**

**Bf 109 flap indicator:** at the product owner's request it now stands upright, 0° at the top and 40° at the
bottom, with START and LANDUNG marked beside the track (`flapIndicatorVertical` in `src/ui/dials.js`). The RAF
panels keep the horizontal one.

**Bf 110 panel** (`src/ui/bf110Panel.js`, dials in `src/ui/bf110Dials.js`), laid out from a photograph of a preserved
Bf 110 cockpit supplied by the product owner, positions measured from the picture:
- **Flying instruments, left:** airspeed to 900 km/h, the combined horizon (horizon bar, turn pointer at the top, slip
  ball at the bottom) and the blue-faced climb indicator to 30 m/s above; the altimeter, repeater compass and clock
  below.
- **Engine instruments, right:** a pair for each engine, the left engine's on the left: rev counters, manifold pressure,
  coolant temperature, oil temperature. Each engine shows its own rpm, manifold pressure and pitch (per-engine
  readings added to `instrumentReadings`).
- **Bottom left:** black cover plates and the switch box.

**Deviations from the photograph, flagged to the product owner:**
- The photographed aircraft has automatic airscrews; the C-4's are set by hand with a pitch indicator per engine
  (S24: "the two clock-like instruments on top at the extreme right of the dashboard"). The two pitch indicators sit on
  the cover plates right of the engine instruments.
- Two dials could not be identified with certainty on the photograph: the lower-left one is drawn as the altimeter
  (the fine altimeter used on the Bf 109) and the small one beside the compass as the clock.
- The flap indicator (upright, as on the Bf 109) and undercarriage lamps are added on the cover plates at the bottom
  left.
- The coolant and oil temperature gauges are not working yet (no engine heat model): their hands rest at typical
  running values.

To show the panel the Bf 110 can now be selected with key 4 (the rest of the twin controls come in Phase 3
checkpoint 2). The cockpit frame gives twins a short nose ahead of the pilot (an estimate for the view).

## D40. He 111 from the Soviet H-6/H-11 test; flying the twins (26 Oct 2026, Phase 3 checkpoint 2)

**He 111 data** (`src/aircraft/he111h.js`, `src/aircraft/jumo211f.js`): as the product owner decided at the start of
Phase 3, the He 111 is built from the Soviet 1943 test of the H-6/H-11 (S29) as a close variant for the 1940 H-3,
flagged as a deviation (more engine power than the H-3).
- **Sourced:** dimensions, weights, the level-speed table 0-8 km, climb, ceiling and turn time (S29); take-off power
  1,350 hp at 2,600 rpm (S29, S35); rated 1,020 PS and cruising 850 PS at 5,500 m (S29); direct fuel injection (S35),
  so no negative-g cut-out; fully automatic VS 11 airscrews (S36), modelled as constant-speed; wing area 87.5 m² from a
  wartime British recognition card (S34), no German figure being found.
- **Fitted:** no engine curve was found, so the Jumo 211F's two-speed full-throttle curve is fitted to S29's speeds at
  0, 2,500 and 4,000 m and the drag to 400 km/h at 5,700 m with S29's rated power (`npm run calibrate`).
- **Estimated:** airscrew diameter (3.5 m) and reduction gear, engine and wheel positions, inertia, lift and handling
  values; span efficiency 0.7 as the Bf 110 (D37). Whether the VS 11 could feather was not found, so it does not.
- **Results:** speeds within 2% to 7 km; climbs to 2-6 km within 9%; ceiling 11% low and the turn 20% quick
  (FLIGHT_VALIDATION.md item 18).

**Flying the twins in the test version:**
- Keys 4 (Bf 110) and 5 (He 111). The He 111 is AI only in the game, so it has no cockpit view, panel or gunsight; it is
  flown from the outside views with the F2 readout.
- **Engine levers** (`src/input/twinLevers.js`): the keyboard and joystick throttle move both engines; K selects both,
  left or right for the levers (throttle, rpm or pitch); L cuts or restarts the selected engine; M feathers it (Bf 110).
  Differential throttle steers on the ground. A short message confirms each key; the F2 readout shows each engine.
- **Turn time** added to the validation kinds (`turnTime` in `src/physics/performance.js`): the steepest sustained
  level turn at a speed with the power setting.

## D41. Bf 109 cockpit after the product owner's photograph of a Bf 109 E cockpit (26 Oct 2026)

**Panel superseded by D89 (1 Nov 2026).**

The product owner supplied a photograph of a preserved Bf 109 E cockpit seen from the seat, with notes. The panel
(`src/ui/bf109Panel.js`) and the cockpit frame follow it:
- **Panel:** black, with the clock at the top; altimeter, repeater compass and manifold pressure above; airspeed, turn
  and bank, rev counter and the airscrew pitch indicator (right of the rev counter) below.
- **Placed as the product owner asked:** the upright flap indicator between the compass and the manifold pressure
  gauge; the undercarriage lever (showing the selected position, EIN up, AUS down) between the turn and bank and the rev
  counter; the fuel and oil pressure gauge below the lever, normal pressures in green and low in red; the two
  undercarriage lamps to its right.
- **Magneto switch** (M1+2, M2, M1): drawn for accuracy, not working. It is on the left, as in the photograph.
- **Compasses:** N, E, S and W at the cardinal points (the Bf 110's repeater compass too).
- **Fuel and oil pressures** are not modelled physically: the gauge shows running values while the engine turns. The
  oil limits come from the Bf 110 instructions for the same DB 601A (S24); the fuel values are estimates
  (AIRCRAFT_DATA.md, "Cockpit gauge pressures").
- **Canopy:** the framed windscreen and hood as photographed: the front pane's posts and cross bar, the front arch, its
  corner braces, top rails and sills (`bf109Hood` in `src/render/cockpitFrame.js`, positions judged from the photograph).
- **Reflector sight:** the glass is centred on the line of sight, so the reticle shows in the middle of the glass; the
  Revi's leather pad is shown. The panel now takes up to 42% of the screen height so it stays below the glass.

## D42. Phase 3 sources, deviations and acceptance test agreed (26 Oct 2026, product owner)

- The wartime British recognition card (S34) is accepted as the source of the He 111's wing area.
- The He 111 deviations (FLIGHT_VALIDATION.md items 18-19) are accepted as recorded.
- **Phase 3 acceptance test:** speeds ±5%, climbs ±10%, ceilings ±5% apart from the recorded deviations; the Bf 110
  holds height on either engine with the dead airscrew feathered and does noticeably worse windmilling; the product
  owner's flight test (Bf 110 circuit, single-engine flight, Bf 109 flaps, He 111 from outside); no earlier tests broken.

## D43. Luftwaffe instruments redrawn to the product owner's reference drawings (26 Oct 2026)

The product owner supplied a sheet of drawings of Luftwaffe instruments and asked for ours to match, without adding
any. The instruments we have that appear on the sheet now follow it (`src/ui/lwFlightDials.js`):
- **Fahrtmesser Fl. 22231** (airspeed, both aircraft): its scale positions, white figures and ticks.
- **Fein-Grobhöhenmesser Fl. 22320** (altimeter, both): 0.1-0.9 round the face, whole kilometres in a two-figure
  counter below the centre (replacing the short hand), the millibar window at the top, the setting knob below.
- **Wendezeiger Fl. 22402** (turn and bank, Bf 109): a long needle pivoted near the bottom with its flag under a fixed
  index above DREHT; a white ball tube above HÄNGT; L and R; the small screws.
- **Variometer Fl. 22383** (climb, Bf 110): 0 at nine o'clock, 5, 10 and 15 m/s up and down, the black centre and the
  black m/s bar. This replaces the 30 m/s blue-faced dial drawn from the Bf 110 photograph (D39).
- **Führertochterkompass "Patin" Fl. 23338** (repeater compass, Bf 110): the turning card ring, fixed white aircraft
  and index bars. The cardinal points are N, E, S and W as the product owner asked in D41; the drawing has O for east.
- **Wendehorizont Fl. 22427** (artificial horizon, Bf 110): the scalloped bezel, the straight-sided window and the white
  horizon bar. It has no turn pointer or ball, as drawn, so the Bf 110 panel no longer shows them (they were on the
  combined horizon drawn from the photograph, D39).
- **The shared look** (`src/ui/lwStyle.js`): dark grey square mountings with domed corner screws and a tab or knob below
  where drawn, thick black bezels, charcoal faces, white markings, pale yellow hands with a dark counterweight. The
  other Luftwaffe dials (rev counter, manifold pressure, clock, pitch indicator, pressure and temperature gauges, the
  Bf 109 E's strip compass) take the same look, but their layouts are unchanged since the sheet does not show them.
- **Not added:** the sheet's directional gyro, direction finder and its control, which our aircraft do not have.

## D44. Bf 110 panel changes, TAKEOFF wording, even instrument spacing (26 Oct 2026, product owner)

- **Bf 110 turn and bank:** the Luftwaffe Wendezeiger (D43) added below the clock.
- **Bf 110 undercarriage display:** the UP/DOWN lever knob on the left (showing the selected position) and three lamps
  in a row along the bottom, green with the undercarriage down and locked, red up and locked, dark while it moves.
- **Flap indicators:** the take-off setting is labelled TAKEOFF on every flap position indicator (RAF and Luftwaffe).
  The landing labels are unchanged (LAND on the RAF panels, LANDUNG on the Luftwaffe ones).
- **Bf 110 engine gauges:** the two rows of temperature gauges became FUEL PRESSURE and OIL PRESSURE (atm, that is
  kg/cm²) for each engine, the normal range in a green band. They read each engine's own running values from the
  DB 601A gauge data (D41; oil limits from S24, fuel values estimates), and nothing when that engine stops.
- **Even spacing:** on both Luftwaffe panels every instrument and plate sits on an even grid with the same gap to its
  neighbours, none touching (Bf 110: 6 photograph pixels, flying instruments in 80-pixel cells, engine instruments in
  55-pixel cells; Bf 109: 5 pixels, 62-pixel cells, keeping the photograph's order and the product owner's positions
  for the flap indicator and undercarriage lever). The mountings' tabs and knobs below the dials were dropped where they
  would close the gaps, and the Bf 110's decorative switch box and knobs were removed to make room for the grid.
  `tests/ui/panelSpacing.test.js` checks the gaps.

## D45. Bf 110 fuel quantity gauges (26 Oct 2026, product owner)

The two blank positions below the airscrew pitch indicators became fuel quantity gauges, left wing above, right wing
below, in litres (0-700). Each wing held 375 litres in its main tank and 260 in its reserve (S24, S25), 635 in all
(`fuel.wingTank`). Fuel use is not modelled yet, so they read full.

## D46. Bf 110 engine instruments in two columns; LANDING labels (26 Oct 2026, product owner)

- **Engine instruments:** two columns, the left engine's on the left and the right engine's on the right, each from the
  top: rev counter, manifold pressure, airscrew pitch indicator, fuel quantity in that wing (litres). The fuel and oil
  pressure gauges (D44) are removed from the Bf 110. The columns keep the even 6-pixel gap (D44).
- **Flap indicators:** the landing setting is labelled LANDING on every flap position indicator, matching TAKEOFF.
- The product owner accepted the removal of the Bf 110's decorative switch box and knobs (D44).

## D47. RAF undercarriage and flap displays as on the Luftwaffe panels (26 Oct 2026, product owner)

The Hurricane and Spitfire panels now use the same undercarriage display as the Bf 110 (UP/DOWN lever knob on the left,
three lamps along the bottom, green down and locked, red up and locked) and the same upright flap position indicator
(0° at the top, fully down at the bottom, TAKEOFF and LANDING marked), titled UNDERCARRIAGE and FLAPS. The product owner
chose this knowing it is not historically correct: it reads more clearly. The two displays live in one shared module
(`src/ui/panelControls.js`) used by all four cockpits; the Bf 109 keeps its own lever and two lamps placed as the product
owner asked (D41). The old horizontal flap indicator was removed.

## D48. Compass decisions confirmed (26 Oct 2026, product owner)

- The compasses show E for east (not the reference drawing's O), with N, S and W (D41, D43).
- The Bf 109 E keeps its strip repeater compass from the product owner's cockpit photograph (D41); the Patin repeater
  compass (D43) stays on the Bf 110 only.

## D49. Engine start and stop; engines off on the ground; twin levers follow the lever position (26 Oct 2026)

- **L starts or stops the engine** on every aircraft (product owner). On the twins it acts on the engines K has
  selected: both together, or one. A started engine is turned to the starter's speed (`common.starterSpeed`, 600 rpm,
  an estimate) and runs up from there, unfeathered; no start-up sequence is modelled. It replaces the twins' engine
  cut key (also L).
- **Ground starts begin with the engines off** (product owner); the message line says to press L.
- **Twin levers follow the lever position:** the selected engines take the throttle and rpm levers' positions rather
  than their movement. With a joystick slider the movement-based version left an engine behind after K had selected
  the other, so the two could look stuck or cut (reported by the product owner). Selecting one engine with K starts
  the keyboard levers from that engine's setting so it does not jump.
- **Idle:** a slow-running engine can always draw the outside air pressure, even where the supercharger's delivery
  (which falls with engine speed) would give less. Before, the DB 601 and Jumo 211 could not hold an idle with the
  throttle closed and slowly ran down; they now settle at about 730 and 780 rpm. The only validation change is the
  Bf 109's take-off, 1 m shorter (FLIGHT_VALIDATION.md).
- A stopped engine can now come fully to rest (before, it crept at about 20 rpm).

## D50. Phase 3 signed off (26 Oct 2026)

The product owner accepted Phase 3 ("All working as planned. Sign off Phase 3"), against the acceptance test agreed in
D42:
- the Bf 110 and He 111 flight models, validated against S23 and S29 with the deviations recorded in
  FLIGHT_VALIDATION.md (items 14-19);
- single-engine behaviour of the Bf 110 as S24 and S25 describe (holds height feathered, worse windmilling,
  controllable with rudder and trim);
- the product owner's flight test, including the twin-engine controls, engine start and stop and feathering;
- no earlier tests broken (840 pass).

Also delivered during Phase 3 at the product owner's request: the Bf 109 and Bf 110 cockpits and instruments after his
photographs and reference drawings (D38-D46), the shared undercarriage and flap displays (D47) and engine start/stop
(D49).

## D51. The map: data, extent and how it is drawn (26 Oct 2026, Phase 4 checkpoint 1)

**Extent (product owner):** London to St-Omer, 50.55°N-51.65°N and 0.5°W-2.5°E (`src/world/mapExtent.js`), about
210 × 122 km. The world's origin is its centre; `src/world/geo.js` projects latitude and longitude onto the flat world
(equirectangular, axes as D5).

**Data, all public domain, no credit needed (D17):**
- **Heights, land and sea:** USGS GMTED2010, 7.5 arc-second mean elevation (about 230 × 150 m cells), tiles 50N030W and
  50N000E. `npm run build:terrain` fetches only the rows needed (HTTP range requests on the uncompressed GeoTIFFs) and
  writes `public/data/terrain.bin` (1,440 × 528 heights, 1.5 MB). The source gives the sea as 0 m: cells at or below
  0 m joined to the map's edge become sea; low land elsewhere stays land.
- **Towns and rivers:** Natural Earth 1:10m built-up area outlines (30 in the map, modern extents) and the Thames
  (`npm run build:features` writes `src/world/mapFeatures.js`).
- **Not used:** ETOPO 2022 (land from Copernicus data, which may need a credit), Mapzen/Tilezen tiles (EU-DEM and UK
  Environment Agency data need credits), OpenStreetMap (needs a credit).

**Terrain for the physics** (`src/world/terrain.js`): heights interpolated from the grid; sea where the nearest cell is
sea; each airfield levelled flat within 750 m and blended back by 1,500 m; beyond the map's edge the edge's land
carries on, sinking to sea level over 10 km. The physics uses it through the same `surfaceAt` as the Phase 2 aerodrome,
so the flight model is unchanged (`npm run validate` identical). The tests still fly in the Phase 2 world.

**Drawing** (`src/render/terrainMesh.js`, `towns.js`): chunks of 64 cells at four levels of detail by distance; colours
for built-up areas, beaches, chalk (steep slopes beside the sea: the cliffs), woods and farmland, with a field-pattern
texture close up; houses within about 9 km of the camera; the Thames as a ribbon. Airfields use the Phase 2 aerodrome
(grass square, markers, hangars) at each field's level.

**Deviations flagged:** the built-up areas are today's, much larger than in 1940; the 230 m grid softens the cliffs into
steep slopes (coloured white).

## D52. Airfield positions from the NGA gazetteer (26 Oct 2026, product owner)

The only public source found for the airfield positions is the US NGA GEOnet Names Server, which asks to be cited. The
product owner decided to use it with the citation here only: positions are "based on the Geographic Names Database"
(NGA, files for the United Kingdom and France, downloaded 26 Oct 2026). `src/world/airfields.js` lists:
- **From the gazetteer's own airfield entries:** Manston, Biggin Hill, Kenley, Rochford (listed as Southend),
  Calais-Marck (Calais Dunkerque), Saint-Inglevert and Saint-Omer (Saint Omer Wizernes, today's field; the 1940 field
  was nearby at Longuenesse).
- **From the village the airfield lay beside (to about 1 km, flagged):** Hawkinge, Lympne, Hornchurch, West Malling,
  Detling (RAF); Wissant, Marquise, Guînes, Caffiers (Luftwaffe). Two land below their real fields: Hawkinge levels at
  92 m and Lympne at 3 m, where both stood on the downs at well over 100 m.
- Which Luftwaffe fields were used in the summer of 1940 is not confirmed from an allowed source; they stand as fields
  round Calais and St-Omer.
- **Home fields in the test version:** RAF aircraft start at Hawkinge, Luftwaffe aircraft at Saint-Inglevert.

## D53. The sky: sun, haze and cumulus (26 Oct 2026, Phase 4 checkpoint 2)

- **Sun** (`src/world/sun.js`): the standard low-precision solar formulas (declination and equation of time from the
  day of the year), good to about half a degree. The default time is 15 August 1940, 14:00 GMT (15:00 British Summer
  Time), with the sun about 46° up in the south-west; the mission screen will set the time of day (Phase 7). The sky
  shader draws the sun's disc and a glow round it, and the directional light shines from it.
- **Haze:** the Phase 2 summer haze is kept (`FogExp2`).
- **Cumulus** (`src/world/clouds.js`, `src/render/clouds.js`): 420 fair-weather clouds, seeded so they are the same
  every time, over the map and 30 km round it. Each is a cluster of 4-10 flattened, flat-shaded blobs (low-polygon, in
  keeping with the style); bases 1,000-1,500 m, tops at most 2,500 m. They fade out within about 700 m of the camera,
  so flying into one is a soft white-out. They are scenery only for now (no effect on the physics).

## D54. Aircraft models (26 Oct 2026, Phase 4 checkpoint 3)

**Built in code** (`src/render/models/`): no model files or textures. Each aircraft is lofted fuselage sections, wing
and tail surfaces with an aerofoil section, nacelles, radiators and undercarriage, drawn flat-shaded and low-polygon.
- **Sizes from the aircraft data:** span, length, dihedral, airscrew diameter and hub, engine and wheel positions. The
  fuselage outlines are also kept consistent with each aircraft's crash contact points (belly, tail, wingtips) and the
  pilot's eye, so what you see touch the ground is what the physics treats as touching it. Tests check span and length
  within 5%.
- **Shapes are display estimates** (`designs.js`): fuselage depth and taper, canopies, planform curves, tail sizes and
  radiators are drawn to look right, not taken from sourced drawings. They are not aircraft data and do not enter the
  physics, so they are not in AIRCRAFT_DATA.md.
- **What makes each recognisable:** the Spitfire's elliptical wing; the Hurricane's deep, hump-backed fuselage, thick
  wing and ventral radiator; the Bf 109 E's square-cut tips, high-set tailplane and wing radiators; the Bf 110's twin
  fins, long glasshouse and engine nacelles; the He 111's glazed nose, elliptical wing and ventral gondola.

**Moving parts:** ailerons, elevators, rudders and flaps follow the control surfaces; undercarriage legs fold with the
gear (Spitfire and Bf 109 outward, Hurricane inward, the twins backward into the nacelles); airscrews show blades below
700 rpm and a disc above (faint from the cockpit). The flaps use the recorded flap travel and the elevators the recorded
up travel. **Flagged estimates:** aileron travel is drawn as 20° and rudder travel as 25° (no figures recorded), and the
elevator's down travel is drawn equal to its up travel.

**Paint and markings** (display approximations, not sourced paint data):
- RAF: Dark Earth and Dark Green above, Sky below, a Sky band round the rear fuselage; Type B roundels on the upper wings,
  A1 on the fuselage sides, fin flash.
- Luftwaffe fighters: RLM 71 and 02 splinter above with mottled sides, RLM 65 below. He 111: RLM 70 and 71 above, RLM 65
  below. Balkenkreuz on the wings (above and below) and fuselage; the swastika on the fin (D16). No unit codes (D14).
- The colours are chosen by eye to suggest the period paints; the camouflage patterns are generated, not copied from
  any particular aircraft.

**Model preview:** `modelpreview.html` (served by the dev server, not part of the built game) draws all five aircraft
side by side from one direction, with control positions set in the address, for checking the silhouettes.

## D55. Phase 4 acceptance test, and the frame-rate readout (26 Oct 2026, product owner)

**Acceptance test agreed by the product owner:**
1. A steady 60 fps on the product owner's machine in Chrome, low over Kent and manoeuvring hard near Dover, as the F3
   readout shows. (There are no other aircraft to dogfight until the AI in Phase 6, so the test is flown alone.)
2. Each of the five aircraft recognisable from its silhouette in the outside views.
3. The coast recognisable from Dover to Calais, with the cliffs, the Thames estuary and the towns; airfields where they
   were.
4. No regressions: all earlier tests pass, and `npm run validate` is unchanged.

**Frame-rate readout** (`src/ui/frameRate.js`, top line of the F3 overlay): the frame rate averaged over half a second;
the longest frame of the last second (a stutter shows here even when the average is good); the work each frame takes
(physics, scene updates and drawing commands, in ms); and the renderer's draw calls and triangles. The frame rate stops
at the screen's refresh rate, so the work time shows the headroom below the 16.7 ms of a 60 fps frame. It measures the
processor's work only; the graphics card's share shows as a lower frame rate or longer frames.

**Measured on the development machine** (Chrome, window 2,560 × 1,259, 75 Hz screen): 75 fps in every case, longest
frame 14-15 ms, work 1.5-1.9 ms, 300-390 draw calls, 310-330 thousand triangles (on the ground at Hawkinge and in the air
start over the coast, cockpit and outside views, Spitfire and He 111). With this much headroom the detail distances are
left as they are (terrain levels of detail, houses within 9 km, cloud fading). If the product owner's machine falls
short, the first steps are a lower pixel ratio, shorter house distance and coarser distant terrain; a graphics-quality
setting comes with the settings screen (Phase 7).

## D56. Yellow nose, wingtips and rudder on the Bf 109 E (26 Oct 2026, product owner)

The product owner asked for the Bf 109 E model to have a yellow engine cowling, wingtips and rudder, as in their
reference photograph (a Bf 109 E-4 in flight). In the summer of 1940 such yellow areas were applied to German fighters
as quick identification markings; the game uses them on every Bf 109 as part of its generic scheme (D14).
- **Areas:**
  - the cowling all round, underside and chin oil cooler included, back to just ahead of the windscreen (x > -0.1 m);
  - both wingtips, upper and lower surfaces, the outer 0.95 m (|z| > 4.0 m), ailerons included;
  - the whole rudder; the fin stays camouflaged and keeps the swastika.
- **Flagged:** the photograph shows a modern restoration, so the extents are judged by eye, not from a period source.
  The colour (RLM 04 yellow, 0xe0b02a) is a display approximation like the other paints (D54).
- **Not adopted from the photograph:** its pale blue-grey sides with little mottling, and its white unit number (D14).
  The Bf 110 and He 111 have no yellow.

## D57. Phase 4 signed off (26 Oct 2026, product owner)

The product owner accepted Phase 4 (world and visuals) against the acceptance test in D55, and asked for the Bf 109's
colour scheme to stay as it is (D56; the photograph's pale sides not adopted). Phase 5 (weapons and damage) is next and
starts with a plan for approval.

## D58. Instrument panel hidden when looking away in the cockpit (26 Oct 2026, product owner)

The instrument panel is a flat overlay at the bottom of the screen, so it stayed in view when the pilot looked to the
side, up or behind. At the product owner's request it now hides while the head is turned more than 20° to either side or
raised more than 20° (`PANEL_LOOK_LIMIT` in `src/render/cameras.js`), whether by the joystick hat (every hat view is
beyond this) or the mouse. Looking ahead again (releasing the hat, or a double-click) brings it back; looking down at it
never hides it. The I key still switches it off altogether, and the outside views are unchanged. The period 3D cockpits
(Phase 7) will replace the overlay.

## D59. Phase 5 plan and the product owner's choices (26 Oct 2026)

Phases 1-4 were pushed to GitHub with the product owner's permission and deployed (26 Oct 2026). The Phase 5 plan
(weapons and damage) was approved, in five checkpoints: research and data; engine heat and structural limits; guns and
ballistics; a target aircraft, hit zones and damage; visible effects and the acceptance test. The product owner chose:
- **Targets:** a target aircraft that flies straight and level on a simple autopilot (a test aid, not the Phase 6 AI),
  and a test key that damages the player's own aircraft.
- **Engine heat and structural limits:** both added in Phase 5 (coolant and oil temperatures, overheating and
  over-revving damage, g and diving-speed limits).
- **Hits:** hit zones. A round that strikes a zone (nose, cockpit, rear fuselage, tail, wing panels) damages a
  component in that zone, picked by weight with a seeded random number generator, rather than tracing every bullet
  through individual components.

## D60. Phase 5 checkpoint 1: weapons, armour, cooling and limits research (26 Oct 2026)

Recorded in AIRCRAFT_DATA.md (new sections under "Guns (Phase 5)"; sources S37-S41; gaps updated).

**Found (allowed sources):**
- **RAF:**
  - Browning Mk II 1,100 rounds/min (Ingenium museum record, S39); Hurricane 334 rounds per gun (S1).
  - Harmonisation on one point at 250 yards, and the typical gun-by-gun ammunition arrangement in the Battle (Dowding's
    despatch, S38).
  - Bullet-proof windscreen, front and rear armour (S38); the Hurricane's Linatex-covered wing tanks and its unprotected
    reserve tank (S38); the Spitfire's tanks, oil coolers and services (Pilot's Notes, S33).
- **.303 ballistics:** the official Mk VII range table from Hythe firings (Textbook of Small Arms 1929, S37), with the
  armour-piercing and tracer rounds.
- **German ballistics:** firing tables from Rechlin for the 7.92 mm armour-piercing bullet and the MG FF/M's 117 g
  shells and 92 g mine shell (S41). Round types and armour penetration from the US Army's TM 9-1985-3 (S40).
- **Engine temperatures:**
  - Merlin III coolant and oil limits (S33);
  - DB 601 oil and coolant limits and its absolute 2,400 rpm limit (manual page 47, S18);
  - the Bf 110's radiator and oil-cooler flap controls and its 650 km/h limit (S24).

**Flagged:**
- **S41's provenance:** the Rechlin tables are retyped in a compilation whose compiler and date are not stated
  (medium confidence). Each table names its origin (Rechlin measurement, or a DWM table recalculated by Rechlin).
- **Muzzle velocity disagreement:** S27 gives the MG 17 2,800 f/s (853 m/s); Rechlin measured 810 m/s for the 10 g
  armour-piercing bullet.
- **.303 muzzle velocity:** S37's Mk VII table was fired from rifles and Vickers guns; no Browning-specific figure was
  found.
- **Not found:**
  - Spitfire rounds per gun;
  - the E-4's cannon (MG FF or FF/M) and whether mine shells were in use in August 1940;
  - Luftwaffe harmonisation;
  - gun positions;
  - armour thicknesses other than the Bf 109's 8 mm;
  - German 1940 belt mixes;
  - the DB 601 coolant boiling curve;
  - g limits for all aircraft;
  - the Hurricane's diving speed limit.

**Decisions needed from the product owner** (proposals, to be confirmed before checkpoint 2 uses them):
1. **Bf 109 E-4 cannon:** the MG FF/M firing the 117 g shells at 585 m/s (S41, from a September 1940 table), without the
   mine shell (its table dates from December 1941).
2. **Spitfire rounds per gun:** the Hurricane's sourced 334, or the often-quoted 300 (not confirmed from an allowed
   source), as an estimate.
3. **Luftwaffe harmonisation** (estimate): Bf 109 and Bf 110 guns converge at 200 m.
4. **Ballistics for unsourced rounds:**
   - every 7.92 mm round flies like the Rechlin armour-piercing table;
   - the MG 17 starts at 810 m/s;
   - the Browning at the S37 Mk VII figures;
   - the MG FF/M at 475 rounds/min (middle of S27's 450-500).
5. **German belt mix** (estimate): armour-piercing, incendiary and incendiary-observing rounds in turn, with no
   separate tracer, for the MG 17. The MG FF/M drum alternates HE-incendiary and HE-tracer.
6. **DB 601 coolant limit** (estimate): 115 °C at sea level, falling with height as the pressure falls. S21 saw over
   120 °C in sustained turns.
7. **g limits** (estimates):
   - fighters damaged beyond 9 g and broken beyond 13 g;
   - Bf 110 7 g and 10.5 g;
   - He 111 4.5 g and 7 g.
8. **Hurricane diving limit** (estimate): 390 mph IAS.
9. **Armour** (estimate): RAF rear armour taken as the same 8 mm as the Bf 109's. It stops rifle-calibre ball and
   incendiary rounds, but not armour-piercing rounds at short range (S37: 10 mm at 100 yards).

## D61. Phase 5 estimates accepted (26 Oct 2026, product owner)

The product owner accepted all nine proposals of D60. They are estimates, recorded as such in AIRCRAFT_DATA.md as each
is used:
1. Bf 109 E-4 cannon: MG FF/M with the 117 g shells at 585 m/s; no mine shell.
2. Spitfire I: 334 rounds per gun, the Hurricane's sourced figure.
3. Luftwaffe guns converge at 200 m.
4. All 7.92 mm rounds fly like the Rechlin armour-piercing table, starting at 810 m/s. The Browning uses the S37 Mk VII
   figures. The MG FF/M fires 475 rounds/min.
5. German belts: MG 17 armour-piercing, incendiary and incendiary-observing in turn; MG FF/M drums alternate HE-incendiary
   and HE-tracer.
6. DB 601 coolant limit 115 °C at sea level, falling with height.
7. g limits:
   - fighters damaged beyond 9 g and broken beyond 13 g;
   - Bf 110 7 g and 10.5 g;
   - He 111 4.5 g and 7 g.
8. Hurricane I diving limit 390 mph IAS.
9. RAF rear armour taken as 8 mm, like the Bf 109's.

## D62. Engine heat and structural limits (26 Oct 2026, Phase 5 checkpoint 2)

**Engine heat** (`src/physics/cooling.js`):
- **Model:** each engine has a coolant and an oil temperature, each one lumped mass.
  - Heat comes in with the engine's power, plus a little at idle.
  - It goes out through the radiator in proportion to the temperature above the outside air and to the air flowing
    through. That flow is the free stream plus the airscrew's slipstream (to the 0.8 power), times the radiator flap
    opening.
- **How the constants were set:** each aircraft has two calibration conditions in its data file (estimates; no
  radiator data were found):
  - a full-power climb at the model's best-climb speed with the radiator open settles just under the limit (Merlin
    110 °C; DB 601 105 °C);
  - a 60% cruise at 100 m/s with the radiator closed settles under the Merlin's 95 °C cruising limit.
  The conductances and the closed flap's share (0.56-0.63) are solved from these, not chosen.
- **Consequences** (checked by tests):
  - closing the radiator at climb power, using the Merlin's +12 lb boost at climbing speed, or holding full power on
    the ground overheats the engine;
  - full power on the ground seizes it after about five minutes;
  - an engine that loses its coolant seizes about a minute later (the glycol leak of checkpoint 4).
- **Wear and seizure:**
  - running over a coolant or oil limit, or past the diving rpm limit, wears the engine;
  - wear costs power after 30% and seizes the engine at 100%;
  - a seized engine gives no power, its airscrew stops, and it cannot be restarted;
  - coolant 15 °C over its limit boils away.
- **Starting temperatures:**
  - air starts begin at the temperatures of their flight;
  - ground starts at 60 °C coolant and 40 °C oil, as after a run-up.
- **Radiator control:** O still opens and closes the radiators (all engines). The Bf 110's 9-position switches (S24)
  are not modelled separately yet.
- **Readouts:**
  - coolant and oil temperatures in the text strip (F2) and per engine in F3, with wear and coolant left;
  - a warning on the message line when an engine runs past a limit, and a notice when one seizes.
- **Flagged: no panel gauges yet.** The temperature gauges are not on the panels: the Luftwaffe panels are laid out
  from the product owner's photographs, which are needed to place them. This is a deviation from the checkpoint 2 plan
  ("gauges on every panel"), for the product owner to decide.

**Structural limits** (`src/physics/structure.js`):
- **g:** past each aircraft's damage limit the skin wrinkles, giving up to 30% more parasite drag; the worst damage
  stays. At the failure limit the wings fail and the flight ends. Negative-g limits are half the positive ones
  (estimate, flagged).
- **Diving speed:** past the diving limit the control surfaces flutter, lose their effect and tear away in about five
  seconds at 10% over. The He 111 has no limit found, so no flutter.
- **Validation:** an undamaged aircraft is untouched: the flight model's numbers are identical and
  `npm run validate` is unchanged.

**Correction to checkpoint 1 (D60):**
- **Ratings:** 23 of its AIRCRAFT_DATA rows were rated "high" on a single source that is not a museum record, against
  the project's rule (high needs two sources or a museum record). They are now "medium"; the Spitfire Pilot's Notes
  (S33, a museum record) and the Ingenium record (S39) keep "high".
- **Leftover rows:** an editing slip had left the old guns table's rows behind as duplicates; they are removed.
- **New rows:** every new data value of checkpoint 2 has its own row in its aircraft's or engine's section.

## D63. Coolant and oil temperature gauges on the panels (26 Oct 2026, product owner)

Placed as the product owner asked:
- **Spitfire and Hurricane:** an oil temperature gauge (0-100 °C) to the right of the rev counter, with the radiator
  temperature gauge (40-140 °C) below it. The panel widened to fit.
- **Bf 109:**
  - **Swap:** the oil pressure gauge and the undercarriage lamps changed places, putting the pressure gauge under the
    rev counter and the lamps under the undercarriage lever.
  - **New row:** a row below the lower panel (the product owner's choice) holds the oil and coolant thermometers
    (0-130 °C), the pressure gauge's size. They are centred as a pair under the rev counter and the pitch indicator,
    keeping the even gaps (D44).
  - **Panel size:** the panel grew taller. Its top stays below the sight glass (D41), so the dials are about 16% smaller
    than before.
- **Bf 110:** a combined gauge below each engine's fuel gauge, oil on the left half and coolant on the right (0-130 °C
  each), with the normal ranges in green:
  - oil 90-100 °C (the DB 601 manual's normal outlet range, S18);
  - coolant 75-105 °C: from the manual's normal inlet temperature (S18) to 10 °C under the 115 °C limit (D61). Flagged:
    the top end is an estimate.
- **Scales:** all the scale ranges are display choices, not from photographs of the period instruments.

## D64. Bf 109 panel rearranged, its ammunition counter, and the Bf 110 sized like the Bf 109 (27 Oct 2026, product owner)

**Superseded by D89 (1 Nov 2026):** the Bf 109 panel is redrawn and the ammunition counter removed (the Bf 109 E had none); the Bf 110 keeps this size until its redraw.

**Bf 109** (supersedes D63's Bf 109 placement), as the product owner asked:
- **Moves:**
  - the airscrew pitch indicator is now the small gauges' size, beside the rev counter;
  - the fuel and oil pressure gauge moved up beside the manifold pressure (ata) gauge;
  - the oil and coolant thermometers sit side by side under the rev counter (their choice), with the undercarriage
    lamps under the lever to their left.
- **Panel size:** the extra bottom row of D63 is gone, so the panel is back to its D41 height and its dials to their
  earlier size. Every instrument keeps the even 5-pixel gap (D44).
- **Ammunition counter:** placed above the altimeter, drawn after the product owner's photograph (`src/ui/ammoCounter.js`):
  - the guns' EIN/AUS switch, three counter columns with round windows, scales marked 500 with white tapes, push buttons
    and label plates;
  - columns: left MG 17, cannon, right MG 17 (the product owner's choice);
  - until the guns are wired in checkpoint 3, the tapes read full and the switch shows EIN.
  - **Flagged:**
    - which gun each column showed is not confirmed from a source;
    - the photograph's scales read 500, while the E-3 carried 1,000 rounds per MG 17 (S16) and 60 per cannon drum, so
      the tape shows the fraction of rounds left.

**Bf 110:**
- **Size:** its panel is now drawn at the Bf 109's scale. Its large dials come out exactly the size of the Bf 109's
  (`matchBf109` in `src/ui/bf110Panel.js`; `panelRadius` in `src/ui/instruments.js`).
- **Engine dials:** these keep their own grid and are about 9% smaller than the Bf 109's small gauges.

## D65. How the Bf 109 ammunition counter works (27 Oct 2026, product owner)

- **Tapes:** each white tape is full at its gun's full load and shortens in proportion as the gun fires: the MG 17s
  from 1,000 rounds each (S16), the cannon from its 60-round drum. This is the product owner's choice: the photograph's
  500 marking is kept as drawn, without implying a 500-round load.
- **Windows:** the round window above each tape turns with every round counted, so it spins while that gun fires and
  stands still when it stops. The 0.21 rad per round (about 3.5 rad/s for an MG 17) is a display choice, kept with the
  drawing code (`src/ui/ammoCounter.js`).
- **Wiring:** the counter reads each gun's `{ rounds, capacity }` from the simulation (`sim.guns.mg17Left`, `cannon`,
  `mg17Right`). Checkpoint 3 adds the guns that fill it; until then it reads full and still. Tested in
  `tests/ui/ammoCounter.test.js`.
- **Lights:** the plates at the foot of the columns are the lights: white while the gun has rounds, red when it is empty
  (product owner, 27 Oct 2026). The round lights first drawn under the tapes were black on black at the counter's size,
  so they are removed.
- **Tape length:** each full tape runs down to just above its plate, a thin gap clear of it (product owner, 27 Oct 2026).

## D66. OBEN / UNTEN and "GEAR" on the Luftwaffe undercarriage indicators (27 Oct 2026, product owner)

**Since D89 (1 Nov 2026):** the Bf 109 shows the real undercarriage selector (Fahrwerk Ein / Ruhe / Aus); the Bf 110 keeps OBEN / UNTEN.

- **Bf 109:**
  - its undercarriage lever reads OBEN (up) at the top and UNTEN (down) at the bottom, in place of EIN and AUS;
  - its two lamps read UNTEN (green: down and locked) and OBEN (red: up);
  - the lamps' plate is captioned GEAR.
- **Bf 110:** the undercarriage display reads OBEN and UNTEN and is titled GEAR, in place of UP/DOWN and FAHRWERK.
- **Unchanged:**
  - the RAF panels keep UP, DOWN and UNDERCARRIAGE;
  - the ammunition counter's gun switch keeps EIN and AUS, as in the photograph (it is not an undercarriage
    indicator).
- **Tests:** `tests/ui/gearLabels.test.js` draws each panel on a recording canvas and checks the words.

## D67. Guns and ballistics (27 Oct 2026, Phase 5 checkpoint 3)

**Since D94 (1 Nov 2026):** in the Bf 109's front view the MG 17s flash on the drawn coaming; the guns' positions are unchanged.

**Ballistics** (`src/weapons/ballistics.js`):
- **Model:** each round flies with gravity and air drag, with the ISA density and speed of sound at its height.
- **Drag:** each round's drag against Mach number is fitted to its sourced range table (`npm run fit:ballistics`):
  - the .303 Mk VII to the Hythe table (S37);
  - the 7.92 mm and the 20 mm FF/M 117 g shell to Rechlin's firing tables (S41).
- **Result** (the Phase 5 acceptance figures, `tests/weapons/ballistics.test.js`): at sea level, velocities within
  0.5% and the German times of flight within 0.003 s out to 600 m (600 yd for the .303); drops within about 8%.
- **Flagged:** every .303 round flies like Mk VII ball and every 7.92 mm round like the AP table (D61). The Browning's
  own muzzle velocity was not found; the Mk VII table's 2,440 ft/s (rifles and Vickers guns) is used.

**Guns** (`src/weapons/guns.js`, data in each aircraft's `guns` and `src/aircraft/ammunition.js`):
- **Rates:**
  - Browning 1,100 rounds/min (S39);
  - MG 17 1,000 synchronised (Bf 109) and 1,100 unsynchronised (Bf 110) (S27);
  - MG FF/M 475 (D61).
- **Ammunition:**
  - 334 rounds per Browning (S1; Spitfire D61): about 18 s of fire;
  - 1,000 per MG 17;
  - one 60-round drum per cannon: about 7.6 s.
- **Rounds:** each round leaves the muzzle with the aircraft's velocity (and its rotation's) added.
- **Recoil:** about 1.2 kN for eight Brownings; it acts only while firing, so `npm run validate` is unchanged. The
  propellant gases' share is left out.
- **Harmonisation:**
  - each gun's bore is aimed so its rounds cross the sight line (the pilot's eye along the body axis) at the
    harmonisation range in level flight, allowing for their drop;
  - RAF 250 yd (S38); Luftwaffe 200 m (D61).
- **Belts:**
  - RAF guns each carry one kind of round, as Dowding's arrangement (S38): 2 old-type incendiary, 1 de Wilde, 2 AP and
    3 ball. Which gun carries which is an estimate (the outer pair incendiary);
  - the MG 17 belts cycle AP, incendiary and observing; the MG FF/M drums alternate HE-incendiary and HE-tracer (D61).
- **Flagged:**
  - the gun positions are estimates placed on the model's airframe (no drawings found);
  - the Bf 110's rear MG 15, the He 111's guns and the Bf 110's in-flight drum changes come with the crews in Phase 6.

**Controls:**
- **Keyboard:** Space fires the machine guns (all eight on the RAF fighters), Enter the cannon.
- **Joystick:** the trigger fires the machine guns, the thumb button the cannon. The mapping moves to version 3:
  saved axes and buttons are kept, and the firing buttons added.

**Display:**
- **Tracers:** the 20 mm tracer shells draw short bright streaks for their 1.8 s burn (S40).
- **Smoke:** the RAF's old-type incendiary leaves grey smoke trails (S38's "smoke-tracer effect"; length an
  estimate).
- **Other rounds:** unseen by day.
- **Muzzle flashes:** at the guns while they fire.
- **Readouts:** rounds left in F2 and F3.
- **Ammunition counter:** the Bf 109's counter (D64, D65) now follows its guns.

Measured in Chrome while firing: 75 fps (the screen's limit), 3.5 ms of work per frame.

**Bf 109 cowling guns moved** (27 Oct 2026, product owner):
- **Problem:** their muzzle flashes showed inside the Revi's glass. Moved below it, they were hidden by the coaming.
- **Product owner's choice:** show them either side of the glass. The MG 17 muzzles are at the front of the cowling,
  spread to x 2.1, y 0.40, z ±0.37 m (estimates; the real guns sat closer together, flagged).
- **Flashes:** drawn 0.1 m ahead of every muzzle, the machine guns' smaller than before (0.06 m; cannon 0.25 m).
- **Result:** from the cockpit each flash shows just outside the glass's sides (it covers about ±5.7°), above the
  coaming.
- **Harmonisation:** the guns are re-harmonised on the sight line at 200 m from their new positions.

**Muzzle flash colour** (27 Oct 2026, product owner): yellow (0xffcc00), drawn with normal blending so the sky no
longer washes it white. The tracers keep their warm white (S40).


## D68. Target aircraft, hit zones and damage (27 Oct 2026, Phase 5 checkpoint 4)

**Target aircraft** (`src/core/target.js`, `src/core/autopilot.js`): a test aid, not the Phase 6 AI.
- **Key Y** puts a target 400 m ahead, at the player's heading and height (at least 300 m above the ground). Further
  presses step through the five types, then none.
- **How it flies:** it flies its own full flight model. An autopilot moves only its normal controls: pitch for height,
  small banks (up to about 15°) for heading, throttle for speed. It cruises at its level speed for 60% throttle, so it
  never dodges or fights. Its gains are in `common.autopilot`. The test holds each type within 30 m, 3° and 5 m/s for a
  minute.
- **Damage shows in its flight:** the autopilot has no more authority than a pilot. Cut cables lose that control, a
  damaged wing panel rolls it, a dead engine sinks it, and a dead pilot freezes its controls.
- **Removed:** when it breaks up, burns or reaches the ground ("Target destroyed: ..."). Its hits and damage show in F3.
- **Flagged:** it holds its own cruising speed. From the slow approach start (N once) it pulls away. Use the air start
  (N twice), which is faster than every target's cruise.

**Hit zones** (`src/weapons/hitZones.js`, sizes in each aircraft's `hitZones`):
- **Zones** (boxes in the aircraft's body axes):
  - engine, cockpit, rear fuselage and tail along the fuselage (the He 111's glazed nose counts as the cockpit);
  - inner and outer panels of each wing (inner to 45% of the semispan);
  - an engine nacelle on each wing of the twins.
- **Detection:** each round's path over a step is tested in the aircraft's body axes, allowing for the aircraft's own
  motion. The first box crossed is the hit.
- **Rounds:** a round never hits the aircraft that fired it. It is removed when it hits.
- **Sizes:** taken from the aircraft models (D54), with no structural drawings. All are estimates, recorded in
  AIRCRAFT_DATA.

**Damage** (`src/weapons/damage.js`, constants in `common.damage`, all estimates: no measured vulnerability data was
found):
- **Choosing what is hit:** each kind of zone holds components by weight. A zone with a tank, radiator or oil cooler
  (each aircraft's `systems`) adds those. A seeded random number generator per aircraft picks one, so a test repeats
  exactly.
- **Round strength:** rifle-calibre rounds count 1. The 20 mm HE shells count 5 and also strike a second component.
- **Effects** (each through the existing models):
  - engine: wear (D62), then power loss and seizure;
  - coolant or oil hit: a leak. The heat model then overheats and seizes the engine (coolant), or the engine wears out
    once the oil is low (about 30 s with none left);
  - fuel tank: incendiaries can start a fire. The chance is 30% for a plain tank, 15% for Linatex and 5% for a
    self-sealing tank. A fire burns for 30 s, then the aircraft breaks up (no extinguishers modelled);
  - pilot: rear armour (RAF 8 mm, D61; Bf 109 8 mm, S38) stops rounds from within 60° of dead astern. Armour-piercing
    rounds get through above 650 m/s (S37: the W Mark I pierces 10 mm at 100 yd), so at short range. Wounds add up to
    death, which freezes the controls;
  - cables: a cut takes that control away;
  - aileron, elevator or rudder: each hit loses some of its effect;
  - wing panel: it loses lift (up to 60%) and gains drag, so the aircraft rolls and yaws towards it. At full damage
    the wing breaks;
  - tail structure: failure destroys the aircraft;
  - undercarriage or flaps: jammed where they are.
- **An undamaged aircraft** flies exactly as before; `npm run validate` is unchanged.

**Where the systems are:**
- **Spitfire:** the tanks ahead of the cockpit, the radiator under the starboard wing, the oil cooler under the port
  wing (S33).
- **Hurricane:** Linatex wing tanks and an unprotected fuselage reserve tank (S38); ventral radiator.
- **Bf 109:** the tank under and behind the pilot; wing radiators.
- **Bf 110:** self-sealing wing tanks (S24, S25).
- **He 111:** self-sealing wing tanks (S38: German bombers' tanks were good).

**Flagged:**
- **Spitfire tank:** modelled as plain, since it was not found to be self-sealing in 1940.
- **Bf 109 tank:** self-sealing assumed.
- **Armour:** the Bf 110 C-4 and He 111 carry none (no data; the RAF-tested Bf 110 had none, S25).
- **Estimates:** all hit-zone sizes, system positions, weights and damage amounts.

**Test key 9:** a 20 mm HE hit on the player's own aircraft. It hits, in turn, the coolant, the engine, the oil, an
outer wing, the tail, the cables and the pilot, and a notice names each one. Rounds can hit the player's aircraft too,
ready for the Phase 6 gunners.

**F3:**
- the target's type, range and bearing from the nose (for example "12° left 3° up"), hits taken, damage and last hit;
- the player's own damage.

**Checked in Chrome:** from 250 m dead astern, about 2 s of the Spitfire's fire hit a Hurricane target 56 times. The
hits took away its elevator and rudder, damaged its tail by 60%, and wore its engine. The coolant then drained, and
with no elevator it climbed away out of control. Key 9 hits the coolant, engine, oil and wing in turn. 75 fps, no
console errors. With the product owner's joystick plugged in, the joystick's axes take over the keyboard's stick and
rudder, as designed.

**Product owner's answers** (27 Oct 2026):
- the D68 estimates are accepted;
- the Spitfire's plain tank, the Bf 109's assumed self-sealing tank, and no armour in the Bf 110 and He 111 are
  accepted;
- the target keeps its own cruising speed.

## D69. Visible damage, wrecks and the Phase 5 acceptance test (27 Oct 2026, Phase 5 checkpoint 5)

**What a damaged aircraft gives off** (`src/weapons/effects.js`, from its damage state, placed in its hit zones so a
trail starts where the hits went in):
- **Glycol:** white vapour, from under the radiator's zone, while the coolant leaks:
  - Spitfire: under the starboard wing;
  - Hurricane: under the belly;
  - Bf 109: both wing radiators;
  - twins: the radiators of the engine that was hit.

  Coolant boiling off past its limit (the heat model's `boilMargin`) vents the same vapour. Overheating shows this way,
  not as smoke.
- **Oil:** a thin dark trail, from under the oil cooler's zone.
- **Engine smoke:** from the engine or nacelle once it is badly worn (from 30% wear), black at seizure.
- **Fire:** flames and thick black smoke, from under the zone where it started. The zone is now kept with the fire.

**Drawn as particles** (`src/render/particles.js`, `src/render/effects.js`):
- **Pools:** two, one for smoke and vapour and one for glowing flames and flashes, with 7,000 particles in all and 2
  draw calls.
- **How they move:** particles are laid in the air along the emitter's path, nearly still, so the aircraft leaves a
  trail behind it.
- **Strikes:**
  - 20 mm shells: an orange-white flash and a dark puff;
  - incendiary and observing rounds: a small yellow flash;
  - ball and AP: a small grey puff.
- **Crashes:** a crash faster than 30 m/s gives a fireball and a column of black smoke that rises for 45 s.
- **Looks:** all colours, sizes, rates and lifetimes are display choices, labelled as such in the code.

**Fixed while checking:** the renderer's logarithmic depth buffer needs its depth chunks (and Three.js's `common`
chunk) in the particle shader. Without them, every particle with land behind it was hidden. A test now checks that
the chunks are there.

**Wrecks and parts breaking off** (`src/core/wreck.js`, `src/core/losses.js`, `src/render/wrecks.js`):
- **Model:** each aircraft model now has its wing halves (`wingLeft`, `wingRight`, with their ailerons, flaps,
  markings, legs and, on the twins, nacelles and airscrews) and its tail (`tail`, with the fin markings) as separate
  groups. It looks the same.
- **What comes off:** each failure now records the parts it takes off:
  - a broken wing: that wing half;
  - the tail;
  - over-g: both wings;
  - a fire: the wing half it burned in, the tail if it was in the fuselage, nothing if it was in a single's engine.
- **The wreck:** a broken aircraft is no longer flown on the flight model. It becomes a wreck that falls under gravity
  and air drag, turning the way the loss would turn it:
  - a lost wing rolls it towards that side;
  - a lost tail pitches it nose down;
  - otherwise it tumbles slowly.
- **The debris:** each lost part falls on its own, slower and tumbling, from where it was on the aircraft.
- **Constants:** in `common.wreck`, all estimates with no source, recorded in AIRCRAFT_DATA:
  - wreck terminal speed 90 m/s;
  - part 35 m/s;
  - roll 3.5 rad/s;
  - pitch 2.5 rad/s;
  - tumble 0.6 rad/s;
  - parts 4 rad/s.
- **Flagged simplification:** an outer-panel failure takes the whole wing half off.
- **The target:**
  - broken up, it becomes a wreck and debris ("Target destroyed: ...");
  - with its pilot killed, it flies on, on its own flight model with frozen controls, until the ground ("Target's
    pilot killed", then "Target crashed");
  - a dead pilot's aircraft can still break up.
- **The player:** the flight ends as before, with "... — press R to restart".
  - A broken aircraft falls as a wreck, with its lost parts tumbling away, and the view moves from the cockpit to the
    outside view.
  - With the pilot killed, the aircraft flies on, uncontrolled, to the ground.
  - The target and the rounds in flight carry on meanwhile.

**Checked in Chrome** (with the joystick switched off in the test tab only, as its twist grip gave 15% rudder):
- glycol, oil, engine smoke, flames and fire smoke trail from the right places, seen against both sky and land;
- 20 mm strikes leave dark puffs;
- a target's wing comes off and the pieces fall away;
- the player's wreck rolls down without its left wing, in the outside view;
- crash fireballs and smoke columns show;
- 75 fps (the screen's limit) with every effect showing, 1.9 ms of work per frame, and no console errors after the
  shader fix.

**For the product owner to judge in the acceptance test:** a 2-second burst of a Spitfire's eight Brownings from 200
m dead astern broke a Bf 109's tail off. The tail-damage rate (`damage.tailDamage`, D68) is an estimate and can be
lowered if that is too quick.

**Proposed Phase 5 acceptance test:**
1. `npm test` passes, including bullet drop and time of flight against the sourced tables (D67).
2. In each fighter, from the air start, shoot a target (Y): hits are counted in F3, and strikes show.
3. A coolant hit gives a glycol trail, then the engine overheats and seizes, and the target goes down.
4. Wing hits roll the target. With enough hits the wing breaks off and the wreck spins down to a crash and a smoke
   column.
5. Incendiaries into a tank start a fire, then break-up.
6. Key 9 on your own aircraft:
   - coolant: glycol visible from outside (V), the temperature climbs, then the engine seizes;
   - wing: the aircraft rolls;
   - cables: a control goes dead.
7. 60 fps or more while firing with trails showing, and no console errors.

## D70. Joystick neutral calibration (27 Oct 2026, product owner)

**Problem:** the product owner's Extreme 3D Pro reads 0.15 on axis 5 (the twist rudder) when hands-off and centred.
That is outside the 0.05 dead zone, so every aircraft got about 15% right rudder and yawed right in hands-off flight.

**The fix:** the joystick panel (J) has a **Set neutral** button for each of axes 0-5, plus **Set all neutral (hands
off)** and **Clear neutral settings**.
- **What it stores:** the axis's present reading, as its centre, saved with the mapping in browser storage.
- **How it reads:** the axis then reads 0 at that centre. Each side is stretched separately, so full travel still
  gives ±1 (full rudder both ways).
- **Display:** the panel's bars show the calibrated reading and the stored centre.
- **What's left alone:** the throttle slider (axis 6) and the hat (axis 9) aren't calibrated.
- **Limit:** a centre is limited to ±0.9.
- **Reset to default** clears the centres too.

**Checked in Chrome** with the product owner's stick, which read 0.17 on axis 5 at the time:
- Set neutral made it read 0.00;
- 8 s of hands-off flight then gave 0% rudder and no change of heading.

The product owner's saved settings were then restored as they were, for them to set their own neutral.

## D71. Joystick sensitivity for the flight controls (27 Oct 2026, product owner)

**What it is:** the Roll, Pitch and Rudder rows of the joystick panel (J) each have a sensitivity choice. It's a
response curve, output = sign(x)·|x|^k, applied after the dead zone and the neutral setting (D70).

| Choice | k | Half stick gives |
|---|---|---|
| Very high | 0.6 | 66% |
| High | 0.8 | 57% |
| Normal (the default) | 1.0 | 50%, the straight line used before |
| Low | 1.5 | 35% |
| Lower | 2.0 | 25% |
| Lowest | 2.5 | 18% |

**Why a curve, not a cut in travel:** full stick always gives full control, so no aircraft loses any control travel
and the flight model is untouched. Lower settings soften small movements, for fine aiming and steady flight.

**Stored:** the choices are saved with the joystick mapping in browser storage. Older saved mappings read as Normal.

**Not included:** the throttle slider and the hat.

**Status:** these are feel choices, not aircraft data. Checked in Chrome: the dropdowns work and are kept after a
reload. The product owner's saved settings, including their axis 5 neutral, were restored afterwards.

## D72. Joystick dead zone for each flight axis (27 Oct 2026, product owner)

**Problem:** the aircraft still yawed right hands-off, the twins included. The product owner's saved neutral for axis
5 was 0.004, set while the twist happened to rest near 0.00. The twist also rests at 0.15 or 0.17 at other times: it
doesn't settle in the same place each time it's let go. A single neutral (D70) can't cover that, and the fixed 5% dead
zone let about 10% right rudder through.

**The fix:**
- **Dead zone choice:** the Roll, Pitch and Rudder rows of the joystick panel (J) each have a dead zone choice of 5%
  (the default, as before), 10%, 15%, 20%, 25% or 30%. It's the band about neutral that gives no input.
- **Full travel kept:** outside the band the travel is stretched, so full stick still gives full control.
- **Order:** neutral (D70), then dead zone, then the sensitivity curve (D71).
- **Live readout:** each row shows what the aircraft receives now ("rudder now 0%").
- **Stored:** saved with the mapping. Older saved mappings read 5%.

**Checked in Chrome** with the product owner's stick:
- with the twist resting at 0.15, "rudder now" read 10% at 5% and 0% at 20%;
- in the Bf 110, 10 s hands-off then gave 0% rudder, 0.0° sideslip and heading 359° from 0°.

The product owner's saved settings were restored afterwards.

**Help text:** it now says rudder trim (, and .) is on the Spitfire, Bf 110 and He 111. It said Spitfire only.

## D73. Rigging solved so every aircraft flies straight hands-off at the air start (27 Oct 2026)

**Problem:** the product owner found every aircraft rolling gently hands-off, whatever joystick neutral was set. The
joystick was clean (axes 0 and 1 read 0.001, F3 showed 0% stick). The roll came from the aircraft. With no joystick at
all, from the air start (1,500 m, 110 m/s, level-flight throttle), the bank after 30 s was:

| Aircraft | Bank after 30 s |
|---|---|
| Hurricane | 1.2° left |
| Spitfire | 1.6° right |
| Bf 109 | 11.0° right, turning 50° in a minute |
| Bf 110 | 6.4° left |
| He 111 | 8.8° left |

**Cause:** the fixed rigging against engine torque (`aero.rollRig`) and the fin offset or ground-set tab against
slipstream swirl (`aero.yawRig`) are meant to cancel exactly at the air start (D25, D26: under 2° in 30 s).
- The values were rounded estimates.
- Later recalibrations changed the torque and swirl: the Bf 109 from the RAE report (D30), and the twins' engines and
  airscrews.
- The slow spiral magnifies a small error: 6% on the Bf 109's roll rigging gave 11° in 30 s.
- Measured at old commits, the drift has been the same since Phase 3 checkpoint 2.
- No test checked it, so it went unnoticed.

**The fix:**
- **Solver:** `npm run fit:rig` (`scripts/fitRig.mjs`, `src/dev/rigging.js`) solves each aircraft's two rig values
  with the full flight model, so no roll or yaw builds up from the air start. A rigger sets a real aircraft the same
  way: wings level and the ball centred at cruise.
- **New values** (estimates, solved):

| Aircraft | rollRig | yawRig |
|---|---|---|
| Hurricane | 0.002119 (was 0.0021) | 0.001156 (was 0.00116) |
| Spitfire | 0.001776 (was 0.0018) | 0.0009217 (was 0.00092) |
| Bf 109 | −0.002231 (was −0.0021) | −0.001464 (was −0.00146) |
| Bf 110 | −0.001402 (was −0.00153) | −0.0005885 (was −0.00059) |
| He 111 | −0.0007952 (was −0.00105) | −0.0002062 (was −0.00037) |

- **Result:** the hands-off bank after 30 s is now under 0.05° for the four fighters and 1.3° for the He 111. It flies
  the air start's 110 m/s near its top speed and is still settling.
- **Flagged:** the He 111 was rigged at 90 m/s. It is now rigged at the air start, like the others.
- **Test:** `tests/physics/rigging.test.js` checks that each aircraft holds its bank within 2° and heading within 3°
  for 30 s hands-off, and that its data matches a fresh solve within 2%. A later flight-model change that upsets the
  balance now fails the tests.

**Validation:** `npm run validate` moved only slightly, since rigging adds small constant moments:
- Bf 109 roll pb/2V: −15.1% to −15.2%;
- Bf 109 time to 45° bank: 1.24 s to 1.26 s;
- Bf 109 landing distance: +6.3% to +6.2%;
- RAF roll calibrations: by 0.1%.

FLIGHT_VALIDATION.md is updated. In `npm run handling` every stall-drop and spin direction is unchanged.

**What stays as it is (realistic):** away from the rigged speed and power, torque and swirl no longer cancel, so the
aircraft wants to roll or yaw a little. At full throttle (once the joystick's throttle slider is moved, it takes over)
or in climbs and dives, the pilot holds it with stick and rudder, or rudder trim on the Spitfire, Bf 110 and He 111,
as in the real aircraft.

**Checked in Chrome:** the Bf 109 hands-off from the air start for 30 s held heading 360°, 1,500 m and wings level, with
0% stick.

## D74. Elevator trim display on the four flyable panels (27 Oct 2026, product owner)

**Since D89 (1 Nov 2026):** removed from the Bf 109's panel (the real E's trim was a handwheel beside the seat).

**The display:** an upright plate, like the flaps display.
- "ELEVATOR TRIM" at the top, "NOSE UP" above the scale and "NOSE DOWN" below it, in English on every panel as the
  product owner asked. On narrow plates each phrase goes on two lines.
- A scale from 15° nose up at the top to 15° nose down at the bottom, a tick every 1°, figures every 5°, and a bold 0
  at neutral.
- A white pointer at the present trim.

**Placement** (the product owner's choice):
- **Hurricane and Spitfire:** on the left, beside the undercarriage and flaps displays, their full height.
- **Bf 109:** on the left edge, in place of the red push button, beside the magneto switch, with the panel's usual
  5-pixel gap (D44).
- **Bf 110:** right of the turn and bank indicator, from its top to near the panel's foot, with the usual 6-pixel gap
  to it and to the engine instruments.

**Flagged:** ±15° is a display scale for the full trim range (trim setting × 15), as asked. It isn't a measured angle
of any aircraft's trim tab or tailplane: none was found.
- The Bf 109 and Bf 110 trim by moving the tailplane.
- The RAF fighters trim by an elevator tab.
- At the air start the pointer shows the solved trim, about 2° nose down.

**Tests:** `tests/ui/trimDisplay.test.js` checks the reading, scale and pointer, and each placement. The Bf 109's
magneto switch and placard and both Luftwaffe trim plates are now in the panel spacing check.

**Checked in Chrome:** all four panels, readable and clear of their neighbours. Holding T moves the pointer towards
NOSE UP. No console errors.

## D75. Phase 5 signed off (27 Oct 2026, product owner)

**The product owner's verdict:** Phase 5 (weapons and damage) passes its acceptance test, and they asked for it to be
pushed and Phase 6 started.

**Their remarks:**
- The flight controls are "mostly good. Could be better but good enough".
- Hands-off flight still needs some pilot input to keep straight and level. That's expected away from the rigged
  condition (D73): other throttle settings, speeds and heights.

**Kept as it is:**
- the tail-damage estimate (D68): a 2-second burst from 200 m dead astern can break a Bf 109's tail off;
- the D68 and D69 estimates and display choices.

Phase 5 was pushed to GitHub with the product owner's permission (27 Oct 2026).

## D76. Phase 6 plan and the product owner's choices (27 Oct 2026)

The Phase 6 plan (AI pilots and gunners) was approved in five checkpoints:
1. research and data (MG 15, gun arcs, drums, crew positions, formations, tactics);
2. many aircraft in the simulation, and the AI pilot's flying skills;
3. fighter behaviour, tactics and formations;
4. bombers and air gunners;
5. skill levels and the acceptance test.

**The product owner chose:**
- **Testing before Phase 7's menus:** scenario keys in the test flight: 6 for fighter scenarios, 7 for a bomber
  formation with escorts (or, for a Luftwaffe player, RAF fighters attacking He 111s), 8 for the skill level, 0 to
  clear.
- **Skill levels:** three, Novice, Regular and Ace. Each sets reaction time, aim error, energy management, aggression
  and willingness to disengage.
- **Enemies only** in Phase 6. Friendly wingmen come with the missions in Phase 7.
- **Fight size:** up to about 12 aircraft at 60 fps, every one on the full flight model.

**Fixed by the spec and earlier decisions:**
- The AI writes the same control input as the player and flies the same flight model (D2, D3).
- The Bf 110's rear gun is always AI-manned (D14).
- The He 111 is AI only.

## D77. Phase 6 checkpoint 1: gunners, formations and tactics research (27 Oct 2026)

**MG 15** (the flexible gun of the Bf 110 and He 111):
- **Rate of fire:** "1,000–1,100 rds./min." (S27). The middle, 1,050, is proposed.
- **Feed:** "Saddle-type drum (75-rd. capacity)" (S27). S25 agrees ("each magazine holding 75 rounds"), and so does
  S28 ("150 Schuß oder 2 Doppeltrommeln Dt 15"). High confidence.
- **Muzzle velocity:** not stated. It fires the same 7.92 mm rounds as the MG 17, so it uses the MG 17's ballistics
  (S41, D61). This is an estimate.

**Bf 110 rear gun** (S25, AFDU Report No. 38, from flying a Bf 110 captured in July 1940):
- **Field of fire:** "greatly restricted, extending about 30° on either side of the centre line of the aircraft. The
  maximum elevation is 60° and it is not possible to fire below the horizontal" (para. 17).
- **Canopy:** with the rear canopy closed, "the field of fire is very limited" (para. 8). The game takes it as open in
  combat.
- **Drums:** "each magazine holding 75 rounds and there is stowage for 10 spare magazines. An experienced gunner
  should be able to change a magazine in about 10 seconds" (para. 16).
- **g:** the gunner can work the gun easily "except under the influence of 'G', when it was found impossible to
  shoot with any degree of accuracy" (para. 8).
- **Sight:** a ring and bead (para. 20).
- **Return fire:** effective "only when the fighter is between 30° and astern", from level to 60° above. An attacker
  below the tailplane is safe. Under evasive action and g, accurate shooting is "extremely difficult" (paras. 38-39).

**He 111 H gun positions** (S28, L.Dv.T. 583/3, October 1940, for the H, P and D):

| Position | Gun | Mount | Drums |
|---|---|---|---|
| A-Stand, nose (bomb aimer) | MG 15 | Kuppellafette GD-A 1114 | 13 |
| B-Stand, dorsal (radio operator) | MG 15 | Drehkranz D 30 | 14 |
| C-Stand, ventral rear (gunner) | MG 15 | small lens mount LL-K or L 15/1 | 15 |
| Two fuselage-side MG 15s (a fifth man) | MG 15 | MG-Lagerungen | 10 between them |
| Tail | MG 17, fixed | — | a 500-round belt |

- In all, 52 drums for the MG 15s.
- The tail MG 17 fires "ungesteuert" along the fuselage axis against attackers using the blind space behind the tail
  surfaces. It is fired from the B- or C-Stand.
- **Not given:** S28 gives no angles.

**He 111 firing sectors** (S29, the 1943 Soviet test report on captured H-6 and H-11 aircraft): a close variant, the
only figures found, flagged.

| Position | Sector |
|---|---|
| Dorsal MG 15 (H-6 turret) | all round; aft from the horizon to 90° up; forward only from 30° up |
| Beam MG 15s (H-11) | 23° forward to 55° aft of the beam; 30° below to 45° above the horizon |
| Ventral rear (H-11, twin MG 81s in the same hatch) | 6° to 70° below, aft; 40° right and 35° left |
| Nose (H-11, MG FF) | down to 40°, nothing above the axis; 15° right, 35° left |

- **Where the guns can't reach:** "from above and ahead" within about 30° of the flight path, and "from below and to
  the side" more than about 40° off it. S29 calls these the safest attacks, with the pilot and dorsal gunner the
  priority targets.

**He 111 cruising speed:** S29's range-table speed is 330-345 km/h. No formation speed was found. 337 km/h is proposed
as the formation cruise.

**Luftwaffe doctrine** (S22, the Rechlin comparison flights, August 1940, sent to all fighter and Zerstörer units):
- **Turning:** the Spitfire, Hurricane and Curtiss "have significantly smaller turning circles and turning times".
  Attacking and breaking off should rely only on the German fighters' superior performance.
- **Climbing away:** at a shallow angle and 280-300 km/h, never steeply, and never behind an enemy at its own angle.
- **Evading:** "on sudden push forward on stick", the enemy's carburettor cuts out. This is recommended.
- **Roll:** the enemy fighters roll worse than the Bf 109 at high speed.

**The Bf 110 in combat** (S25):
- Single-seaters "could easily out-turn the Me.110 at low altitude"; the advantage is smaller at 20,000 ft.
- To evade, it can pull "up to its steepest climbing position", making the attacker overshoot (para. 43).
- If an attacker is seen early at "about 1,000 yards", "a quick turn through 180°" gives it a head-on attack (para. 44).
- Head-on, an attacker meets its forward armament (para. 40).

**RAF fighters against raids** (S38, Dowding's despatch):
- **The escort:** "A strong Fighter formation would fly a mile or so behind and above the Bombers."
- **The RAF attack:** fighters attacked the bombers "before the Fighters could intervene", "from ahead or below". The
  escort then moved inside, below and stepped up to 30,000 ft (para. 126).
- **Numbers:** about four German fighters to each bomber (para. 123).

**Turning:** S21's turning-circle trials, already in the model, show the RAF fighters out-turning the Bf 109.

**Not found** (proposed as estimates, or left as gaps):
- the spacing of the RAF vic and line astern, the Luftwaffe Rotte and Schwarm, and the He 111 Kette;
- gun traverse rates, gunners' aim error and reaction, and the g at which a gunner can't aim;
- the Bf 110 defensive circle: no allowed source was found, so it isn't modelled;
- the H-3's own firing sectors (S29's H-6/H-11 are used, flagged).

## D78. Phase 6 estimates accepted (27 Oct 2026, product owner)

The product owner accepted the checkpoint 1 estimates (D77). They are in the data files with keyed rows in
AIRCRAFT_DATA:
- **MG 15:**
  - rate of fire 1,050 rounds/min, the middle of S27's 1,000-1,100;
  - its rounds fly like the MG 17's;
  - its drums carry the MG 17's mix of armour-piercing, incendiary and observing rounds.
- **He 111 firing sectors:** S29's H-6/H-11 figures, applied to the H-3 (flagged).
  - The beam sector is read as measured from the beam.
  - The ventral sector is read as 40° right and 35° left of dead aft.
  - The two beam guns share S28's 10 drums, 5 each.
- **He 111 formation cruise:** 337 km/h (93.6 m/s), the middle of S29's range-table speed.
- **Escort:** 1,609 m behind the bombers (S38's "a mile or so") and 500 m above (estimate).
- **Formation spacing** (estimates):
  - RAF vic: wingmen 20 m out and 15 m back;
  - RAF line astern: 40 m apart;
  - Rotte: the wingman 200 m abreast and 30 m back;
  - Schwarm: the two Rotten 300 m apart;
  - He 111 Kette: 40 m out and 30 m back.
- **Gunners:**
  - they can't aim above 2 g;
  - guns swing at up to 60°/s;
  - a drum change takes 10 s for an Ace (S25's experienced gunner), 14 s for a Regular and 20 s for a Novice (the
    skill factors go in `src/ai/skill.js`).
- **Bf 110 rear gun:** the canopy is taken as open in combat.
- **Bf 110 defensive circle:** not modelled (no source).

Gun pivot positions are estimates placed on the aircraft models.

## D79. Many aircraft, and the AI pilot's hands (27 Oct 2026, Phase 6 checkpoint 2)

**Aircraft in the simulation** (`src/core/craft.js`):
- **The craft:** every aircraft is now a craft: its type, side, flight-model state, control input, guns, damage dice
  and pilot.
- **The AI aircraft:** each step, its pilot sets the input, its guns fire into the shared pool of rounds, and the same
  flight model as the player's moves it.
- **The player:** a craft with no pilot. The panels, readouts and tests are unchanged.
- **The target (Y):** an AI craft flown by its autopilot.
- **Hits:** rounds can hit any aircraft but the one that fired them.
- **Losses:** each AI aircraft that breaks up, loses its pilot or crashes is handled as the target was (D69) and
  reported by name.
- **The clock:** the simulation keeps one clock that every pilot sees by.

**The AI pilot's hands** (`src/ai/pilot.js`):
- **What it moves:** only the stick, rudder, throttle, rpm lever, radiator and triggers, within their travel and no
  faster than the skill's hand. The AI can do nothing to the aircraft that the player can't.
- **What it sees** (`src/ai/perception.js`): the others as they were one reaction time ago. Formation pilots carry the
  leader forward by his seen velocity.
- **How it steers:**
  - it works out the lift a turn towards its goal needs, plus the lift that holds the aircraft up;
  - it rolls that lift into place (with damping), never banking past the goal's limit;
  - it pulls for the g it needs, within the goal's g limits, easing off at the stall buffet its skill feels;
  - its rudder keeps the ball in the middle.
- **Throttle:** proportional and gradual, to hold a speed.
- **Engine:**
  - the radiator is opened 15°C before the coolant limit and closed 30°C below it;
  - full rpm in a fight, cruising rpm (lever 0.8) otherwise;
  - the Bf 109 and Bf 110 use the engine-management assist for the airscrew pitch, as a player may.
- **Gunnery** (`src/ai/gunnery.js`):
  - aims ahead by the rounds' time of flight and above by their drop, from the same ballistics as the rounds;
  - points the nose, where the guns lie, not the flight path, onto the aim;
  - fires within the skill's range when the nose is within its aim cone.
- **The ground:** a pilot won't point the nose down below 300 m plus 6 s of his descent rate; he pulls out instead.
- **Tuning:** the gains are values of the AI's handling, not aircraft data. Formation flying uses gentle steering:
  banks up to 20°, a turn gain of 0.4.

**Behaviours for now** (`src/ai/basic.js`, replaced by checkpoints 3 and 4):
- **Fighter:** pursues and fires at the nearest enemy.
- **Escort:** keeps its place behind and above the bombers until an enemy is within 2.5 km.
- **Bomber:** the leader holds heading, height and formation speed; the others keep their Kette places.

**Skill table** (`src/ai/skill.js`, game design, not aircraft data):

| Setting | Novice | Regular | Ace |
|---|---|---|---|
| Reaction time | 0.6 s | 0.35 s | 0.2 s |
| Aim error | 12 mrad | 6 mrad | 2.5 mrad |
| Full stick travel | 0.45 s | 0.3 s | 0.2 s |
| Share of the g limit used | 0.7 | 0.85 | 1.0 |
| Buffet felt (eases off at this stall share) | 0.05 | 0.12 | 0.25 |
| Firing range | 250 m | 350 m | 400 m |
| Drum-change factor | 2.0 | 1.4 | 1.0 |

**Scenario keys** (`src/core/scenarios.js`):
- **6:** Luftwaffe fighters for an RAF player (one Bf 109, a Rotte, a Schwarm, two Bf 110s), or RAF fighters for a
  Luftwaffe player (one Spitfire, a Hurricane vic, four Spitfires in line astern). They start 2.5 km ahead and 500 m
  higher, flying towards the player.
- **7:** an He 111 Kette crossing 3 km ahead with a Rotte of Bf 109 escorts behind and above (RAF player), or a
  friendly Kette with three Hurricanes coming to attack it (Luftwaffe player).
- **8:** skill. **0:** clear.
- Never more than 12 aircraft. F3 shows the nearest AI aircraft and an AI line.

**Flagged:**
- **Bomber speed:** a formation flies at the lower of 337 km/h (D78) and its 60%-throttle level speed at its height.
  At 1,800 m, 337 km/h is close to the He 111's top speed and overheated its engines, so it flies 278 km/h there.
- **Start temperature:** AI aircraft that would start hotter than their radiator rule allows start with the radiator
  open, 20°C under the coolant limit. A crew arriving from its own approach would have managed it.

**Measured:**
- the flight model costs 5 µs per aircraft step;
- ten aircraft fighting cost 15 ms per simulated second in Node;
- in Chrome, 75 fps with the bomber scenario, 3.3 ms of work per frame;
- draw calls grow by about 75 per aircraft model, to watch at 12 aircraft;
- an Ace Spitfire closes on a Bf 109 and hits it;
- a Regular Bf 109 shot down a hands-off Spitfire;
- the Kette holds its places within 7 m for 3 minutes.

## D80. Bailing out and parachutes (27 Oct 2026, Phase 6 checkpoint 2b, product owner)

**Accepted from checkpoint 2:** the bomber formation speed rule, the skill table and the 2.5 km escort engage range
(D79).

**The product owner asked:** crews bailing out of battle-damaged aircraft, each man seen jumping, his parachute
opening and him floating down; the player too, with the view following him.

**Their choices:**
- **The player:** bails out automatically when the aircraft is lost (broken up, on fire, or its elevator gone), and can
  bail out any time by holding Backspace for 1 s, or a joystick button chosen in the J panel (default: button 8 as
  printed on the stick; mapping version 4 keeps saved settings).
- **AI crews:** bail out when their aircraft is lost, and also when badly damaged.
- **Timing:** built before tactics.
- **Source:** S42, a 1942 RCAF station publication, accepted though outside the usual source list.

**Crew** (corrected with the product owner, who thought the He 111 carried 6):
- He 111 H: 5. Pilot, observer, radio operator, flight engineer and the "5. Mann" for the side guns (S28).
- Bf 110 as a fighter: 2 (S25).
- Single-seat fighters: 1.
- Seats are estimates on the models.
- **Exit times** (estimates, from deciding to clear of the aircraft):
  - fighters 4 s;
  - Bf 110: 4 s and 6 s;
  - He 111: 6, 8, 10, 12 and 14 s, one after another;
  - from a broken-up aircraft, half these, from its falling wreck.

**Parachutes** (S42, the RAF's 24 ft Irvin; no Luftwaffe figures were found, so both sides use these, flagged):
- the canopy descends at 4.9 m/s at sea level ("approximately 16 feet per second"), faster in thinner air;
- free fall settles at up to 58 m/s ("will not exceed 130 miles per hour");
- the ripcord is pulled after 3 s ("a count of three");
- the canopy is fully open 1.6 s later.
- Drag in proportion to the square of the speed gives these limits; the canopy's drag grows smoothly as it opens.
- A man who reaches the ground before his canopy is open is killed.
- A landing is on the ground or in the sea.

**When AI crews go** (game-design thresholds, `src/core/bailout.js`):
- **Lost:** broken up, on fire, or the elevator gone.
- **Badly damaged:** every engine seized or with its coolant or oil all but gone, any control surface gone, or a wing
  panel or the tail at 50% damage.
- **Decision:** after the crew's reaction time. The pilot's hands come off the controls and the aircraft flies on
  pilotless.
- **The pilot killed:** the rest of a crew (the Bf 110's gunner, the He 111's men) still bail out. A single-seater
  with a dead pilot doesn't.
- **Lost aboard:** men still aboard when the aircraft or its wreck reaches the ground.
- **Cleared aircraft:** an aircraft cleared with key 0 (or replaced by a new scenario) takes its crew with it.
- **Reported:** "Bf 109 E-4 #1: pilot bailed out", "He 111 H #1: 5 crew bailed out".

**The player:**
- "Bailing out!" while getting out (4 s, or 2 s from a broken-up aircraft); the controls still work until he leaves.
- Then the flight ends ("You bailed out — press R to restart").
- The aircraft flies on without him, or falls as a wreck.
- The instrument panel goes and the orbit view follows him down.
- When he lands: "Landed by parachute", "Came down in the Channel", or "Killed: the parachute had not opened".

**Drawing** (`src/render/parachutes.js`, display choices):
- a small figure in RAF brown or Luftwaffe grey-green, tumbling in free fall;
- a white 7.3 m canopy with 12 rigging lines, swelling open and swaying, collapsing once he's down;
- landed men are dropped after 60 s.

**Checked in Chrome:**
- holding Backspace bailed the player out of a Spitfire, which flew on without him; he tumbled, then hung under an
  open canopy;
- an He 111 set on fire put out all five crew under open canopies;
- no console errors.

## D81. Fighter tactics and formations (28 Oct 2026, Phase 6 checkpoint 3)

**What the fighter pilot does** (`src/ai/fighter.js`): a state machine. He decides 20 times a second from what he can
see and flies through the same hands and controls as before (D79).
- **Patrol:** he keeps his place in the formation (D78), or his heading. He spots an enemy within his sighting range,
  except under his own tail.
- **Engage and attack, by type:**
  - **Bf 109 and Bf 110, boom-and-zoom (S22, S25):**
    - with 200 m of energy height to spare, and never head-on, he dives on the target and fires in the pass, pulling
      no more than 4 g;
    - he breaks off within 150 m, when the target gets 45° off his nose, or below 72 m/s;
    - he zooms away in a 12° climb at about 290 km/h (S22's 280-300 km/h) to build 450 m before the next pass, or
      goes again after 15 s with any advantage;
    - against a target coming head-on, he climbs out to its side to come round behind.
  - **Hurricane and Spitfire, turning fight (S21):** pursuit with full turns. A Regular or Ace eases the turn below
    75 or 90 m/s to keep his speed.
  - **RAF against bombers (S29, S38):** he sets up outside the guns' reach, either ahead and 400 m above (inside 30° of
    its path) or 500 m below and 50° off its path. He steers for where that point will be, makes the run, then breaks
    away below.
- **Evade,** when he notices an enemy nose-on behind him inside 800 m (a Bf 110 crew watch to 1,100 m):
  - **RAF:** a hard break turn towards the attacker.
  - **Bf 109:**
    - attacker more than 400 m back: a shallow, fast climb away (S22);
    - close behind: a push-over with negative g (S22) or a split-S, with 900 m or more beneath him;
    - lower down: an extension at full power.
  - **Bf 110 (S25):** an attacker seen at 900 m or more is met head-on; one closer is answered with a steep climb to
    make him overshoot.
- **Disengage:** under 10% of his rounds left, damaged (worn or leaking engine, holed wing or tail, a hurt control),
  or out-matched longer than his skill's staying power. He goes home (RAF north-west, Luftwaffe south-east) in a
  shallow dive, and still evades if caught.
- **Wingmen:** a wingman keeps his slot on patrol, covers a fighting leader 200 m behind on his quarter and 50 m up,
  and goes for anyone on the leader's tail.
- **Escorts:** they keep station behind and above their bombers (S38), and engage only fighters within 2.5 km of them
  or the bombers.
- **The ground:** the ground check now steps in whenever he is below his safe height, unless already climbing hard,
  and holds the bank to 60°.
- **The hands:** they gained a push-over: wings level, pushing negative g.
- **Firing cone:** 30 mrad (about a fighter's span at gun range) plus twice the aim error. It was 20 mrad, which was
  too tight to fire much.

**Skill additions** (game design):

| Setting | Novice | Regular | Ace |
|---|---|---|---|
| Sighting range | 2.5 km | 4 km | 5.5 km |
| Chance of noticing an enemy on his tail (each second) | 30% | 70% | 100% |
| Lowest speed in a turning fight | none | 75 m/s | 90 m/s |
| Fights on out-matched for | 10 s | 20 s | 40 s |

**Measured in seeded fights** (`tests/ai/tactics.test.js`):
- an Ace Spitfire beat a Novice Spitfire in 5 of 6;
- a Bf 109 against a Hurricane (both Regular, the 109 starting 500 m higher) stayed above it 72-88% of the time and
  never turned continuously for more than about 10 s;
  - it broke off for home when it couldn't regain the advantage, as S22 advises;
- an Ace breaks within a second of an enemy settling behind him; a Novice takes longer;
- a Bf 110 meets an attacker seen at 1,050 m head-on, and zooms when he's seen at 600 m;
- out of ammunition, a fighter heads home;
- a Hurricane attacked an He 111 from ahead or below more than 80% of its attack time;
- a Schwarm on patrol kept its places within 50 m.

**In Chrome:** a Rotte of Bf 109s against a Spitfire:
- the leader avoided the head-on pass and climbed out to the side while his wingman covered him;
- he then came round behind and dived on the Spitfire's tail;
- 75 fps, no console errors.

**Flagged:**
- all thresholds, distances and times are game-design estimates built on the sources' qualitative advice;
- the Bf 110 defensive circle is still not modelled (no source, D78);
- two equal RAF fighters often decide it on the first head-on pass (eight guns at a combined 220 m/s).

## D82. Mid-air collisions (28 Oct 2026, product owner)

**Problem:** flying through another aircraft didn't register. Only rounds were tested against the hit zones.

**The fix** (`src/core/collisions.js`, checked after every physics step):
- **Pairs:** every pair of aircraft still flying, the player's included.
- **Quick test:** their hit-zone bounding spheres must be within reach. Far-apart pairs cost one distance check.
- **Close test:** each sample point of one aircraft (the corners and centre of each of its hit zones) is followed over
  the step and tested against the other's zones. The path is seen in the other aircraft's body axes, using both
  aircraft's previous and present poses, with the rounds' own box test.
  - Testing the paths, not just where the points end up, catches a thin wing passed through at a couple of metres a
    step.
  - The test runs both ways.
- **What a collision does** (game design): both aircraft are wrecked; at these speeds even a touch is fatal.
  - **Each loses the part it was struck on:** a wing half, or the tail. A blow to the fuselage or engine leaves the
    airframe whole to tumble.
  - **Cause:** "Mid-air collision with Bf 110 C-4 #1" ("... with you" for the player's victim).
  - **What follows** is the same as any other loss: the falling wreck and debris (D69), crews bailing out if they can
    (D80), reports, and the player's flight ending.
  - **Visible:** a flash and a puff at the point of contact.
- **Not included:** collisions with wrecks, falling parts and parachutists.

**Tests** (`tests/core/collisions.test.js`):
- head-on, both break up with each other's name;
- a 30 m near miss isn't a collision;
- wing tips passing through each other at 300 m/s (2.5 m a step) are caught, each losing that wing, while the same
  pass 3 m further out misses;
- the player's flight ends and the AI is reported;
- a Kette with escorts flies 30 s without touching, within the time budget.

**Checked in Chrome:** a hands-off Spitfire ran into the target ahead. "Mid-air collision with Target Hurricane Mk I"
appeared, the player bailed out, both pilots came down by parachute, and there were no console errors.

## D83. Bombers and air gunners: Phase 6 checkpoint 4 (28 Oct 2026, plan approved by the product owner)

**Flexible guns** (`src/weapons/mounts.js`):
- One gun per entry in the aircraft's `mounts` data (D78): the Bf 110's rear MG 15 and the He 111's nose, dorsal,
  ventral and two beam MG 15s, plus its fixed rearward MG 17 (a mount whose arc is one direction).
- Each gun swings towards its gunner's aim at no more than 60°/s (D78, estimate) and never leaves its arc. Arcs that run
  through dead astern (150° to 210°) are handled; a gun aimed outside its arc stops at the nearer edge and never swings
  through the gap. The He 111's dorsal gun goes all the way round but clears the cabin only from 30° up when it points
  forward (S29).
- It fires at the MG 15's rate from 75-round drums. An empty drum is changed in 10 s × the skill's drum factor (S25:
  "about 10 seconds" for an experienced gunner); no fire meanwhile; silent when no drums are left.
- Rounds leave along the gun with the aircraft's velocity added, into the shared pool. The recoil of one hand-held gun
  is left out of the flight model (small, and taken by the mount).

**Drum loading** (product owner accepted; estimate): each MG 15 drum carries the MG 17's mix with a 7.92 mm tracer in
place of the observing round (AP, incendiary, tracer), so the gunners' fire can be seen. Germany had 7.92 mm tracer
(S40, "L'spur"); no 1940 drum loading and no burn time were found. The burn time, 1.5 s (about 900 m), is an estimate
a little under the 20 mm tracer's 1.8 s (S40). **Deviation flagged.**

**Who mans what** (S28): the He 111's nose gun by the observer (bomb-aimer), the dorsal by the radio operator, the
ventral by the C-Stand gunner (the flight engineer in the game's crew of five), both beam guns by the fifth man (he
fires one at a time). The tail MG 17 is fired by the radio operator, or by the C-Stand gunner if he is out of action,
whenever its line is on the target he is shooting at with his own gun. The Bf 110's rear gun is manned by its radio
operator (S25).

**Air gunners** (`src/ai/gunner.js`; game-design values, estimates):
- **Seeing:** enemies within his gun's arc and his skill's gun range (new skill value `gunRange`: Novice 450 m,
  Regular 550 m, Ace 650 m), seen one reaction time ago and judged on to where they are now. He prefers one closing
  on his aircraft, else the nearest.
- **Aiming:** ahead by the rounds' time of flight, allowing for his own aircraft's motion, and above by their drop; plus
  a wandering aim error of five times his skill's pilot aim error (a flexible gun on a moving aircraft), twice that
  again when he is wounded. Measured headless: at a fighter sitting 300 m astern an Ace hits with about a third of his
  rounds, a Regular about a tenth, a Novice almost none; at one crossing 300 m behind, about a tenth, a twentieth and
  almost none.
- **Firing:** bursts of 1.5 s with 0.6 s pauses while the gun is within 2° of his aim; never with a friendly aircraft
  in the line of fire nearer than the target.
- **Limits:** nobody fires above 2 g (S25, figure an estimate, D78); a killed gunner's gun falls silent; nobody fires
  once the crew abandon the aircraft.
- **The player's Bf 110:** the rear gunner is always AI (D14), at the AI's skill (key 8); his rounds count as the
  player's.

**Crew wounds** (`src/weapons/damage.js`): a zone that holds crewmen other than the pilot gets a "crew" component,
weight 0.1 per man (estimate). The He 111's fuselage holds three (radio operator, flight engineer, side gunner); its
cockpit the observer; the Bf 110's cockpit the gunner. A hit wounds one of them as a pilot is wounded (D68). Killed
crewmen do not bail out (D80 extended). F3 lists wounded and killed crewmen with the damage.

**Bombers** (`src/ai/bomber.js`, replacing the bombers' part of `basic.js`; distances are game design):
- **Route:** the leader steers for each waypoint in turn at formation speed and height, in gentle turns (20° bank), then
  holds his heading. A waypoint counts as reached within 1 km, or within 3 km once it is behind the wing line (a
  20° turn at bomber speed is about 1.7 km in radius, so a waypoint just off to the side could otherwise be circled for
  ever).
- **Formation:** the others keep their places; with enemy fighters within 1.5 km of the leader they close up to 60% of
  the spacing, so that their guns support each other, and open out again once all are beyond 2.5 km.
- **Straggler:** a bomber badly damaged (D80) or with an engine out leaves the formation and turns for home, losing
  height gently (about 3°) at 90% of the formation speed.
- **Leader lost:** the next bomber still in formation takes the lead, the route and the escort. The others move up a
  place, each staying on the side of the new leader he is already on (crossing over behind him caused a collision in
  testing).
- **Scenario 7:** the Kette flies 15 km on its course to its target, then turns for home (30 km on).

**AI hands, two fixes found while testing** (`src/ai/pilot.js`, `src/ai/basic.js`):
- **At its bank limit** (formation flying), a pilot pulled the full g meant for a tighter turn, so the extra lift went
  into a zoom and the speed bled away (a bomber fell to 6 m/s in a 90° turn); and in a big turn the small climb or
  descent wanted was scaled up with the turn, so the hands pushed to 0 g and dived. Now, when the bank limit holds
  him, he pulls only the g that gives the climb or descent he wants at that bank, and turns as fast as the bank allows.
- **Wingmen in gentle formation flight** may bank to 29° (was 20°, the leader's limit), so that a wingman on the
  outside of a turn can hold his place.

**F3:** the nearest AI aircraft's line shows its gunners ("gunners: 2 firing, 1 changing drum, 1 wounded"); a Bf 110
player's line shows the rear gun's state, rounds in the drum and drums left. Muzzle flashes show at the flexible guns
and follow them as they swing.

**Tests:** `tests/weapons/mounts.test.js` (arcs through dead astern, the dorsal's forward limit, the traverse rate, the
fixed tail gun, the rate of fire and tracer, drum changes, no drums left); `tests/ai/gunner.test.js` (Ace against Novice
on a crossing fighter, no fire above 2 g, a killed gunner silent, the ventral not the dorsal against an attacker low
astern, the player's Bf 110 gunner firing at an enemy and never at or past a friend, crew wounds in the fuselage, killed
crewmen not bailing out); `tests/ai/bomber.test.js` (the route, closing up and opening out, a straggler, a new leader).

**Checked in Chrome:** a Spitfire placed 300-350 m behind the Kette was fired on (333 rounds, 17 hits, glycol trailing),
the tracers showing and the Kette closed up; a Bf 110 with one Spitfire behind it: the rear gunner fired 54 rounds and
hit 3 times, and the Spitfire, leaking coolant, broke off. No console errors.

## D84. Straight and level hands-off from the air start, rigged for full power (28 Oct 2026, product owner)

**Problem:** after an air start the aircraft at once rolled left, needing constant right stick, and kept rolling
hands-off. The joystick's roll axis read 0.00.

**Cause:** two things together.
- **The throttle slider took over at once.** Once moved in a visit, the joystick's slider stayed in control for every
  later flight, so a new air start jumped from its trimmed throttle (about 56% in the Spitfire) to wherever the slider
  sat (about 90%).
- **The rigging was set for cruise.** The fixed rigging against torque and swirl (D73) was solved for the air start's
  cruise, so more power rolled the aircraft. Stick needed to hold the wings level at 90% / 100% throttle:
  - Spitfire: 3.4% / 4.6% right;
  - Hurricane: 0.2% / 1.0% right;
  - Bf 109: 2.5% / 2.5% left;
  - Bf 110: 1.2% / 1.1% left.
  - The joystick's 10% dead zone made that a large hand movement.

**The product owner's choice:** both fixes below. A fixed rigging can be exact at only one power and speed, and the
air start must be at that point or the start itself rolls. So the air start moved to full power.

**1. The air start at full power** (`src/core/simulation.js`, `fullPowerStart`):
- 1,500 m, full throttle, rpm lever full, at the speed full power holds in level flight;
- the radiator open if, closed, the engines would settle within 15 °C of their coolant limit (the AI's radiator rule,
  D79). They all would: closed, the Spitfire would settle at 124 °C against its 120 °C limit. So every aircraft
  starts with its radiator open, and the start speed allows for the flap's drag;
- start speeds: Hurricane 113.4 m/s, Spitfire 125.3, Bf 109 129.4, Bf 110 123.8, He 111 93.1;
- engines start at their settled temperatures (75-93 °C). `steadyFlight` and `createAircraft` take a radiator setting
  for this.

**2. Rigging re-solved there** (`npm run fit:rig`; estimates, solved):

| Aircraft | rollRig (was, D73) | yawRig (was, D73) |
|---|---|---|
| Hurricane | 0.0023 (0.002119) | 0.001315 (0.001156) |
| Spitfire | 0.002156 (0.001776) | 0.001053 (0.0009217) |
| Bf 109 | −0.002991 (−0.002231) | −0.001566 (−0.001464) |
| Bf 110 | −0.001739 (−0.001402) | −0.0006242 (−0.0005885) |
| He 111 | −0.00116 (−0.0007952) | −0.0003983 (−0.0002062) |

**Flagged deviation:** real RAF and Luftwaffe fighters were rigged for level flight at cruise. Rigging for full power
is a playability choice at the product owner's request.

**3. The joystick throttle per flight** (`src/input/joystick.js`): each new flight (restart, start mode or aircraft)
keeps its own throttle until the slider is moved more than 5%. The slider then takes over as before.

**Knock-on refits** (the documented procedure after a flight-model change; each keeps a sourced figure matched):
- **Aileron power** (`npm run calibrate`), because the rolls are measured in one direction, with or against the
  stronger rigging:
  - Hurricane 0.0389 → 0.0387 and Spitfire 0.0434 → 0.0428 (NACA's 30 lb rolls, S13);
  - Bf 109 0.0507 → 0.0579, so it still banks 45° at 400 mph as quickly as the model's Spitfire (S32, D30). With the
    stronger rigging its roll is now noticeably quicker to the left than to the right at high speed.
- **Validation** (`npm run validate`, FLIGHT_VALIDATION.md updated):
  - roll calibration points −0.1% and −0.0%;
  - Spitfire full-aileron roll −15.5% (was −15.2%, still the known deviation);
  - Hurricane full-aileron −8.5%;
  - 400 mph time to 45°: 1.200 s (Spitfire) and 1.175 s (Bf 109), against 1.242 and 1.258;
  - Bf 109 take-off over 20 m −20.0% (was −19.7%);
  - Spitfire landing run 457 yd (was 458).
- **Stalls:** the wing-drop directions are unchanged (Hurricane left, S12; Spitfire right, S31; Bf 109 left, S20).
  The Bf 109's drop now rolls past 180° within the 3 s measured. The stall test now follows the bank continuously, so
  such a drop keeps its sign; with the old measure it read as a right drop. The Spitfire's drop is larger than
  before (118° against 87°), still the mildest of the three.

**Result:**
- From the air start, all five aircraft hold bank and heading within 0.05° for 30 s hands-off.
- **Checked in Chrome** with the product owner's joystick connected and the slider left where it was: the Spitfire,
  Hurricane, Bf 109 and Bf 110 each held bank and heading within 0.01° for 9.5 s at full throttle, the radiator open,
  1,500 m. No console errors.

**What remains (realistic, recorded):** away from full power the aircraft now want a little opposite stick. Stick to
hold the wings level:

| Aircraft | 90% | 75% | 56% |
|---|---|---|---|
| Spitfire | 1.1% left | 2.7% | 4.8% |
| Hurricane | 0.8% left | 1.9% | 3.2% |
| Bf 109 | 1.2% right | 3.0% | 5.4% |
| Bf 110 | 0.7% right | 1.9% | 3.4% |

With the slider fully forward, all four are level hands-off.

**Tests:**
- `tests/physics/rigging.test.js`: the full-power start, with its speed held for 10 s, alongside the hands-off and
  fresh-solve checks;
- `tests/ui/phase2Controls.test.js`: the slider leaves a new flight's throttle alone until moved;
- tests that assumed a 110 m/s player adjusted without loosening their checks:
  - targets placed dead ahead of the nose;
  - in two chase tests the player cruises at the old setting with a hand holding the wings level;
  - the AI chaser given 150 s to catch the faster player.

## D85. RAF engine gauges: a MAP gauge, small gauges and green normal bands (28 Oct 2026, product owner)

**Superseded in part by D86 (1 Nov 2026):** the RAF panel is now the reference picture's, without the MAP gauge; the
green and orange bands are kept on its boost, oil and radiator gauges.

**Request:** a manifold pressure gauge on the RAF panel (Hurricane and Spitfire), since the throttle sets manifold
pressure and the E and D keys the rpm; smaller oil, coolant and boost gauges; and green bands for the normal operating
ranges.

**Layout** (`RAF_LAYOUT`, `rafEngineGauges` in `src/ui/instruments.js`):
- the rev counter where it was;
- the MAP gauge below it, the same size (the product owner's later change: first planned small), captioned "MAP";
- oil °C, radiator °C and boost, small, one above another in a column right of them, spread evenly over the panel's
  height;
- "small" is the Bf 110's proportion: its engine dials are 19/30 the size of its flying instruments. Copied in pixels
  they would be about a third of the RAF flying instruments, too small to read;
- captions keep the large dials' lettering size.

**The MAP gauge:** inches of mercury, absolute, 10-60. It reads the same pressure as the boost gauge, which shows it as
lb/sq in above standard sea-level pressure (+6¼ lb = 42.6 in. Hg). **Flagged deviation:** the RAF fighters of 1940 had
no such gauge, and RAF pressures are otherwise shown in lb/sq in. It was added at the product owner's request.

**Green normal bands** (S33, the Spitfire I Pilot's Notes engine limitations, museum record; the Hurricane has the same
Merlin III data):

| Gauge | Green band | Source |
|---|---|---|
| Oil | 15-90 °C | minimum for take-off to the climbing and cruising limit |
| Radiator | 60-95 °C | minimum for take-off to the cruising limit |
| Boost and MAP | +2¼ to +6¼ lb/sq in (34.5-42.6 in. Hg) | cruising (weak mixture) to climbing and all-out; the product owner chose the range |

The orange band over the +12 lb emergency boost (54.4 in. Hg) is on both pressure gauges.

**Data** (`src/aircraft/merlin3.js`, rows in AIRCRAFT_DATA.md): `heat.oilNormal`, `heat.coolantNormal`, `boostNormal`
(Pa absolute). Constant `UNIT.INHG`. `gauge()` now takes any number of bands.

**Tests** (`tests/ui/tempGauges.test.js`):
- the layout (places, sizes, nothing overlapping, inside the panel);
- the bands from the data;
- the MAP reading equal to the boost converted, falling with the throttle;
- every band drawn and clipped to its scale.

**Captions** (product owner, after seeing the gauges): the MAP caption 1.3 times the usual lettering with "in.Hg" above
it (1.25 times the usual lettering, raised a little further, at the product owner's next request), and "PSI" above BOOST (lb/sq in, as the boost gauge reads). `captionLines` in `src/ui/instruments.js`; tested to
sit under the needle's hub and inside the dial, the unit line above the caption.

**Checked in Chrome** (Spitfire, air start):
- MAP 42.6 in. Hg and boost +6¼ at full throttle;
- throttle back with S: 24.0 in. Hg and −2.9 lb together;
- rpm lever down with D: rpm 2,993 to 2,275, MAP and boost unchanged;
- no console errors.

## D86. The Hurricane and Spitfire panel from the product owner's reference picture (1 Nov 2026, product owner)

**Request:** replace the RAF panel with the Spitfire I panel in the product owner's reference picture (a 3D render),
rendered as accurately as possible.
- **Working:** the flight and engine instruments; a trim gauge in place of the elevator trim display; the undercarriage
  UP/DOWN indicator and the flap lever.
- **Normal operation:** the rest (oxygen, voltmeter, brake pressure, switches).
- **Clock:** where the picture has it, left of the UP/DOWN indicator, showing the computer's local time.
- **Airspeed:** in mph (the picture's reads knots).

**The product owner's answers:**
- redrawn in code, the picture used only as the layout reference (GAME_SPEC §2: no copyrighted assets; nothing of it is
  in the game);
- the D85 MAP gauge dropped (the picture has none), so that deviation is gone;
- the panel as large as fits (as the Bf 110's);
- the green normal bands and the orange +12 lb band kept;
- the fuel gauge full and static until fuel use is modelled.

**Layout** (`src/ui/rafPanel.js`):
- **Positions:** measured on the 1920×1080 picture with a coordinate grid; the outline traced from its pixels. In picture
  pixels, 82 to a dial radius (the airspeed indicator's face).
- **Size:** as wide as fits and at most 45% of the screen height. The arched top stays below the reflector sight in the
  middle of the view (as the Bf 109's panel, D41). Drawn at the Bf 110's 54% it would cover the sight.
- **What that means on screen:** a 2560×1259 window gives a dial radius of 45 px against the old strip panel's 66. The
  whole panel is now shown, so the instruments are smaller than before.

**What it holds, as the picture:**
- **Blind-flying plate:** airspeed, horizon, climb; altimeter, direction indicator, the large turn and slip.
- **Right:** rev counter; F.S. gear warning box and the blank plate; boost (amber bezel); edgewise oil pressure gauge;
  oil temperature (yellow bezel); radiator temperature; fuel contents with its placard; fuel pressure warning lamp.
  The voltmeter at the top.
- **Left:** navigation light switch, flap lever and placard, oxygen regulator Mark VIIIC with its delivery and supply
  dials, clock, UP/DOWN indicator with its night blind, trim gauge, magneto switches, fuel-pump note, Dunlop brake
  pressure gauge.
- **Bottom:** two compass deviation cards, flood-light knobs, boost-coil and starter buttons, bottom-tank button.
- **Everywhere:** mounting screws, the panel's holes and rivets.

**The code:**
- `src/ui/rafPanelFittings.js`: the panel and fittings;
- `src/ui/rafPanelDials.js`: the dials;
- `src/ui/panelParts.js`: bezels, screws, knobs, lenses, lettering and the picture's colours.

**Instruments:**
- **Scales read off the picture:** where they are uneven (rev counter, boost, oil and radiator temperatures, fuel), they
  are tables of value against needle angle.
- **Rev counter:** 1,000-5,000 rpm, 10 at seven o'clock, 30 at the top, 50 at five. Replaces the 10-40 face of D32.
- **Boost:** −4 to +16 lb/sq in.
- **Oil pressure:** reads the Merlin's normal 60 lb/sq in while it runs (S33, now in the data with the 45 lb emergency
  minimum). It is not modelled physically, as the DB 601A's gauges (D63).
- **Fuel:** the gauge face says "CAPACITY TANK 37 GALLONS" (S33: bottom tank 37 gallons, top tank 48 not gauged) and
  reads full.
- **Trim gauge:** its needle swings 30° each way over the full trim range.
- **Recoloured:** the RAF faces' markings are now the picture's pale yellow, the direction indicator's drum and the
  turn and slip's lettering, scales and needles included (product owner, after first seeing them white as in the
  picture).
- **Redrawn as the picture:** the climb indicator's figures (all one size, lettered CLIMB, THOUSANDS, FEET MIN.,
  DESCENT) and the turn and slip (numbered scales top and bottom, white needles with yellow diamond tips, grey centre).
- **Indicator and lever:**
  - the UP/DOWN indicator lights UP red (up and locked) or DOWN green-yellow (down and locked), and is dark while the
    undercarriage moves;
  - the flap lever's paddle reads UP, or tilts over reading DOWN with the flaps down. There is no room below its housing
    for it to swing down: the oxygen regulator is there.
- **Corrected from the picture:** the picture's spelling slip OXIGEN is written OXYGEN.
  The F.S. gear lamp is shown out (normal operation), where the picture shows it lit.

**Flagged:**
- the Hurricane has the Spitfire's panel, though its own panel differed (the product owner's choice);
- its fuel gauge shows the Spitfire's bottom tank;
- the rev counter's scale follows the picture, replacing D32's.

**Removed:**
- the old RAF strip panel (`RAF_LAYOUT`) with its undercarriage, flap and elevator trim plates;
- D85's MAP gauge (`mapInHg`, `UNIT.INHG`). The Luftwaffe panels are unchanged.

**Tests:**
- `tests/ui/rafPanel.test.js`:
  - everything inside the outline;
  - no dials overlapping;
  - the clock left of the indicator;
  - the panel below the sight on five screen sizes;
  - oil pressure running and stopped;
  - trim needle and clock hands;
  - the picture's lettering and the bands drawn;
  - the UP/DOWN lamps and the flap lever.
- The rev counter's test updated; the old RAF layout tests removed.

**Checked in Chrome** (2560×1259, Spitfire and Hurricane, air start):
- the panel as the picture, below the sight;
- with the undercarriage and flaps lowered: DOWN lit, UP dark, the flap paddle tilted to DOWN;
- the trim gauge's needle up with nose-up trim;
- no console errors.

## D87. The RAF reflector sight: a Barr & Stroud GM 2 drawn square-on (1 Nov 2026, product owner)

**Problem:** the sight's body was a plain 3D box on the coaming. Since D86 the 2D panel is drawn over the 3D view and
hid it, leaving the glowing ring on the sky and a faint glass.

**Request:** a realistic sight, replicating the product owner's reference picture of the GM 2 (a render, used only as
the reference), shown square-on from the pilot's seat.

**The sight** (`src/ui/reflectorSight.js`): drawn in code on its own canvas in front of the panel, as the real sight
stands in front of the panel's top. From the foot up:
- the mounting block with its bevelled foot;
- the BASE ring (FEET 100-80-60-40-30) and the RANGE ring (YARDS 1.5-6), with label plates, figures and knurled thumb
  wheels each side, and the side bracket;
- the collar, the lamp housing's cone and deep top ring;
- the two short brackets holding the glass.

Proportions are the picture's; the finish is black anodised with soft highlights.

**The glass:** the first picture has none. After the product owner's photograph of the sight with its glass:
- the glass is held by its lower edge in slots in two short, straight brackets at the top ring's rim (first drawn as tall
  cranked arms, as the render's);
- the glass is wider than the top ring, standing out beyond both brackets and well above them, with its cut top edge
  catching the light;
- it is big enough for the 100-mil ring (D33 estimate);
- the 3D sight has the same short brackets and wider glass.

**Placing:**
- the glass centred on the middle of the view (the guns' line looking ahead);
- the foot on the panel's plain top centre, just above the blind-flying instruments;
- scaled to that space on every screen (about 120 px of glass on a 2560×1203 window), clear of the voltmeter.

**The reticle:** the GM 2 pattern of D33 (now drawn by one function for the 3D and 2D sights, `src/ui/reticle.js`). It is
seen only on the glass, clipped to it, at the point where the aircraft's nose direction falls on the screen (projected
through the camera each frame); its ring is the sight's mils at the camera's field of view. As a collimated sight, a
small look round moves it within the glass.

**When it shows:**
- in the Spitfire and Hurricane, in the cockpit view, while the pilot looks ahead (the panel's rule, D58);
- the 3D body and reticle are hidden meanwhile;
- looking round and in the outside views, the 3D sight shows, now with a simple GM 2 shape (block, rings, collar, cone,
  top ring, arms; sizes estimated on the drawing's proportions);
- the Bf 109 and Bf 110 keep their Revi C/12C (D33), unchanged.

**Tests** (`tests/ui/reflectorSight.test.js`):
- the glass on the middle of the view and the foot on the panel on five screen sizes, clear of the voltmeter;
- the glass big enough for the ring;
- the reticle at the projected guns' line with its ring from the mils and field of view, drawn inside the glass's clip;
- the scale rings' lettering;
- when it shows.

**Checked in Chrome** (2560×1203, Spitfire and Hurricane, air start):
- the sight square-on above the panel, the ring inside the glass;
- hidden in the outside view and in the Bf 109;
- no console errors.

## D88. Faster twelve-aircraft simulation, after the failed deploy of 1 Nov 2026 (1 Nov 2026, product owner)

**Problem:** the push of 1 Nov 2026 reached GitHub, but the deploy stopped at its test step. "Twelve aircraft, all
flying and fighting, run in well under real time" measured 106.6 ms per simulated second against its 100 ms budget, so
the live game was not updated.

**Cause:** on the Mac the stepping alone took 23 ms per simulated second. The test runner runs many test files in
parallel, and on GitHub's smaller machine they compete with the timed test. The profile of the stepping showed:
- **35%, a one-off:** each bomber pilot solved its formation cruising speed on its first decision. That is a costly
  solve, done three times over for three bombers at the same height, inside the timed loop. The scenario had already
  solved it to place them.
- **12%:** the stall angle re-solved by bisection (about 48,000 lift-curve evaluations) whenever a wing panel's
  maximum lift took a new value. That happens every step while the Bf 109's slats or the flaps are part-way.

**The product owner's choice:** speed the simulation up (rather than loosen the budget on GitHub's machine).

**Fixes:**
- **Cruising speed:** the scenario passes the speed it has already solved to its bombers' pilots, and `cruiseSpeed`
  remembers its result for each aircraft and height (`src/ai/bomber.js`, `src/core/scenarios.js`, `src/core/target.js`).
- **Stall angle:** while slats or flaps are part-way, the stall angle is read by a straight line between exact solutions
  every 0.0005 of maximum lift, within about a millionth of a radian (`src/physics/aero.js`). Settled slats and flaps
  keep the exact solve, so `npm run validate` is identical. A first version that read every value off the table moved
  one ceiling by 1 ft and was changed.
- **Timing tests:** they run a second of warm-up before the clock starts, so they time the steady running rather than
  the JavaScript engine's start-up. The 100 ms budget is unchanged.

**Result:** twelve aircraft now take 15.5 ms per simulated second on the Mac, against 23 before (a third less). All tests
pass and the validation is unchanged.

## D89. The Bf 109 E panel and its Revi from the product owner's pictures (1 Nov 2026, plan approved by the product owner)

**The pictures** (layout references only: everything is redrawn in code, nothing of them goes into the game):
- #15: a printed drawing of a Bf 109 E-4 panel;
- #16: a museum photograph from the seat, the panel under the windscreen arch (the source of D38/D41);
- #17: a restored Bf 109 E panel on a stand, with its Revi, in the same layout as #15;
- #18: a page of a German Revi manual (drawn at about 1:2.5), for the parts' names;
- #19, #20: a Revi C/12D photograph and a drawing;
- #21: the reflected reticle as the pilot sees it, with the dark glass set in the clear glass;
- #22, then #23: for the panel's shape. #22 looked like a Ju 87 panel (bomb release, ETC racks, dive placard); the
  product owner then chose #23, the restored panel of #17.

**The product owner's answers:**
- laid out as #17, with its lower panel; the shape is the restored panel's own (#23): the upper plate with its
  shoulders, wings and the raised middle round the clock, and the lower plate with its two lever wings (the plan's
  first version used #16's arch);
- the flap indicator, the elevator trim display and the OBEN/UNTEN lever with its GEAR lamps are removed: none was on a
  real E panel (flaps and trim were handwheels beside the seat). The undercarriage shows on the real selector;
- no ammunition counter: their research shows the Bf 109 E and Bf 110 C had none;
- the two items that could not be identified are drawn as photographed, not working;
- looking down slides the panel up to show the whole lower panel (below).
- The GM 2's 100-mil ring is approved (D33).

**The panel** (`src/ui/bf109Panel.js`, fittings in `src/ui/bf109Fittings.js` and `src/ui/bf109Lower.js`), measured on
#17 in its pixels from the Revi's axis and the top of the upper plate:
- **Upper panel:** clock; flap placard ("Höchstgeschwindigkeit mit voll ausgefahrenen Landeklappen 250 km/h", Start 20°,
  Landung 40°); fine altimeter, repeater compass and manifold pressure, the altimeter, airspeed and manifold pressure
  gauges in red bezels as photographed; the deviation card; airspeed, turn and bank, the airscrew pitch switch, rev
  counter and airscrew pitch indicator; on the left the magneto switch, a red push button, the "Achtung! Vor Anlassen
  Fahrwerkschalter auf ‚Ruhe'" placard and the pitot heater switch (Staurohr).
- **Lower panel:** lighting dimmer (Hell/Aus), a cover plate, the fuel and oil pressure gauge, the circuit breakers
  (EIN/AUS), the fuel reserve warning lamp, fuel contents (Liter, yellow ring), oil and coolant thermometers (the
  coolant's blue ring) with the coolant placard, the undercarriage selector (Fahrwerk Ein / Ruhe / Aus) with its
  emergency pull (Notzug für Fahrwerk), the arrow placard, the hand pump lever and placard, the left lever with its
  Aus/Betrieb box, the four-lamp box marked SKK404-2 and the narrow Ein/Aus strip.
- **Working:** the flight and engine instruments, the fuel contents (full: fuel use is not modelled), the clock and the
  undercarriage selector: its handle points to Ein with the undercarriage selected up, Aus with it selected down. UP and DN
  were added beside them in D92.
- **Shown only:** everything else. Placards are lettered where the picture can be read, grey lines where it cannot.
- **Data added:** the fuel tank's 400 litres (`fuel.tank`, S16, S17), the fuel gauge's full scale.

**Since D93** the whole panel is in the normal view and the look-down slide is gone.

**Looking down:** looking ahead, the screen shows the Revi and the upper panel at about the earlier panel's size (dial
radius 49 px on a 1,259-pixel-high window, against 56 before and 45 for the Spitfire), with the lower panel's top edge
at the bottom, as from the seat (#16). Showing the whole panel at once would have made the dials about 34 px. Dragging
the mouse down slides the panel and the Revi up by as much as a point ahead moves on the screen, until the whole lower
panel is in view. Pushing the joystick hat forward does the same (product owner): it now looks down 20° at the panel, in
place of the forward hat's look up and ahead, far enough to show the whole lower panel. Pulling the hat back still
looks behind.

**The Revi** (`src/ui/reviSight.js`), drawn square-on in front of the panel while the pilot looks ahead, on the RAF
sight's canvas (D87): the clear glass with the dark glass set in its middle (clear glass above and beside it, #21), the
black housing at their foot with its curved dip, the body and its brown leather crash pad, the sun filter's lever, the
bead post, the mounting block, the knurled lamp knob and the cable to its clip on the panel. Sizes are as seen from the
seat (#16) and measured on #21 against the ring. The 3D Revi stays for looking round. The Bf 110 keeps its 3D Revi
until its own redraw.

**The Revi reticle** (`src/ui/reticle.js`, shared with the 3D reticle) redrawn from #21: a fine ring; a horizontal line
broken either side of the centre, both halves running a little past the ring; a vertical line broken above the centre
and running from the centre down, well past the ring; no centre dot. The ring stays 100 mils, an estimate (D33).

**Deviations, flagged to the product owner:**
- **Rev counter:** redrawn to #17's scale, 600 to 3,400 rpm with 2,000 at the top (before: 600-3,000 with 1,800 at the
  top). The Bf 110 shares it. The red mark is at the DB 601A's 2,400 rpm limit from our data (S15, S18); the
  photograph's mark looks nearer 2,500.
- **Panel offset:** the Revi stands right of the panel's centre on #16 and #17. With the Revi on the guns' line in the
  middle of the screen, the panel sits a little left of centre, as photographed.
- **Revi height:** the glass stands a little nearer the panel than from the seat, so the panel can be larger.
- **The panel's colour** follows #17's blue-grey; #16's panel is black.
- **Unidentified:** the four-lamp box (SKK404-2) and the Ein/Aus strip, drawn as photographed and not working.
- **Fuel gauge figures:** #17's are too small to read; the scale runs to the documented 400 litres.
- **Revi C/12D pictures:** #19-#21 show the later C/12D. Its outside and reticle are taken as the 1940 C/12C's.

**Removed:** the ammunition counter (`src/ui/ammoCounter.js`, the guns' counter columns and `sim.guns`); the Bf 109's
flap and trim displays and its undercarriage lever and lamps. The Bf 110 keeps the size of the Bf 109's earlier panel
(`sizeAs`, D64) until its own redraw.

**Cost:** drawing the new panel takes about 0.2 ms a frame in Chrome, half the Spitfire panel's.

## D90. The Bf 109's front cockpit view framed as the product owner's picture (1 Nov 2026, plan approved by the product owner)

**The frame superseded by D103** (from the museum photograph #16, square joins).

**The picture** (#24): a Bf 109 E cockpit from the seat. It is a screenshot from another program's model viewer, so it
is used as a shape guide only and nothing is copied. The product owner's museum photograph from the seat (#16) shows the
same framing.

**The front frame** (`src/ui/bf109Frame.js`), drawn square-on with the panel while the pilot looks ahead, sliding up
with it when he looks down (D89):
- the coaming's curved lip arching over the upper plate's top above the clock, with a lighter top edge and rivets;
- the two front windscreen posts rising from its ends, leaning a little outward;
- the cockpit's side frames running diagonally down from the posts' feet, outside the panel's wings, to the foot of the
  screen;
- the cockpit's dark interior round the panel below them (drawn on the panel's canvas before its plates).
- Positions were measured on #24 against its dials and converted to the restored panel's (#17) pixels.

**Hidden while the front view shows** (`src/render/testView.js`): the 3D windscreen frame and hood, the nose (cowling),
the wings and the airscrew. Looking round (past 20°, by hat or mouse), the 2D panel, Revi and frame hide as before and
the 3D frame, nose and wings show again. A wing lost in a break-up stays hidden.

**Only the Bf 109 changes:** the RAF fighters and the Bf 110 keep their views.

**Deviation, flagged to the product owner:** on the ground the Bf 109's long nose hid the view ahead (S20: about 20°
either side, D28). With the nose hidden in the front view, the view straight ahead over the panel opens up. That is the
product owner's choice; the nose still shows when looking round.

## D91. Pilot's speed cards on the RAF and Bf 109 panels (1 Nov 2026, plan approved by the product owner)

**Request:** a white pilot's card on each panel with the stall, take-off, best rate-of-climb and final approach speeds:
on the RAF panel left of the GM 2, on the Bf 109's right of the manifold pressure gauge (the product owner wrote
"boost"; the Bf 109's equivalent is the ata gauge).

**The product owner's choice:** the period sources' figures where we have them, theirs only where we have none. The Bf
109's card replaces the white deviation card (D89). The two RAF fighters share a panel but show their own figures.

**Figures** (`pilotCard` in `src/aircraft/spitfire.js`, `hurricane.js`, `bf109e4.js`; card in `src/ui/speedCard.js`):

| | Spitfire | Hurricane | Bf 109 E |
|---|---|---|---|
| Stall, flaps up | 78 mph (S4) | 87 mph (S12, Mk II, 86.5) | 150 km/h (S20) |
| Stall, flaps down | 68 mph (S4) | 70 mph (S12, Mk II) | 100 km/h, flap 40° (S20) |
| Take-off | 81 mph (product owner) | 81 mph (product owner) | 120 km/h, flap 20° (product owner) |
| Best rate of climb | 140 mph (S4) | 164 mph (S2, sea level) | 250 km/h (S15, sea level) |
| Final approach | 85 mph (S33) | 70 mph (product owner) | 145 km/h (S32: about 90 mph) |

**The product owner's figures that differ from the sources** (not used):
- **RAF stall:** 57 mph, against the Spitfire's 78/68 (S4) and the Hurricane's 86.5/70.3 (S12).
- **RAF best climb:** 130 mph, against the Spitfire's 140 (S4, with 162 recommended) and the Hurricane's 164 (S2).
- **RAF approach:** 70 mph, against the Spitfire's 85-90 (S33).
- **Bf 109 stall without flap:** 120 km/h, against 150 (S20).
- **Bf 109 best climb:** 150 km/h, against 250 (S15).

The product owner's Bf 109 stall with flap (100 km/h) and approach (145 km/h) agree with the sources.

**Unsourced, the product owner's figures used** (estimates, listed under the research gaps): the three take-off speeds
and the Hurricane's approach speed.

**Placement:**
- **RAF:** box [714, 70, 822, 400] on the reference picture, above the blind-flying panel, right of the flap placard,
  clear of every part of the GM 2 on every screen tested.
- **Bf 109:** box [808, 345, 866, 478] on #17, inside the upper plate's edge and clear of the front frame.

The labels are in English, as the product owner wrote them.

## D92. UP and DN on the Bf 109's undercarriage selector (1 Nov 2026, plan approved by the product owner)

At the product owner's request the Fahrwerk selector's placard (D89) carries UP beside Ein and DN beside Aus, in bold,
between the German words and the window (`SELECTOR_LABELS` in `src/ui/bf109Lower.js`). Ruhe has no English label. To
leave room for them clear of the handle, the placard is drawn wider than on the restored panel, out to the left into the
plain panel beside the coolant thermometer: box [775, 695, 900, 749], against #17's [805, 695, 900, 749]. The English
labels and the wider placard are additions to the photographed panel.

## D93. Whole Bf 109 panel in the normal view; its undercarriage lever; the flap ball lever; hat forward (1 Nov 2026, plan approved by the product owner)

**Partly superseded by D95:** the switch between the turn and bank and the rev counter is the propeller pitch lever, and the Fahrwerk selector is the undercarriage switch again.

**The whole panel looking ahead.** At the product owner's request the normal Bf 109 view shows the lower panel too:
- The guns' line (the reticle, and the horizon in level flight) stands 30% of the way down the screen (`BF109_AIM`, their
  choice), with the dials about their earlier size (48 px on a 1,259-pixel-high window, against 49).
- The 3D picture is lens-shifted up to match (`CameraRig.aim` and `shiftPicture`, `camera.setViewOffset`): no tilt,
  verticals stay upright and the field of view is unchanged. The RAF fighters and the Bf 110 keep the middle.
- The look-down slide of D89 is gone.

**Hat forward** looks up and ahead again, as before D89.

**The undercarriage lever.** The product owner identified the switch between the turn and bank indicator and the rev
counter as the undercarriage lever. It had been drawn as the airscrew pitch switch since D38, read on the museum
photograph. The upper panel's "Vor Anlassen Fahrwerkschalter auf ‚Ruhe'" placard fits. Its red knob now slides up its
slot with the undercarriage selected up and down with it selected down, lettered UP and DN (their choice).

**The other undercarriage items** stay still: the right ball lever (by its placard, the hydraulic hand pump) and the
lower Fahrwerk selector (probably the hand pump's valve), whose handle now rests at Ruhe. Its UP and DN labels (D92) stay.

**Deviation, flagged to the product owner:** the left ball lever swings with the flaps, from its photographed 39° out
from the vertical with the flaps up to 20° with them fully down. The real Bf 109 E's flaps were set by a handwheel
beside the seat; the lever stands in for it so that the flap setting shows on the panel (their choice).

## D94. Bf 109 MG 17 flashes on the coaming; hood cross bar and corner braces removed (1 Nov 2026, plan approved by the product owner)

**MG 17 flashes:** at the product owner's request the cowling MG 17s' muzzle flashes show on top of the coaming lip
(D90) in the front view, well apart, instead of beside the Revi's glass.
- **Where:** symmetric about the windscreen's centre (the fuselage's centre line, where the real guns sat), at x 393 and
  773 on the panel picture: about 8.4 dial radii apart, inside the windscreen posts, the right one clear of the Revi.
- **How:** drawn with the front frame (`flashPoint`, `mgFlashes` in `src/ui/bf109Frame.js`), each for 0.03 s after its
  gun's shot, as the 3D flashes. The cowling guns' 3D flashes are hidden while the front view shows and show again when
  looking round; the cannon's are unchanged.
- **The guns themselves don't move:** their positions (D67) still set where the rounds start and how they are
  harmonised, so the ballistics are unchanged.

**Hood:** at the product owner's request the 3D Bf 109 hood seen when looking up or round no longer has the front pane's
cross bar or the diagonal braces across its upper corners (`bf109Hood` in `src/render/cockpitFrame.js`).

## D95. Bf 109 pitch lever, undercarriage switch and lights, trim indicator (1 Nov 2026, plan approved by the product owner)

After the conflict flagged after D94 (the Achtung placard's "Fahrwerkschalter auf ‚Ruhe'" matches the lower selector's
Ein / Ruhe / Aus), the product owner settled the Bf 109 panel's controls:
- **Propeller pitch lever:** the lever switch between the turn and bank indicator and the rev counter, as first drawn in
  D38. It is lettered Fine at the top and Coarse at the bottom. Its red knob moves with the blade angle, from the fine
  stop (22.5°) at the top to the coarse stop (55°) at the bottom: the thumb-switch changes and the engine-management
  assist both show (`pitchFraction`).
- **Undercarriage switch:** the Fahrwerk selector beside the hand pump. Its handle stands at Ein (UP) with the
  undercarriage selected up and Aus (DN) with it selected down. D93's undercarriage lever and the selector's rest at
  Ruhe are undone.
- **Undercarriage lights:** the lamps marked EIN and AUS beside the fuel and oil pressure gauge, one of each per leg.
  The EIN pair glows red with the undercarriage fully up, the AUS pair green with it down and locked, and all are dark
  while it moves.
- **Elevator trim indicator:** the narrow window below the hand pump. A white pointer moves with the trim, from + (nose
  up) at the top through 0 (neutral) in the middle to − (nose down) at the bottom, on the trim display's ±15° scale (D74).
  The window was moved down (box [957, 782, 995, 858]) to clear the right ball lever's knob, which covers its top on
  the photograph.

**Deviations from the photographed panel, flagged:**
- the EIN/AUS lamps are drawn as undercarriage lights;
- the strip is drawn as a trim indicator, moved down;
- the trim marks are + and − rather than words: the window is too narrow for words to be read;
- the labels Fine and Coarse are in English, as the product owner asked.

## D96. Joystick buttons for propeller pitch fine and coarse (1 Nov 2026, plan approved by the product owner)

At the product owner's request the joystick panel (J) offers two more buttons, **Propeller pitch fine (hold)** and
**Propeller pitch coarse (hold)** (`pitchFine`, `pitchCoarse` in `src/input/joystick.js`; mapping version 5).
- **Defaults:** the Extreme 3D Pro's unused buttons 7 and 9 (as printed on the stick).
- **Saved mappings:** a mapping saved before keeps every button the owner chose and gains the two new ones. One whose
  default number the owner already uses for another button starts unassigned. Every button list now has a "none"
  choice, and an unassigned button never fires.
- **What they do while held:** on the Bf 109 and Bf 110 (manually pitched VDM airscrews) they work the pitch thumb
  switch, as the E and D keys do, so the Bf 109's pitch lever (D95) follows. On the RAF fighters (constant-speed
  airscrews) they move the rpm lever up or down at the keyboard's rate.

## D97. Propeller arc from the cockpit; HUD and reticle in the outside views (1 Nov 2026, plan approved by the product owner)

**Propeller arc:** at the product owner's request a spinning propeller arc shows from the cockpit.
- **Bf 109:** its airscrew is no longer hidden in the front view (it was since D90); the nose and wings stay hidden.
- **Tip ring:** every airscrew gains a faint ring where its blade tips run, beside its disc. Both show only above the
  blade-drawing speed (700 rpm), so stopped blades still show on the ground.
- **Opacity from the cockpit:** the disc goes from 6% to 10%, with the ring at 25%. From outside: disc 30%, ring 35%.

**Outside views** (chase, fixed and orbit; all aircraft), at the product owner's request:
- **Panel:** hidden (`panelHidden` in `src/ui/instruments.js`).
- **Reticle:** each aircraft's pattern (GM 2 or Revi) drawn without the sight body at the guns' convergence point:
  the point on its line of sight at its harmonisation range (aircraft data), projected from the chase camera, so it shows
  where the guns point. The ring keeps the sight's mils at the camera's field of view (`chaseAim` in
  `src/ui/reflectorSight.js`).
- **HUD** (`src/ui/flightHud.js`): a translucent column on the right of the screen in the side's units:
  - airspeed, altitude, heading and climb;
  - throttle, boost or ata, rpm with the rpm lever or blade pitch, and coolant temperature;
  - flaps, undercarriage (UP, DN or moving) and trim;
  - rounds left.

  It shows only in the outside views; the F2 strip and F3 overlay are unchanged.

## D98. The Bf 109's propeller arc centred on the drawn fuselage centre (1 Nov 2026, plan approved by the product owner)

The product owner saw the propeller arc (D97) off centre to the right in the Bf 109's front view and asked for it to be
centred on the fuselage centre.

**Why it was off:** the drawn cockpit follows the photographs, with the Revi right of the panel's centre (D89). The
3D view is centred on the guns' line through the Revi, so the drawn windscreen and panel centre stands about 1.7 dial
radii left of the screen's middle (`FUSELAGE_CENTRE_OFFSET`), while the 3D airscrew sat straight ahead at the middle.

**The change:** in the front view only, the airscrew is drawn shifted sideways so that its hub falls on the drawn
fuselage centre on any screen (`screwShift` in `src/render/testView.js`). Its spinner is hidden there: with the nose
hidden it would float on its own. Looking round and in the outside views the airscrew is back in its true place. The
guns, the reticle and the physics are unchanged.

**Deviation, flagged:** on the real aircraft the pilot sits on the centre line, so the arc would centre on the guns'
line. Here the arc follows the drawing.

## D99. Hurricane and Spitfire front cockpit views, as the Bf 109's (1 Nov 2026, plan approved by the product owner)

**The Hurricane's frame superseded by D100** (from the museum photograph #28); **the Spitfire's by D102.**

At the product owner's request the Hurricane and Spitfire get the Bf 109's front-view treatment (D90, D97, D98).
- **Their frames are drawn with the panel:** `RAF_FRAMES` and `drawRafFrame` in `src/ui/rafFrame.js`, drawn on the
  sight's canvas before the GM 2.
- **No nose or wings** in the front view, and no 3D windscreen; they show again when looking round.
- **The propeller arc stays,** its spinner hidden there. The GM 2 is on the panel's centre line, the middle of the
  screen, so the arc needs no shift.

**The pictures,** shape guides only, nothing copied:
- **#25 and #27:** paintings of a Hurricane cockpit, #27 the main guide.
- **#26:** a screenshot of a Spitfire cockpit from another game, flagged as such.

**The frames,** measured against each picture's dials and sight in the RAF panel's picture pixels:
- **Both:**
  - the coaming's lip along the panel's arched top;
  - the armoured windscreen's two posts on the coaming either side of the GM 2, joined over it by a rounded arch.
- **Spitfire (light grey metal):**
  - a wide arch, its top about 8 dial radii above the panel;
  - two straight canopy bows meeting above the view and running down past the panel's lower corners;
  - short struts from the arch's shoulders to them.
- **Hurricane (grey-green, as both paintings):**
  - a taller arch, about 12 dial radii;
  - a wide canopy hoop rounding over the top, its legs running down outside the panel;
  - level struts from the windscreen's posts across to it.

**Departures from the plan:** no interior fill is drawn round the RAF panel. All three pictures show the landscape
through the side windows beside it, so the ground shows there.

**Deviations, flagged:**
- the shapes come from paintings and another game's screenshot, not from drawings;
- the Hurricane uses the Spitfire's panel (D86).

## D100. The Hurricane's front view redrawn from the museum photograph (1 Nov 2026, plan approved by the product owner)

The product owner found the RAF front views of D99 needed fixing, starting with the Hurricane. It should show the
front windscreen frame, the coaming and the fuselage sides as in their photograph #28: a museum Hurricane cockpit from
the front, canopy back, used as the shape reference only. The canopy hoop and struts from the paintings are gone.

**The frame** (`RAF_FRAMES.hurricane`, `src/ui/rafFrame.js`), measured on #28 against its blind-flying dials and the
GM 2:
- **Outer windscreen frame:** grey-green, upright legs on the coaming's ends about 9.9 dial radii either side of the
  sight, and an elliptical crown about 16 dial radii above the panel's top. On most screens the crown runs just off the
  top of the view.
- **Armoured windscreen:** a broad, lighter frame inside it, posts on the coaming about 5 dial radii either side and a
  rounded top about 13 dial radii above the panel.
- **Coaming:** a broad pale lip curving across over the panel's top, highest over the sight, down to its ends about 2.4
  dial radii below the panel's top. Its lower edge stays clear of the speed card, placards and dials.
- **Fuselage sides** (`drawRafInterior`, on the panel's canvas before the panel):
  - the pale sills sloping from the coaming's ends out to the edges of the view;
  - the grey-green side walls below them;
  - the dark cockpit interior under the coaming beside the panel.

The colours follow the photograph. The Spitfire's frame (D99) is unchanged until it is reworked.

## D101. The Hurricane's front view refined (1 Nov 2026, plan approved by the product owner)

At the product owner's request, after reviewing D100:
- **Thinner frames:** outer 56, armoured windscreen 60, coaming 56 and sills 70 picture pixels (were 96, 100, 112, 135).
- **The windshield lower:** first by 25%. Then, at the product owner's further request, the armoured windscreen's
  posts were brought in by about a dial radius each side (to 4.1 radii from the sight's axis) and its top lowered by the
  same amount, to about 8.8 dial radii above the panel.
- **The outer frame:** its legs lean in about 15° from their feet on the coaming to where its crown springs, and its
  crown is shorter and lower, its top about 10.4 dial radii above the panel. It still clears the armoured windscreen and now shows fully on screen.
- **Side panes:** horizontal frames about halfway up, from the armoured posts across to the outer legs.
- **Fuselage sides:** the sills angle in at the Bf 109 side frames' slope (1.156 across for each pixel down) from the
  outer legs' feet.
- **The coaming:** wraps close round the panel's arched top, a band just outside its outline between the outer legs'
  feet. The legs stand on it, and the dark interior and side walls follow.
- **The GM 2 raised:** in the Hurricane cockpit the guns' line stands 45% of the way down the screen (`RAF_AIM`), with
  the 3D picture lens-shifted to match as the Bf 109's (D93). The GM 2 standing on the panel grows a little, so that its
  reflector glass stands above the coaming, with the reticle still centred in it.

The Spitfire is unchanged until it is reworked.

## D102. The Spitfire's front view, as the Hurricane's with #29's differences (1 Nov 2026, plan approved by the product owner)

With the Hurricane's front view approved (D100, D101), the product owner asked for the Spitfire's to closely resemble it,
with the minor differences of their picture #29. #29 is a screenshot of a Spitfire cockpit from another game, the same as
#26: a shape guide only.

**Shared with the Hurricane** (`RAF_FRAMES.spitfire`, `src/ui/rafFrame.js`):
- the thin frames;
- the armoured windscreen, made narrower between its posts and lower at the product owner's request (posts 3.5 dial
  radii either side of the sight, top about 8.1 dial radii above the panel);
- the coaming close round the panel;
- the fuselage sides: sills at the Bf 109's slope, side walls and the dark interior;
- the GM 2 raised, the guns' line at 45% of the screen.

**The Spitfire's differences, from #29:**
- **Outer windscreen frame:** the legs lean in more steeply, about 20° (the Hurricane's 15°), to a flat top bar about
  10 dial radii above the panel, clear above the armoured windscreen. Its corners are rounded (product owner).
- **A rear-view mirror** on the top bar's centre.
- **Struts** rising from the armoured windscreen's shoulders out to the outer legs, in place of the Hurricane's level
  frames halfway up.
- **Colours:** light grey metal frames, pale grey coaming and sills, grey side walls.

The long canopy bows and the dark lip of D99 are gone.

**The look of both RAF fighters' frames:** at the product owner's request, the windscreen frames, struts, mirror stem,
fuselage side frames and coaming of the Hurricane and Spitfire are drawn in the Bf 109 frames' style (D103), in dark
green (a darker grey at first): a band with a dark outline, a lit edge on the outside, a shaded edge and a row of rivets. Their shapes, rounded
corners included, are unchanged. The fuselage's inside walls below the side frames are in the instrument panel's
colour (product owner).

## D103. The Bf 109's front view framed as the museum photograph, with square joins (1 Nov 2026, plan approved by the product owner)

With the RAF fighters' front views approved (D100–D102), the product owner asked for the Bf 109's to be similar to the
Hurricane's, but with square frame joins rather than rounded ones, as their museum photograph from the seat shows (#16,
a shape guide only). They chose to include the windscreen's cross bar and the two corner braces in the front view. The
3D view when looking up stays without them (D94).

**The frame** (`FRAME` and `drawFrontFrame` in `src/ui/bf109Frame.js`), measured on #16 in the restored panel's picture
pixels (the D89 dial match), all bars thin with mitred joins and flat ends:
- **Coaming lip:** thinner (22), arching tight over the panel's top, only between the posts' feet (product owner).
  For a while it ran 25% further round the panel.
- **Front pane:** at the product owner's later requests, the two posts stand 20% closer together than in #16 and lean in
  about 5° going up to a cross bar just above the Revi's glass. Above it they angle out to the hood's top frame's
  corners. The side windows' lower frames keep their feet on the
  coaming where the posts stood before. Standing right of centre as photographed, the Revi's glass now overlaps the
  right post's edge.
- **Heights:** at the product owner's request the hood's top frame stands 20% lower above the coaming than at first.
  The cross bar is lowered about 16%, as far as it can go while staying above the Revi's glass (a full 20% would cross
  its top). The braces stay at 45°. Every corner stays joined, because the posts, braces and hood sides are all worked
  out from these heights.
- **The hood's top frame:** flat with square corners, 20% narrower than #16's at the product owner's request. Its sides
  lean out more steeply going down so that they still meet the side windows where they did.
- **Corner braces:** across the top corners at about 45° (removed for a while, then put back at the product owner's
  request). They cross the posts' diagonals near the corners, drawn over them (product owner).
- **Side windows:** their lower frames, the fuselage's sides, start at the posts' feet, joining them (product owner).
  They run down to meet the hood's sides near the bottom corners, and on to the foot of the screen. At the product
  owner's request they are steeper than D90's: 1.02 across for each pixel down, not 1.156. That is the steepest that
  clears the upper plate's wings from the posts' feet. To clear these frames, the speed card is 6 px narrower and 8 px
  further left ([800, 345, 852, 478]), and the flap placard 6 px narrower on its left.
- **No band below the windows:** the dark fill across the screen below the side windows, which looked like the wings'
  leading edges, was removed (product owner).

**Screen fit, a deviation flagged:** at the photograph's proportions the top frame would stand well above the top of the
screen. As for the Hurricane, the height above the cross bar is compressed so the whole frame shows. The coaming, posts'
feet, cross bar and side windows keep the photograph's proportions.

**The look:** at the product owner's request every frame, the coaming included, is drawn in the coaming's style in
dark grey (light, then medium grey at first): a band with a dark outline, a lit edge and a shaded edge, and a row of rivets.

**Unchanged:** the propeller arc (D98), the MG 17 flashes on the coaming (D94), the Revi and the panel.

## D104. Welded cockpit frames (2 Nov 2026, product owner)

At the product owner's request every aircraft's front-view frame joints look welded, not bolted. The Bf 109's frames
(dark grey) and the Hurricane's and Spitfire's (dark green) are drawn by one routine (`drawFrames`, `src/ui/frameBars.js`)
in passes:
- **Outlines:** every bar's dark outline first, so no outline crosses a joint.
- **Bands:** each bar's band, edges and rivets next, in order. A bar that ends on another comes after it, so its band
  covers the other's edge where they meet.
- **Trimming:** each bar's own lit and shaded edges and rivets stop at the other bar's side.
- **Feet:** the RAF fighters' windscreen frames carry their feet down into the coaming, so they join it without a seam.
- **Unchanged:** the Bf 109's corner braces still lie over its posts where they cross.

Earlier colour changes the product owner asked for:
- the Hurricane's and Spitfire's frames and coaming in dark green;
- their fuselage inside walls in the instrument panel's colour (D102);
- the Bf 109's frames and coaming in dark grey (D103).

## D105. Radium luminous paint on the Bf 110's and Bf 109's dials (2 Nov 2026, product owner)

At the product owner's request these Bf 110 dials have their markings and hands in light yellow, for radium luminous
paint: the airspeed indicator, the altimeter, the climb indicator (VSI), the turn and bank indicator, and each engine's
rev counter, manifold pressure gauge and pitch indicator. At the product owner's further request the attitude
indicator (horizon), compass, clock and temperature gauges were added; only the fuel gauges stay white. The yellow is
the RAF panel's luminous colour (`LUMINOUS`, `src/ui/lwStyle.js`). The clock's second hand stays red.

**Bf 109:** the same, at the product owner's request: the airspeed indicator, altimeter, compass, manifold pressure
gauge, turn and bank indicator, rev counter, pitch indicator, clock and both thermometers. The fuel contents gauge and
the fuel and oil pressure gauge stay white.

The Luftwaffe dial drawings, shared with the Bf 109, take their colours from `paint`. `luminous(draw)` sets it to the
luminous yellow for the dials drawn inside it and then restores it, so each panel chooses which of its dials are luminous.

## D106. The Bf 110 C panel from the product owner's pictures (2 Nov 2026, plan approved by the product owner)

**The pictures** (layout references only: redrawn in code, nothing copied):
- **#31 ("BF110C panel.jpg"):** the panel's shape and instrument positions.
- **#32 ("Bf110C cockpit view_1.jpg"):** details. Its large compass on the right is ignored, at the product owner's
  request.

**The product owner's answers:**
- The ammunition counter of #32 (three tall windows with a red strip below) replaces #31's box of lamps and knobs at the
  top.
- The added flap indicator, OBEN/UNTEN lever with GEAR lamps and elevator trim display are removed. The panel's own
  Landeklappe and Fahrwerk Ein/Aus switches work instead, and a trim indicator goes in a free space.

**The panel** (`src/ui/bf110Panel.js`, fittings in `src/ui/bf110Fittings.js`), measured on #31 and traced on its
outline, the turn and bank's column on the middle of the screen:

| Area | Items |
|---|---|
| Top | Ammunition counter, red push button, "4 MG / 2 MG" strip, "L … R" instrument and strip, trim indicator, clock |
| Upper row | Patin repeater compass, the "00 00" instrument, turn and bank, climb |
| Middle | The "Umschalterstellung" strip |
| Lower row | Strip compass in its recess, fine altimeter, horizon, airspeed |
| Right, per engine | Fuel and oil pressure gauge, rev counter, manifold pressure in its red ring |
| Bottom centre | Each engine's oil and coolant temperatures either side of the fuel gauge; four warning lamps; the radiator flap switches either side of the fuel tank selector |
| Left | The EIN/AUS undercarriage lights, the Landeklappe and Fahrwerk switches, magneto switches, placards, the hydraulic pressure gauge, two knobs |

**Working:**
- **Instruments:** the flying and engine instruments and the clock.
- **Ammunition counter:** the left MG 17 pair, both MG FF and the right MG 17 pair, each tape dropping as its guns fire.
- **Flap and undercarriage switches:** Aus with the flaps or undercarriage selected down, Ein with them up.
- **Undercarriage lights:** EIN red with it up, AUS green with it down, dark while it moves.
- **Radiator switches:** Auf or Zu with key O.
- **Trim indicator:** as the Bf 109's.
- **Fuel gauge:** the front left main tank, the selector at 1: 375 L, full.

The rest shows normal operation. All the dials but the fuel gauge carry luminous paint (D105).

**Data added:** `fuel.main` 375 L and `fuel.reserve` 260 L for each wing (S24, S25).

**Deviations, flagged:**
- **Rev counters:** to 3,600 rpm as photographed (the Bf 109's run to 3,400). The red mark stays at the DB 601A's
  2,400 rpm limit.
- **Additions to #31:** the ammunition counter (from #32) and the trim indicator, which stands where #31 has a pasted
  photograph.
- **Tank selector:** fixed at 1.
- **Unidentified, shown only:** the "00 00" instrument and the "L … R" instrument (a homing indicator; the game has no
  radio aids).
- **Removed:** the Bf 110's earlier grid panel (D39, D44, D46), its added displays (D34, D66, D74 on the Bf 110) and the
  sizing matched to the Bf 109's old panel (D64).

## D107. The Bf 109's instruments and Revi on the Bf 110 C panel (2 Nov 2026, plan approved by the product owner)

**The request:**
- **Instruments:** the Bf 110 C panel's airspeed indicator, altimeter, turn and bank and "G4" compass become the
  Bf 109's instruments exactly. The product owner named the "G4" compass as the strip compass in the recess; the big
  Patin compass stays.
- **Revi:** the instrument under the reticle (the "L … R" homing indicator) is replaced by the Bf 109's Revi, its body
  20% shorter, standing on the panel above the turn and bank.

**The instruments** (`src/ui/bf110Panel.js`):
- **Size:** the same on screen as on the Bf 109 (product owner). One Bf 109 dial radius is `BF109_SCALE` (1.18) Bf 110
  radii on every screen tested, all of which are limited by their height. Each face and mounting is the Bf 109's
  layout entry scaled by it.
- **Finish:** the Bf 109's red bezels and knurled setting knobs on the airspeed indicator and altimeter, and square
  mountings on the turn and bank and the strip compass.
- **Recess:** the strip compass's recess is gone, as on the Bf 109.

**Moved to make room** (on #31's pixels):
- the airspeed indicator, 2 px left;
- the strip compass, 3 px left;
- the "Umschalterstellung" strip and its knobs, 9 px down;
- the "4 MG / 2 MG" strip, 3 px up;
- the ammunition counter and the red push button, 18 px left.

**Removed:** the "L … R" instrument and the strip under it, where the Revi's block and knob now stand.

**The Revi** (`REVI_110`, `BF110_REVI`; the parts in `src/ui/reviParts.js`):
- **Drawing:** the Bf 109's sight at its size on screen.
- **Shorter body:** the body is 3.2 units tall instead of 4.0 (`shortRevi`).
  - The pad, the lever and its pivot are pressed down to fit.
  - The block and knob move up 0.8 units.
  - The glasses and housing are unchanged.
- **Cable:** left off, since it would hang across the turn and bank.
- **Placement:** the knob's foot stands just above the turn and bank's mounting, so the guns' line is 4.3 Bf 110 radii
  above the panel's top.
- **Guns' line:** raised to `BF110_AIM` (0.41 of the screen from the top, was 0.5) by the same lens shift as the
  Bf 109's (D93), so the reticle falls on the glass. The panel keeps its 45% share of the screen.
- **3D sight:** the 2D Revi replaces the 3D sight while looking ahead, as on the Bf 109; the 3D one shows when looking
  round.

**Flagged:**
- the moves above;
- the cable left off;
- the Bf 110's guns' line now above the middle of the screen.

No aircraft data changed.

## D108. The Bf 110 C's flying instruments rearranged (2 Nov 2026, plan approved by the product owner)

**The request:**
- **Removed:**
  - the "00 00" instrument right of the Patin (vertical) compass;
  - the "4 MG / 2 MG" strip above it.
- **Upper row:** the turn and bank goes right of the Patin compass, with their bottoms aligned, and the climb indicator
  right of the turn and bank.
- **Lower row:**
  - the artificial horizon goes right of the strip (horizontal) compass, enlarged to the Patin compass's size;
  - the airspeed indicator goes below the climb indicator, a little to its left;
  - the altimeter goes right of the airspeed indicator.

**The product owner's answers:**
- **Revi:** it stays in the middle of the screen, so it stands above the climb indicator, which sits on the axis.
- **"Umschalterstellung links / rechts" strip:** removed, with its two knobs.

**Layout** (`src/ui/bf110Panel.js`, on #31's pixels):
- **Upper row:** the Patin compass (250, 185, unmoved), the turn and bank (343, 189) and the climb indicator (428, 199).
  Their bottoms are on 232.
- **Lower row:** the strip compass (237, 291), the horizon (331, 287; face 40, mounting 47, as the Patin compass), the
  airspeed indicator (423, 291) and the altimeter (512, 291). Their bottoms are on 334.
- **Spacing:** 3 px between mountings. The rows are built by `row()`, so the alignment is exact.

**My choices, flagged:**
- the lower row's bottoms aligned as well as the upper row's;
- the 3 px gaps;
- the space where the climb indicator was is left empty;
- the Revi's knob stays where D107 put it, so the guns' line keeps its approved place (0.41 of the screen). That leaves a
  small gap above the climb indicator.

## D109. Airscrew pitch indicators on the Bf 110 C panel (2 Nov 2026, plan approved by the product owner)

**The request:** the two small gauges above the rev counters become propeller pitch indicators, as on the Bf 109's
panel. They were the fuel and oil pressure gauges.

**The change** (`src/ui/bf110Panel.js`):
- **Instrument:** the Bf 109's airscrew pitch indicator (`lwPitchIndicator`: ten minutes to a degree of blade angle,
  S32), in luminous paint (D105).
- **One per engine:** each indicator reads its own engine's blade angle (`engines[i].pitchClock`).
- **Place and size:** where the photographed gauges stand (585 and 643, 175 on #31), at their size.

**Flagged:**
- **Size:** smaller than the Bf 109's indicator. At the Bf 109's size, the right one would stick out past the panel's
  sloping top-right edge.
- **Fuel and oil pressure gauges:** no longer on the Bf 110 panel. They showed normal operation only, since the pressures
  are not modelled (D63).

## D110. The Spitfire's trim gauge on the Bf 110 C panel (3 Nov 2026, plan approved by the product owner)

**The request:**
- Replace the Bf 110's elevator trim indicator (the small +/0/− strip taken from the Bf 109, D106) with the Spitfire's
  trim dial. The product owner noted it is "not strictly original but it looks more authentic".
- Then: reduce it to the clock's size.

**The change** (`src/ui/bf110Panel.js`):
- **Drawing:** the Spitfire's trim gauge (`rafTrimGauge`, src/ui/rafPanelDials.js, unchanged for the Spitfire): the
  needle pivoted on the left over an arc, with NOSE UP above and NOSE DOWN below.
- **Finish:** its RAF bezel, with its four screws in proportion.
- **Reading:** the Bf 110's trim (`trimDegrees`, keys T and G).
- **Size and place:** the clock's size (face 20, mounting 24 on #31's pixels), level with the clock at (510, 112) on
  #31, where the trim strip stood.

**Flagged:** an RAF instrument with English words on a Luftwaffe panel (the product owner's choice).

## D111. Even, wider gaps between the Bf 110's flying instruments (3 Nov 2026, plan approved by the product owner)

**The request:**
- Extend the panel's right-hand side so the gaps between the flying instruments can be widened to one even amount.
- Then: extend it a bit more, so the strip (horizontal) compass's left edge lines up with the Patin (vertical)
  compass's, keeping the gaps between the horizon, airspeed indicator and altimeter.

**Layout** (`src/ui/bf110Panel.js`):
- **Gaps:** one 10 px gap on #31 (was 3) between neighbouring flying instruments, in both rows.
- **Upper row:** the Patin compass is unmoved; the turn and bank (350) and the climb indicator (437) follow it.
- **Lower row:** the strip compass's left edge is under the Patin compass's (203, was 194); the horizon (347), the
  airspeed indicator (446) and the altimeter (542) follow it.
- **Bottoms:** still aligned in each row.
- **Middle line (`AXIS`):** now the climb indicator's column, so the Revi still stands above it in the middle of the
  screen. The panel shows 9 px further left on screen. The guns' line is unchanged (0.41).
- **Right-hand side:** moved out 30 px (`WIDEN`: 21 for the wider gaps, 9 for the compass alignment). This covers the
  outline's right section, the clock, the trim gauge, the pitch indicators, the rev counters and the manifold pressure
  gauges.
- **Unchanged:** the left side and the bottom centre.

**Flagged:** the panel is now wider than the photographed one (#31) by 30 px on its pixels.

## D112. The Bf 110 C panel's right shoulder and side, engine gauges by the edge, a wider lower row (3 Nov 2026)
These are the product owner's follow-on refinements to D111, given in the session.

**Right shoulder:**
- The left shoulder is mirrored on the right, and the top edge ends over the clock's 12 o'clock.
- The right-hand side then leans out at 75° from the horizontal, as on #31 (product owner: "angled about 75 degrees not
  vertical").
- The section's bottom edge is lengthened to meet it (to about 795 on #31's pixels).

**Engine gauges:**
- The pitch indicators, rev counters and manifold pressure gauges each move right as a pair.
- Each right-hand gauge's mounting comes 8 px (on #31) inside the sloping edge at its top corner (`toEdge`).

**Lower row:** the gaps between the strip compass, horizon, airspeed indicator and altimeter widen from 10 to 15 px
(`LOWER_GAP`). The strip compass's left edge stays under the Patin compass's.

**Flagged:** the panel's right-hand part is wider than on #31, and its side is straight instead of the photograph's
slight curve.

## D113. The Bf 109's ammunition counter on the Bf 110 C panel (3 Nov 2026, product owner)

**The request:** the Bf 110's ammunition counter becomes exactly the counter built for the Bf 109 in its earlier panel
(D64, D65), which was taken off the Bf 109 with its redraw (D89).

**The counter** (`src/ui/ammoCounter.js`, restored unchanged from that version but for its header):
- **Layout:** the dark plate with the guns' EIN/AUS switch on the left, then three columns. Each column has a round
  window that turns with every round counted, a scale marked 500 with a white tape showing the rounds left, and a plate
  at its foot that lights red when the guns are empty.
- **Columns:** the left MG 17 pair, both MG FF and the right MG 17 pair, as before (D106) (`ammoColumns`).
- **Box:** the old Bf 109 counter's shape (57 × 36.5), 107 × 68.5 on #31's pixels, in the old box's place, clear of the
  Revi.

The tests are restored with it and read the Bf 110's guns.

## D114. T-bar flap and undercarriage levers on the Bf 110 C panel (3 Nov 2026, product owner)

**Replaced by D199:** the sliding T levers became two push/pull T-handle valves per control.

**The request:** the Landeklappe and Fahrwerk levers are a "T" bar shape: an upright T, not one on its side.

**The change** (`tBar` in `src/ui/bf110Fittings.js`):
- **Shape:** each lever is a black upright T. Its stem rises from the slot at the lever's position, behind the Ein and
  Aus discs, to a bar across its top that is lit along its upper edge.
- **Removed:** the old sideways arm and its round knob.
- **Movement:** the T moves along the slot with the flaps and undercarriage selection, as before (D106).
- **Room for the bar at Ein:** the EIN/AUS light box is trimmed 4 px at its foot and the "Achtung Fahrwerk" placard
  10 px at its foot (#31's pixels).

## D115. The Bf 109's coolant thermometers on the Bf 110 C panel; the fuel gauge to match (3 Nov 2026, product owner)

**The request:**
- The engine temperature gauges either side of the fuel gauge become the Bf 109's coolant temperature gauge.
- Then: match the fuel gauge's size to them.

**The change** (`src/ui/bf110Panel.js`):
- **Thermometers:** each engine's coolant temperature is shown on the Bf 109's thermometer (`lwThermometer`: 0–130 °C,
  its blue ring, "Kühlst.", luminous paint), at the Bf 109's size on screen.
- **Placement:** the thermometers sit either side of the fuel gauge, at 347 and 509 on #31's pixels.
- **Fuel gauge:** now the same size (the Bf 109's fuel gauge size), still white and without the Bf 109's yellow ring.

**Flagged:** the Bf 110 panel no longer shows the oil temperatures. They were the left half of each of the two-scale
gauges (D63), which these thermometers replace.

## D116. The Bf 110 C's pilot's speed card and flap placard (3 Nov 2026, plan approved by the product owner)

**The request:**
- A pilot's speed card in the clear space below the trim gauge, its rows in this order: Stall Speed Flaps Up, Stall
  Speed Flaps Down, Take-off Speed, Final Approach Speed, Best ROC Speed.
- The placard beneath the flap lever (it read "Achtung Fahrwerk") to read "Achtung! Max Flap Speed 250 km/hr", with the
  take-off and landing flap angles.
- Refinements given in the session:
  - the card white on black, in the flap placard's font size, as narrow as its lettering;
  - its top level with the climb indicator's;
  - the pitch indicators the clock's size.

**The product owner's answers:**
- **Speeds without a source:** use the flight model's own figures, recorded as estimates.
- **Flap angles:** the sourced ones, 0° for take-off and 50° for landing (they had written 10° and 40°).

**Figures** (`pilotCard` in `src/aircraft/bf110c4.js`, indicated km/h):

| Row | Figure | Where it comes from |
|---|---|---|
| Stall Speed Flaps Up | 155 | The model's power-off stall, flaps and undercarriage up (153), to the nearest 5 (estimate) |
| Stall Speed Flaps Down | 132 | S23's landing speed |
| Take-off Speed | 170 | The model's lift-off speed in the standard take-off without flap (168), to the nearest 5 (estimate) |
| Final Approach Speed | 160 | S24 |
| Best ROC Speed | 220 | The model's best-climb speed at sea level, 2300 rpm and 1.2 ata (219), to the nearest 5 (estimate) |

- **Model figures under test:** a test keeps each within 5 km/h of what the flight model gives, so a later change to the
  model that moves them is caught.
- **Flap placard:** "Achtung!", "Max Flap Speed", "250 km/hr" (S24, `pilotCard.flapLimit`), "Take-off 0°",
  "Landing 50°" (S24, from the flap data).

**Drawing** (`src/ui/bf110Placards.js`):
- **Look:** both placards white on black with a light border, in one font size (`PLACARD_FONT`, 5.2 px on #31, the
  largest at which the flap placard's widest line fits).
- **Speed card:** centred under the trim gauge with its top level with the climb indicator's, as wide as its lettering
  plus a margin. Labels sit on the left and figures on the right.
- **Flap placard:** widened to 48 px on #31.

**Pitch indicators:** now the clock's size (face 20, mounting 24); D109 had kept the photographed gauges' size.

**Flagged:**
- three of the card's figures are the flight model's, not a source's;
- the card's lettering is English, in the product owner's words, on a Luftwaffe panel.

## D117. The Bf 110 C's drawn cockpit view from the product owner's photograph (3 Nov 2026, plan approved by the product owner)

**The request:** redesign the Bf 110 C's cockpit view, taking the Bf 109's drawn windscreen, fuselage frames and coaming
(D90, D103, D104) as the starting point and replicating the product owner's photograph "Bf110C cockpit view_1.jpg"
(#32). The photograph is a layout reference only; everything is redrawn in code.

**The frame** (`src/ui/bf110Frame.js`):
- **Scale:** sizes are in the Bf 110 panel's picture pixels, measured on #32 at about 1.12 times its pixels from the
  Revi's axis.
- **Outer canopy frame:** the flat top bar with rounded corners. Its side posts lean out going down (0.16, as #32), as
  the Bf 109's hood sides and fuselage frames do, and pass behind the panel to the foot of the screen.
- **Cross bar:** spans between the outer posts, as the Bf 109's. Below it, the armoured windscreen's posts lean in
  going down (0.14), with a ledge across their feet, two knobs, and gussets in the upper corners.
- **Shown only:** two loop grab handles behind the top bar, and the bracket with the red-knobbed handle.
- **Coaming:** two grey padded crash pads, one either side of the Revi, with a stitched seam. They lie along the
  panel's top and shoulders, as the Bf 109's coaming lip, thick by the Revi and thinner outward.
- **Cockpit sides:** dark round the panel between the outer posts (drawn on the panel's canvas).
- **Drawing:** all the bars are welded as D104 and dark grey as the Bf 109's.

**Placement:**
- The frame is placed on the panel. The windscreen is raised above #32's proportions, so its cross bar clears the
  Revi's glass, which is drawn larger than #32's. The guns' line stays at 0.41 of the screen (D107).
- The Revi is drawn in front of the frame, as before.

**3D view** (`src/render/testView.js`):
- Looking ahead, the 3D cockpit frame hides and the drawn one shows; looking round, the 3D frame returns.
- Unlike the Bf 109, the Bf 110's wings, engines and spinning airscrews stay in view beside the frame.

**Flagged:**
- the windscreen is taller relative to the panel than in #32;
- the side posts are straight;
- the crash pads follow the panel's outline, not #32's straighter slopes (made straight in D118).

## D118. The Bf 110 C's crash pads as straight slopes (3 Nov 2026, product owner's request)

**The request:** "Make the crash pads straight slopes like the photo" (#32).

**The change** (`src/ui/bf110Frame.js`, `FRAME_110.pads`):
- **Shape:** each pad is now a straight wedge, from beside the Revi down and out to the outer post. Its lower edge
  slopes about 0.28 px down for each px out, as on #32; its upper edge about 0.23.
- **Thickness:** 52 px by the Revi and 64 px at the post. Like #32, the pad thickens outward, where D117's thinned
  outward.
- **Height:** the lower edge runs from 20 px by the Revi to 88 px at the post. It passes just above the panel's top
  corners, so no dial or plate is covered.
- **Underneath:** the gap between the pads and the panel's top is the dark cockpit colour.
- **Windscreen ledge:** raised from 6 px to -10 px, so its two knobs sit on the pads' top, as on #32. Most of the
  ledge is now behind the pads and the Revi.

**Flagged:**
- On #32 the pads lie over the top of the panel. Here they sit above it, because our panel's dials and the ammunition
  counter reach its top edge.
- The ledge is straight, not curved as on #32.

**Tests:** tests/ui/bf110Frame.test.js checks that each pad:
- is a four-cornered straight wedge;
- has its slope within 0.2-0.35;
- thickens outward;
- ends under its outer post;
- has its lower edge above every corner of the panel's outline it crosses.

## D119. The Bf 110 C's windscreen frame first: dash covers removed, the corner handles as arcs (3 Nov 2026, product owner's request)

**The request:** the product owner said the dash covers (the crash pads of D117/D118) are wrong. Start with the
windscreen frame alone, with no dash covers yet. The handle hoops in the top corners should be arcs joining the
vertical and horizontal frames, as in #32.

**The change** (`src/ui/bf110Frame.js`):
- **Dash covers removed:** the crash pads and the dark fill under them are gone. D118 is superseded.
- **Grab handles:** each is now an arc in its top corner (`handlePath`, `FRAME_110.handles`). It is a quarter ellipse
  that bows in from the corner.
  - It runs from the top bar's middle line, 112 px in from the corner, down to the outer post's middle line, 56 px
    below the top bar. That is #32's ≈100 and ≈50 of its pixels, scaled by 1.12.
  - The tube is 9 px wide. It is drawn before the bars, so its ends sit under them.
  - This replaces D117's free-standing loops.
- **Windscreen ledge:** back at 6 px, D117's measured height. The windscreen posts now end on it (foot 12 px, the
  ledge's lower edge). Before, they ran down behind the pads.

**Shown:** the handle arcs only. On #32 each hoop is a closed loop whose upper half lies over the top bar; that upper
half is not drawn.

**Left:** the dash covers, to be redesigned with the product owner.

**Tests:** tests/ui/bf110Frame.test.js checks that each handle:
- starts on the top bar, 112 px in from the corner;
- ends on the post's middle line, 56 px down;
- bows in from the corner;
- is symmetric with the other handle.

## D120. The Bf 110 C's outer frame posts stop at the panel's top (3 Nov 2026, product owner's request)

**The request:** "The outer vertical frames should stop at the top of the panel."

**The change** (`src/ui/bf110Frame.js`):
- **Posts:** the outer posts now end at y 167 (`FRAME_110.posts.foot`), where they reach the panel's top corners (its
  outline's shoulders). Each post's inner edge lands on the shoulder.
  - Before, they ran on down beside the panel to the foot of the screen (D117), like the Bf 109's fuselage frames.
- **Cockpit sides:** the dark sides between the posts also stop at that height, so no dark strip runs on beside the
  panel without a post.
  - Below the panel's top corners, the 3D view shows beside the panel.

**Tests:** tests/ui/bf110Frame.test.js checks that the outer frame's line ends at the posts' foot on both sides, and that
each post's inner edge is within half a post width of the panel's shoulder.

## D121. The Bf 110 C's fuselage frames at 75 degrees (3 Nov 2026, product owner's request)

**The request:** draw the left and right fuselage frames from the bottom of the windscreen's outer frames to the
bottom of the screen, at an angle of 75 degrees.

**The change** (`src/ui/bf110Frame.js`):
- **Frames:** from each outer post's foot (y 167, the panel's top corners, D120), a fuselage frame runs down to the
  foot of every screen at 75° from the horizontal (`FRAME_110.fuselage.angle`, `fuselageX`). The frames lean out going
  down, as the Bf 109's fuselage frames do.
  - They are part of the outer frame's line, welded to the posts with a rounded bend, and as wide as the posts
    (26 px).
  - They are kept behind the panel.
- **Panel sides:** the right frame runs just outside the panel's right side, which also slopes at 75° (D112). The
  panel's traced left side bulges further out, so it covers part of the left frame lower down.
- **Cockpit sides:** the dark cockpit sides now run between the posts and the fuselage frames down to the foot of the
  screen.

**Tests:** tests/ui/bf110Frame.test.js checks that each fuselage frame:
- starts at the post's foot;
- leans out going down;
- is at 75°;
- reaches below the foot of every tested screen.

## D122. The Bf 110 C's windscreen top bar between its own posts; corner gussets removed (3 Nov 2026, product owner's request)

**The request:** the lower horizontal frame below the handle hoops should not extend to the outer vertical frames, and
the short angled corner frames should be removed.

**The change** (`src/ui/bf110Frame.js`):
- **Windscreen frame:** it is now one frame of its own (`windscreenPath`): up its left post from the ledge, across its
  top bar at y -164, and down its right post.
  - The top bar ends at the windscreen's posts. It no longer runs out to the outer posts.
  - The top bar is now the posts' width, 20 px, where the cross bar was 22 px.
- **Gussets removed:** the short angled corner frames between the cross bar and the outer posts (D117) are gone.
- **Welding:** the outer frame and the windscreen frame are each drawn whole, and the ledge is welded between the
  windscreen's posts.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- there are three bars: the outer frame, the windscreen frame and the ledge;
- the windscreen's top bar ends at its own posts, well inside the outer posts;
- its foot still clears the Revi's glass on every screen.

## D123. Thin corner posts between the Bf 110 C's windscreen frame and its outer frame (3 Nov 2026, product owner's request)

**The request:** draw a thin post, the same width as the handle hoops, from the top left corner of the inner
(windscreen) frame to the top left corner of the outer frame, and the same on the right.

**The change** (`src/ui/bf110Frame.js`, `cornerPostPath`):
- **Posts:** each runs from the windscreen frame's top corner up and out to the outer frame's top corner. At the outer
  end it stops on the frame's middle line, half way round the rounded corner.
- **Drawing:** 9 px wide, like the grab handles, and drawn the same way, as grey tubes with a lit upper edge. Their ends
  sit under the bars.

**Tests:** tests/ui/bf110Frame.test.js checks that each post:
- starts at the windscreen frame's top corner;
- ends half way round the outer frame's rounded corner, on its middle line;
- runs up and out;
- mirrors the other post.

## D124. The Bf 110 C's corner posts behind the grab handles (3 Nov 2026, product owner's request)

**The request:** the thin corner posts (D123) should be behind the handle hoops.

**The change** (`src/ui/bf110Frame.js`, `tubePaths`): the corner posts are now drawn before the grab handles, so each
handle passes in front of its post where they cross.

**Tests:** tests/ui/bf110Frame.test.js checks the drawing order: the corner posts first, then the handles.

## D125. The Bf 110 C's windscreen raised to the handles; ledge knobs, canopy latch and lever removed (3 Nov 2026, product owner's request)

**The request:**
- remove the two dots at the bottom corners of the inner windscreen frame;
- remove the canopy latch and lever on the outer frame's top bar;
- raise the inner windscreen's horizontal frame so its top corners just touch the handle hoops.

**The change** (`src/ui/bf110Frame.js`):
- **Removed:** the ledge's two knobs, and the bracket with the red-knobbed handle (D117, shown only).
- **Windscreen top bar:** raised from y -164 to -181 (`FRAME_110.crossBar.y`). Its rounded top corners now just touch
  the grab handles' tubes, leaving under 1 px between their edges.
- **Windscreen posts:** they keep their D117 line (`inner.at` -164, `half` 207, lean 0.14) and are extended up to the
  raised bar.
- **Corner posts (D123):** they still run from the windscreen frame's top corners, so they are now shorter.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the gap between each windscreen top corner and its handle is 0 to 1.5 px;
- the bar is higher than before;
- there is no latch or ledge knob data.

## D126. Level side bars from the Bf 110 C's windscreen to the outer posts, below the handles (3 Nov 2026, product owner's request)

**The request:** draw a frame connecting the inner frame's top left corner with the left outer frame, just below the
handle hoop, and the same on the right.

**The change** (`src/ui/bf110Frame.js`, `sideBarPath`, `FRAME_110.sideBars`):
- **Bars:** each is a level bar from the windscreen's post at its top corner out to the outer post. It is the
  windscreen's width (20 px), and welded to both posts.
- **Height:** its middle line is at y -173, the highest level bar that stays clear of the grab handle. The handle's
  tube clears it by under 1 px where the handle meets the outer post.
- **At the windscreen:** the bar overlaps the lower part of the windscreen's top bar (y -181). Its top edge is therefore
  8 px below the top bar's, a small step at the corner.

**Tests:** tests/ui/bf110Frame.test.js checks that each bar:
- is level;
- runs from the windscreen's post to the outer post;
- overlaps the windscreen's top bar;
- clears its handle by 0 to 1.5 px.

It also checks that the bars are welded after the frames they end on.

## D127. The Bf 110 C's side bars angled up into the windscreen's corners (3 Nov 2026, product owner's request)

**The request:** "The short frames need angling up slightly to join the corner of the inner top frame" (D126's level
bars).

**The change** (`src/ui/bf110Frame.js`, `sideBarPath`):
- **Bars:** each now starts at the windscreen's top corner, on the middle line of its top bar (y -181), and runs out
  and slightly down to the outer post at y -166 (`FRAME_110.sideBars.y`). That is about 13° from level, rising going
  in, so it meets the corner with no step.
- **Handle clearance:** -166 is the highest point on the outer post that keeps the bar clear of the grab handle. The
  handle's tube clears the bar by under 1 px.

**Tests:** tests/ui/bf110Frame.test.js checks that each bar:
- starts at the windscreen's top corner;
- ends on the outer post;
- rises going in at 5-20°;
- clears its handle by 0 to 1.5 px.

## D128. The Bf 110 C's windscreen ledge as an arc (3 Nov 2026, product owner's request)

**The request:** make the inner frame's bottom bar an arc, keeping its centre where it is but lowering its ends a
little.

**The change** (`src/ui/bf110Frame.js`, `ledgePath`, `FRAME_110.ledge`):
- **Ledge:** it is now a circular arc. Its middle stays at y 6 on the axis, where it was (D117). Its ends are 12 px
  lower (`sag`), at y 18, on the windscreen posts' middle lines.
- **Windscreen posts:** they now reach down to the ledge's lower edge at its ends, y 24. They used to stop at y 12;
  `inner.foot` is now worked out from the ledge.
- **Welding:** the ledge is still welded to the posts at both ends.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the ledge's middle is at y 6 on the axis;
- its ends are `sag` lower (12 px, no more than 20) on the posts' middle lines;
- every point lies on one circle, falling away from the middle both ways;
- the windscreen posts reach the ledge's ends.

## D129. The Bf 110 C's panel lowered so the lowest gauges are half shown (3 Nov 2026, product owner's request)

**The request:** lower the instrument panel so only half of the lowest gauges are visible.

**The change:**
- **Panel** (`src/ui/bf110Panel.js`): the panel now stands `SINK` below the screen's foot. That is 1.33 dial radii,
  from FOOT 475 to the lowest gauges' centres at y 438, plus the 0.1 radius margin. The screen's foot crosses the
  centres of the radiator flap switches and the tank selector, so only their upper halves show.
  - The two round knobs at the bottom left are also cut about half way.
  - The panel's size on screen is unchanged.
- **Canvas** (`src/ui/instruments.js`): `BF110_PANEL.sink` cuts the panel's canvas at that line, keeping its 3 px top
  margin.
- **Panel's top** (`panelTop110`): it is worked out from the cut, so the frame (D117-D128) and the cockpit sides move
  down with the panel.

**Flagged: the guns' line moves.** The Revi stands on the panel (its knob just above the climb indicator, D108), so it
moves down with it.
- The guns' line looking ahead (`BF110_AIM`) moves from 0.408 of the screen's height, approved in D107, to 0.450.
- The camera's picture is shifted to match, as before, so the reticle still marks where the guns point.
- There is more sky above the windscreen and less panel.

**Tests:**
- tests/ui/bf110Panel.test.js checks that the switches and selector are the lowest dials, and that their centres lie on
  the screen's foot on every tested screen.
- tests/ui/bf110Revi.test.js now takes the panel's top from `panelTop110`. Its knob-above-the-climb-indicator check still
  passes.

## D130. The Revi-110: the Bf 110 C's gunsight with a round glass as wide as its body (3 Nov 2026, product owner's request)

**The request:** call the Bf 110's sight the Revi-110. As in the product owner's photograph of the Bf 110 C's cockpit
(#32), it has a round glass reflector as wide as the sight's body. Make the glass holder frame the same width as the
body.

**The change** (`revi110` in src/ui/reviParts.js, drawn by `roundHead` in src/ui/reviSight.js; `REVI_110` in
src/ui/bf110Panel.js):
- **Body:** the D107 body is kept, 20% shorter than the Bf 109's, with its leather pad, lever, block and knob.
- **Removed:** the Bf 109's wide glass with rounded top corners, its dark sun-filter glass, the black housing with its
  dip, and the bead post.
- **Round glass:**
  - It is as wide as the body (radius 1.425 of the Bf 109's dial radii) and centred over it.
  - Its middle is at the guns' line's height, so the reticle sits in its middle. It is 0.075 left of the reticle,
    because the body is not quite centred on the guns' line.
  - It has a faint tint, a thin dark metal rim and a lit upper edge. The reticle shows only on the glass.
- **Holder frame:** the body's width. A plate lies across the body's top, and a strap runs up each side to a pin at the
  glass's middle, in front of the glass's edge.
- **Placement:** the sight's place is unchanged: on the guns' line (0.450 of the screen, D129), its knob just above the
  climb indicator. The windscreen frame's checks now use the round glass's extent.
- **Bf 109:** its Revi C/12C is unchanged.

**Shown as simplified:** on #32 a thin wire bracket arches over the glass's top; it is not drawn.

**Tests:** tests/ui/bf110Revi.test.js checks that:
- the glass's diameter equals the body's width and it is centred over the body;
- the holder is the body's width and stands on the body's top;
- the Revi-110 has no housing, dark glass or bead post;
- its placement's glass is the square about the circle;
- the drawing has an arc of the glass's radius;
- the Bf 109's Revi keeps its own glass.

## D131. The Revi-110's body cut to its pad; the reticle in the round glass's middle (3 Nov 2026, product owner's request)

**The request:** make the gunsight's body the same size as the brown pad, and adjust the sight's position so the
reticle is centred in the round reflector glass.

**The change** (`revi110`, src/ui/reviParts.js):
- **Body:** the body is now the brown pad's rectangle: 1.92 wide (x ±0.96 after centring) and 2.72 tall, in the Bf 109's
  dial radii. With it, the round glass and its holder frame shrink to the same width (radius 0.96), as D130 asked.
- **Centred:** the sight is moved 0.19 sideways, so the round glass's middle is on the guns' line and the reticle sits in
  its middle.
- **Glass on the body:** the body and lever are raised 0.61, so the smaller glass still stands on the holder's plate on
  the body's top, as on #32. The lever sits against the body's narrower left side.
- **Reticle ring:** the ring's sourced size (100 mils at the cockpit's 70° field of view) is 97-98% of the glass's
  radius on every screen. The glass's dark rim is now drawn just outside the glass, so the whole ring shows inside it.

**Flagged: the guns' line moves again.** Raising the body raises the point where its mounting met the panel (D108).
To keep the sight above the climb indicator, the sight and the guns' line move down: from 0.450 of the screen's height
(D129) to 0.474. The camera's picture is shifted to match, as before.

**Tests:** tests/ui/bf110Revi.test.js checks that:
- the body equals the pad, as wide as the Bf 109's pad;
- the glass is centred on the guns' line and stands on the plate;
- the lever is against the body's side;
- the whole ring fits inside the glass on every tested screen.

## D132. The Revi-110 without its mounting block and knob (3 Nov 2026, product owner's request)

**The request:** remove the black box and adjuster knob below the gunsight.

**The change:**
- **Removed** (src/ui/reviParts.js, src/ui/reviSight.js): the Revi-110 has no mounting block or knurled knob. Its body
  (the brown pad) is the lowest part, standing in front of the panel's top.
- **Height kept** (src/ui/bf110Panel.js): the sight's height still comes from where the knob's foot stood
  (`REVI_110.foot`), just above the climb indicator. The guns' line is unchanged from D131 (0.474).
- **Bf 109:** its Revi keeps its block and knob.

**Tests:** tests/ui/bf110Revi.test.js checks that there is no block or knob, and that the sight still stands where the
knob's foot stood above the climb indicator on every screen.

## D133. The Revi-110 standing on the panel's top; its sun filter lever removed (3 Nov 2026, product owner's request)

**The request:** raise the bottom of the gunsight to the level of the panel's top, and remove the black rectangle on the
left of the gunsight's body.

**The change:**
- **Position** (src/ui/bf110Panel.js): the Revi-110 is raised so its body's foot (the bottom of the brown pad body) stands
  on the panel's top edge on every screen. `GLASS_ABOVE_110` now comes from the body's foot rather than the old knob's
  foot (D108, D132).
- **Lever removed** (src/ui/reviParts.js, src/ui/reviSight.js): the Revi-110 has no sun filter lever or pivot, the
  black rectangle on the body's left. The Bf 109's Revi keeps its lever.

**Flagged: the guns' line moves up.** It goes from 0.474 of the screen's height (D131) to 0.447. The camera's picture is
shifted to match, so the reticle still marks where the guns point.

**Tests:** tests/ui/bf110Revi.test.js checks that the body's foot lies on the panel's top on every tested screen, and
that there is no lever or pivot.

## D134. The Bf 110 C's lower windscreen frames (3 Nov 2026, product owner's request)

**The request:** draw the left lower windscreen frame, starting in line with the red button on the left of the panel
and running to the lower left corner of the inner windscreen frame, and mirror it on the right.

**The change** (`src/ui/bf110Frame.js`, `lowerFramePath`, `panelEdgeY`):
- **Left frame:** it rises from the panel's top edge directly above the red button (x 231, where the left shoulder is at
  y 72) to the windscreen frame's lower left corner. That corner is where the windscreen's post meets the ledge's end,
  at (255, 18).
- **Right frame:** it mirrors the left one about the panel's axis. It starts at x 643, on the right shoulder at y 70,
  and runs to the lower right corner at (618, 18).
- **Shape:** each leans in going up, at about 24° from the vertical. It is the windscreen's width (20 px) and welded to
  its corner.
  - It starts a little behind the panel's edge along its own line, so it rises from the edge itself.

**Tests:** tests/ui/bf110Frame.test.js checks that each lower frame:
- ends at the windscreen's lower corner, on its post's middle line;
- has its line crossing the panel's edge above the red button, mirrored on the right;
- starts behind the panel;
- leans in going up.

The weld test now counts seven bars.

## D135. The Bf 110 C's lower windscreen frames run to the outer posts, level with the red button (3 Nov 2026, product owner's request)

**The request:** the D134 frames were not quite right. Connect the bottom of each new frame to the outer windscreen
frame, keeping it level with the red button.

**The change** (`src/ui/bf110Frame.js`, `lowerFramePath`):
- **Route:** each lower frame now runs from the windscreen frame's lower corner (the post meeting the ledge's end, at
  y 18) down and out to the outer post's middle line at the red button's height (y 108). On the left that is from
  (255, 18) to (121, 108); the right frame mirrors it.
- **Clear of the panel:** the frames pass above the panel's shoulders, over the dark cockpit sides.
- **Welding:** each is welded to the windscreen at its top and to the outer post at its foot. D134's start on the
  panel's edge is replaced.

**Tests:** tests/ui/bf110Frame.test.js checks that each lower frame:
- starts at the windscreen's lower corner;
- ends on the outer post's middle line at the red button's height;
- runs out going down;
- stays above the panel's outline.

The weld test checks both ends are trimmed.

## D136. The Bf 110 C's dash covers as corner gussets (3 Nov 2026, product owner's request)

**The request:** start on the panel's dash covers. Draw a corner gusset on the left, from the lower left angled frame to
the bottom of the gunsight body's left side, filled in the frame's colour. Mirror it on the right.

**The change** (`src/ui/bf110Frame.js`, `dashCoverPath`, `dashCover`):
- **Shape:** each cover fills the corner between the lower angled frame (D135), the outer post and the panel's top.
- **Top edge:** straight, from the windscreen frame's lower corner (255, 18) down to the gunsight body's lower corner
  on the panel's top. On the left that is x 403, y 57; the right cover mirrors it about the axis.
- **Lower side:** it runs into the panel and is hidden by it, since the frame is drawn only outside the panel, so the
  cover meets the panel's edge exactly.
- **Colour:** the frame's grey (`GREY.band`), with its dark outline and a lit top edge. It is drawn after the grab
  handles and under the bars, so the lower frames and the outer posts lie over its edges.

**Tests:** tests/ui/bf110Frame.test.js checks that each cover:
- starts at the windscreen's lower corner and ends where the lower frame meets the outer post;
- has its top edge running down to the gunsight body's lower corner on the panel's top edge;
- mirrors the other cover.

## D137. The Bf 110 C's dash covers reshaped after the product owner's photograph (3 Nov 2026, product owner's request)

**The request:** the dash cover gussets should look like the product owner's photograph of them (#33: the two padded
covers either side of the Revi, a layout reference only).

**The change** (`src/ui/bf110Frame.js`, `dashCoverPath`, `dashCover`):
- **Shape:** each cover is now four-sided, as on #33.
  - The top edge is level just below the windscreen's ledge (y 24), from the lower frame's line in to the gunsight's
    body.
  - The inner side runs down behind the body to its foot on the panel's top.
  - The front edge is straight, from the body's foot down and out to where the lower frame meets the outer post (the red
    button's height, y 108).
  - The outer edge lies under the lower frame.
- **Finish:** padded grey, lighter at the back and the frame's grey at the front, with a dark outline. A light stitched
  seam runs just inside the top and front edges.
- **Drawing order:** the covers are drawn before the frame bars and over the panel's top, as on #33. The lower frames
  and the outer posts lie over their edges, and the Revi stands in front.

**Flagged: the left cover hides part of the panel.** As on #33, the covers lie over the panel's top. The left cover's
front edge crosses the top of the ammunition counter (D113): it hides 3 px of the counter at its right end and about
23 px at its left end, including the EIN lamp. The right cover clears the trim gauge and the clock. **Decision needed:**
keep this, move the counter down, or bend the cover's front edge to clear it.

**Tests:** tests/ui/bf110Frame.test.js checks that each cover:
- has its top level at the ledge's lower edge;
- has its outer edge on the lower frame's line;
- ends its front edge at the lower frame's foot;
- has its inner side just inside the gunsight body's side, down to the panel's top;
- mirrors the other cover.

## D138. The Bf 110 C's dash covers' top edge along the windscreen ledge (3 Nov 2026, product owner's request)

**The request:** almost correct. Make the cover's top edge an arc that joins the lower inner windscreen frame (the
ledge) along the frame's bottom edge.

**The change** (`src/ui/bf110Frame.js`, `dashCoverPath`):
- **Top edge:** each cover's top edge now follows the ledge's lower edge. That is the arc of D128 brought half the
  ledge's width (6 px) towards its centre.
- **Extent:** the edge runs from the ledge's end, under the windscreen post and the lower frame, in to just inside the
  gunsight body's side, rising from y 24 at the ledge's end towards the middle.
  - The end point at the body's side is interpolated between the arc's samples.
- **Stitching:** the seam inside the top edge follows the arc.
- **Unchanged from D137:** the rest of the cover: its inner side behind the body, its straight front edge to the lower
  frame's foot, and the padding.

**Still flagged (D137):** the left cover hides the top of the ammunition counter. A decision is pending.

**Tests:** tests/ui/bf110Frame.test.js checks that every top-edge point lies on the ledge's lower-edge arc (within
0.05 px), that the edge rises from the ledge's end in to the gunsight body's side, and the D137 checks on the rest of the
shape and the mirroring.

## D139. The Bf 110 C's fuselage frames as thin sheets, angled further out (3 Nov 2026, product owner's request)

**The request:** make the fuselage frames thin, like a sheet, starting at the outside edge of the windscreen's outer
frame and running down to the bottom of the screen, angled out a little more.

**The change** (`src/ui/bf110Frame.js`, `fuselagePath`, `fuselageX`, `sheets`):
- **Separate sheets:** the fuselage frames are no longer part of the outer frame's line, which now ends at the posts'
  feet (y 167, D120). Each is a thin sheet of its own.
- **Start:** the outer post's outside edge at its foot, half the post's width (13 px) out from its middle line.
- **Run:** down to below the foot of every screen.
- **Angle:** 70° from the horizontal (`FRAME_110.fuselage.angle`), out from D121's 75°.
- **Thickness:** 6 px (`FRAME_110.fuselage.width`), where the posts are 26 px. The sheet is grey with a dark outline and
  lit along its inner edge, with no rivets. It is drawn behind the posts and kept behind the panel.
- **Cockpit sides:** the dark sides now reach out to the sheets.

**Tests:** tests/ui/bf110Frame.test.js checks that each sheet:
- starts at the post's outside edge at its foot;
- leans out going down at 70°, further out than 75°;
- reaches below every tested screen;
- is under a third of the post's width.

It also checks that the outer frame's line ends at the posts' feet.

## D140. The Bf 110 C panel redrawn from the product owner's picture of the panel (3 Nov 2026, plan approved by the product owner)

**The request:** with the cockpit frame good enough, redo the panel after the product owner's picture "Bf110C
panel_5.jpg" (#34).
- **About #34:** a render seen a little from the left, not square-on. It is a layout reference only; everything is
  redrawn in code, and its placard figures are not sources.
- **Half-shown row:** the lower row of switches and the hydraulic (Preßluft) gauge are half shown, as D129.
- **Guns:** the ammunition counter becomes #34's round counter for the two 20 mm cannon. The four MG 17s are left with
  only the shown-only switch block (SKK 404-2) right of the red button.

**The product owner's answers (this plan):**
- **Size:** the flying instruments stay at the Bf 109's size on screen (D107).
- **Pitch indicators kept:** the two airscrew pitch indicators stay (D109), fitted into a free space.
- **Removed:** the trim gauge (D110) and the speed card (D116).
- **Placard figures:** the sourced ones.
- **Middle line:** the Revi and the panel's middle line stand over the turn and bank.

**Layout** (new src/ui/bf110Layout.js):
- **Measuring:** each item was measured in #34's pixels, its rows levelled (the picture falls about 2.5–3° to the
  right) and its spacing evened out. Everything was turned into the layout's picture pixels at one scale (0.46), which
  draws the airspeed indicator's face at the Bf 109's size.
- **Middle line:** AXIS is the turn and bank's column.
- **Dial radius on screen:** unchanged, kept as a share of the screen's height as since D106. The Bf 109's
  instruments, the Revi and the frame therefore keep their sizes.
- **Height:** the panel shows 13.9 dial radii above the screen's foot, where it showed 12.7.
- **Clock bracket:** it rises above the top edge, so the panel's canvas keeps room for it (`above`).
- **Half-shown row (D129):** the radiator flap switches, the tank selector and the Preßluft gauge have their centres on
  the screen's foot. The Preßluft gauge was moved down from #34's place to that line; the two knobs below it are left
  out.

**What it shows (from #34):**
- **Top:** the clock on its lighter bracket; the red Kurssteuerung button; the SKK 404-2 block (Ein/Aus toggle, four
  dark lamps, four knobs); the Siemens Kurssteuerung indicator; the round counter "Durchladen"; the Heizung placard and
  its green knob.
- **Middle:**
  - the repeater compass, the 2 MG / 4 MG switch and the Kurs strip;
  - the airspeed indicator, turn and bank (both the Bf 109's) and the climb indicator;
  - the outside air thermometer and the two pitch indicators;
  - the dive placard and the Umschaltwarnung placard with its two lamps;
  - the Siemens course box, the AEG L/R indicator, the horizon, the two-bar window and the altimeter (the Bf 109's,
    its setting knob kept).
- **Right:** two rev counters and two manifold pressure gauges in their recess, each with its "d 30′ 5′" card.
- **Bottom:**
  - the two coolant thermometers in green rings with their "Km" cards, either side of the fuel gauge in its yellow ring;
  - the four tank lamps (Behälter vorn / hinten);
  - the two radiator switches (Kühler / Auf) and the tank selector (0, 1 VL, 2, HL 3, HR 4).
- **Left:** the Fahrgestell Anzeige lights, the airscrew lever box (Automatik / Hand, größer / kleiner), the Fahrwerk
  and Landeklappe EIN/AUS switches with their T levers (D114), the Achtung placard and the labels.
- **Plate:** dark grey, as #34.

**Working:**
- the flying and engine instruments, the clock, the two pitch indicators and the fuel gauge;
- the undercarriage lights and the undercarriage and flap switches;
- the radiator switches;
- **new, the round counter:** each cannon's window counts its drum's rounds left (60 to 0), and its red lamp lights when
  the drum is empty;
- **new, the outside air thermometer:** it reads the standard atmosphere's temperature at the aircraft's height, a new
  `airTemp` reading. A new `diveLimit` reading gives the dive placard its figure from the aircraft's data.

**Shown only (normal operation):** everything else listed above.

**Placards in sourced figures:**
- the dive placard says 650 km/h (S24), not #34's 700;
- the Achtung placard says 250 km/St for the undercarriage and the flaps (S24, the limit with flaps and undercarriage
  down), not #34's unsourced 400.

**Removed:**
- the Spitfire trim gauge (D110);
- the speed card and the flap placard (D116);
- the strip compass G4 (D107);
- the magneto switches and the hydraulic gauge;
- the four warning lamps;
- the D113 ammunition counter: src/ui/ammoCounter.js and its test are deleted;
- the red rings under the manifold pressure gauges, and src/ui/bf110Dials.js, which nothing used any more.

**Frame ties** (src/ui/bf110Frame.js, now reading the layout directly):
- The outer posts end where the panel first reaches a post's inner edge, at y 140, where the panel's left side below
  the clock's bracket meets the left post. Both posts end at that height; the panel's right side stays inside its post.
- The lower frames still meet the posts level with the red button (now the Kurssteuerung button, y 112).
- The clock's bracket stands proud of the panel, in front of the dash covers. The lower frame passes behind it.

**Flagged:**
- **Guns' line moves up,** from 0.447 of the screen's height (D133) to 0.406, because the panel shows more above the
  screen's foot. The camera's picture is shifted to match.
- **Pitch indicators are smaller:** to fit beside the outside air thermometer they are about 70% of the clock's size
  (D116's choice), and their lettering is very small.
- **Preßluft reading:** the gauge's hand stands at a steady 150 kg/cm². No figure was found.
- **Flap angles:** the take-off and landing angles (D116) no longer show on the panel. `pilotCard` stays in the data.
- **Airspeed indicator's setting knob:** removed, since #34 shows none and its place is the dive placard's.
- **Left dash cover:** it lies over the top of the SKK block, hiding part of its dark lamps.

**Tests:**
- tests/ui/bf110Panel.test.js is rewritten. It checks that:
  - everything is inside the outline with no overlaps;
  - the dial radius is kept and the panel fits every screen;
  - the turn and bank is on the axis;
  - the lowest row and the Preßluft gauge have their centres on the screen's foot;
  - there is room above for the bracket;
  - each engine reads on its own gauges and the rev counters go to 3,600;
  - the round counter counts each cannon and lights its lamp when empty;
  - the outside air temperature is the standard atmosphere's;
  - the coolant scale, the switches and lights, the fuel and radiator readings, and the pitch indicators work;
  - the placards say 650 and 250, not 700 or 400;
  - the removed items are gone;
  - the T levers clear the boxes above them, and the dials are luminous.
- **Updated:** bf110Revi (no strip compass; the Revi over the turn and bank), bf110Frame (the posts' end; the lower frames
  behind the bracket), trimDisplay and gearLabels (no trim gauge).

## D141. The Bf 110 C panel lowered to the coolant thermometers' feet; the Preßluft gauge below the lever box (3 Nov 2026, product owner's requests)

**The requests:**
- Move the whole panel, gauges included but not the gunsight, so the bottoms of the temperature gauges touch the
  bottom of the screen.
- Add the hydraulic pressure gauge shown below the airscrew pitch levers in #34. This is the Preßluft gauge, which
  D140 had moved down to the lowest row.

**The change:**
- **Panel** (src/ui/bf110Layout.js): it is lowered so the screen's foot touches the bottoms of the two coolant
  thermometers (920 + 60 on #34). Their square mountings and green rings end there.
  - The radiator flap switches and the tank selector below them are now out of sight, below the screen.
  - The frame (D117–D139) is tied to the panel, so it moves down with it, about one dial radius.
- **Gunsight:** kept where it stood (`REVI_RAISE`). The guns' line stays at 0.406 of the screen.
- **Preßluft gauge:** now as #34 has it, below the airscrew lever box and between the Fahrwerk and Landeklappe labels
  (180, 905 on #34; face 42, mounting 48). It is wholly on screen. The lettering is "Preßluft" (compressed air), as on
  #34.

**Flagged:**
- **Revi gap:** the Revi's body no longer stands on the panel. It stands about one dial radius (REVI_RAISE 1.0) above
  the panel's top edge, with a gap below it.
- **Hidden switches:** the radiator flap switches and the tank selector are no longer visible. The radiator still works
  from key O, but its switches can't be seen.

**Tests:**
- tests/ui/bf110Panel.test.js checks that:
  - the coolant thermometers' mountings and rings end on the screen's foot on every tested screen;
  - the radiator switches and selector are below it, and the Preßluft gauge is wholly on screen;
  - the Preßluft gauge stands below the lever box, between its labels.
- tests/ui/bf110Revi.test.js checks that the Revi's foot is REVI_RAISE above the panel's top.

## D142. The Bf 110 C's Preßluft gauge reads 0 stopped, 150 running (3 Nov 2026, product owner's request)

**The request:** the hydraulic pressure gauge (the Preßluft gauge, D141) should read 0 with the engines off and 150
with them started.

**The change:**
- **Reading** (src/ui/bf110Gauges.js, `pressluftReading`): the gauge reads 150 kg/cm² times the fastest engine's
  `running` fraction, a new `enginesRunning` reading in src/ui/instruments.js. It rises from nothing at 200 rpm to all
  of it at 1,000 rpm, as the DB 601A's fuel and oil pressures do (D63).
  - It reads 0 with both engines stopped, 150 with either running, and in between while one starts.
- **Replaced:** D140's steady 150.

**Flagged:** 150 kg/cm² is the product owner's figure; no source was found. It is a display value in the gauge's code,
not aircraft data.

**Tests:** tests/ui/bf110Panel.test.js checks that the gauge reads 0 with both engines stopped, 150 with one at
2,200 rpm, part way at 600 rpm, and that its scale runs from bottom left with 125 straight up.

## D143. The Bf 110 C's windscreen frame raised so the reticle is in the windscreen's middle (3 Nov 2026, product owner's request)

**The request:** raise the windscreen frame group, including the dash covers, leaving the panel and the gunsight where
they are, so the gunsight's reticle is in the middle of the front windscreen.

**The change** (src/ui/bf110Frame.js, `FRAME_SHIFT`, `framePlacer`):
- **Raised:** the whole frame group is drawn 23.4 picture pixels (0.78 dial radius) higher on the panel's picture.
  - The group is the outer frame, grab handles, corner posts, windscreen, side bars, ledge, lower frames, fuselage
    sheets and dash covers.
  - The guns' line (GUNS_Y, now in src/ui/bf110Layout.js with the Revi-110) falls exactly midway between the windscreen
    top bar's lower edge and the ledge's upper edge at the middle, on every screen.
- **Still meeting the panel:**
  - The posts end where the panel's edge, level with them, first reaches a post. Raised and leaning out going down,
    they now meet the panel's left side lower down, at its left wing (frame y 227, panel y 204, was 140). The fuselage
    sheets start there.
  - The dash covers' inner feet stay on the panel's top. Their top edges rise with the ledge.
  - The cockpit's dark sides follow the raised posts and sheets, from the panel's top down.
- **Moved up with the group:** the lower frames still meet the posts at the red button's height on the frame's own
  picture, so they now meet them 23 px higher than the button itself.
- **Unchanged:** the panel, the Revi and the guns' line (0.406).

**Tests:** tests/ui/bf110Frame.test.js checks that:
- on every tested screen the guns' line lies midway in the windscreen's opening;
- the frame stands higher than before;
- the posts meet the panel level with their raised points;
- the covers' inner feet lie on the panel's top.

The on-screen checks use the raised frame.

## D144. The Bf 110 C's dash covers end at the Revi's brown pad; the panel's top filled up to them (3 Nov 2026, product owner's request)

**The request:** move the dash covers' lower inner end point, which touched the bottom of the gunsight, up to touch the
brown rectangular pad. This exposes more of the panel's top, which should be filled in the panel's colour.

**The change** (src/ui/bf110Covers.js, new; the covers moved out of src/ui/bf110Frame.js to keep it under 400 lines):
- **Inner foot:** each cover's inner foot is now the brown pad's lower corner (the Revi's body foot, REVI_RAISE above
  the panel's top, D141). Its front edge runs straight from there to the lower frame's foot on the outer post.
- **Fill (`coamingPath`):** the panel's top uncovered by this, and the strip under the Revi between the pad and the
  panel's top, is filled in the plate's top colour.
  - The fill is kept outside the panel's outline, so no dial or plate is covered.
  - It is drawn on the sight's canvas before the covers and the frame.

**Tests:** tests/ui/bf110Frame.test.js checks that each cover's inner foot lies level with the Revi's body foot on every
tested screen, and that the fill runs along the covers' front edges and the pad's foot down to the panel's top.

## D145. The Bf 110 C panel's top widened on the right to the right dash cover (3 Nov 2026, product owner's request)

**The request:** extend the panel's top on the right to touch the bottom of the right dash cover.

**The change** (`shoulderPath` in src/ui/bf110Covers.js):
- **Fill:** the dark gap between the panel's right shoulder and the right cover is filled in the plate's colour. It runs
  from the top edge's right end up to the cover's front edge, along it to the cover's foot on the right outer post,
  level from there back to the shoulder, and up the shoulder.
- **Lower edge:** the new level lower edge is lined as the plate's edge. Below it the dark cockpit side continues
  between the panel and the post.
- **Order:** it is drawn over the dark cockpit side and under the cover and the frame.

**Tests:** tests/ui/bf110Frame.test.js checks that the widened top reaches the cover's front edge and its foot, its
lower edge is level at the foot's height, and it starts on the panel's top edge.

## D146. The Bf 110 C panel's right corner reaches the right dash cover (3 Nov 2026, product owner's request)

**The request:** extend the panel's top horizontally to touch the bottom of the right dash cover. The panel's right
corner should follow the cover's angle, then angle down as in the panel picture (#34).

**The change** (src/ui/bf110Layout.js, `RIGHT_CORNER`):
- **Outline:** the panel's own outline now does this, replacing D145's fill.
  - **Top edge:** it runs on level to the right cover's front edge (1250.7 on #34's pixels, x +170 from the axis).
  - **Along the cover:** it follows the cover's front edge down to where the cover meets the right outer post's inner
    edge (1541.8, 194.8 on #34).
  - **Side:** it angles down and slightly out, inside the post, to the right section's foot (1570, 895).
  - **Replaced:** #34's rounded right shoulder and its stepped side.
- **Recess:** the manifold pressure gauges' recess is 5 px narrower on the right, to stay inside the new side.
- **Frame and cover meeting:**
  - The corner points were worked out from the cover and post geometry and set in #34's pixels.
  - A test checks they stay on the cover's edge and the post's inner edge.
  - Where the corner meets the cover's foot, it hides the lower end of the right lower frame (D135) behind the panel.
- **Posts' end:** now measured on the left side only (D140's rule otherwise). The right post touches the corner and runs
  on past it, so both posts still end where the panel's left side reaches the left post.
- **Removed:** D145's shoulder fill (`shoulderPath`), which this replaces.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the top edge runs level to the cover's front edge;
- the corner follows that edge to the right post's inner edge;
- the side angles down and out, staying inside the post.

The posts and lower frame checks allow for the corner's touch.

## D147. The Bf 110 C panel's right corner reshaped: past the Heizung placard, a short drop, then down to the fuselage side (3 Nov 2026, product owner's request)

**The request:** D146's corner was not right. The panel's top right corner should not meet the frame's corner.
- It should end just past the right edge of the Heizung placard.
- Then it should drop almost vertically for a short distance.
- Then it should run down at an angle until it touches the right fuselage side.

**The change** (src/ui/bf110Layout.js, `RIGHT_CORNER`; replaces D146's):
- **Top edge:** it ends at 1335 on #34's pixels, 15 past the Heizung placard's right edge (1320).
- **Drop:** almost straight down to (1340, 172), 18 picture pixels.
- **Angle:** down at #34's shoulder slope (115 across for 95 down), until it touches the right outer post's inner edge
  at (1568.4, 360.7). That is the right fuselage side there, above the fuselage sheet.
- **Side:** down beside the post, inside it, to the right section's foot (1570, 895).
- **Beyond the corner:** between the angled edge, the right cover and the post, the dark cockpit side shows, as on #34.
- **Fill limited:** D144's fill on the right now runs only down to the panel's top along the cover's front edge, so it no
  longer spills past the corner.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the top edge ends past the placard by under 10 px;
- the drop is short and nearly upright;
- the angled edge has #34's slope and touches the post's inner edge;
- the side stays inside the post;
- every dial stays inside the corner;
- the fill's right end lies on the cover's edge at the panel's top.

## D149. The Bf 110 C's outer windscreen frame widened at its base by two frame widths (3 Nov 2026, product owner's request)

**The request:** the product owner meant the outer windscreen frame, not the inner one. Widen the outer frame's base by
twice the frame's width, and undo the inner change. D148 is reverted (commit 333bff1); the armoured windscreen is as
D117–D128 again.

**The change** (src/ui/bf110Frame.js, `FRAME_110.posts.slope`):
- **Posts:** the outer posts keep their tops at the top bar's corners (260 px either side of the axis). Their lean out
  going down is increased from #32's 0.16 to 0.215, so at their feet they stand one post width (26 px) further out
  each side. The base is 52 px wider: 724 px across at the feet where it was 671.
- **Feet:** recomputed where the panel's left side reaches the wider-set left post (frame y 229, was 227). The fuselage
  sheets start there.
- **Following the posts:**
  - The side bars (D126, D127) and the lower frames (D135) end on the posts, so they reach a little further out.
  - The dash covers' feet follow the lower frames.
  - The grab handles' feet follow the posts. The windscreen's top corners now clear the handles by up to 1.52 px; the
    test allows 2 px.
- **Panel's right corner** (D147): it touches the right post further out and lower, at (1631, 412.4) on #34's pixels.
  Its side then runs down and slightly in, inside the post, to the right section's foot.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the top bar's corners are unchanged;
- the base is two post widths wider than at #32's slope;
- the right corner still touches the post.

## D150. The Bf 110 C's outer windscreen frame widened at its base again by the same amount (3 Nov 2026, product owner's request)

**The request:** widen the outer frame's base again by the same amount (D149).

**The change** (src/ui/bf110Frame.js, `WIDEN` 2):
- **Posts:** the outer posts' feet now stand two post widths (52 px) further out each side than at #32's slope, their
  tops at the top bar unchanged. The slope is 0.270 (0.215 in D149). The base is 104 px wider than #32's, 777 px across
  at the feet.
- **Feet:** recomputed where the panel's left side reaches the left post (frame y 231). The fuselage sheets start there.
- **Following the posts:** as D149, the side bars, lower frames, dash covers' feet and grab handles' feet follow the
  posts.
- **Panel's right corner** (D147): it touches the right post further out and lower, at (1701, 470.2) on #34's pixels.
- **Left side:** more of the dark cockpit side shows between the panel's left side and the left post.

**Tests:** tests/ui/bf110Frame.test.js checks that the base is four post widths wider than at #32's slope (within 10 px)
and that the right corner still touches the post.

## D151. The Bf 110 C panel's top right edge runs three quarters of the way along the right dash cover (3 Nov 2026, product owner's request)

**The request:** fix the panel's right-hand edge. Its top right edge should extend three quarters of the length of the
right dash cover's bottom edge.

**The change** (src/ui/bf110Layout.js, `RIGHT_CORNER`; replaces D147's corner):
- **Top edge:** it runs level to the right cover's front (bottom) edge, at 1292.1 on #34's pixels.
- **Along the cover:** it follows that edge three quarters of its length from the Revi's pad, to (1479.8, 167.6).
- **Angled edge:** down at #34's shoulder slope (115 across for 95 down) until it touches the right outer post's inner
  edge, at (1659.3, 315.9).
- **Side:** down beside the post, inside it, to the right section's foot (1570, 895).
- **Beyond:** a small dark wedge of the cockpit side shows between the angled edge, the last quarter of the cover and
  the post.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the top edge runs level to the cover's edge;
- the corner lies on that edge at 0.75 of its length;
- the angled edge has #34's slope and touches the post's inner edge;
- the side stays inside the post.

## D152. The Bf 110 C panel's lower right edge extended to the right fuselage side (3 Nov 2026, product owner's request)

**The request:** extend the panel's lower right edge at an obtuse angle so it touches the right fuselage side.

**The change** (src/ui/bf110Layout.js, `RIGHT_SIDE`):
- **Side:** from the corner's touch on the right outer post (D151), the panel's right side now runs down the right
  fuselage side, at an obtuse angle to the corner's angled edge:
  - down the post's inner edge to its foot (1698, 459.2 on #34's pixels);
  - out to the fuselage sheet's inner edge there (1748, 459.2);
  - down the sheet to the right section's foot (1906.6, 895), below the screen's foot.
- **Bottom edge:** the right section's bottom edge runs out to meet the side.
- **Replaced:** D147–D151's side, which ran in to (1570, 895).
- **Result:** the plate now fills out to the fuselage side below the corner; no dark cockpit side shows there.
- **Width:** the panel is wider (31.6 dial radii, measured from the axis to its furthest side). It still fits every
  tested screen, and the dial radius is unchanged.

**Tests:** tests/ui/bf110Frame.test.js checks that:
- the side follows the post's inner edge to its foot, then the sheet's inner edge;
- the bottom edge runs out to it;
- the angle at the touch is obtuse.

## D153. The Bf 110 C panel's left edge: down at 75 degrees from the clock, then level to the lever box (3 Nov 2026, product owner's request)

**The request:** fix the panel's left edge. From just left of the clock's bottom left corner, run it down at 75° to the
top left corner of the airscrew pitch lever box.
- A 75° line from there reaches the box's height about 46 picture px left of the clock, well short of the box's corner.
- Asked which to keep, the product owner chose: 75° down to the box's height, then level left along its top to its
  corner.

**The change** (src/ui/bf110Layout.js, `LEFT_SIDE`):
- **Left edge:** from the clock bracket's foot (255, 295 on #34's pixels, just left of the clock's bottom left corner at
  263, 292), the edge runs down and left at 75° to the lever box's top (209.4, 465). It then runs level to the box's top
  left corner (40, 465), and down the left side.
- **Replaced:** #34's near-upright left edge and the wing top.
- **Gear lights moved:** the undercarriage lights box (Fahrgestell Anzeige) now stood out past the new edge, so it is
  moved right and narrowed: [250, 330, 355, 445] on #34, was [220, 330, 335, 445]. **Flagged.**
- **Posts' slope kept:** the posts' slope is now fixed at D150's value (0.270, worked out from the feet at #32's slope).
  It no longer moves when the panel's outline changes.
  - The posts' feet, where the new left edge reaches the left post, move down to frame y 234.
  - The panel's right side (D152) follows the post's foot there.

**Tests:**
- tests/ui/bf110Panel.test.js checks that the left edge starts just left of the clock's bottom left corner, runs at 75°,
  then runs level along the lever box's top to its corner. The existing checks keep every dial and box inside the
  outline.
- tests/ui/bf110Frame.test.js keeps the right side on the post and sheet.

## D154. The Bf 110 C panel's left edge starts 10 mm further left and runs straight to the lever box (3 Nov 2026, product owner's request)

**The request:** move the left edge's start, at the clock's bottom left corner, about 10 mm left, and change its angle
so it joins the airscrew pitch lever box's top left corner.

**The change** (src/ui/bf110Layout.js, `LEFT_SIDE`; replaces D153's edge):
- **Start:** 70 of #34's pixels left of the clock's bottom left corner, at (185, 295), level with the clock's foot.
  - **Assumption:** 10 mm on the product owner's 2560 px wide screen is about 43 screen px, which is 70 of #34's
    pixels.
  - A short level step joins the start to the clock bracket's foot (255, 295).
- **Edge:** a straight line from the start to the lever box's top left corner (40, 465), at about 50° from level. D153's
  75° edge and level ledge are gone.
- **Gear lights:** the undercarriage lights box is back at its D140 place and size, [220, 330, 335, 445]. D153's move
  is undone, since the new edge clears it.
- **Posts' feet:** they move up to frame y 214, where the new edge reaches the left post. The panel's right side (D152)
  follows the post's foot there: (1688.3, 423.3), (1738.3, 423.3), (1910, 895) on #34.

**Tests:** tests/ui/bf110Panel.test.js checks that:
- the start is level with the clock's foot, 30–40 picture px left of its corner;
- a level step joins it to the bracket;
- the edge clears every dial.

## D155. The Bf 110 C panel's left edge extended to the left fuselage side, then straight down (3 Nov 2026, product owner's request)

**The request:** extend that edge to touch the fuselage side. Then the far left edge, by the lever box, should run
straight down to the bottom of the screen.

**The change** (src/ui/bf110Layout.js, `LEFT_TOUCH`, `FAR_LEFT`):
- **Edge extended:** D154's straight edge carries on past the lever box's top left corner, which stays on it. It runs
  down and left until it touches the left fuselage sheet's inner edge (D139), at (-11.5, 525.3) on #34's pixels, just
  outside the picture.
- **Far left edge:** from there the panel's edge runs straight down to the outline's foot, below the screen.
- **Replaced:** #34's left side of the left wing.
- **Below the touch:** the sheet leans out going down, so a narrowing strip of the dark cockpit side shows between it
  and the panel.

**Tests:**
- tests/ui/bf110Frame.test.js checks that the touch lies on the sheet's inner edge below the post, and that the edge then
  runs straight down to the outline's foot without crossing the sheet.
- tests/ui/bf110Panel.test.js checks that the lever box's corner lies on the straight edge.

## D156. The Bf 110 C's clock mounted directly in the panel; its bracket removed (3 Nov 2026, product owner's request)

**The request:** remove the light grey bracket round the clock, so the clock appears mounted directly in the panel.

**The change:**
- **Bracket removed** (src/ui/bf110Layout.js, src/ui/bf110Fittings.js): the bracket (D140) is gone, along with its
  slanted top that rose above the panel's top edge. The panel's outline now starts at the top left corner (255, 132 on
  #34's pixels), and its top edge runs level from there.
- **Clock:** it stands in its usual square mounting on the plate.
- **Dash covers** (src/ui/bf110Covers.js): they leave the clock's mounting in sight in front of them, where they used to
  leave the bracket.
- **Canvas:** nothing rises above the top edge now, so the panel's canvas keeps no room above it (`above` is near 0).

**Tests:** tests/ui/bf110Panel.test.js checks that nothing rises above the top edge and that the clock lies inside the
panel. tests/ui/bf110Frame.test.js no longer excuses the bracket where the left lower frame passes behind the panel's top
left corner.

## D157. The Bf 110 C's undercarriage indicator lights in a round housing (3 Nov 2026, product owner's request)

**The request:** redesign the undercarriage indicator light block to be round, not square.

**The change** (src/ui/bf110Fittings.js, `gearLights`, `GEAR_LAMPS`):
- **Housing:** the "Fahrgestell Anzeige" block is now a round dark housing filling its square box (115 of #34's pixels
  across), with a lit inner rim and four small screws on the diagonals.
- **Lamps:** "Fahrgestell" sits above the lamps and "Anzeige" between the rows. The two EIN lamps above and the two AUS
  lamps below stand inside the rim.
- **Working as before:** EIN red with the undercarriage up, AUS green with it down (D95, D106).

**Tests:** tests/ui/bf110Panel.test.js checks that the box is square, all four lamps lie inside the rim, and the housing
is drawn as a circle of the box's half-width.

## D158. The Bf 110 C's undercarriage lights housing the round counter's size (3 Nov 2026, product owner's request)

**The request:** make the undercarriage lights housing's diameter the same as the cannon round counter's.

**The change** (src/ui/bf110Layout.js): the round housing (D157) is now 150 of #34's pixels across, the round counter's
flange diameter (twice its 75 half-width), where it was 115. It stays centred where it was, at (277.5, 387.5). It still
clears the clock, the repeater compass, the Fahrwerk switch's lever and the panel's left edge. The lamps and lettering
grow with it.

**Tests:** tests/ui/bf110Panel.test.js checks that its width equals the round counter's diameter. The layout checks keep
it inside the outline and clear of every dial and box.

## D159. The Bf 110 C's course box as wide as the repeater compass (3 Nov 2026, product owner's request)

**The request:** make the bezel width of the horizontal compass the same as the vertical compass's.

**Interpretation:**
- The "horizontal compass" is the Siemens course box, with its horizontal compass strip.
- The "vertical compass" is the round repeater compass above it.

**The change** (src/ui/bf110Layout.js): the course box is now exactly as wide as the repeater compass's square mounting,
220 of #34's pixels (360–580), and lined up under it. It was 242 wide (352–594). Its height is unchanged.

**Also:** in the larger round undercarriage housing (D158), "Anzeige" was crowded by the lamps. The lamps now stand a
little further apart (±0.44 of the radius) and the word is smaller.

**Tests:** tests/ui/bf110Panel.test.js checks that the course box's sides line up with the compass mounting's.

## D160. The Bf 110 C's dials white, their screws black (3 Nov 2026, product owner's request)

**The request:** change all the instrument bezel screws to black, and the dial colour to white.

**Interpretation:** "dial colour" is the dials' markings and hands, which were luminous yellow (D105). White faces would
hide white markings, and #34's dials are black with white markings.

**The change:**
- **Dials** (src/ui/lwStyle.js `whiteDials`, used by src/ui/bf110Panel.js): every Bf 110 dial's markings, figures and
  hands are now white (#f1f1ec), in place of D105's luminous yellow. The fuel gauge was already white.
- **Screws** (src/ui/lwStyle.js `blackScrews`): every domed screw on the Bf 110 panel is now black. That covers the
  instruments' square mountings, the round counter's flange, the boxes' corners and the undercarriage housing.
- **Other aircraft:** the Bf 109's and the RAF panels keep their colours. Both settings are restored after the Bf 110's
  panel is drawn.

**Tests:** tests/ui/bf110Panel.test.js checks that the dials' lettering is white, not luminous, and that the paint is
restored. It also checks that every screw is shaded black on the Bf 110 panel and grey again afterwards.

## D161. An elevator trim indicator below the Bf 110 C's airspeed indicator (3 Nov 2026, product owner's request)

**The request:** make the gauge below the airspeed indicator an elevator trim indicator. The needle points horizontally
at 9 o'clock for a neutral 0° trim setting, with positive degrees above the 0 and negative degrees below.

**The change** (src/ui/bf110Gauges.js `trimIndicator`, `trimAngle`; layout entry `trim` in src/ui/bf110Layout.js):
- **Replaced:** #34's AEG L/R indicator (shown only, D140) at the same place and size.
- **Scale:** round the dial's left half, 5° of arc for each degree of trim.
  - 0 at 9 o'clock (the needle horizontal, pointing left).
  - +5, +10, +15 above it and −5, −10, −15 below, with ticks every degree.
  - Lettered "Höhentrimmung" and "Grad" in the right half.
- **Working:** it reads the elevator trim setting (`trimDegrees`) on the ±15° display scale used by the other panels'
  trim displays (D74), nose-up trim positive. The needle is held at the scale's ends.

**Flagged:**
- The trim indicator is not on #34. It is the product owner's addition, replacing the AEG indicator.
- The ±15° figures are the display scale of D74, not a sourced trim range.

**Tests:**
- tests/ui/bf110Panel.test.js checks that 0 points to 9 o'clock, positive is above and negative below, the needle is held
  at the ends, the indicator is below the airspeed indicator, it reads the trim, and it is lettered.
- tests/ui/trimDisplay.test.js now expects the Bf 110's trim indicator.

## D162. The Bf 110 C's airspeed indicator, altimeter, undercarriage lights and round counter in black mountings (3 Nov 2026, product owner's request)

**The request:** give the airspeed indicator, the altimeter, the undercarriage indicator and the cannon round counter a
black bezel, the same as the turn and slip indicator's.

**The change:**
- **Airspeed indicator and altimeter** (src/ui/bf110Panel.js): they now stand in the turn and slip indicator's square
  black mounting with its corner screws (`mount`, black since D160). The Bf 109's red round bezels (D107) are gone; the
  altimeter keeps its setting knob.
- **Round counter** (src/ui/bf110Gauges.js): it stands in the same mounting, at its 75 px half-width. Its old round
  flange with twelve screws is gone.
- **Undercarriage lights** (src/ui/bf110Fittings.js): the round housing (D157, D158) stands in the same mounting at the
  box's half-width. The housing is 0.9 of the mounting's width (`GEAR_HOUSING`), so the mounting's corners show.
- **Every dial** on the Bf 110 panel now stands in the same black mounting.

**Tests:**
- tests/ui/bf110Panel.test.js checks that the airspeed indicator, altimeter, turn and slip indicator, round counter and
  undercarriage lights each have a square mounting of their half-width, and that the undercarriage housing is 0.9 of it.
- tests/ui/bf110Revi.test.js checks that no red bezels remain.

## D163. The Bf 110 C's airscrew pitch indicators removed (3 Nov 2026, product owner's request)

**The request:** remove the airscrew pitch indicators; the Bf 110 C did not have them.

**The change** (src/ui/bf110Layout.js, src/ui/bf110Panel.js): the two pitch indicators (D109, kept beside the outside
air thermometer in D140) are gone. The space beside the outside air thermometer is now bare plate.

**Flagged:**
- **No pitch reading:** the airscrew pitch is no longer shown anywhere on the Bf 110's panel. The airscrew lever box
  (D140) is shown only, and the pitch is still set from the keyboard and joystick.
- **Source:** the statement that the Bf 110 C had no pitch indicators is the product owner's. No source has been checked
  for it.
- **Other aircraft:** the Bf 109's pitch indicator (D89) is unchanged.

**Tests:** tests/ui/bf110Panel.test.js checks that the Bf 110 has no pitch indicator entries and no
"Luftschraubenstellung" lettering.

## D164. The Bf 110 C's elevator trim indicator redrawn after #34's AEG instrument (3 Nov 2026, product owner's request)

**The request:** redesign the elevator trim indicator (D161) to match the original instrument in the panel picture (#34,
the AEG instrument). The rudder trim marked "L | R" is not functional. No degree markings: just the five marks on the
indicator's left side, and a very short pointer.

**The change** (src/ui/bf110Gauges.js `trimIndicator`, `TRIM_MARKS`, `trimAngle`):
- **Marks:** measured on #34. Five white marks round the left side at 0.7 of the radius:
  - a dash at 45° above and below 9 o'clock;
  - a dot at 22.5° above and below;
  - a square at 9 o'clock.
  - There are no figures or lettering; D161's ±15 figures and "Höhentrimmung / Grad" are gone.
- **Pointer:** a very short white bar inside the marks, between 0.44 and 0.56 of the radius.
  - It sits at 9 o'clock for neutral trim, above for nose-up and below for nose-down.
  - It moves 3° of arc for each degree of trim, so the ±15° display scale (D74) reaches the outer dashes.
- **Shown only:**
  - the dark round window at the top;
  - the rudder trim's "L ▮ R" with its upright marker, fixed in the middle;
  - "AEG" at the foot, as on #34.

**Tests:** tests/ui/bf110Panel.test.js checks that:
- there are five marks on the left;
- ±15° reaches the outer marks and 0 is at 9 o'clock;
- L, R and AEG are lettered;
- no degree figures or trim lettering remain.

## D165. The Bf 110 C's right engine gauges moved 25 mm right (3 Nov 2026, product owner's request)

**The request:** move the far right rev counter and manifold pressure gauge 25 mm to the right.

**The change** (src/ui/bf110Layout.js, `RIGHT_MOVE`):
- **Moved:** the right engine's rev counter and manifold pressure gauge, with their correction cards, now stand 173.6 of
  #34's pixels further right. That is 107.5 screen px on the product owner's 2560 × 1259 screen, taking 10 mm as 43 px
  as in D154 (an assumption: the screen's pixel size is not known).
- **Recess:** the manifold pressure gauges' recess is widened by the same amount, so the right gauge stays inside it.
- **Unchanged:** the left engine's gauges. Both stay inside the panel's right side (D152).

**Tests:** tests/ui/bf110Panel.test.js checks the move on a 2560 px screen (107.5 px), that the left engine's gauges
stay, and that the gauges stay inside the recess and the outline.

## D166. The Bf 110 C's left engine gauges moved 15 mm right (3 Nov 2026, product owner's request)

**The request:** move the left rev counter and left manifold pressure gauge 15 mm to the right.

**The change** (src/ui/bf110Layout.js, `LEFT_MOVE`): the left engine's rev counter and manifold pressure gauge, with
their correction cards, now stand 104.2 of #34's pixels further right. That is 64.5 screen px on a 2560 × 1259 screen,
taking 10 mm as 43 px as in D154. The recess's left edge moves with them.

**Tests:** tests/ui/bf110Panel.test.js checks the move on a 2560 px screen.

## D167. The Bf 110 C's left engine gauges moved a further 5 mm right (3 Nov 2026, product owner's request)

**The request:** move the left rev counter and left manifold pressure gauge 5 mm further right.

**The change** (src/ui/bf110Layout.js): `LEFT_MOVE` is now 138.9 of #34's pixels, 20 mm in all (86 screen px on a 2560
× 1259 screen, at 43 px to 10 mm as D154). Their cards and the recess's left edge move with them.

## D168. The Bf 110 C's engine gauges moved 5 mm up (3 Nov 2026, product owner's request)

**The request:** move the top tacho and top MAP gauges 5 mm upward.

**Interpretation:** the rev counters (the top row) and the manifold pressure gauges are moved together.

**The change** (src/ui/bf110Layout.js, `ENGINE_UP`): all four engine gauges, their correction cards and the recess move
up 34.7 of #34's pixels (5 mm, 21.5 screen px on a 2560 × 1259 screen). They stay clear of the outside air thermometer
and inside the panel's right side.

**Tests:** tests/ui/bf110Panel.test.js checks the left engine's 20 mm move and the 5 mm rise of all four on a 2560 px
screen.

## D169. The Bf 110 C's outside air thermometer lined up with the left manifold pressure gauge, 5 mm up (3 Nov 2026, product owner's request)

**The request:** move the outside air temperature gauge so its left edge lines up with the left manifold pressure
gauge's, and move it up 5 mm.

**The change** (src/ui/bf110Layout.js):
- **Thermometer:** its mounting's left edge is now in line with the left manifold pressure gauge's mounting (D166–D168),
  and it is 34.7 of #34's pixels (5 mm) higher.
- **Heizung placard:** the placard and its knob are moved 3 px left, so the thermometer's mounting clears the placard's
  corner (they overlapped by 2 px). This is a small unrequested move, kept to the minimum.

**Tests:** tests/ui/bf110Panel.test.js checks the left edges line up and the 5 mm rise. The layout checks keep it clear of
every dial and box.

## D170. The Bf 110 C's rev counters moved a further 3 mm up (3 Nov 2026, product owner's request)

**The request:** move the tacho gauges up 3 mm.

**The change** (src/ui/bf110Layout.js, `RPM_UP`): the two rev counters and their correction cards stand 20.8 of #34's
pixels (3 mm) higher, 8 mm above #34's place in all. The manifold pressure gauges stay where D168 put them. The
counters' cards now come within a pixel of the outside air thermometer's mounting.

**Tests:** tests/ui/bf110Panel.test.js checks the 8 mm rise of the rev counters and the 5 mm of the manifold pressure
gauges on a 2560 px screen.

## D171. Plate round the Bf 110 C's manifold pressure gauges; their recess removed (3 Nov 2026, product owner's request)

**The request:** fill the area round the MAP gauges with the panel's colour.

**The change:** the dark recess the manifold pressure gauges stood in (#34, D140; `ataBox`) is gone, from
src/ui/bf110Layout.js and src/ui/bf110Boxes.js. The gauges now stand in their black mountings on the plate, like the
other dials.

**Tests:** tests/ui/bf110Panel.test.js checks there is no recess. The overlap check now covers every box with no
exceptions.

## D172. The Bf 110 C's round counter and Heizung placard moved 4 mm up (3 Nov 2026, product owner's request)

**The request:** move the cannon round counter and the Heizung switch up 4 mm.

**The change** (src/ui/bf110Layout.js, `UP_4MM`): the round counter, the Heizung placard and its green knob stand 27.8 of
#34's pixels (4 mm, 17.2 screen px on a 2560 × 1259 screen) higher. They stay inside the panel's top and clear of the
Kurssteuerung indicator.

**Tests:** tests/ui/bf110Panel.test.js checks the 4 mm rise of all three.

## D173. The Bf 110 C's turn and slip indicator the airspeed indicator's size (3 Nov 2026, product owner's request)

**The request:** make the turn and slip indicator the same size as the airspeed indicator.

**The change** (src/ui/bf110Layout.js): the turn and slip indicator now takes the airspeed indicator's face and mounting
sizes exactly. Their faces were already equal (the Bf 109's 44 to 45 px, D107). Its mounting was the Bf 109's slightly
wider one (55 against the airspeed indicator's 54), and is now 0.8 px narrower each side.

**Tests:** tests/ui/bf110Panel.test.js and tests/ui/bf110Revi.test.js check that the two are the same size.

## D174. The Bf 110 C's elevator trim indicator the airspeed indicator's size (3 Nov 2026, product owner's request)

**The request:** make the elevator trim indicator the same size as the airspeed indicator.

**The change** (src/ui/bf110Layout.js): the trim indicator (D161, D164) now takes the airspeed indicator's face and
mounting sizes. Its face is 34.7 picture px, was 31.3; its mounting 42.6, was 36.3. It stands 11 of #34's pixels lower
(716) so its mounting clears the dive placard above it.

**Tests:** tests/ui/bf110Panel.test.js checks it is the airspeed indicator's size. The layout checks keep it clear of
the placard, the course box and the horizon.

## D175. The Bf 110 C's climb indicator the airspeed indicator's size (3 Nov 2026, product owner's request)

**The request:** make the VSI (climb indicator) the same size as the airspeed indicator.

**The change** (src/ui/bf110Layout.js): the climb indicator now takes the airspeed indicator's face and mounting sizes.
Its face is 34.7 picture px, was 35.0; its mounting 42.6, was 38.6. It stays at #34's place, clear of the Kurs strip,
the round counter, the two-bar window and the outside air thermometer. The flying instruments' upper row (airspeed, turn
and slip, climb) is now three dials of one size.

**Tests:** tests/ui/bf110Panel.test.js checks it is the airspeed indicator's size. The layout checks keep it clear of
everything round it.

## D176. The Bf 110 C's two-bar window above the altimeter moved 2 mm up (3 Nov 2026, product owner's request)

**The request:** move the label above the altimeter up 2 mm.

**The change** (src/ui/bf110Layout.js): the small two-bar window above the altimeter (#34, shown only) stands 13.9 of
#34's pixels (2 mm, 8.6 screen px on a 2560 × 1259 screen) higher. It stays clear of the climb indicator's mounting
(D175).

**Tests:** tests/ui/bf110Panel.test.js checks the 2 mm rise.

## D177. The Bf 110 C's artificial horizon 15% larger than the airspeed indicator (3 Nov 2026, product owner's request)

**The request:**
- Verify the airspeed indicator, altimeter, turn and slip indicator, elevator trim indicator, climb indicator, rev
  counters and manifold pressure gauges are all the same size.
- Make the artificial horizon 15% larger than the airspeed indicator.

**Verification** (picture px, face radius / mounting half-width):

| Dial | Face | Mounting | Same as the airspeed indicator? |
|---|---|---|---|
| Airspeed indicator | 34.72 | 42.61 | — |
| Altimeter | 34.72 | 42.61 | yes |
| Turn and slip indicator | 34.72 | 42.61 | yes |
| Elevator trim indicator | 34.72 | 42.61 | yes |
| Climb indicator | 34.72 | 42.61 | yes |
| Rev counters and manifold pressure gauges | 35.88 | 39.56 | **no** |

The engine gauges' faces are 3% larger and their mountings 7% narrower. They were measured on #34 and have not been
changed. **Decision needed:** whether to match them to the airspeed indicator.

**The change** (src/ui/bf110Layout.js): the artificial horizon now has 1.15 times the airspeed indicator's face and
mounting: face 39.93 (was 39.10), mounting 49.00 (was 47.84). It stands 3 of #34's pixels lower (715) so its mounting
clears the Umschaltwarnung placard above it.

**Tests:** tests/ui/bf110Panel.test.js checks the altimeter, turn and slip, trim and climb indicators against the
airspeed indicator's size, and the horizon at 1.15 times it.

## D178. The Bf 110 C's Heizung placard lined up with the outside air thermometer (3 Nov 2026, product owner's request)

**The request:** move the Heizung control right so its left edge lines up with the outside air thermometer's left edge.

**The change** (src/ui/bf110Layout.js, `OAT_LEFT`): the Heizung placard and its green knob move 133.9 of #34's pixels
right. The placard's left edge now lies in line with the thermometer mounting's left edge, which lies in line with the
left manifold pressure gauge's (D169). The placard keeps its width and its height (D172). It stays inside the panel's top
right corner, clear of the right dash cover's edge.

**Tests:** tests/ui/bf110Panel.test.js checks that the left edges line up and that the knob moved with the placard.

## D179. The Bf 110 C's altimeter raised level with the trim indicator (3 Nov 2026, product owner's request)

**The request:** move the altimeter up so its bottom edge lines up with the elevator trim indicator's.

**The change** (src/ui/bf110Layout.js): the two are the same size (D174), so the altimeter's centre is raised from 730 to
716 on #34's pixels, the trim indicator's height. Their mountings' bottom edges are now level. The setting knob moves
with it, and it stays clear of the two-bar window above (D176).

**Tests:** tests/ui/bf110Panel.test.js checks the bottom edges are level and the knob is below the altimeter.

## D180. The Bf 110 C's Kurs strip, turn and slip, horizon, altimeter, climb indicator and round counter moved 5 mm right (3 Nov 2026, product owner's request)

**The request:** move the Kurs indicator, turn and slip indicator, artificial horizon, altimeter, climb indicator and
cannon round counter 5 mm to the right.

**The change** (src/ui/bf110Layout.js, `RIGHT_5MM`): all six move 34.7 of #34's pixels (5 mm, 21.5 screen px on a
2560 × 1259 screen) right. "Kurs indicator" is taken as the Kurs strip under the round counter. The altimeter's setting
knob moves with it. Everything stays clear of its neighbours and inside the panel.

**Flagged:**
- **Turn and slip off the gunsight's line:** the panel's middle line (AXIS), the Revi and the windscreen frame stay put,
  so the turn and slip indicator now stands 5 mm right of the Revi rather than under it (D140).
- **Window not moved:** the two-bar window above the altimeter was not in the list and stays where it was. It is now
  5 mm left of the altimeter's centre.

**Tests:**
- tests/ui/bf110Panel.test.js checks the 5 mm move of all six on a 2560 px screen.
- tests/ui/bf110Revi.test.js now expects the turn and slip indicator right of the Revi's line.

## D181. The Bf 110 C's artificial horizon with a round glass face and level marks (3 Nov 2026, product owner's requests)

**The requests:**
- Redesign the artificial horizon with a round glass face and no "L" and "R" letters at its sides.
- Give it a short white fixed mark at 9 o'clock and at 3 o'clock, so the horizon bar can be lined up with them when
  straight and level.

**The change** (src/ui/lwFlightDials.js `lwHorizon`, drawn only on the Bf 110's panel):
- **Window:** fully round (0.84 of the face radius). The straight sides it had are gone.
- **Glass:** a faint sheen across its upper left and a dark rim.
- **Letters:** "L" and "R" removed.
- **Level marks:** two short white bars at 9 and 3 o'clock on the window's edge (0.16 of the radius long), level with
  the small aircraft's wings. The horizon bar lines up with them in level flight.
- **Unchanged:** the scalloped bezel and its eight screws, the banking and pitching horizon bar, and the small aircraft.

**Tests:** tests/ui/bf110Panel.test.js checks that the horizon draws two level marks at ±0.74 of its radius and no
lettering.

## D182. The Bf 110 C's engine gauge sizes and the gunsight's place kept (3 Nov 2026, product owner's decisions)

**Decisions on D177 and D180:**
- **Engine gauges:** the rev counters and manifold pressure gauges keep their own size: face 35.88, mounting 39.56
  picture px, as measured on #34. They are not matched to the airspeed indicator.
- **Gunsight:** it stays where it is. The Revi, the guns' line and the windscreen frame stay on the panel's middle line,
  5 mm left of the turn and slip indicator (D180).

No code changes.

## D183. The Bf 110 C's elevator trim indicator lined up under the airspeed indicator (3 Nov 2026, product owner's request)

**The request:** line up the elevator trim indicator's right edge with the airspeed indicator's.

**The change** (src/ui/bf110Layout.js): the two are the same size (D174), so the trim indicator's centre moves 10 of
#34's pixels right, from 680 to 690, directly under the airspeed indicator. Their right edges, and their left edges, are
now in line. It stays clear of the course box on its left and the horizon on its right; the gap to the horizon is
about 0.6 mm smaller.

**Tests:** tests/ui/bf110Panel.test.js checks the right edges line up.

## D184. The Bf 110 C's turn and slip indicator on the artificial horizon's centre line (3 Nov 2026, product owner's request)

**The request:** line up the turn and slip indicator's vertical centre line with the artificial horizon's.

**The change** (src/ui/bf110Layout.js, `HORIZON_X`): the turn and slip indicator moves 2 of #34's pixels (0.9 picture px,
0.3 mm on a 2560 px screen) left, onto the horizon's centre line, 880 + 5 mm on #34. It is now 4.8 mm right of the
gunsight's line (D182).

**Tests:** tests/ui/bf110Panel.test.js checks the two centres share one x.

## D185. The Bf 110 C's climb indicator spaced from the turn and slip as that is from the airspeed indicator (3 Nov 2026, product owner's request)

**The request:** make the gap between the climb indicator and the turn and slip indicator the same as the gap between
the airspeed indicator and the turn and slip indicator (18.15 picture px, about 5.7 mm on a 2560 px screen).

**The change** (src/ui/bf110Layout.js, `ROW_GAP`, `CLIMB`): the climb indicator is placed from the other two. It stands
one gap past the turn and slip indicator's mounting, about 2.5 mm right of where it was (the gap was 7.7 picture px).
If the airspeed indicator or the turn and slip indicator moves, the climb indicator keeps the gaps equal.

**Tests:** tests/ui/bf110Panel.test.js checks the two gaps are equal.

## D186. The Bf 110 C's round counter and altimeter on the climb indicator's centre line (3 Nov 2026, product owner's request)

**The request:** line up the cannon round counter's and the altimeter's vertical centre lines with the climb
indicator's.

**The change** (src/ui/bf110Layout.js): the round counter and the altimeter now take the climb indicator's x (D185),
both about 2.5 mm right of where they were. Their heights are unchanged, and the altimeter's setting knob moves with
it. The upper row's right-hand column (round counter, climb indicator, altimeter) is now one line. They stay clear of
the Heizung placard, the outside air thermometer and the engine gauges.

**Tests:** tests/ui/bf110Panel.test.js checks the three share one x.

## D187. The Bf 110 C's Kurssteuerung indicator on the Kurs strip's centre line (3 Nov 2026, product owner's request)

**The request:** line up the centre line of the gauge below the gunsight with the Kurs gauge's vertical centre line.

**Interpretation:** the gauge below the gunsight is the Siemens Kurssteuerung indicator in the top row. The Kurs gauge
is the Kurs strip below it (D180).

**The change** (src/ui/bf110Layout.js, `KURS_X`): the Kurssteuerung indicator moves onto the Kurs strip's centre line,
30.2 of #34's pixels (about 4.4 mm on a 2560 px screen) right. Its height and size are unchanged. It stays clear of the
SKK block and the round counter.

**Tests:** tests/ui/bf110Panel.test.js checks it lies on the Kurs strip's centre line.

## D188. The Bf 110 C's pitch control switches, Automatik or Hand, on Shift+P (3 Nov 2026, product owner's request)

**The request:** the airscrew pitch control switches should show a white knob 10 px across, at either Automatik or Hand
as set. The setting is toggled from the keyboard. The product owner first named P, which already pauses the game, and
then chose Shift+P.

**The change:**
- **Key** (src/input/keyboard.js): Shift+P is its own key. It does not also pause, and P alone still pauses. On the
  Bf 110 it toggles the pitch control between Automatik and Hand.
- **Behaviour:** the product owner did not say what the settings should do. The chosen default is:
  - **Automatik** is the existing automatic pitch, the engine assist that holds the rpm (D16, `engineAssist`, also on
    key A);
  - **Hand** is the pitch set with E and D.
  - The player's aircraft starts at Hand, as it did.
- **Panel** (src/ui/bf110Fittings.js, `pitchKnobY`, `PITCH_KNOB`; the `pitchAutomatik` reading):
  - each of the two rocker switches under the Automatik and Hand plates shows a white knob, at its Automatik end (top)
    or its Hand end (foot);
  - the knob is 10 screen px across on the product owner's 2560 × 1259 screen, and scales with the panel on other
    screens;
  - both switches follow the one setting, since the assist works both engines together.
- **Bf 109:** unchanged; Shift+P does nothing there.

**Tests:**
- tests/ui/phase2Controls.test.js checks that Shift+P toggles Automatik and Hand on the Bf 110 without pausing, that P
  still pauses, and that the Bf 109 is unaffected.
- tests/ui/bf110Panel.test.js checks the knobs' places at each end of the rocker, their 10 px size on a 2560 × 1259
  screen, and that both are drawn at Hand when set so.

## D189. The Bf 110 C's pitch levers' knobs in the Heizung knob's green (3 Nov 2026, product owner's request)

**The request:** change the airscrew pitch control knobs' colour to the Heizung control knob's.

**Interpretation:** the two round knobs on the pitch levers (größer / kleiner Drehzahl) in the airscrew lever box, which
were dark grey. The white switch knobs of D188 are unchanged.

**The change** (src/ui/bf110Boxes.js `greenKnob`, `GREEN_KNOB`; src/ui/bf110Fittings.js): both lever knobs are now
drawn with the Heizung knob's green shading (#4f8f86 to #0f2f2c, lit from the upper left). Both knobs share one drawing
function.

**Sizes, on a 2560 × 1259 screen:**
- lever knobs: 17.3 px across;
- pitch control switch knobs (D188): 10 px;
- the Heizung knob: 37.1 px.

**Tests:** tests/ui/bf110Panel.test.js checks three knobs use the green: the Heizung knob and both lever knobs.

## D190. The Bf 110 C's pitch levers' knobs 25 px across (3 Nov 2026, product owner's request)

**The request:** make the pitch control knobs 25 px.

**The change** (src/ui/bf110Fittings.js, `LEVER_KNOB`): the two green knobs on the pitch levers (D189) are now 25 screen
px across on the product owner's 2560 × 1259 screen (they were 17.3), scaling with the panel on other screens. They
stay clear of each other (37 px apart) and inside the lever box.

**Tests:** tests/ui/bf110Panel.test.js checks the 25 px size on a 2560 × 1259 screen.

## D191. The Bf 110 C's pitch levers' knobs follow each engine's airscrew pitch (3 Nov 2026, product owner's request)

**The request:** verify that the pitch control knobs move with changes in airscrew pitch. They did not: they were drawn
fixed half way along their slots (shown only since D140). The product owner asked for them to follow each engine's
pitch.

**The change:**
- **Reading** (src/ui/instruments.js): each engine now has a `pitchFraction`, its blade angle from the fine stop (0) to
  the coarse stop (1), held at 1 when feathered.
- **Knobs** (src/ui/bf110Fittings.js, `leverKnobY`, `LEVER_TRAVEL`):
  - the left lever's knob follows the left engine and the right lever's the right engine;
  - each runs from the top of its slot at the fine stop (größer Drehzahl) to the foot at the coarse stop (kleiner);
  - the travel, 0.54 to 0.73 of the lever box's height, keeps the 25 px knob clear of the größer and kleiner labels.
- **What moves them:** E and D in Hand, the automatic pitch in Automatik (D188), and the engine selection (K), which can
  move one engine alone.

**Checked:**
- The pitch keys reach each engine through the twin levers (`applyTwinLevers`).
- Holding D for 2 s moves both engines' readings 0.25 coarser.
- Holding E for 7 s takes them to the fine stop, at the airscrew's assumed 4°/s pitch rate (`propeller.pitchRate`).
- Headless screenshots run the game far slower than real time, so the knobs move only a little in them.

**Tests:**
- tests/ui/phase2Controls.test.js holds D and E through the keyboard, the levers and the simulation, and checks both
  engines' readings.
- tests/ui/bf110Panel.test.js checks the readings at the fine, coarse and feathered blade angles, the knobs' travel
  ends, and that the left knob is drawn at the top and the right at the foot when the engines differ.

## D192. The Bf 110 C's engines moved outward to clear the airscrew arcs from the fuselage (3 Nov 2026, product owner's request)

**The request:** reduce the airscrew arc's diameter, since it is too close to the fuselage.

**The choice:** the 3.1 m airscrew diameter is sourced (S23, S24, S25, high confidence). The engines' sideways position
(2.45 m from the centreline) is only an estimate. Asked, the product owner chose to keep the sourced diameter and move
the engines outward.

**The change** (src/aircraft/bf110c4.js `engines`; docs/AIRCRAFT_DATA.md rows `engines.left.z`, `engines.right.z`):
- **Engines:** both airscrew hubs move from 2.45 m to 2.75 m from the centreline, still an estimate (no scaled drawing
  found). The blade tips now clear the fuselage's side by about 0.55 m, where they cleared it by 0.25 m.
- **Following them:** the nacelles, airscrews and engine hit zones.
- **Effects:**
  - **Single-engine flight:** slightly more yaw from one engine alone, since the engines are 12% further out.
  - **Validation:** `npm run validate` is unchanged, as its cases use both engines.
  - **Cockpit view:** the arcs stand further out at the screen's sides.

**Flagged:** the main wheels keep their own estimated track (`gear.main.z` 2.3 m, "under the engines", S24), so they now
sit at the nacelles' inner edge rather than under the engines. **Decision needed:** whether to move them out with the
engines. That would widen the wheel track and change ground handling. **Decided:** moved out with them (D194).

**Tests:** the existing tests pass, including the data rows check (tests/aircraftCode.test.js) with the new figures.

## D193. The Bf 110 C's pitch change with flaps: the nose rears up, then sinks (3 Nov 2026, plan approved by the product owner)

**Prompt:** the product owner asked to verify that the nose pitches up when the flaps are lowered and down when they
are raised. It did not: every aircraft had only a small fixed nose-down moment with flaps down (`aero.flapCm` −0.02,
an estimate). Lowering the flaps sank the nose; raising them lifted it.

**The source (S24):** the RAE report on the Bf 110 says that when the flaps are lowered, "the nose first rears up,
then sinks, and the eventual change of trim is very small". The product owner asked for this to be modelled for the
Bf 110 only.

**The change:**
- **Moment** (src/physics/aero.js, pitch): a passing moment `flapCmLag × (flaps − flapsLag)`.
  - `flapsLag` follows the flap position with a first-order lag of `flapLagTime` (src/physics/controls.js).
  - While the flaps go down they lead the lag, so the moment is nose-up. While they come up it is nose-down.
  - Once they stop it dies away, leaving the small final change, `flapCm`.
- **New data** (Bf 110 only, src/aircraft/bf110c4.js, with keyed rows in docs/AIRCRAFT_DATA.md): `aero.flapCmLag`
  0.025 and `controls.flapLagTime` 2 s. Both are estimates: S24 gives no figures.
- **Tuning:** flown hands off from trimmed level flight at 220 km/h, the full 8 s flap travel rears the nose about 2°
  above its starting attitude near the end of the travel. It then sinks below it as the speed falls. Raising the flaps
  from 200 km/h dips the nose by about 1.5° in 4 s, compared with the same flight without the moment.
- **Other aircraft:** they have no `flapCmLag`, so the term is always zero and they fly as before.

**Flagged:** the size (0.025) and duration (2 s) of the rear-up are estimates tuned to S24's words, not measured figures.

**Not changed:** `npm run validate`, whose cases fly with the flaps up.

**Tests:** tests/physics/flapPitch.test.js checks that:
- the nose rears up 1.5–4° while the flaps go down, then sinks;
- lowering pitches the nose up, and raising dips it, compared with the same flights without the moment;
- the moment dies away once the flaps stop;
- the other aircraft have no lag.

## D194. The Bf 110 C's main wheels moved out with the engines (4 Nov 2026, product owner's decision)

**The question (D192):** the engines moved out to 2.75 m from the centreline, but the main wheels stayed at their own
estimated 2.3 m, so they sat at the nacelles' inner edge. S24 says the wheels retract into the engine nacelles.

**The decision:** the product owner chose to move the main wheels out with the engines.

**The change** (src/aircraft/bf110c4.js `gear.main.z`; docs/AIRCRAFT_DATA.md row `gear.main.z`):
- **Track:** half the track goes from 2.3 m to 2.75 m (the whole track from 4.6 m to 5.5 m), under the airscrew hubs.
  It is still an estimate: no scaled drawing has been found.
- **Following it:** the drawn undercarriage legs (they are placed from `gear.main.z`).
- **Effects:**
  - **Ground handling:** a wider track makes the aircraft steadier on the ground, harder to tip onto a wingtip. One
    braked wheel gives a little more turning moment.
  - **Parked:** the weight, its share on the tailwheel and the ground angle are unchanged (they depend on the wheels'
    fore and aft position, not their spread).
  - **Validation:** `npm run validate` is unchanged (it flies in the air).

**Flagged:** the track is an estimate, as before; it now follows the estimated engine position.

**Tests:** a new test checks the main wheels stand under the engines (tests/physics/ground.test.js); the parked,
brake and landing tests pass for the Bf 110 with the wider track.

## D195. The Bf 110 C's four MG 17s checked, and the SKK 404-2 lamps light when each gun is empty (4 Nov 2026, product owner's request)

**The request:** verify the four nose MG 17s work, and make the MG ammunition display light red when each gun runs out.

**Checked, already working:**
- **Trigger:** the MG trigger (Space, or joystick button 1) fires all four MG 17s together; the cannon trigger (Enter)
  fires only the two MG FF/M.
- **Rate and rounds:** each MG 17 fires 1,100 rounds a minute (unsynchronised in the nose, S27) from its 1,000-round
  belt, so the four run dry together after about 54.5 s of firing.
- **Each gun is separate:** it counts its own rounds and stops at empty.

**The change** (src/ui/bf110Boxes.js `SKK_LAMPS`, `mgLamps`): the four red lamps of the SKK 404-2 block, dark until now
(shown only), each stand for one MG 17: the upper row for the upper guns, the lower row for the lower guns, left guns
on the left. A lamp lights red, in the round counter's red, when its own gun has no rounds left.

**Flagged:**
- **Not from a source:** what the SKK 404-2 block's lamps really showed is not described in any source we have. Its
  lamps as one "empty" lamp for each MG 17 is the product owner's choice.
- **The block identified (enthusiast catalogue, not an approved source):** the product owner supplied
  deutscheluftwaffe.de, "Fl.47292 Schalt-Kontrollkasten SKK404-2 1941"
  (https://www.deutscheluftwaffe.de/fl-47292-schalt-kontrollkasten-skk404-2-1941), read 4 Nov 2026. It is an
  enthusiast and collector site (it has a forum and a parts market; its operator is not stated), outside the source
  list in CLAUDE.md. It is recorded, at the product owner's request, as backing only for the box's identity, not
  for any figure or behaviour:
  - **Name:** Schalt-Kontrollkasten SKK404-2, Anforderungszeichen Fl.47292, Gerät-Nr. 102-84 (as on the drawn block);
  - **Maker:** Michel-Werke, Augsburg, about 1941;
  - **Fitted to:** "Bf 110 Versionen mit 4 MG 17" (B to G) and the Bf 109 E.
  This supports the product owner's choice of the block as the MG 17s' fitting (D140, D106 had left it unidentified).
  The page has only this list and photos: nothing on the lamps, the Ein/Aus toggle or the knobs. A further search
  found no description either.
- **Replica pictures (a replica seller's photographs, not an approved source):** the product owner found an eBay
  listing, https://www.ebay.de/itm/266475283038 (seller "Bf109 Nachbauten", Air Legend Replika Factory, Memmingen,
  read 4 Nov 2026), and supplied three of its photographs. The listing calls the box a resin cast taken from an
  original ("Abformung eines SKK404 von einem Original"), and repeats the catalogue's details (Fl.47292, Michel
  Augsburg, about 1941, "4 Glaslinsen", fitted in Bf 110 versions with MG 17 and the Bf 109 E). Recorded, at the product
  owner's request, as replica pictures backing the box's appearance only (D196). Like the catalogue, it says nothing
  on what the lamps showed; the product owner presumes each glows when its MG 17 is empty. (The MG 17s are belt-fed,
  1,000 rounds each; the drums are the MG FF cannon's.)
- **Gerät-Nr.:** the replica is engraved "Gerät-Nr. 104-84", the catalogue gives 102-84. The product owner chose to keep
  102-84 on the drawn block.
- **The 2 MG / 4 MG switch** is still shown only: all four guns always fire together.

**Tests** (tests/ui/bf110Panel.test.js): one lamp for each MG 17, all dark when loaded; emptying any one gun lights only
its lamp; holding the MG trigger in the simulation empties all four after their 1,000 rounds, leaves the cannon full,
and lights all four lamps. Checked in the game: after the trigger was held to empty, all four lamps showed red and the
cannon lamps stayed dark.

## D196. The SKK 404-2 block redrawn after the replica's photographs (4 Nov 2026, product owner's request)

**The request:** redraw the SKK 404-2 block to match the replica's photographs more closely (D195), keeping its label
Gerät-Nr. 102-84.

**The change** (src/ui/bf110Boxes.js `SKK`, `SKK_LAMPS`, `skkBlock`), every part measured as a fraction of the block on
the square-on photograph (the block's proportions, 1.61 wide to 1 high, match the photographed plate's 1.57):
- **Plate:** dark grey, with a mounting screw in each corner hole.
- **Lamp plate:** raised, at the top right, its edge catching the light, with its two screws. On it, the four red lenses
  in black rims: the lower pair set wider apart than the upper, as photographed. Each lights bright red when its MG 17
  is empty (D195); otherwise a deep red.
- **Ein/Aus toggle:** on the left, a black ring and its lever between "Ein" above and "Aus" below. The lever stands at
  Ein, since the guns' circuit is always on in the game. (The photographed replica's lever is at Aus.) The lever is
  drawn worn bare metal, silver to light grey, not the replica's black: the product owner judges any coating would have
  worn off with use.
- **Push-buttons:** four black domed buttons, each with a white ring on its face, the outer two lower than the inner
  two, where the grey knobs were.
- **Lettering:** "Gerät-Nr. 102-84" (product owner's choice, not the replica's 104-84) and "SKK 404-2" along the foot.
  The replica's "Michel Augsburg" and "Fl. 47 292" are left off: too small to read on screen.

**Flagged:** the drawing follows a replica, not a photographed original or a drawing; the buttons stay shown only (what
they did is not known).

**Tests** (tests/ui/bf110Panel.test.js): the lamps lie on the lamp plate; the toggle lies left of it and the buttons below
it; none of the round parts touch; the lettering is drawn.

## D197. The round counter redrawn round after #34, the VSI's size, its lenses the SKK 404-2's (4 Nov 2026, product owner's request)

**The request:** the cannon round counter should be round, its profile as in #34 (Bf110C panel_5.jpg), its lenses the
same colour as the SKK 404-2's; then, its size the same as the climb indicator's (VSI).

**The change** (src/ui/bf110Gauges.js `COUNTER`, `roundCounter`; src/ui/bf110Layout.js `dials.counter`;
src/ui/bf110Panel.js), every part in fractions of the body's radius, measured on #34:
- **Round, on its own flange:** the square black mounting (D162) is gone from the counter. A round body with a lit rim
  and eight rivets round it stands on a dark flange whose corners, each with a large screw, stand out past the body
  on the diagonals.
- **Lenses:** on a raised plate at the top (the rim's arc above, a flat foot below, two small screws), one over each
  cannon's window, drawn exactly as the SKK 404-2's lenses: deep red, bright red when that cannon's drum is empty.
- **Windows:** each cannon's two digit drums, white on black, a grey band beneath, a dot between the windows.
- **Lettering:** Durchladen, with the two makers' marks either side (RB, BA, as on #34).
- **Buttons:** the two charging buttons below, black with white rings, as the SKK's (shown only).
- **Size:** the round body is as wide as the climb indicator's mounting, and the counter stays on its centre line
  (D186), at its height (D172). It grows from 34.5 to 42.6 picture px in radius, clear of the Kurssteuerung
  indicator, the Heizung placard and the climb indicator.

**Kept:** the undercarriage light housing keeps its size (matched to the old counter in D158); it is not tied to the
counter any more.

**Tests** (tests/ui/bf110Panel.test.js): the counter has the climb indicator's size and centre line; it has no square
mounting; its round body fills its place; the flange's corners stand out past the body; the lenses lie on the raised
plate; the buttons lie inside the rim, clear of every rivet; the digits and lettering are drawn.

## D198. The flap and undercarriage levers centred between the lever box and the compass, and 15% larger (4 Nov 2026, product owner's request)

**Partly replaced by D199:** the centre line stays; the sliding T and its 15% scale gave way to the push/pull valves.

**The request:** move the Fahrwerk and Landeklappe levers onto the vertical centre line between the airscrew lever box
and the compass; then make the levers 15% larger, but not their EIN and AUS labels.

**The change:**
- **Position** (src/ui/bf110Layout.js `SWITCH_X`, `switches`): both switches stand at x 300 on #34, midway between the
  lever box's right edge (240) and the compass's mounting's left edge (470 − 110 = 360). They stood at 268 and 270.
  Their heights are unchanged.
- **Landeklappe label:** centred under its switch, its width kept. (Moved by the same 30 px instead, it would have
  run past the panel's edge, which steps in below the flap switch.) The Fahrwerk label stays where it is, under the
  lever box.
- **Size** (src/ui/bf110Fittings.js `LEVER_SCALE`, `tBar`): each lever's T (its stem and the bar across its top) is
  1.15 times its first size. The EIN and AUS discs and their lettering, and the slot, keep their size.

**Checked:** at EIN, each larger T still clears the box above its switch (the undercarriage lights and the Achtung
placard); the switches clear the lever box and the compass's mounting; the label stays on the panel.

**Tests** (tests/ui/bf110Panel.test.js): both switches on the centre line, clear of the lever box and the compass;
the label centred under its switch; the T 15% larger and clear of the box above it at EIN.

## D199. Push/pull T-handle valves for the Bf 110 C's Fahrwerk and Landeklappe (4 Nov 2026, product owner's decision)

**The question:** how were the flap and undercarriage controls worked: flip switches or push/pull?

**No approved source found.** The Bf 110 C Betriebsanleitung (works edition, June 1939, chapter "2 Fahrwerk") exists,
but only for sale: reproduced in a published German book of Bf 110 handbooks
(https://www.amazon.de/dp/3939847496) and as scans from onlineaviationlibrary.com. Neither was bought.

**The leads (not approved sources under CLAUDE.md; read from search summaries, as the pages would not load):**
- a translated "Bf 110 C manual" on the Team Fusion (game-mod) wiki
  (https://www.theairtacticalassaultgroup.com/wiki/doku.php?id=hbf110c): push the control marked "Aus" until the
  indicator by the seat reaches the setting, then pull it out; the undercarriage control is unlocked before it is
  pressed; blue hand-wheels are the compressed-air emergency valves;
- the same wiki's C-4/C-7 page: a two-button, three-position control left on the panel, below the undercarriage
  lights;
- Chuck's Il-2 Cliffs of Dover Bf 110 guide (a sim guide): EIN (up) / neutral / AUS (down);
- a 1C forum thread quoting cockpit diagrams: push-button switches (Druckknopfschalter).

**The product owner's decision:** accept the push/pull lead. Each control is two hydraulic pilot valves worked by a
two-finger T-grip, larger than the D198 T. Picture #34 shows two round buttons per control, EIN above and AUS below,
so there are two Ts per control, four in all.

**Flagged:** the T-grip follows the product owner's reading. #34 shows round buttons, and no approved source
describes the handle.

**The change** (src/ui/bf110Valves.js; called from src/ui/bf110Fittings.js, which loses `einAus`, `tBar`,
`T_STEM`, `LEVER_SCALE` and `switchPosition`):
- **Layout:** each valve is a lettered disc (EIN or AUS, D198's size, 0.3 dial radii) beside its T, the pair centred
  on the switch line (x 300 on #34, D198). The black slot between them is gone.
- **The T:** a bar 0.8 dial radii wide (was 0.63) and 0.24 tall (was 0.16), with a finger recess either side of its
  shaft and a lit top edge, on a dark collar where the shaft enters the panel.
- **Pulled out (neutral):** its shaft shows and the bar stands 0.25 dial radii off the collar, casting a shadow.
  **Pushed in:** the bar sits on the collar, its disc lit white.
- **Show only:** the keys don't change (F / Shift+F the flaps, U the undercarriage, and the joystick buttons). The AUS
  T shows pushed in while the undercarriage or flaps run down, the EIN T while they run up; both pop out (neutral)
  once they stop.
- **Landeklappe pair moved up 20** on #34 (EIN 755, AUS 815; were 775, 835): pulled out, the AUS T crossed the
  plate's edge where it steps in beside the course box. The Fahrwerk pair is unchanged.

**Known limitation:** flaps jammed by damage short of their setting leave the AUS T pushed in.

**Tests** (tests/ui/bf110Valves.test.js): which T is pushed in, from the readings and in flight (pushed while the
undercarriage and flaps travel, out once they stop); the bigger T with the discs kept at 0.3; pushed in on the
collar, pulled out off it; each pair centred on the line, between the lever box and the compass and course box,
clear of the boxes above and below, and inside the panel's outline. The old T lever tests are removed.

## D200. The Bf 110 C valve T-grips 20% bigger, their labels on the bar for the thumb (4 Nov 2026, product owner's request)

**The request:** make the handles 20% bigger and put the button labels in the centre of the T-bar. The product owner
pictures the thumb pushing the T in on its label, two fingers pulling it out by the bar's ends. Then: make the T-bar
10% bigger again.

**The change** (src/ui/bf110Valves.js `T_SCALE`, `VALVE`, `valveGeometry`):
- **Size:** the bar, shaft and collar are 1.2 × 1.1 = 1.32 times D199's. The bar is 1.06 by 0.32 dial radii (was 0.8
  by 0.24).
  How far a pulled-out T stands off its collar (0.25) is unchanged.
- **Label:** the EIN or AUS disc (still 0.3 dial radii, D198) now rides on the middle of the bar, ringed in black and
  shadowed with it. The finger recesses moved out to the bar's ends. Each T is centred on the switch line.
- **Spacing:** with the discs on the T, each valve stands taller. Each pair is spread 5 px further apart on #34 so
  it clears the boxes above and below: Fahrwerk EIN 500 and AUS 560 (were 505, 565); Landeklappe 760 and 820 (were
  755, 815).

**Tests** (tests/ui/bf110Valves.test.js): the bar 1.32 times 0.8 by 0.24; the disc centred on the bar, leaving its ends for
two fingers; the clearance, outline and centre-line tests kept.

## D201. The Bf 110 C's trim indicator doubles as a flap indicator (4 Nov 2026, product owner's request)

**The request:** make the elevator trim indicator dual use. Its blank right side becomes a flap indicator, with Ein at
the top and Aus at the bottom of an arc of marks, one every 10 degrees. Remove the small dark round window at the top
of the face. Then: move Ein to 12 o'clock and Aus to 4 o'clock.

**The change** (src/ui/bf110Gauges.js `trimIndicator`, `flapScale`, `flapAngle`, `flapMarks`, `FLAP_ARC`):
- **Flap scale:** an arc on the right side, 120 degrees of arc from 12 o'clock to 4 o'clock (24 degrees of arc for each
  10° mark).
  - **Ein:** flaps up (0°), at 12 o'clock.
  - **Aus:** fully down, the Bf 110's 50° (`controls.flapTravel`), at 4 o'clock.
  - **Marks:** six, one for every 10° of flap. The end marks are longer.
  - **Words:** Ein is lettered left of its mark (above it, it would touch the bezel); Aus below its mark.
- **Pointer:** a short pointer like the trim's follows the flaps' actual position (`flapDegrees`), not the selection.
- **Window:** the dark round window at the top of the face is removed.
- **Trim side:** the trim's marks and pointer and the rudder trim's L ▮ R are unchanged.

**Flagged:** the combined trim and flap indicator is the product owner's design. #34's AEG instrument shows only the
trim marks and the window. The flap-control leads (D199) put the flap indicator beside the pilot's seat, not on the
panel, and no approved source has been found for either.

**Tests** (tests/ui/bf110Panel.test.js): the flap marks at 0-50 in 10s; Ein at 12 o'clock and Aus at 4 o'clock, 24
degrees of arc a mark, held at the ends; the words drawn; no dark window at the top.

## D202. The Bf 110 C's trim and flap pointers twice as long (4 Nov 2026, product owner's request)

**The request:** make the trim and flap pointers 2x longer.

**The change** (src/ui/bf110Gauges.js `POINTER`): both pointers run from 0.32 to 0.56 face radii, 0.24 long (were 0.44
to 0.56, 0.12 long). The outer ends stay where they were, inside the marks (0.62), so the pointers grow inward and stay
clear of the L ▮ R and the Ein and Aus words.

**Tests** (tests/ui/bf110Panel.test.js): the pointer's length 0.24 and its outer end inside the marks; the trim and
flap pointers drawn at that length.

## D203. A magnetic compass on a bracket at the Bf 110 C panel's top right (4 Nov 2026, product owner's request)

**The request:** draw a magnetic compass as in the product owner's picture #36 (a photograph of a compass on a light
grey bracket). Put it on a bracket at the panel's top right, small enough not to cover any instrument. Then: move it
to the panel's right corner and enlarge it 20%. Then: enlarge it 25% more and move it up next to the Heizung placard.

**The change** (new src/ui/bf110MagCompass.js; placed in src/ui/bf110Layout.js `MAG_COMPASS`, `boxes.magCompass`;
drawn from src/ui/bf110Panel.js):
- **Size:** the case is 165 of #34's pixels square (first 110, then 20% and 25% larger). The bracket is 16% wider all
  round.
- **Place:** next to the Heizung placard, 3 px right of it on #34, the bracket's foot 4 px above the right rev
  counter's correction card. (Its earlier places: right of the placard at (1530, 370); then the right corner.)
- **Over the edge:** at this size it can't fit inside the plate there. Its top right corner overhangs the panel's
  sloping edge onto the frame, as a bracket fixed to the frame would. So it's kept in its own layout entry
  (`magCompass`), apart from the plates that must stay inside the outline. The bracket's arm is gone: the corner
  itself now reaches the frame.
- **Looks, after #36:**
  - a black rounded-square case with four screws on a light grey bracket;
  - a round black face in a bezel;
  - a small lamp above the window;
  - a level window showing the compass card: a mark every 5°, longer every 10°, and a figure every 30° (N, then tens
    of degrees: 3, 6 ... 33, as #36's 27, 24, 21);
  - a thin yellow lubber line.
- **Working:** the card follows the heading. As on a direct-reading compass seen from behind its card, the figures rise
  to the left (#36 reads 27, 24, 21 from left to right), so in a right turn the card runs right to left.

**Flagged:**
- **Unsourced type and place:** #36 is unidentified (the compass type and where it was fitted are not sourced). The
  Bf 110 C's own compass and its position are not confirmed by an approved source.
- **True heading:** it reads true heading like the repeater compass. Magnetic variation and deviation are not
  modelled (about 10° west over south-east England in 1940, unsourced here).
- **Card figures:** N plus numbers follows #36's numbered card; whether the C's card showed O, S and W is not known.

**Tests** (tests/ui/bf110MagCompass.test.js; the panel layout test covers the bracket too):
- the heading under the lubber line, the figures rising to the left (27, 24, 21), the card wrapping through north and
  moving right to left in a right turn;
- the case 165 px square, next to the Heizung placard, its foot just above the right rev counter's card; it covers no
  dial, plate or card; the case's left side and foot on the plate, only its top right corner over the edge.

## D204. The magnetic compass's lamp removed and its lubber line the face's full height (4 Nov 2026, product owner's request)

**The request:** remove the white dot above the vertical line, and extend the line to the top and bottom of the
compass face.

**The change** (src/ui/bf110MagCompass.js):
- **Lamp:** the small white lamp above the window is gone (`MAG.lamp` removed).
- **Lubber line:** it now runs from the top to the foot of the black face (`MAG.inner`, 0.92 of the bezel). Before, it
  ran only just past the window.
- **Colour:** the line keeps its gold colour (#d9b623), after #36's lubber line. The product owner called it red.

**Tests** (tests/ui/bf110MagCompass.test.js): no small disc on the face; the lubber line from the face's top to its
foot, through the centre.

## D205. The magnetic compass's face 4 mm wider (4 Nov 2026, product owner's request)

**The request:** enlarge the compass face's diameter by 2 mm; then another 2 mm.

**The change** (src/ui/bf110MagCompass.js `MAG.face`): the face's bezel is 27.8 of #34's pixels wider across (twice
2 mm on the product owner's 2560 px screen, 13.9 px each, the measure used in D176). Its radius goes from 0.8 to 0.968
of the case's half-width (82.5), still inside the case and clear of its screws. The black face and the lubber line grow with it. The case, the bracket and the card window are
unchanged.

**Tests** (tests/ui/bf110MagCompass.test.js): the face 27.8 px wider across, inside the case and clear of its screws.

## D206. The labels between the Bf 110 C's flying instruments centred under the dials above (4 Nov 2026, product owner's request)

**The request:** align the three labels between the flying instruments with the vertical centre lines of the
instruments above them.

**The change** (src/ui/bf110Layout.js `centredOn`, `DIVE`, `UMSCHALT`, `WINDOW`):
- **Dive speed placard:** centred under the airspeed indicator, 15 of #34's pixels right (about 2.2 mm on the product
  owner's screen).
- **Umschaltwarnung placard:** centred under the turn and slip indicator, 32 px right (about 4.6 mm). Its two lamps
  move with it and stay the same distance either side.
- **Two-bar window:** centred under the climb indicator, which is also the altimeter's centre line (D186), 57 px right
  (about 8.3 mm).
- **Unchanged:** each label's size and height.

**Tests** (new tests/ui/bf110Labels.test.js): each label centred under its dial; the sizes kept; the lamps the same
distance from their placard; the window on the altimeter's line too. The panel layout test still finds no overlaps.

## D207. The Fahrwerk label level with the Landeklappe label (4 Nov 2026, product owner's request)

**The request:** align the Fahrwerk label below the airscrew lever box with the Landeklappe label.

**The change** (src/ui/bf110Layout.js `boxes.fahrwerkLabel`): the label now runs from 870 to 892 on #34, the same top
and foot as the Landeklappe label. It was 858 to 878, so it is 12 px lower and 2 px taller. It stays at its x (55 to
125), under the lever box.

**Tests** (tests/ui/bf110Labels.test.js): the two labels' tops and feet level, and the Fahrwerk label still below the
lever box.

## D208. The Achtung placard's lettering 1.5 times larger (4 Nov 2026, product owner's request)

**The request:** make the font on the flap and undercarriage warning placard, between the levers, 1.5 times larger.

**The problem:** the lettering was already as large as the placard's width allowed. Its widest line ("bei
Geschwindigkeit über") filled 0.9 of the 95 px plate. At 1.5 times, the old lines would need about 145 px, and the gap
between the lever box and the course box is only 120 px.

**The change** (src/ui/bf110Placards.js `ACHTUNG`, `achtungLines`, `achtungPlacard`; src/ui/bf110Layout.js):
- **Font:** exactly 1.5 times the old one, 0.0756 of the placard's height (was 0.0504; the old figure is from Chrome's
  measured widths).
- **Plate:** 112 px wide on #34 (was 95), centred on the valves' line (x 300), clear of the lever box and the course
  box. Its height (590 to 730) is unchanged.
- **Lines broken shorter,** hyphenated as the picture's "voll-ständig":
  - Fahrwerk (4 lines): "Achtung Fahrwerk / bei Geschwindig- / keit über 250 km/St / nicht betätigen";
  - Landeklappe (6 lines): "Achtung / Landeklappe muß / bei Geschwindig- / keit über 250 km/St / vollständig /
    eingefahren sein".
  - The words and the 250 km/h limit (S24) are unchanged.
- **Spacing:** lines 1.15 font heights apart (was 1.3) and margins 0.3 (was 0.6), so the ten lines fit the height.
  Each section's height is in proportion to its lines, so the rule between them sits higher.

**Tests** (tests/ui/bf110Labels.test.js): the font 1.5 times the old; ten lines fitting the height; every line, at
Chrome's measured widths, within 0.92 of the placard's width; the plate centred on the valves and clear of the lever
box and course box; four lines above the rule and six below.

## D209. The airscrew lever box 10 mm shorter from its foot (4 Nov 2026, product owner's request)

**The request:** reduce the propeller pitch control block's height by 10 mm from the bottom.

**The change** (src/ui/bf110Layout.js `LEVER_FOOT_UP`, `LEVERS`; src/ui/bf110Fittings.js):
- **Box:** its foot is 69.5 of #34's pixels higher (10 mm on the product owner's screen: 43 screen px, one of #34's
  pixels 0.619 screen px, as D154). It now runs from 465 to 785.5 (was 855). Its top, sides and the outline's left
  edge through its top corner are unchanged.
- **Parts:** the box's parts are placed as shares of its height, so they close up with it. The pitch levers' 25 px
  knobs then touched the "größer" label. So "größer" moves from 0.47 to 0.45 of the height, and the knobs' travel
  becomes 0.535 to 0.715 (was 0.54 to 0.73) so they clear both labels.
- **Unchanged:** the Fahrwerk label stays level with the Landeklappe label (D207), so there's now a gap below the box.

**Tests** (tests/ui/bf110Labels.test.js): the box 43 screen px (10 mm) shorter with its top and width kept; the
knobs clear of the größer and kleiner labels at both ends of their travel; größer below the Hand plate.

## D210. The Achtung placard's sections swapped: Landeklappe above Fahrwerk (4 Nov 2026, product owner's request)

**The request:** swap the positions of the Landeklappe and Fahrwerk warnings.

**The change** (src/ui/bf110Placards.js `achtungPlacard`): the Achtung placard between the handles now carries the
flaps' warning ("Achtung / Landeklappe muß …", 6 lines) above the rule and the undercarriage's ("Achtung Fahrwerk …",
4 lines) below it. Each section keeps its height in proportion to its lines (D208), so the rule now sits below the
middle. The wording, font and plate are unchanged.

**Tests** (tests/ui/bf110Labels.test.js): the flaps' lines above the rule, the undercarriage's below, and the rule below
the middle.

## D211. A second Fahrwerk label under the airscrew lever box (4 Nov 2026, product owner's request)

**The request:** place a new "Fahrwerk" label 5 mm below the propeller pitch control block, aligned with the block's
right edge. Then: move it up 5 mm. Then: move it down 1 mm. Then: make it 50% larger, keeping its gap from the block.

**The change** (src/ui/bf110Layout.js `boxes.gearLabel`; drawn in src/ui/bf110Fittings.js):
- **Place:** its top 1 mm (6.9 of #34's pixels) below the lever box's foot (5 mm below, then 5 mm up, then 1 mm
  down), its right edge at the box's right edge (240).
- **Size:** 1.5 times the first Fahrwerk label's (105 by 33, was 70 by 22). It grows down and to the left, so its
  top (the gap from the box) and its right edge stay where they were. Its lettering grows with it.
- **The first label kept:** the original Fahrwerk label (D207, level with the Landeklappe label) is still there, so the
  panel now shows "Fahrwerk" twice. The product owner may want the first one removed.

**Tests** (tests/ui/bf110Labels.test.js): its top 1 mm below the box's foot, its right edge in line, 1.5 times the first label's size,
and clear of the Preßluft gauge. The panel layout test finds no overlaps.

## D212. The Preßluft gauge 5 mm from the Fahrwerk and Landeklappe labels (4 Nov 2026, product owner's request)

**The request:** set the gaps between the pressure gauge (the Preßluft gauge, D141) and the Fahrwerk and Landeklappe
labels to 5 mm.

**The change** (src/ui/bf110Layout.js `GAP_5MM`, `PRESSLUFT_X`): the gaps are measured from the gauge's square
mounting (48 either side of its centre). 5 mm is 34.7 of #34's pixels.
- **Landeklappe label:** stays centred under its handles (D198). The gauge moves 0.8 px right (centre 180.8, was 180)
  so the gap on this side is exactly 5 mm (it was 35.5 px, about 5.1 mm).
- **Fahrwerk label** (the first one, level with the Landeklappe label): moves 27 px left to 28.1 to 98.1 (was 55 to
  125) so the gap on this side is 5 mm too (it was 7 px, about 1 mm). Its size and height are unchanged.

**Tests** (tests/ui/bf110Labels.test.js): both gaps 5 mm on the product owner's screen, and the label's size kept. The
D141 test still finds the gauge below the lever box, between its labels.

## D213. Knurled emergency hand-wheels under the Fahrwerk and Landeklappe labels (4 Nov 2026, product owner's request)

**The request:** add two 44 mm knurled knobs, to the left and right of the Preßluft gauge, centred on the Fahrwerk
and Landeklappe labels. Asked to clarify:
- **Size:** 44 mm in life, to the panel's scale.
- **Place:** each knob below its label.

**What they are:** read as the compressed-air emergency hand-wheels for the undercarriage and the flaps. The D199
leads (not approved sources) mention them as "Handräder für Pressluft (Fahrwerk-/Landeklappennotbetätigung)". The
44 mm size is the product owner's.

**The change** (src/ui/bf110Layout.js `REAL_MM`, `AIR_WHEEL`, `knobs.gearAirWheel`, `knobs.flapAirWheel`;
src/ui/bf110Fittings.js `knurledKnob`):
- **Scale:** the airspeed indicator's face is taken as 80 mm, which makes about 1.9 of #34's pixels a millimetre. Each
  wheel is 83 px across on #34 (about 12 mm on the product owner's screen), almost the Preßluft gauge's dial size.
- **Place:** each wheel's top is 1 mm below its label, centred under it.
  - **Deviation:** the Landeklappe wheel stands 6 px (about 0.9 mm) left of its label's centre. Centred, its right
    side would cross the panel's edge, which slopes in beside the bottom centre section.
- **Looks:** a black wheel with 40 knurled teeth round its rim, lit from the top left; a dished face; a domed hub
  with a screw slot. Shown only: they don't work.
- **Partly off screen:** the wheels' lower part runs below the screen's foot, as the Preßluft gauge's lower part
  does (the panel is cut at the coolant thermometers' feet, D141).

**Flagged:** the wheels' size, look and place are the product owner's. #34 doesn't show them, and no approved
source gives them.

**Tests** (tests/ui/bf110Labels.test.js): 44 mm at that scale; 1 mm below and centred under each label (the
Landeklappe one 6 px left); every point of each rim on the plate and clear of the Preßluft gauge's mounting.

## D214. The slip balls fixed: the Luftwaffe turn indicator's ran the wrong way; the course box's now works (4 Nov 2026, product owner's request)

**The request:** check that the slip ball moves correctly in the "gyro compass". The product owner then named it as the
horizontal compass below the round repeater compass: the Siemens course box (D159).

**What was found:**
- **Course box:** its ball (the dark band in the curved white tube) was drawn fixed in the middle, shown only. It never
  moved.
- **Turn indicator** (the Wendezeiger, under the Revi, `lwTurnBank`, shared by the Bf 109 and Bf 110): its ball moved
  the wrong way, because two minus signs cancelled. A skid to the right (right rudder, wings level) sent the ball
  right; a real ball goes left, to the outside.
- **Checked in flight:** with right rudder, the sideways push the pilot feels (`sideG`) is to the right, as it should
  be. The RAF and generic slip indicators already moved the right way.

**The change:**
- **Turn indicator** (src/ui/lwFlightDials.js `lwBallAngle`): the ball swings away from the push, left in a right skid.
  This fixes the Bf 109 as well.
- **Course box** (src/ui/bf110Boxes.js `courseBall`, `COURSE_TUBE`, `courseTubeAt`): the ball rides along the sagging
  tube with `sideG`. It reaches the tube's ends at a quarter g, as the other balls do, and stays inside the tube.
- **Unchanged:** the course box's cards (3 and N) are still shown only and don't follow the heading.

**Noticed, not changed (flight model):** half rudder at cruise gives about 20° of sideslip and over 1 g sideways after
a second, with a lightly damped swing. That seems large and should be checked against sources in a later physics
task.

**Tests** (new tests/ui/slipBalls.test.js): `sideG` to the right in a right skid and to the left in a left skid (Bf 109
and Bf 110); both balls left in a right skid, right in a left skid, centred when balanced and held at the ends; the
turn indicator's ball drawn left of centre for a push to the right; the course box's tube sagging in the middle.

## D215. The twelve-aircraft timing test warms up for 3 s, not 1 (5 Nov 2026, product owner's approval)

**What happened:** pushing D194–D214, the deploy failed on one test on GitHub's runner, twice: twelve AI aircraft for
ten simulated seconds took 103.5, then 100.9 ms per simulated second, against a budget of 100.

**Not a slowdown:** timed on this Mac, the run is the same before this batch (the last deploy, 3 November) and after
it: about 27 ms per second on the first timed run, then about 10 ms once warm. The batch was almost all panel drawing,
which the test doesn't run.

**The cause:** GitHub's runner is about four times slower. After the test's one second of warm-up it was still timing
the code while it was being compiled, which D88 meant to leave out ("time the steady running, not the start-up").

**The change** (tests/core/scenarios.test.js): three seconds of warm-up before the ten timed seconds. The 100 ms budget
is unchanged, so a real slowdown still fails it.

## D216. Phase 6 checkpoint 5, part 1: aggression, the duels, and the AI pilot out of trouble (5-6 Nov 2026)

Under the approved checkpoint 5 plan (5 Nov 2026). The frame-rate measurement (D221) and the proposed acceptance test
(D222) are still to come; D217-D220 continue this work.

**Aggression, a new skill setting** (src/ai/skill.js, src/ai/fighter.js), game-design estimates as in the plan:
- `press`: how close a fighter presses a diving pass or a run on a bomber before breaking off (it replaces the fixed
  150 m): Novice 250 m, Regular 150 m, Ace 100 m.
- `attackMargin`: a multiple of the energy-height advantage he wants before a diving pass (`DIVE_MARGIN` 200 m,
  `ZOOM_MARGIN` 450 m): Novice 1.5, Regular 1.0, Ace 0.75.

**The duels** (new src/dev/duels.js; `npm run duels`, scripts/duels.mjs): seeded one-against-one AI fights on the full
flight model, 2.5 km apart head-on, the better pilot on each side for half the seeds. The tactics tests now use the same
duel code.

**Breaking off a pass** (src/ai/basic.js `headOnBreak`): the first duels ended in head-on mid-air collisions. An enemy
coming head-on is now broken off at the skill's press range plus 0.7 s of closing; one being overhauled from behind,
inside half that range. He breaks up if he is the higher, down if the lower (a level pass decided by label, so two
pilots breaking at once part), and a little to his right, for 2 s, without firing. Game-design estimates. A sign error
made the closing speed zero at first; with it fixed, no collisions remain in the duels.

**The AI pilot out of trouble** (product owner's choice: "add spin recovery now"). With the collisions gone, AI pilots
flew into the ground instead: 21 crashes in 100 duels (Spitfires, Hurricanes and Bf 109s). Traced:
1. **19 of the 21 were a negative stall, not a spin.** The hands' "ease off at the buffet" rule always asked for 0.5 g
   less than the aircraft was pulling. That unloads a wing stalled pulling, but at a wing stalled *pushing* it pushed
   harder, and the push fed itself: full forward stick, −3 to −4 g, −20° angle of attack, the aircraft tumbling at
   100-200°/s all the way down. **Fix** (src/ai/pilot.js): at the buffet he eases the stick towards the middle, forward
   when stalled pulling, back when stalled pushing.
2. **The other 2 (and 2 more seen after fix 1)** were a steep diving spiral after a target above: the ground rule
   (`keepClear`) left any goal that pointed up alone, so a pilot diving at 45° in a 6 g spiral was never made to pull
   out. **Fix** (src/ai/basic.js): it leaves an upward goal alone only once the aircraft itself is climbing.
3. **Spin recovery** (src/ai/pilot.js `recoverSpin`): once he has felt a spin for his reaction time (a wing more than
   half stalled and the nose yawing faster than 34°/s), he leaves his goal: throttle closed, ailerons central, full
   rudder against the rotation, the stick eased forward (back from a spin pushing). When the rotation stops he centres
   the rudder and holds the stick until the wing flies again; then his goal, and the ground rule, pull him out. This is
   the usual recovery the spin tests already fly (FLIGHT_VALIDATION.md, D30). The Pilot's Notes wording has not been
   checked against the scans (S33), so no source is claimed for it beyond those tests.
   - Holding the stick until the wing unstalls was needed: stopping at the end of the rotation, at 67° angle of attack,
     handed the controls back too early and the spin restarted.
   - Felt spin time builds while it spins and runs down while it doesn't, so a stall that flickers still adds up.

**Results:** no crashes in the same 100 duels (from 21). From a 6 s spin, all four fighters recover in under 0.55 turns
after the AI takes over, losing 220-650 m, and then climb away.
- **Flagged, honestly:** without `recoverSpin` the ordinary hands also got out of these spins, because easing off the
  buffet and centring the ball already work against the rotation. The recovery mostly makes an Ace quicker (a
  Spitfire's left spin: 0.15 turns, against 0.5) and is a safety net. Fixes 1 and 2 are what stopped the crashes.
- **Noticed, not changed:** before he recognises a spin, a pilot's speed-hold opens the throttle, since he is far below
  the speed he wants. That is the ordinary hands' behaviour.

**Duel table after these fixes** (`npm run duels`, 20 seeds; the better pilot's wins / losses / draws):

| Pairing | Spitfire | Bf 109 E |
|---|---|---|
| Ace v Novice | 13 / 0 / 7 | 0 / 4 / 16 |
| Ace v Regular | 6 / 4 / 10 | 2 / 9 / 9 |
| Regular v Novice | 8 / 0 / 12 | 0 / 5 / 15 |

Mixed types at Regular (10 seeds, RAF / Luftwaffe / draws): Spitfire v Bf 109 10/0/0, Hurricane v Bf 109 10/0/0,
Hurricane v Bf 110 4/6/0, Spitfire v Bf 110 4/6/0.

**Open: Bf 109 against Bf 109 no longer separates the skills.** Nobody hits anybody in 3 minutes. The better 109 pilot's
"losses" are him going home out-matched after 40 s with the other behind him, not being shot down. Before fix 1 the
109 Ace won 14 of 20 against a Novice, though under the old rule the Novice spent 9-11 s of each fight in negative
stalls. He was hit later, flying level, after the tumbles had cost him height and speed. Two 109s flying dive-and-zoom
at each other is the tactics question this checkpoint now has to answer, before the plan's proof of the skill levels
holds.

**Tests:** new tests/ai/recovery.test.js:
- a Regular recovers from a 6 s spin within a turn, with rudder against the rotation, the stick forward and the
  throttle closed, then climbs (Hurricane, Spitfire both ways, Bf 109, Bf 110);
- a hard turn with the ball in the middle is not taken for a spin;
- a Novice stalled pushing unstalls within 2 s (failed under the old buffet rule);
- the ground rule pulls a diving pilot out even when his goal points up (failed under the old rule), and leaves the
  goal alone once he climbs or is high enough.

## D217. Phase 6 checkpoint 5, part 2: skills proved in real match-ups, Bf 109 tactics, +12 lb in combat (6-7 Nov 2026)

**Why:** after D216, Bf 109 against Bf 109 never scored, and at Regular the RAF fighters beat the 109 in 20 of 20
fights, mostly by the 109 going home "out-matched", unhit. **The product owner decided (6 Nov):**
1. prove the skills in the fights the game has (RAF against Luftwaffe), not same-type duels;
2. each side starts 1,000 m higher in turn;
3. fix the 109's tactics;
4. AI RAF pilots use +12 lb in combat;
5. (later) fix three more faults found on the way, and judge the S22 escape by real performance.

**The duels** (src/dev/duels.js, scripts/duels.mjs):
- each skill of one type fights a Regular of the other side, 20 seeds, the higher side alternating (`EDGE` 1,000 m);
- 109 against Spitfire and Hurricane, both ways, and the Bf 110 for interest.

**+12 lb in combat** (src/ai/fighter.js `decide`, src/ai/pilot.js):
- an AI fighter pulls the boost cut-out while engaging, attacking or evading, not on patrol or going home;
- engines without an emergency rating (DB 601, Jumo) ignore it;
- in 12 Ace duels (32 min at +12 lb) the hottest coolant was 116 °C, under the Merlin's 120 °C (Pilot's Notes); no
  engine seized.

**Bf 109 tactics** (src/ai/fighter.js; all new values game-design estimates):
- **Smooth zoom** (`zoomClimb`): the climb angle runs 0-24° with speed, 12° at 290 km/h (S22). It had jumped between
  12° and level, the hands lurching from -1.5 to +3 g and gaining 9-12 m/s of energy height against a best of 15-17.
- **Escapes by the attacker's real performance** (`escape109`, new src/ai/performance.js `combatPerformance`: best climb
  and top speed at full combat power, from the flight model, coarse and cached per type and 1,000 m band, about 10 ms
  each the first time):
  - climb away (attacker 400 m or more back) only from one that climbs at least 1 m/s worse;
  - push over only from an engine that cuts out under negative g (the Merlin), or a split-S 40% of the time with
    1,500 m of room;
  - from one that can follow both (another 109, a Bf 110): a split-S with room, else a break;
  - low down: extend only from one that is slower here, else a break.
- **A dive that can't win:** with no energy-height advantage, closing under 5 m/s inside 2,500 m and outside his fire
  range, he goes back to the zoom.
- **Slow targets:** one slower than 72 m/s (hanging nose-high) isn't treated as head-on, so he dives on it.
- **Minimum zoom:** 3 s before the next dive (except to close on a target beyond 3,000 m).
- **The phase bug, found on the way:** `set()` cleared the tactic's phase whenever the state changed, so the move from
  a dive (attack) to its zoom (engage) was forgotten at once and re-decided from scratch: he dived again at 200 m of
  advantage instead of building 450 m, and the dive and zoom flipped every 2 s. The phase is now cleared only when the
  tactic changes. (The bomber run had worked by the same accident; it now keeps its phases.)

**Threats and staying power** (src/ai/tactics.js `threatens`, src/ai/fighter.js `choose`):
- an enemy behind and nose-on is a threat only if he can reach you: his energy height at least your height, and,
  beyond `GUN_REACH` (400 m, the Ace's fire range), closing. A slow Spitfire 500 m below had sent a 109 Ace fleeing.
- the out-matched count fills only while a threat is within 400 m. It had filled whenever a threat was noticed, so the
  Ace, who notices everything, went home first.

**Flagged against a source (the product owner's choice (a), 6 Nov):** with real performance, the model's +12 lb
Spitfire and Hurricane out-climb the 109 at 2,000 m (21.3 and 19.4 m/s against 17.0). S22 says the 109 out-climbs
them; the +12 lb climb is not checked by any source (AIRCRAFT_DATA.md open research gap), and the model isn't changed
for it. So the 109 no longer climbs away from them; it still climbs away from the Bf 110. The S22 test ("keeps above a
Hurricane, never a turning fight") passes again since the phase fix, so it is kept.

**Results** (`npm run duels`, 20 seeds; the varied pilot's wins / losses / draws):

| Varied pilot (against a Regular) | Novice | Regular | Ace |
|---|---|---|---|
| Bf 109 v Spitfire | 0 / 7 / 13 | 2 / 5 / 13 | 1 / 5 / 14 |
| Bf 109 v Hurricane | 5 / 4 / 11 | 2 / 2 / 16 | 2 / 0 / 18 |
| Spitfire v Bf 109 | 0 / 0 / 20 | 5 / 2 / 13 | 7 / 1 / 12 |
| Hurricane v Bf 109 | 0 / 2 / 18 | 2 / 2 / 16 | 3 / 3 / 14 |

Hits given / taken over the same fights:

| Varied pilot (against a Regular) | Novice | Regular | Ace |
|---|---|---|---|
| Bf 109 v Spitfire | 0 / 81 | 0 / 13 | 0 / 29 |
| Bf 109 v Hurricane | 0 / 52 | 4 / 30 | 2 / 24 |
| Spitfire v Bf 109 | 9 / 0 | 13 / 0 | 44 / 0 |
| Hurricane v Bf 109 | 0 / 2 | 30 / 4 | 63 / 4 |

- The fights are now even in wins (before: the 109 lost 9 in 10), but most end undecided after 3 minutes, so wins are
  too few to rank three skills. Hits rank the RAF skills clearly in both types.
- **Open:** the 109 lands almost no hits at any skill. In 10 Ace fights against a Hurricane it spent 183 s within
  400 m, 172 s of them with the Hurricane on its tail; it is on the defensive nearly throughout, because at low level
  the model's +12 lb RAF fighters out-climb and out-turn it (and the Spitfire is faster). Skill figures can't change
  that. Put to the product owner.

**Tests:**
- new tests/ai/escape.test.js: threats that can and can't reach; the 109's escape against each type; the smooth zoom;
  the dive that gives up; the slow head-on target; the minimum zoom; out-matched only within 400 m; +12 lb in a fight
  and not on patrol;
- new tests/ai/skill.test.js: an RAF Ace does more damage to a Regular 109 than an RAF Novice (Spitfire and Hurricane,
  six seeds, net hits). It replaces the same-type Spitfire test.

## D218. Phase 6 checkpoint 5, part 3: the +12 lb sources, diving limits, and duels at 20,000 ft (7-8 Nov 2026)

**Why:** D217 left the Bf 109 landing almost no hits at any skill level. The product owner chose (7 Nov) to do both:
(a) check the +12 lb RAF performance against sources, and (b) fight the duels higher.

**(a) The +12 lb sources:**
- **Combat use:** the archive site's Hurricane I page collects some thirty 1940 combat reports and record books
  (May-October) in which pilots "pulled the plug" for +12 lb, which supports D217's decision 4.
- **Speed:** S3's pencilled +12 lb line starts at 316 mph at sea level (already validated, model 312.0, −1.3%). Its
  figure at the full-throttle height can't be read on the scan, so no point is added. The archive page quotes "RAE
  figures" of 359 mph at 11,500 ft without naming the document; the model gives 359.4 mph, noted but not used.
- **Climb:** still no source at +12 lb. The model's (about 4,000-4,250 ft/min low down) follows from the validated
  power and the validated +6¼ lb climb (S4). **The flight model is not changed.**
- **New source S43, A.F.C. 99** (a captured Me 109 against a "Rotol" Spitfire): at +6¼ lb and 2,650 rpm the
  Spitfire "was then able to overtake and outclimb the Me.109". It stayed on the 109's tail "despite all efforts of
  the pilot of the Me.109 to shake him off", and was "considerably the faster… without having to make use of the
  emergency + 12 lb. boost". This supports the model: the constant-speed Spitfire out-climbs the 109 E. S22's
  contrary verdict stays flagged (D217); it likely compared Spitfires with other airscrews.

**(b) Fighting higher:**
- **The duels' height:** `npm run duels` now fights at 6,000 m (about 20,000 ft, `HIGH`), within the Battle's
  fighting heights (S38 para. 126: German escorts stepped up to 30,000 ft), then low (2,000 m) for comparison.
  `duel()` takes an `altitude`; its default is unchanged.
- **The fault this exposed:** at 6,000 m the 109 Ace flew into the ground in every fight, at up to 905 km/h against
  his 750 km/h diving limit (S15). His escapes and dives began high at full power with nothing limiting the speed.
  Three causes:
  - the ground rule allowed only 300 m plus 6 s of descent;
  - a push-over goal (at most 1 g) stopped him pulling out;
  - inverted at 800 km/h the 109's heavy ailerons (S32) took about 4 s to roll him upright.
- **Diving limits for every AI pilot** (src/ai/basic.js `keepInLimits`, `pullOutHeight`, inside `keepClear`):
  - above 90% of the type's sourced `limits.diveEas`, less 25% times the sine of the dive angle (so a vertical dive
    starts at 65%), a goal steeper than 10° down is raised to 10°, the push-over ends (he may pull 80% of the g his
    skill pulls), and the throttle comes back to 0.3 without +12 lb;
  - the ground floor adds the pull-out's height loss, `v² / (g (n − 1)) × (1 − cos γ)` at that g, plus 2 s of
    descent while he is more than 90° banked (to roll upright);
  - all of these are game-design values. The diving limits themselves are sourced (S15, S6, S24; the Hurricane's an
    estimate, D61).
- **Results:** in 40 high fights of a 109 Ace against Regular RAF fighters, crashes of the 109 fell from 10 to none;
  one Hurricane still crashed. The Ace's peak fell from 905 to 807 km/h, with 9 s over the limit in all.
- **The S22 test's height check is dropped** (the product owner's choice (a), D217): the 109 kept above the Hurricane
  57% of the time against 60%. Its "never a turning fight" check is kept.

**Duel table** (`npm run duels`, 20 seeds; the varied pilot's hits given / taken; net = given − taken):

| Varied pilot (against a Regular) | Novice | Regular | Ace | Net rises? |
|---|---|---|---|---|
| 6,000 m: Bf 109 v Spitfire | 0 / 42 | 0 / 30 | 0 / 2 | yes |
| 6,000 m: Bf 109 v Hurricane | 0 / 3 | 0 / 0 | 0 / 0 | no |
| 6,000 m: Spitfire v Bf 109 | 0 / 1 | 30 / 0 | 41 / 0 | yes |
| 6,000 m: Hurricane v Bf 109 | 15 / 0 | 0 / 0 | 12 / 0 | no |
| 2,000 m: Bf 109 v Spitfire | 0 / 90 | 0 / 36 | 0 / 6 | yes |
| 2,000 m: Bf 109 v Hurricane | 0 / 28 | 4 / 20 | 2 / 12 | yes |
| 2,000 m: Spitfire v Bf 109 | 4 / 0 | 36 / 0 | 52 / 0 | yes |
| 2,000 m: Hurricane v Bf 109 | 8 / 2 | 20 / 4 | 57 / 4 | yes |

- Low down all four groups now rise; at 6,000 m two do. The Hurricane-against-109 fights there are nearly hitless.
- **tests/ai/skill.test.js:** the Spitfire test moves to 6,000 m (Ace net +17, Novice 0 over its six seeds). The
  Hurricane test stays low, since at 6,000 m its skills don't separate.

**Open: the 109 still lands almost no hits** (at most 4 in 20 fights at any height). Measured over 40 Ace fights:
- **Passes:** 120 at 6,000 m and 185 low, about two thirds ending 400-800 m out, before gun range.
- **Why they end:** of 258 passes, 145 ended because the RAF fighter broke more than 45° off the 109's path inside
  800 m, so the 109 broke off rather than turn (S22's doctrine); 39 as head-on; 26 to evade a threat; 48 otherwise.
- **Inside fire range** (1-2 s per pass): his nose 5-15° off at 144 m/s closing, never within the Ace's 2° firing
  cone. He never takes the deflection shot as the target breaks.
- **Not changed** (the plan's step 4: report first). Put to the product owner.

**Tests:**
- tests/ai/escape.test.js: near the diving limit a steep goal is raised to 10° down with the push ended and the
  throttle back; the pull-out height grows with speed and dive angle; a 109 told to keep diving at 60° from 4,000 m
  pulls out under 750 km/h without hitting the ground;
- tests/ai/recovery.test.js: the ground-rule cases given an attitude;
- `npm run validate` is unchanged.

## D219. The Bf 109's diving pass: a full pull and a parting burst tried, and taken out (8 Nov 2026)

**Why:** after D218 the 109 lands at most 4 hits in 20 duels at any skill. The product owner approved the proposed
fix (8 Nov):
- in the last 800 m of a pass, the 109 pulls what its skill pulls, not 4 g;
- before breaking off from a target that breaks away, it fires a short snapshot burst within three times its usual
  firing cone, for 1 s.

**Result: no gain, so both were taken out.**
- **Duels:** over 20 duels per skill against Regular Spitfires and Hurricanes, the 109 still landed 0-4 hits and
  fired for at most 0.2 s.
- **Why the burst can't help:** it triggered 21 times, always within 400 m, but with the RAF fighter 102-166° off the
  109's nose, already behind it. At about 144 m/s of closing speed the RAF fighter breaks and the 109 overshoots, so
  there is no crossing shot to take. Holding the pass for the burst kept the 109 flying straight for a second with
  the enemy behind it.
- **Not left in:** logic that never helps and can hurt. The diff is kept outside the repository.

**What the measurements point to (not done; for the product owner):** the 109 dives in far too fast to shoot. From
400 m to its break-off range it has about 2 s, against a turning target, with a 2° firing cone. A pass that arrives
behind the target with a smaller overtake would give it time on target. That means curving onto the target's tail
and easing the throttle in the last kilometre to keep the closing speed moderate. Any such figure would be a
game-design estimate, as no source in the project gives one.

## D220. The Bf 109 can't yet attack a single RAF fighter: prototypes and findings (8 Nov 2026)

**Decision (product owner, 8 Nov):** record the limitation and move on to the rest of checkpoint 5. A proper fix is
a dedicated later plan. **No code was changed:** every prototype below ran in memory, replacing methods at run time.

**What was found:**
- **The guns work.** Dead astern at 300 m, 20 m/s faster than a Hurricane flying straight, a 109 Ace fires at once and
  lands 8 hits in about a second.
- **Head-on duels can't give it a shot.** The RAF fighter's turning-fight AI always points its nose at the 109, so
  every pass is head-on and is cancelled by the "no head-on pass" rule. Over 20 Ace fights: 224 passes of about 1 s,
  1,645 s zooming and about 1,700 s evading. A slower pass gave no hits: aiming 300 m behind and 150 m below the
  target, with the overtake held to 30 m/s inside 1 km.
- **Bounces from 4.5 km behind and 1 km above** (the 109's real way of fighting) gave no shots either:
  - spotting is instant within a set range, and only behind-and-below is hidden, so the RAF Regular saw the 109 at
    4 km and turned in;
  - the 109's dive was shallow (about 12°) and closed at only about 25 m/s.
- **A rear blind cone** (within 30° of a pilot's tail, sight limited to 35% of his sighting range) delayed spotting
  to about 1.3 km. Still no shots.
- **Spotting that takes time** (in view, a chance each second of the skill's `notice` × (1 − range / sighting),
  halved in the rear cone):
  - an unaware Hurricane didn't spot a bouncing 109 for 49 s;
  - yet the 109 sat astern within 600 m for only 1 s and overshot, passing 89 m from it. It steered for a point 400 m
    behind and 50 m below, attacking from within 20° of the tail inside 600 m, overtake held to 40 m/s;
  - this spotting also changed the RAF skill results (Spitfire Novice net +6 against the Ace's 0 over six low
    seeds), so it would need tuning.

**The missing piece:** a stern-approach guidance that curves onto the target's tail, matches its speed and holds a
steady overtake into gun range. Proposed as a dedicated later plan:
- that guidance, for the 109's bounce;
- time-to-spot and a rear blind cone, for both sides;
- bounce duels to prove the Luftwaffe skills.

The prototype values above are kept as a starting point; all are game-design estimates, none sourced.

**Where it shows in the game:** an AI 109 does poorly against an alert RAF fighter in a one-against-one. It also meets
the player, who doesn't always turn to face it, and RAF fighters busy with bombers; those cases weren't measured.
The RAF skill proof (tests/ai/skill.test.js) is unaffected.

## D221. Twelve aircraft run at the screen's full rate; Shift+7 loads them (8 Nov 2026)

**The measurement** (the approved checkpoint 5 plan, section 3), in Chrome on this Mac on the dev server:
- the player's Spitfire in the air, with 11 AI aircraft: an He 111 Kette, its two Bf 109 escorts and six fighters;
- the F3 overlay's frame line sampled twice a second for 20 s in each view, the fight going on throughout;
- the frame rate is held at the screen's refresh rate (75 Hz here), so the work each frame takes is the headroom
  measure, against the 16.7 ms a 60 fps frame allows.

| View | Frame rate | Longest frame | Work per frame (mean / peak) | Draw calls | Triangles |
|---|---|---|---|---|---|
| Cockpit | 75 fps throughout | 14 ms | 4.0 / 4.3 ms | 592-836 | 322-344k |
| Outside | 75 fps throughout | 14 ms | 4.0 / 5.8 ms | up to 612 | up to 322k |

- No console errors; all 11 AI aircraft still flying at the end.
- **Result:** well within 60 fps (about four times the headroom), so the draw-call merge the plan held in reserve
  isn't needed. Screenshots were shown to the product owner with this report.

**A change from the plan's method, flagged:** the plan said to load scenario 7 and then 6, but each scenario key
clears the last, so no key gave twelve aircraft. New **Shift+7** (src/core/scenarios.js `crowdScenario`) loads the
bomber scenario plus six fighters of the other side behind the player, 500 m up. That is the same set as the
twelve-aircraft timing test, and gives twelve with the player from either side. It's listed in the in-game help, and
the product owner can use it for the acceptance test. Test: tests/core/scenarios.test.js.

**Checkpoint 5's gunner proof** (plan section 2) already exists from checkpoint 4 (tests/ai/gunner.test.js: an Ace
gunner hits a fighter crossing 300 m behind more than twice as often as a Novice), so no new test was added.

## D222. The proposed Phase 6 acceptance test (8 Nov 2026, for the product owner to agree and fly)

From the approved checkpoint 5 plan, updated for D216-D221:
1. **Tests:** `npm test` passes and `npm run validate` is unchanged.
2. **Key 6 fighter scenarios, from each side:** AI fighters patrol, spot, engage, attack and evade, and go home when
   out of ammunition, hurt or out-matched in gun range.
   - RAF fighters turn and break.
   - The Bf 109 and 110 dive and zoom.
   - Known limitation (D220): an AI Bf 109 rarely scores against a single RAF fighter.
3. **Key 7 raid:** He 111s in formation on a route with escorts; their gunners fire with tracer and change drums; the
   escorts defend them.
4. **Key 8 skill:** Novices are clearly easier (they spot you later, shoot wider, break off early and bleed their
   speed), Aces clearly harder. `npm run duels` shows the RAF skills rising Novice < Regular < Ace by net hits (low
   down all four groups rise, D218).
5. **Bf 110:** your rear gunner fires at attackers within his arc.
6. **Endings:** bail-outs, parachutes, collisions and wrecks behave as before. AI pilots no longer fly into the ground
   from stalls, spirals or fast dives (D216, D218), and recover from spins.
7. **Frame rate:** Shift+7 (twelve aircraft) holds 60 fps on your machine (F3), with no console errors (D221: 75 fps,
   4 ms of work per frame here).

Phase 7 doesn't start until the product owner signs Phase 6 off.

## D223. Phase 6 signed off (8 Nov 2026, product owner)

The product owner agreed the acceptance test as written (D222) and signed Phase 6 (AI pilots and gunners) off.
- **Carried forward as a known limitation:** the AI Bf 109 can't yet attack a single RAF fighter (D220); a dedicated
  plan later.
- **Pushed:** the product owner asked for all outstanding work (D216-D223) to be pushed to GitHub. A push to `main`
  runs the tests, builds and deploys.
- **Next:** Phase 7, after a plan.

## D224. The Phase 7 plan: missions and the game loop (8 Nov 2026, product owner's approval)

**Decisions (product owner, 8 Nov 2026):**
- **RAF radar:** blips show the bearing only, on the compass ring (settles D17).
- **Cockpits:** the 2D panels stay as the forward view; simple 3D cockpit sides, sills and rear are added for looking
  round (updates D16).

**Checkpoints:**
1. menus and the game loop (main menu, mission setup, pause, results, kill credit, time of day; dogfights);
2. missions (interception, escort, friendly wingmen);
3. ranks (single-player kills; rank names from an allowed source);
4. the RAF radar display;
5. sound (Web Audio, generated in code);
6. cockpit sides, HUD and settings;
7. the Bf 110 rear-gun swap;
8. the Phase 7 acceptance test.

Each later checkpoint gets its own detailed plan when it starts. Checkpoint 1's detail is in the approved plan: a
game-state machine, DOM menu screens, src/core/mission.js, kill credit from round owners (30 s window, a game-design
rule) and `setSkyTime` for the mission's time of day.

## D225. Phase 7 checkpoint 1: menus and the game loop (8 Nov 2026)

**What was built** (the approved plan, D224):
- **The game's states** (new src/core/gameState.js): main menu, mission setup, settings, flying (a mission or the
  test flight), paused and results.
  - The 3D view draws in every state; the simulation advances only while flying.
  - Every flight starts afresh in the same simulation, so the game goes from the results back to the menu, and on to
    another flight, without reloading.
  - src/main.js opens on the main menu with the key list shut. Esc pauses and resumes.
  - The test keys (aircraft 1-5, R, N, 9 and the AI scenarios 6-0) work only in the test flight.
  - Keys pressed on a menu are dropped, so they don't act once a flight starts.
- **Screens** (new src/ui/menus.js and src/ui/missionSetup.js, page overlays):
  - **Main menu:** Fly a mission; Test flight; Settings (a placeholder until checkpoint 6).
  - **Mission setup:** side, aircraft (each side's flyable types), mission (dogfight), enemy type, number (1-6, inside
    the 12-aircraft limit), enemy skill, start height (1,000-8,000 m, shown in feet for the RAF and metres for the
    Luftwaffe), and time (15 August 1940, half-hour steps, daylight only: the sun at least 5° up, src/world/sun.js).
    A side change keeps the choices consistent.
  - **Pause:** Resume, Restart mission, End mission, Main menu. The test flight has no mission actions.
  - **Results:** the outcome; kills, shared, damaged; enemy destroyed and gone home; hits given and taken; rounds
    fired; flight time; Fly again and Main menu.
- **Missions** (new src/core/mission.js), the dogfight:
  - the player in the air at the chosen height over his home field, facing the enemy's side of the Channel;
  - the enemy 4 km ahead and 300 m higher, coming the other way, in its side's formations (Luftwaffe Schwarms of
    four, then a Rotte or a single; RAF vics of three);
  - it ends when every enemy is lost (destroyed, abandoned or gone home), when the player is lost, or when he has
    landed on a friendly field and stopped. The results follow 5 s later.
- **Kill credit** (src/core/combat.js `noteShooter`; the hit now carries its round's `owner`, src/weapons/projectiles.js):
  - each aircraft keeps the hits from each shooter, and the last shooter and time;
  - an enemy destroyed within 30 s of the player's last hit is his kill, one he hit that was finished otherwise is
    shared, and one that goes home with his hits is damaged (game-design rule);
  - his Bf 110 gunner's rounds count as his.
- **Time of day** (src/render/scene.js `setSkyTime`): the sun's disc, glow and light move to the mission's time; the
  test flight keeps 14:00 UTC.
- **Start override** (src/core/simulation.js `startOverride`): a mission sets the air start's height and heading.
  src/core/scenarios.js exports `spawnGroup` (with a `count` of a formation's first places), `dropAll` and
  `otherSide`.
- **Times are shown in UTC.** Local times (British and German summer time in 1940) would need a source and are left
  for later.

**Checked in Chrome** (dev server, no reloads, no console errors, 75 fps throughout):
- menu → setup → a dogfight (3 Bf 109s) → pause, with the simulation frozen (height unchanged over 2 s);
- End mission → results → Fly again (a fresh mission) → Main menu → Test flight (on the ground, no AI);
- at 06:00 UTC the sun is low in the east;
- a mission ending by itself: a hands-off Bf 109 against six Ace Spitfires came down in a belly landing, and the
  results appeared 5 s later.
- **Seen again, as recorded in D220:** six Ace Bf 109s never hit a hands-off Spitfire in 2½ minutes.

**Tests:**
- tests/core/mission.test.js: building a dogfight, the formations, each ending, kill credit (kill, shared, damaged,
  none, and the 30 s window), the player's rounds credited to him, and three missions in a row;
- tests/core/gameState.test.js: the state changes, advancing only while flying, Fly again, a mission ending by
  itself, the test flight, settings;
- tests/ui/missionSetup.test.js: daylight times, units per side, a consistent setup.

## D226. The joystick is read on the menus too (8 Nov 2026, the product owner's report)

**The report:** "The joystick is not working in the browser!" after checkpoint 1.

**The cause:** Chrome shows a joystick to a page only after a button press or stick movement while the page is asking
for gamepads. Before checkpoint 1 the game asked from the moment it loaded. Since D225 it asked only while flying, so a
press on the menus went unseen, and in flight Chrome could still be waiting for a first press. macOS saw the
"Logitech Extreme 3D Pro" throughout.

**The fix:**
- src/input/joystick.js listens for `gamepadconnected` from the start;
- src/main.js reads the joystick on every screen, not only in flight;
- the main menu shows the joystick's state: "Joystick: none seen yet. Press a joystick button to connect it.", or
  "Joystick: Logitech Extreme 3D Pro connected." (src/ui/menus.js `setStatus`, `Joystick.status`).

**What actually fixed it:** restarting Chrome (product owner, 8 Nov 2026). Chrome had stopped passing the joystick to
any page; a bare test page with no game code saw nothing either, while macOS still listed the stick. The changes above
stay: the joystick is now read on every screen, and the main menu's status line shows whether it's connected. If the
status line says "none seen yet" after a stick button is pressed, quitting and reopening Chrome is the first thing to
try.

## D227. Phase 7 checkpoint 2: the bomber missions and friendly wingmen (9 Nov 2026)

**What was built** (the approved checkpoint plan):
- **Raids** (new src/core/raid.js):
  - an He 111 formation flies from the Luftwaffe's home field (Saint-Inglevert) to a Kent target (Hawkinge, Lympne or
    Manston, 46-58 km) and back over its field, with the Phase 6 bomber pilots;
  - 3 bombers are a Kette; 6 are two Ketten as one formation (`FORMATIONS.ketten`), the second 400 m behind and 100 m
    below (`common.formations.ketten`, estimates, keyed rows in AIRCRAFT_DATA);
  - the raid's own Bf 109 escort is placed a mile behind and above the bombers (S38);
  - **no bombs are modelled:** a raid "reaches its target" when its leader passes the target waypoint.
- **Interception** (RAF):
  - the player starts at the raid's height 8 km to the English side of the middle of its route, heading for a point
    3 km short of that middle (game design);
  - the raid's bombers and escort are the enemy, at the setup's skill;
  - it ends when every bomber is down or straggling home, or the raid has passed its target ("5 of 6 bombers reached
    Hawkinge", or "The raid was turned back before Hawkinge").
- **Escort** (Luftwaffe):
  - the player starts in the escort's place, a mile behind and 500 m above the bombers (S38);
  - the bombers are friendly, at Regular;
  - the RAF attackers (the setup's type and number, at its skill) appear 6 km ahead of the raid and 300 m above once
    it is a third of the way to its target (game design);
  - it ends when the raid is back over its field ("3 of 3 bombers escorted home from Lympne") or every bomber is down
    or straggling.
- **Friendly wingmen,** in every mission (new src/core/wingmen.js; src/ai/fighter.js `followPlayer`):
  - RAF 0-2 in a vic with the player at its head; Luftwaffe 1 (a Rotte) or 3 (a Schwarm);
  - all friendly aircraft (wingmen, escorted bombers) fly at Regular; the setup's skill is the enemy's (game design);
  - a wingman keeps his place on the player (within 19 m in a minute's level flight), goes for anyone attacking him,
    fights on his own once an enemy is within 2.5 km of him, and rejoins when none is near;
  - with no AI leader there is no "covering" phase: the player's moves can't be followed reliably (game design);
  - a wingman's kills are his own, listed apart in the results.
- **Setup:**
  - the mission choice offers the interception to the RAF and the escort to the Luftwaffe;
  - the raids add target, bombers (3 or 6), and the raid's escort (0/2/4, interception) or the attackers (escort);
  - wingmen in every mission;
  - only numbers that keep everything within the twelve-aircraft limit are offered. A setup that doesn't fit gives way
    in turn: attackers, the raid's escort, wingmen, then bombers.
- **Results** add the bombers shot down, those that reached the target and those escorted home, the raid's escort
  shot down, and the wingmen's kills and losses.
- **Structure:** each mission's start moved to new src/core/missionStarts.js; `spawnGroup` gained `from` (a
  formation's later places) and `skill`.

**Flagged, the escort mission's length:** the raid flies out, past its target and back to its field. Flown headless
with the player held level, a full escort took about 23 minutes (1 of 3 bombers home). An interception ends as the
raid passes its target, about 9½ minutes if it isn't stopped. To shorten them, the raid could start over the coast or
mid-Channel, or the escort could end once the raid is back over the French coast. That is for the product owner.

**Checked in Chrome** (no reloads, 75 fps, longest frame 14 ms with ten aircraft):
- an interception of 6 bombers with 2 Bf 109s and a vic of wingmen, the wingman seen in place;
- an escort of 6 bombers with a Schwarm, the bombers seen ahead over the French coast;
- the setup offering only the numbers that fit;
- the results with the raid's and wingmen's lines.
- Headless: an interception flown until the raid passed Hawkinge, and an escort until the raid was home.
- The one console error came from a test script choosing an option the screen doesn't offer; the drop-downs now ignore
  such a change.

**Tests:**
- new tests/core/raid.test.js: the route, the two-Ketten formation, the escort keeping station;
- new tests/ai/wingmen.test.js: formations and skill, keeping place, going for an attacker and rejoining;
- tests/core/mission.test.js: interception and escort building, ending and results, the attackers' arrival, a
  wingman's kill;
- tests/ui/missionSetup.test.js: the missions by side, the twelve-aircraft limit, wingmen and targets.

## D228. The raid missions halved in length (9 Nov 2026)

**Decision:** the product owner chose to halve the raid missions' length ("Yes, halve the mission time."), after D227
flagged a full escort at about 23 minutes and an unstopped interception at about 9½.

**How:** one constant, `RAID_START` = 0.5 in src/core/raid.js (game design, not a historical figure).
- **Start:** a raid starts halfway from its field, Saint-Inglevert, to its target.
  - That point is over the Strait of Dover for all three targets: about 51.0°N 1.45°E for Hawkinge, 50.97°N 1.39°E
    for Lympne and 51.11°N 1.54°E for Manston.
- **Return:** its route turns at the target and comes back to that point, not to the field. Past that point the
  bombers hold their heading towards France.
- **The escort mission** ends once the raid is back over mid-Channel (or every bomber is down or straggling). The
  outcome line says "N of M bombers escorted back to mid-Channel from X".
- **What scales with the shorter course,** with no change in logic:
  - the interceptor's start, 8 km to the side of the middle of the course to the target;
  - the escort's attackers, who appear a third of the way along that course.
- **Rejected:** starting the raid over the French coast, or ending the escort at the French coast. Either saves only a
  few kilometres of a 46-58 km route, not half.

**Times (flown headless, the player held level):**

| Mission | Before (D227) | After |
|---|---|---|
| Interception, nobody stopping the raid (Hawkinge) | 572 s | 282 s |
| Interception (Lympne) | not timed | 324 s |
| Interception (Manston) | not timed | 353 s |
| Escort (Lympne) | about 1375 s | 712 s |

In the escort, the attackers now appear about 110 s in.

**Tests:**
- tests/core/raid.test.js: the start is halfway along the route and over the Strait, and the route ends there;
- tests/core/mission.test.js: a new check that an unstopped interception ends in 200-360 s, and the escort's outcome
  text updated.

## D229. Phase 7 checkpoint 3: ranks (9 Nov 2026)

**The product owner's choices (9 Nov 2026):**
- **Ranks:** officers only.
- **Being lost:** the career goes on. A mission's kills count however it ends.

**Ranks** (new src/core/ranks.js): five for each side, set side by side as the game's steps, not as a claim that the
two sides' ranks were equal.

| Step | RAF (S44) | Luftwaffe (S45) | Weighted kills |
|---|---|---|---|
| 1 | Pilot Officer | Leutnant | 0 |
| 2 | Flying Officer | Oberleutnant | 2 |
| 3 | Flight Lieutenant | Hauptmann | 5 |
| 4 | Squadron Leader | Major | 10 |
| 5 | Wing Commander | Oberstleutnant | 20 |

**Sources:**
- **RAF:** S44, the Air Force List of August 1940, uses these gradation headings.
- **Luftwaffe:** S45, the US War Department's TM-E 30-451, says the Air Force bears the Army's insignia of rank
  (par. 32d), and Plate VII names the grades.

**Flagged:**
- S45 is dated September 1943, not 1940. These five grades were unchanged in between, but the handbook itself is
  later than the game's period.
- **The weighted-kill steps (0/2/5/10/20) are game design.** Neither air force promoted its pilots by their scores.
  The product owner confirmed them on 9 Nov 2026, the first promotion at 2 kills.
- **A shared kill counting ½ is also game design.** Damaged enemies count nothing.
- **Where they're recorded:** the names and steps are rows in docs/AIRCRAFT_DATA.md under "Ranks (Phase 7, D229)",
  with S44 and S45 on its source list. The steps and the weight of a shared kill are marked as estimates.

**The career** (new src/core/career.js):
- **What it holds:** one record per side: kills, shared kills and missions.
- **Where it's kept:** in the browser's localStorage (key `bob1940.career`).
  - Missing, blocked or unreadable storage gives fresh careers, and the game carries on without saving.
  - The careers belong to that browser only: another browser or a private window starts afresh.
- **What counts:**
  - a mission is added to its side's career once, as its results show: at its natural end, or by "End mission";
  - a mission left for "Main menu" from the pause menu is abandoned and not counted;
  - the test flight never counts, since its reset and scenario keys would make kills free;
  - being shot down, killed or bailing out costs nothing (the product owner's choice).

**Screens:**
- **Main menu:** a line for each side, for example "Flying Officer: 4 kills, 1 shared, 6 missions (½ kill to Flight
  Lieutenant)".
  - "Reset careers" needs a second click ("Click again to reset both careers"); no browser dialog.
- **Results:** a "Career (side)" line, and "Promoted" with the new rank at the top when the mission earned one.

**Checked in Chrome:**
- a career put in storage shows on the main menu after a reload;
- a dogfight ended from the pause menu adds a mission and shows the career line;
- the reset needs both clicks;
- no console errors.
- The "Promoted" line wasn't seen in the browser, as no kill could be made there without flying a fight. It is covered
  by the tests.

**Tests:**
- new tests/core/ranks.test.js: the names, the steps, half for shared kills, the boundaries;
- new tests/core/career.test.js: one side only, promotion, the save and load round trip, broken storage;
- tests/core/gameState.test.js:
  - recorded once;
  - "End mission" and the natural end count;
  - "Main menu" from the pause menu and the test flight don't;
  - a lost mission's kills count;
  - the career line's wording.

## D230. Phase 7 checkpoint 4: the RAF radar display (9 Nov 2026)

**The product owner's choices (9 Nov 2026):**
- **Heading-up ring:** it turns with the aircraft, so a blip at the top is dead ahead. Its N, E, S and W marks and
  degree numbers keep their true places.
- **Updates every 20 s,** like plots passed on from the ground. In between, each blip keeps its last bearing while the
  ring turns live.

**What was built:**
- **The plots** (new src/core/radarPlot.js; logic only, tested):
  - the enemy is every AI aircraft on the other side from the player's;
  - aircraft within 3,000 m of another in a group join it, so one blip stands for a formation, or a raid with its
    escort;
  - each blip is the compass bearing of its group's middle from the player, and nothing else (D224: no height and no
    numbers);
  - RAF aircraft only.
- **The display** (new src/ui/radar.js): a transparent round screen at the top left (180 px).
  - The ring has a tick every 10°, numbers every 30°, and N, E, S and W.
  - It has a nose mark at the top and an aircraft symbol in the middle.
  - Blips are amber dots on the ring that fade in as each plot is taken.
  - It shows while flying or paused in an RAF aircraft, in missions and the test flight. It is hidden on the menus,
    in Luftwaffe aircraft and after bailing out.
  - **F4** hides and shows it; it is on by default. The key help lists it.

**Game design, flagged:**
- the 20 s interval (the product owner's choice);
- the 3,000 m grouping;
- radar cover, the Observer Corps' tracking inland and plotting errors are not modelled: every enemy on the map is
  plotted, at its true bearing.

**Checked in Chrome** (75 fps, longest frame 14 ms, no console errors):
- **Interception:** the raid's blip ahead and to the left at the start.
- **Dogfight:** six enemies show as one blip dead ahead. Their two groups start 800 m apart, within 3,000 m of each
  other.
- **Turning:** the ring and blip turned together.
- **Showing and hiding:** F4 hides and shows the radar. It stays on the pause menu, and is hidden on the main menu and
  in a Luftwaffe escort.

**The twelve-aircraft timing test** (tests/core/scenarios.test.js, the product owner's choice): it now times three
spans of 4 s and takes the best, so a pause on GitHub's shared runner doesn't fail it. On 9 Nov a single 10 s span
measured 120 ms there. The 100 ms budget is unchanged.

**Tests:**
- new tests/core/radarPlot.test.js: bearings and the heading-up ring; grouping (a Schwarm, two groups 10 km apart, a
  raid with its escort); sides (wingmen and a Luftwaffe pilot); the 20 s update; a fresh plot on a new flight.

## D231. Phase 7 checkpoint 5: sound (9 Nov 2026)

**The product owner's choice (9 Nov 2026):** other aircraft are heard too, their engines and guns, fading with
distance and dropping in pitch as they pass.

**What was built:** sound with the Web Audio API, all of it generated in code; no recordings (GAME_SPEC §2).
- **What each sound follows** (new src/audio/soundModel.js, pure functions, tested):
  - **Engines:** one voice per engine, pitched at the four-stroke firing frequency, crankshaft rev/s × cylinders / 2.
    A Merlin at 3,000 rpm fires 300 times a second.
    - Loudness and brightness rise with the manifold pressure (boost or ata) and the rpm.
    - A failed or stopped engine is silent, and the Merlin's negative-g cut-out quietens it.
    - A twin's engines are separate voices, so a dead or slower engine is heard.
  - **Wind:** loudness with the square of the indicated airspeed, brighter as it rises, a little more with the
    undercarriage and flaps down.
  - **Guns:** the rounds each gun fired since the last frame, machine guns and cannon apart, fixed guns and air
    gunners' alike. A drum change is not a shot.
  - **Hits on the player:** each new hit is one sound.
  - **Other aircraft:** up to 6, the nearest within 1,500 m.
    - Loudness falls with distance.
    - Stereo pan comes from the bearing off the nose.
    - Doppler pitch at the ISA speed of sound at the height: about ×1.2 at 60 m/s closing.
- **Playing it** (new src/audio/audioEngine.js):
  - **Engines:** a sawtooth at the firing frequency and a square at half of it, through a lowpass, with band-passed
    noise for the exhaust.
  - **Wind:** band-passed noise.
  - **Gun and hit sounds:** short buffers made once at start: a machine gun's 25 ms crack, a cannon's 110 ms thump
    with a 70 Hz tone, a hit's 90 ms clang with a 140 Hz tone.
  - **Other aircraft:** 6 pooled engine voices behind stereo panners.
  - **Mixing:** a master gain and a compressor.
  - **Starting and stopping:** sound starts on the first click or key press (the browser's rule). It is suspended on
    the menus and the pause menu. The engine falls silent after bailing out or crashing.
- **Sound on/off:** a button on the main menu and the pause menu, remembered in the browser (`bob1940.sound`). The
  volume control comes with the settings, checkpoint 6.
- **Data:** `cylinders: 12` added to the Merlin III (S7), DB 601A (S19) and Jumo 211 (S35), with rows in
  AIRCRAFT_DATA.md.

**Found while checking in Chrome:** the game's guns of a group fire together, a volley at a time; eight Brownings put
eight rounds into one frame every three or four frames. The first cap of 4 sounds per frame lost half of them.
- Now up to 8 play per group per frame, each volley's cracks scattered over 50 ms (one Browning's interval at 1,100
  rounds/min), as real guns weren't locked together.
- Measured afterwards: 149 sounds a second for the Spitfire's 147 rounds a second.

**The product owner's first listen (10 Nov 2026):** the player's engine was a bit too loud and is halved (engine
and exhaust voices). The player's machine guns are 50% louder, the cannon 75% louder. Other aircraft keep their
levels, since their engines fade with distance anyway.

**Game design, flagged:** the 1,500 m hearing range, the 6-aircraft cap, the 50 ms scatter, and every loudness and tone
curve. They are tuned by ear, not measured data.

**Checked in Chrome** (no console errors):
- the sound starts on the first click; it is "suspended" on the menu and the pause menu, and "running" in flight;
- 75 fps, longest frame 14 ms, with a dogfight of six enemies and two wingmen while firing;
- the Sound button switches and is remembered over a reload.
- I can't listen in the browser, so how it sounds is for the product owner to judge.

**Tests:**
- new tests/audio/soundModel.test.js: the firing frequency and the cylinders; the engine voices (boost, stopped,
  twins); the wind; the rounds counted (a Spitfire burst, a Bf 109's cannon apart, a gunner, a drum change); hearing
  (range, the nearest 6, loudness, Doppler, pan);
- tests/core/gameState.test.js: the Sound button.

## D232. Phase 7 checkpoint 6a: settings, assists and the HUD in the cockpit (10 Nov 2026)

**The product owner's choices (10 Nov 2026):**
- checkpoint 6 in two parts: 6a here, 6b the 3D cockpit sides;
- the stall and g warnings give a tone and a text line;
- graphics changes take effect on the next flight, except sharpness, which changes at once.

**Settings** (new src/core/settings.js, stored under `bob1940.settings`; unreadable or blocked storage gives the
defaults):
- volume (default 80%);
- graphics Low / Medium / High (default High, today's look);
- the modern HUD in the cockpit (default off);
- four assists, all off by default (D16).
- Sound on/off keeps its own key (D231).

**The settings screen** (new src/ui/settingsScreen.js): reached from the main menu and now the pause menu. Back returns
to whichever it came from. It has:
- the volume slider and Sound switch;
- Graphics;
- "Modern HUD in the cockpit too";
- the four assists, each with a line saying what it does;
- Keys (the key list) and Joystick setup (the J panel, now drawn above the menus).
- Rebinding the keys stays in Phase 8 (GAME_SPEC §5).

**Assists** (new src/core/assists.js, applied in the player's 120 Hz step, src/core/simulation.js). They use only the
pilot's own controls.
- **Auto-rudder:** while airborne, with the pilot's rudder within 5% of the middle, the rudder flies 3 × sideslip
  (radians), at most half travel.
  - The pilot's own rudder overrides it, and the input keeps the pilot's setting.
  - In hands-off rolling turns it halved the worst sideslip or better: Hurricane 5.6° → 2.5°, Spitfire 3.9° → 1.9°,
    Bf 109 3.6° → 2.0°, Bf 110 3.2° → 1.1°.
- **Engine management:**
  - the automatic airscrew pitch (`engineAssist`, D18) on the Bf 109 and Bf 110;
  - the radiator opened when the hottest engine's coolant is within 15 °C of its limit, and shut again 25 °C below
    it.
- **Stall warning:** airborne above 20 m/s EAS, with the angle of attack within 2° of the stall angle for the flap
  setting (`stallAlpha`).
- **g warning:** at 90% of the damage g limit, with negative g at its negative share.
- **Warning tones** (src/audio/audioEngine.js): the stall warning a 900 Hz beep, the g warning a 600 Hz double beep.
  The text lines are "STALL WARNING — stick forward" and "G LIMIT — ease off the stick", in red on the message line.
- **Showing what's on:** the assists switched on are listed on the F2 strip and on the results ("Assists").

**The HUD in the cockpit:** with the setting on, the outside views' HUD column (D97) shows in the cockpit too.

**Warnings after the product owner's flight (10 Nov 2026):**
- **The report:** "my engine overheated with engine management on".
- **What was happening:** the assist had opened the radiator. In a slow, steep full-power climb even a fully open
  radiator can't carry the heat away. Flown headless to about 6,000 m with engine management on:
  - at normal climb speeds (EAS 61-90 m/s, about 140-200 mph or 220-330 km/h) every type stayed 11-15 °C under the
    limit;
  - at about 50 m/s (110 mph, 180 km/h) the Bf 109 went 2 °C over;
  - at about 42 m/s (90 mph, 150 km/h) the Bf 109 went 9 °C over and the Bf 110 8 °C over.
  - The assist leaves power to the pilot (the product owner agreed).
- **The overheating line** no longer says "(O opens the radiator)" when the radiator is already open. It now says
  "(radiator open: climb less steeply or reduce power)".
- **Every warning** (g, stall, overheating, oil, seized) is now shown in bold white on a see-through red ground, as
  the red text alone was hard to see (the product owner).

**Graphics levels** (new src/render/graphics.js):

| Level | Sharpness (pixel ratio, at most the screen's) | Terrain detail ranges | Houses within | Clouds shown |
|---|---|---|---|---|
| High | 2 | × 1 | 9 km | all |
| Medium | 1.5 | × 0.75 | 6 km | 70% |
| Low | 1 | × 0.5 | 4 km | 40% |

**Game design, flagged:** every assist threshold and gain, the warning tones, and the graphics levels' figures.
Neither warning was period equipment; both are off by default.

**Checked in Chrome** (no console errors):
- the settings screen, from both menus;
- the settings remembered in the browser;
- the HUD in the cockpit;
- the results' Assists line;
- Low showing visibly fewer clouds on the next flight.
- **Not checked in the browser:**
  - Both levels ran at 75 fps on this Mac (the screen's refresh), so a speed gain couldn't be measured.
  - This screen's pixel ratio is 1, so sharpness makes no difference here.
  - The warnings couldn't be triggered there: the connected joystick sets the stick each frame, over the test keys.
    The tests cover them.

**Tests:**
- new tests/core/settings.test.js;
- new tests/core/assists.test.js: off by default, auto-rudder on all four flyable aircraft, the pilot's override,
  engine management, both warnings and their thresholds, the stall warning in a hard pull;
- tests/core/gameState.test.js: settings from the pause menu and back, assists at once and on each new flight, the
  results line.

## D233. Phase 7 checkpoint 6b: the 3D cockpit sides, seat and rear (10 Nov 2026)

**What was built** (new src/render/cockpitInterior.js; D224: the 2D panels stay as the forward view): for the
Hurricane, Spitfire, Bf 109 and Bf 110, simple low-polygon 3D parts round the pilot. They are seen when he looks away
from the panel.
- **Side walls** from the panel (0.62 m ahead of the eye) back to the bulkhead, up to the sill: the canopy glazing's
  lower edge in each model.
  - A dark rail runs along the sill, with ribs every 0.26 m.
  - A console runs along each wall, with the throttle lever on the left.
- **Seat back and headrest,** both kept below the eye. The view turns about the eye, and a pilot could lean his head
  but the camera can't, so a headrest at head height hid the whole view astern. It was lowered after the first look in
  Chrome.
- **The floor,** and a **bulkhead** 0.42 m behind the eye, shaped as the fuselage section there.
- **The tail seen astern:** looking back shows a rear deck from the bulkhead to the tail, then the model's own
  tailplane and fin (the Bf 110's twin fins). Until now the whole fuselage, tail included, was hidden in the cockpit
  view (D28).
- **Colours:** the walls are dark grey-green for the RAF and dark grey for the Luftwaffe, in the tones of the 2D
  panels' interiors.
- **Unchanged:** the front view with the 2D panel.

**After the product owner's first look (10 Nov 2026: "the rear and side views are awful", with a transparent cone
astern in every aircraft and the Hurricane's and Spitfire's tailplanes wrong):**
- **The cone** was the canopy glazing seen from inside: a faceted shell that only looks right from outside. The player's
  own glazing is no longer drawn from the cockpit.
- **The tailplanes** were hidden for two reasons:
  - **The bulkhead:** it was a full fuselage section 0.42 m behind the eye, and so close it covered most of the view
    astern. It now stops at the sill.
  - **The eye inside the model:** the model's fuselage runs up into the canopy to about the eye's height (the
    Spitfire's top 0.49 m against the eye's 0.48 m). Drawn from inside, the shell's inner faces hid the tail; drawn
    one-sided, the spine vanished.
- **The fix:** from the cockpit the model's fuselage shell, glazing and fuselage markings are not drawn. A rear deck
  stands in for them (`rearDeck`): the model's own fuselage sections from the bulkhead to the tail, their tops kept
  6 cm below the eye, in the outside paint colour. The tail group (tailplane, fins and their markings) is drawn as
  modelled.
- **The first approach,** clipping the real fuselage at the bulkhead with a clipping plane, was dropped.
- **Checked in Chrome** looking back in all four aircraft: the spine runs to a visible tailplane and fin, the Bf 110's
  twin fins and tailplane, and no cone.

**Estimates, flagged:** every size (panel distance, seat, headrest, bulkhead and floor positions, wall inset, ribs and
consoles, the deck's 6 cm below the eye). There are no cockpit drawings among the sources. The shapes come from each model's fuselage sections and
eye position. The product owner may supply pictures to refine them, as for the panels.

**Checked in Chrome:**
- the Spitfire looking back (the fin above the bulkhead) and looking left (the throttle lever, ribs, and the rear
  fuselage with its roundel beyond the sill);
- the Bf 109 looking back (the spine to the fin and tailplane);
- the Bf 110 looking back (the twin fins, the right wing and engine beside).
- 75 fps; no console errors.

**Closes** the PROGRESS known issue "looking sideways shows the canopy frame but no cockpit sides".

**Tests:** new tests/render/cockpitInterior.test.js. For each flyable aircraft:
- the parts are there, inside the fuselage's width, between the bulkhead and the panel;
- the sill is below the eye and the bulkhead behind the seat;
- the rear deck runs from the bulkhead to the tail with its top below the eye.

## D234. Phase 7 checkpoint 7: the Bf 110 rear-gun swap (10 Nov 2026)

**The product owner's choices (10 Nov 2026):**
- **Tab** swaps between the pilot's seat and the rear gun; a joystick button can be assigned to it in the J panel,
  unassigned by default (mapping version 6).
- The AI pilot flies **defensively** while the player mans the gun.

**What was built:**
- **Seats** (new src/core/crewSeat.js): the Bf 110 only.
  - Every flight starts in the pilot's seat.
  - **Refused, with a message:** a swap to a gunner who is out of action, or during a bail-out or after a crash.
  - **On the gun:**
    - an AI pilot flies the aircraft in every physics step, while the pilot lives;
    - both engines take his throttle, and the automatic airscrew pitch is held on;
    - the player's keys and stick work the gun, not the aircraft (src/main.js): Space or the trigger fires, the stick
      or arrows swing the aim at up to the gun's 60°/s, the mouse drags it, and Backspace still bails out.
  - **The gunner hit while the player is on the gun:** the player is sent back to the pilot's seat.
  - **Back in the pilot's seat:** the AI lets go, and the controls stand as he left them (throttle and all).
- **The defensive pilot** (new src/ai/defensive.js; game design, flagged). Never above 2 g, so the gun can still be
  aimed (D78), and never with the nose guns.
  - An enemy fighter within 2,000 m, in the rear half or closing, brings a turn (bank up to 57°) that swings it towards
    dead astern. One below the horizontal brings a shallow descent (about 7°) that closes the height between them.
  - Otherwise he keeps the escort's station on the raid's leader (escort missions, S38), or holds heading and height.
  - He sees enemies one reaction time late (Regular).
- **The gun manned** (src/ai/gunner.js `crew.manned`): the player's aim and trigger replace the AI gunner's target,
  lead and bursts.
  - Kept: the arc (±30° about dead astern, 0-60° up, S25), the traverse rate, drum changes (at Regular's pace, 14 s)
    and no aiming above 2 g.
  - His rounds are his own (D225 kill credit).
- **The gunner's view** (a 'gunner' camera mode, src/render/cameras.js):
  - The eye sits 0.45 m behind the gun's pivot along its line and 0.11 m above, in the gun's own frame, so the view
    looks along the gun.
  - The look the player asks for (mouse, stick, arrows) is the aim, kept to the arc and a little beyond. The gun
    follows at its traverse rate and the view follows the gun.
  - Hidden, as from the pilot's cockpit: the model's fuselage shell and glazing; the rear deck (D233) runs to the twin
    fins.
- **The MG 15 in 3D** (new src/render/mg15.js): a barrel, breech and a saddle drum, a half low on each side, kept
  upright as the gun swings.
- **The gunner's screen** (new src/ui/gunnerHud.js):
  - the ring-and-bead sight (S25 para. 20) in the middle of the view: a ring of 2.5° radius (an estimate) with four
    spokes and a bead;
  - a line: rounds in the drum, drums left (or "changing drum"), height and speed in Luftwaffe units, and "Tab: back
    to the pilot's seat".
  - No pilot's panel, Revi, chase reticle or flight HUD on the gun.
- **Multiplayer** keeps the gun AI-manned (D14). D83's "the rear gunner is always AI" now holds only there; GAME_SPEC
  §3 updated.

**Estimates, flagged:** the defensive pilot's ranges, turn, bank and descent; the eye's place behind the gun; the gun
model's sizes; the ring's size.

**Found in Chrome and fixed:**
- The drum first sat on top of the gun, in front of the eye, hiding the sight. It is now a saddle drum, low either
  side.
- The eye was first placed "up" in the aircraft's frame and went into the breech with the gun raised.
- The model rolled at combined angles. It is now turned by a basis that keeps it upright.

**Checked in Chrome** (75 fps, no console errors), in a Bf 110 dogfight against Hurricanes:
- Tab to the gun: the view astern along the MG 15, with the sight between the twin fins;
- a mouse drag swung the aim up and to the left;
- Space fired, 75 rounds down to 48;
- Tab back to the pilot's panel.
- Handing back mid-fight, the aircraft was in the AI's banked descent with the throttle where he left it (0%).

**After the product owner's flight (10 Nov 2026, "it works well"):**
- **Engine volume:** a new setting, "Engine volume", 25% by default. It scales every engine voice, the player's and
  others', against today's level as 100%.
- **The guns:** the player's machine guns and cannon are another 50% louder (0.33 → 0.495 and 0.7875 → 1.18).
- **The MG 15's tracer** started over the aircraft. Two causes, both fixed:
  - its rounds left from the gun's pivot, not its muzzle. They now leave 0.75 m along the bore (`mounts.rear.muzzle`,
    an estimate, with a row in AIRCRAFT_DATA.md), and the muzzle flash shows there.
  - every tracer streak was drawn a fixed 0.025 s of flight behind its round, so just after firing it reached back
    past the gun. A streak now stops where its round left the muzzle (all guns).

**After the product owner's next flight (10 Nov 2026):**
- **The MG 15 could hit its own fins** at its lowest elevation. The real gun could not.
  - The Bf 110's twin fins stand 2.4 m either side, 6.25-7.5 m aft, up to 1.25 m high (the model), about 21-25°
    either side of dead astern, inside the gun's ±30°.
  - From the muzzle, a round needs up to 5.4° of elevation to pass over them with 0.15 m to spare.
  - Over 151-162° and 198-209° of azimuth (the fins plus a degree each side) the gun now goes no lower than 6°
    (`mounts.rear.tailClearance`, an estimate). Elsewhere it still reaches the horizontal (S25). The AI gunner keeps to
    it too.
- **The nose MG 17s now fire a tracer in four** (armour-piercing, incendiary, observing, tracer), so their fire shows:
  the product owner's wish.
  - **Flagged:** not a documented 1940 belt; no 1940 belt mix was found.
  - The tracer round replaces part of the incendiary effect.
  - Only the Bf 110's nose guns have it (a gun may now name its own belt, `belt`). The Bf 109's MG 17s keep D61's
    three-round belt.
  - Seen in Chrome: the tracers converge in the Revi from the nose.

**The MG 15 out of ammunition** (the product owner, 10 Nov 2026): with the player on the gun and its drum empty, the
message line shows "MG15 OUT OF AMMO! CHANGING DRUMS" as a warning (white on a see-through red ground, D232) while the
drum is changed. With no drums left it shows "MG15 OUT OF AMMO! NO DRUMS LEFT" (added, as "changing drums" would then
be untrue). In the pilot's seat the AI gunner changes his drums without a message. Seen in Chrome.

**Tests:**
- new tests/render/tracers.test.js;
- tests/ui/damageReports.test.js: the out-of-ammunition warning;
- tests/ai/gunner.test.js: the fins can't be hit while dead astern still reaches 0°; the 110's nose belt one tracer
  in four, the 109's without;
- new tests/core/crewSeat.test.js;
- new tests/ai/defensive.test.js;
- tests/ai/gunner.test.js gains the manned gun: the aim from the look, traverse and arc, the trigger only, drum
  changes, no target choice, and nothing above 2 g.
