# Battle of Britain 1940 - Game Specification

## 1. Vision
A browser-based air combat simulator set over south-east England, the Channel and the Pas-de-Calais
between July and October 1940, in daylight. In single player, the player fights AI opponents in
dogfights and bomber missions. In multiplayer, 2-4 people fly fighters against each other, RAF
against Luftwaffe. Authentic flight behaviour is the top priority. The graphics are clean and
low-polygon, not photorealistic.

## 2. Technical constraints
- HTML5 + JavaScript (ES2022 modules). No TypeScript, no frameworks beyond those listed.
- Three.js for 3D rendering. Vite for the dev server and build. Vitest for automated tests.
- No paid or copyrighted assets. All models, textures and sounds are generated in code or are
  clearly licensed for free use (record the licence in docs/DECISIONS.md).
- Published on GitHub Pages from `mdayv261/WW2-BattleOfBritain`: a push to `main` runs the tests,
  builds and deploys (`.github/workflows/deploy.yml`). Pushing needs the product owner's permission.
- Target: 60 fps on a mid-range laptop, in Chrome and Firefox.
- Physics runs on a fixed time step (120 Hz), decoupled from rendering. SI units (metres, kg,
  seconds, newtons, pascals, radians) internally; convert only for display:
  - RAF aircraft: mph, feet, boost in lb/sq in.
  - Luftwaffe aircraft: km/h, metres, manifold pressure in ata.
- This codebase is separate from Dawn Patrol (WW1). No code is copied from it unless the product
  owner approves that module.

## 3. Aircraft

| Aircraft | Side | Engines | Who flies it |
|---|---|---|---|
| Hawker Hurricane Mk I | RAF | 1 × Rolls-Royce Merlin III | Player or AI |
| Supermarine Spitfire Mk I | RAF | 1 × Rolls-Royce Merlin III | Player or AI |
| Messerschmitt Bf 109 E-4 | Luftwaffe | 1 × Daimler-Benz DB 601A | Player or AI |
| Messerschmitt Bf 110 C-4 | Luftwaffe | 2 × Daimler-Benz DB 601A | Player or AI; the rear gun is always AI-manned |
| Heinkel He 111 H-3 | Luftwaffe | 2 × Junkers Jumo 211 (A-3 or D-1, to be confirmed) | AI only |

The variants modelled are recorded in docs/DECISIONS.md (D9). The RAF fighters are modelled as
they were in mid-August 1940: constant-speed propellers, 100-octane fuel, and +12 lb/sq in emergency
boost. The 1940 sources allow +12 lb boost only for "short periods" and give no number of minutes, so the game sets
no fixed time limit (product owner, 24 Oct 2026, D14). The engine's heat model applies as at any other setting.

Every performance and dimension figure comes from a documented source and is recorded in
docs/AIRCRAFT_DATA.md with its value, unit, original figure, source, and confidence (high, medium
or estimate). Estimates give a reason. Nothing is invented silently.

Allowed sources:
- museum records;
- period test reports (A&AEE, RAE, Rechlin);
- Pilot's Notes and Luftwaffe handbooks;
- published reference books;
- NACA/NASA reports.

Not allowed: Wikipedia, Reddit, forums and game-company pages.

Every deviation from a historical or published figure is flagged to the product owner and recorded.

## 4. Flight model requirements
- **Rigid body:** six degrees of freedom (position, velocity, orientation as a quaternion, angular
  velocity).
- **Atmosphere:** the International Standard Atmosphere for density, pressure and temperature
  against altitude.
- **Lift and drag:**
  - coefficient curves against angle of attack, including post-stall behaviour and wing drop at
    the stall;
  - induced drag from aspect ratio;
  - parasite drag for each aircraft, with extra drag from the flaps, the undercarriage and an
    open radiator.
