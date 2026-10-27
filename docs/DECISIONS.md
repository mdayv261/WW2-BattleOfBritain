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

