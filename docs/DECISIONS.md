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

**Checked in Chrome** (Spitfire, air start):
- MAP 42.6 in. Hg and boost +6¼ at full throttle;
- throttle back with S: 24.0 in. Hg and −2.9 lb together;
- rpm lever down with D: rpm 2,993 to 2,275, MAP and boost unchanged;
- no console errors.