- **Engines:** supercharged piston engines.
  - Power depends on altitude, boost or manifold pressure, and rpm, with the full-throttle height
    of each supercharger.
  - Rated, combat and take-off settings come with their documented time limits. Where the sources give none
    (the Merlin's +12 lb emergency boost), no timer is invented.
  - Overspeed and overheating damage the engine.
- **Propellers:**
  - constant-speed propellers on the Merlin aircraft (the governor holds the rpm the pilot sets);
  - the VDM propeller on the Daimler-Benz engines, with automatic or manual pitch as documented;
  - propeller thrust and efficiency against airspeed.
- **Fuel systems:**
  - the Merlin's carburettor cuts out under negative g;
  - the DB 601's direct fuel injection keeps running under negative g;
  - the Jumo 211's fuel system is to be confirmed from a source.
- **Bf 109 automatic leading-edge slats:** they open at high angle of attack, delaying the stall.
  An uneven opening can cause a wing drop or aileron snatch.
- **Flaps and undercarriage:** retractable undercarriage, landing flaps, and their speed limits.
- **Cooling:**
  - liquid (glycol) cooling, with a radiator flap the pilot can open and close;
  - the coolant temperature rises at high power and low speed;
  - a hit to the coolant system leaks glycol, then the engine overheats and seizes.
- **Twin-engine aircraft:**
  - each engine runs separately, so the thrust can be uneven, with swing and yaw on one engine;
  - single-engine flight and its minimum control speed;
  - feathering where the aircraft had it.
- **Controls:**
  - control surface authority scales with dynamic pressure;
  - stick forces get heavier at high speed, as measured in the NACA and RAF tests (for example, the
    Spitfire's ailerons cannot reach full travel much above 140 mph, and the 109's controls become very heavy
    above about 250 mph);
  - trim (elevator on all; rudder where fitted).
- **Propeller effects:** torque, slipstream and gyroscopic effects from the propeller and engine.
- **Structural limits:** g limits and diving speed limits from Pilot's Notes and handbooks; going past
  them damages the airframe.
- **Spins:** spins and spin recovery must be possible.
- **Ground handling:** taxiing, take-off, landing, and the Bf 109's narrow undercarriage track. Tail
  draggers can nose over or ground-loop.
- **Validation:** `npm run validate` compares each flight model with its published performance
  (top speed against altitude, climb, ceiling, and turn and roll where sourced). The results go in a
  validation document.
- **Debug overlay (F3):** airspeed (indicated and true), altitude, angle of attack, sideslip, g-load,
  thrust, lift, drag, boost or ata, rpm and coolant temperature.

## 5. Controls
- **Inputs:**
  - the Logitech Extreme 3D Pro joystick (stick, twist rudder, throttle slider, hat, buttons) together with the
    keyboard: the primary controls (product owner, 24 Oct 2026, D14);
  - keyboard and mouse alone also work;
  - all controls are rebindable (Phase 8).
- **Controls to map:** pitch, roll, yaw, throttle, propeller rpm (Merlin aircraft) or pitch (VDM),
  mixture where needed, radiator, flaps, undercarriage, trim, fire (guns and cannon, separately where
  the aircraft had them), views.
- **Optional assists:** auto-rudder, stall warning, g warning, engine management (automatic rpm and
  radiator). All are off in the realistic setting.

## 6. Weapons and damage
- **Period guns, at their documented rates of fire:**
  - Hurricane and Spitfire: eight .303 in Browning machine guns, in the wings.
  - Bf 109 E-4: two MG 17s over the engine, synchronised; two 20 mm MG FF cannon in the wings,
    with 60-round drums (the E-4's MG FF/M version is still to be confirmed).
  - Bf 110 C-4: four MG 17s and two MG FF in the nose, plus an MG 15 in the rear cockpit on a
    flexible mount (AI-manned).
  - He 111 H: MG 15s in the nose, dorsal, ventral and two waist positions, and a fixed rear-firing MG 17 in
    the tail (AI-manned; L.Dv.T. 583/3, October 1940).
- **Guns:**
  - wing guns are harmonised to converge at a set range, as documented;
  - nose guns fire straight ahead;
  - synchronised guns fire through the propeller arc.
- **Bullets and ammunition:**
  - ballistics with muzzle velocity, gravity and air drag;
  - limited ammunition;
  - ammunition types (ball, armour-piercing, incendiary, explosive shell) where they are documented.
- **Component damage:** engine, coolant and radiator, oil, fuel tanks (self-sealing where fitted),
  pilot and crew, armour plate, wings, tail, control runs, flaps, undercarriage, hydraulics.
  Damage feeds back into the flight model.
- **Visible effects:** smoke, glycol vapour trails, fire.

## 7. AI
- **Same rules as the player:** AI pilots use the same flight model and control inputs as the
  player. No extra speed, turn rate or perfect aim.
- **Fighter behaviour:**
  - states: patrol, engage, attack, evade, disengage;
  - period tactics: the RAF's "vic" and "line-astern", and the Luftwaffe's "Rotte" and "Schwarm";
    boom-and-zoom, turning fights, the split-S and diving escapes.
- **Bombers:** fly in formation on a route to a target, and defend with flexible guns.
- **Air gunners (Bf 110 rear gun, He 111 positions):**
  - they aim with lead and realistic error;
  - they are limited by their gun's arc, ammunition and drum changes;
  - they can be wounded.
- **Skill levels:** change reaction time, aim error, energy management and willingness to
  disengage.

## 8. World
- **Area:** south-east England, the Channel and the Pas-de-Calais, in daylight, July-October 1940.
  The exact area and the map data source are to be decided (see PROGRESS.md).
- **Ground features:** coastlines, chalk cliffs, farmland, woods, towns, RAF airfields on the
  English side, Luftwaffe airfields on the French side, a few recognisable landmarks.
- **Markings:** typical generic RAF and Luftwaffe markings (national insignia and camouflage of summer 1940),
  not particular squadrons or pilots (product owner, 24 Oct 2026, D14).
- **Sky:** sun, haze, cumulus cloud and summer visibility. The altitude range suits the period
  aircraft (above 10,000 m).

## 9. Game flow and UI
- **Screens:** main menu; mission setup (side, aircraft, mission type, enemy type and count, skill,
  start altitude, time of day within daylight); pause; results.
- **Missions:**
  - dogfights;
  - intercepting bomber raids (RAF);
  - escorting bombers (Luftwaffe): the player may fly the Luftwaffe side (product owner, 24 Oct 2026, D14).
- **RAF radar information:** RAF players are given the bearing of an incoming raid only, as an intercept aid.
  Height, numbers and range are not given (product owner, 24 Oct 2026, D14).
- **Cockpit:**
  - instruments matching each aircraft's period layout and units;
  - an optional modern HUD;
  - each aircraft's period reflector gunsight (types to be researched).
- **Settings:** controls, graphics quality, sound volume, assists.

## 10. Audio
- Web Audio API.
- Engine sound varies with rpm and boost. Guns and cannon, hits, and wind noise that varies with
  airspeed.

## 11. Quality rules
- Every physics, weapons, AI and network module has automated tests.
- Code is commented in plain English. Functions stay small. Files stay under about 400 lines.
- Physics constants live in data files (`src/aircraft/*.js`), never hard-coded.

## 12. Multiplayer
- 2-4 human players in private rooms joined by a code. RAF against Luftwaffe. Fighters only: Hurricane,
  Spitfire, Bf 109 and Bf 110. No AI aircraft. The Bf 110's rear gun is AI-manned, the one AI element allowed in
  multiplayer (product owner, 24 Oct 2026, D14).
- An authoritative room server on Cloudflare Workers + Durable Objects runs the same flight model
  for every aircraft and decides every hit. It uses the same Cloudflare set-up as Dawn Patrol's multiplayer
  (product owner, 24 Oct 2026). Whether that means Dawn Patrol's own Worker, or a separate Worker on the same
  account, is to be confirmed (see PROGRESS.md).
- Outline: docs/MULTIPLAYER_SPEC.md. The details are designed in Phase 9.
