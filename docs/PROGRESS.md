# Progress

Read this at the start of every session.

## Current status (26 Oct 2026)

- **Phase 0** (foundations and research): signed off (24 Oct 2026, D14). The game is live at
  https://mdayv261.github.io/WW2-BattleOfBritain/ (repository https://github.com/mdayv261/WW2-BattleOfBritain).
- **Phase 1** (single-engine flight model): signed off (25 Oct 2026, D27).
- **Phase 2** (controls, cameras, ground): signed off (25 Oct 2026, D35).
- **Phase 3** (twin-engine aircraft: Bf 110 C-4 and He 111 H): signed off (26 Oct 2026, D50).
- **Phase 4** (world and visuals): signed off (26 Oct 2026, D57).
- **Phase 5** (weapons and damage): in progress (plan approved 26 Oct 2026, D59). Checkpoint 1 (research) done (D60); estimates accepted (D61). Checkpoint 2 (engine heat and structural limits) done (D62); checkpoint 3 (guns and ballistics) done (D67);
  checkpoint 4 (target aircraft, hit zones and damage) done (D68); checkpoint 5 (visible damage and wrecks) done
  (D69). Next: the product owner's Phase 5 acceptance test (proposed in D69).
- **Pushed:** Phases 1-4 pushed and deployed on 26 Oct 2026.

## Elevator trim display (27 Oct 2026)

**Done** (D74): an upright elevator trim display (±15°, 1° graduations, NOSE UP / NOSE DOWN) on all four flyable panels:
- Hurricane and Spitfire: left of the undercarriage and flaps;
- Bf 109: in place of the red button, left of the magneto switch;
- Bf 110: right of the turn and bank.

**Known issue:** the ±15° scale is a display scale for the full trim range, not a measured tab or tailplane angle.

## Hands-off rigging solved (27 Oct 2026)

**Done** (D73): the roll and yaw rigging of all five aircraft is solved with the flight model (`npm run fit:rig`), so
each flies straight hands-off at the air start (under 0.05° of bank in 30 s for the fighters, 1.3° for the He 111). A
new test (`tests/physics/rigging.test.js`) guards it.

**Known issue:** away from the air start's speed and power (for example at full throttle), the aircraft still want to
roll or yaw a little, as the real ones did; the pilot corrects.

## Joystick dead zone (27 Oct 2026)

**Done** (D72): a dead zone choice (5-30%) for Roll, Pitch and Rudder in the joystick panel (J), with a live readout of
what the aircraft receives. This fixes the right yaw from a twist that rests anywhere from 0.00 to 0.17. The help
text now names all three aircraft with rudder trim. Tests are in `tests/ui/phase2Controls.test.js`.

## Joystick sensitivity (27 Oct 2026)

**Done** (D71): a sensitivity choice for Roll, Pitch and Rudder in the joystick panel (J), from Very high to Lowest.
Full stick always gives full control. Tests are in `tests/ui/phase2Controls.test.js`.

## Joystick neutral calibration (27 Oct 2026)

**Done** (D70): Set neutral buttons for axes 0-5 in the joystick panel (J), plus Set all neutral and Clear. The axis
reads 0.00 at its stored centre and still reaches full travel. Tests are in `tests/ui/phase2Controls.test.js`.

## Phase 5 checkpoint 5: visible damage and wrecks (27 Oct 2026)

**Done** (D69):
- glycol vapour, oil, engine smoke, flames and fire smoke trailing from where the damage is;
- flashes and puffs where rounds strike;
- crash fireballs and smoke columns;
- wings and tails breaking off, and wrecks falling and turning, for the target and the player;
- a target whose pilot is killed flies on, uncontrolled, to the ground;
- after a break-up, the view moves outside;
- tests: `tests/weapons/effects.test.js`, `tests/core/wreck.test.js`, `tests/render/particles.test.js`, plus model
  groups (1456 tests pass; `npm run validate` unchanged; 75 fps with every effect).

**Known issues:**
- wreck motion constants and all effect looks are estimates or display choices;
- an outer-panel failure takes the whole wing half off;
- a burst from dead astern can break a tail off quickly (D68's tail-damage estimate, for the product owner to judge);
- the joystick's twist reading 0.15 hands-off (the aircraft yawed right): fixed by the neutral calibration in the J
  panel (D70).

## Phase 5 checkpoint 4: target aircraft, hit zones and damage (27 Oct 2026)

**Done** (D68):
- key Y: a target ahead of you (each of the five types in turn, then none), flown by a simple autopilot on its own
  flight model;
- hit zones for every aircraft; rounds hit the target or you, never the aircraft that fired them;
- damage through the existing models: engine wear, coolant and oil leaks, fires, pilot wounds and armour, cut cables,
  damaged control surfaces, wing panels that lose lift and break, tail failure, jammed undercarriage and flaps;
- key 9: a 20 mm hit on your own aircraft, each component in turn;
- F3: the target's range, bearing, hits and damage, and your own damage;
- tests in `tests/weapons/hits.test.js`, `tests/weapons/damage.test.js` and `tests/core/target.test.js`
  (1412 tests pass; `npm run validate` unchanged).

**Known issues:**
- all hit-zone sizes, system positions and damage amounts are estimates (no vulnerability data found);
- the Spitfire's tank is modelled as plain and the Bf 109's as self-sealing (not confirmed);
- the target cruises at its own speed, so from the slow approach start it pulls away (use the air start);
- no visible damage effects yet (checkpoint 5).

## Phase 5 checkpoint 3: guns and ballistics (27 Oct 2026)

**Done** (D67):
- every fighter's guns at their documented rates, with limited ammunition, belts and harmonisation;
- rounds flying with gravity and drag fitted to the sourced range tables (velocities within 0.5% to 600 m/yd);
- recoil while firing;
- tracers, smoke trails and muzzle flashes;
- rounds in F2 and F3, and the Bf 109's ammunition counter live;
- controls: Space and Enter, joystick trigger and thumb button;
- tests in `tests/weapons/`.

**Known issues:**
- gun positions are estimates;
- the .303's Browning muzzle velocity was not found (the Mk VII table's is used);
- the Bf 110's rear gun and drum changes come in Phase 6.

## Phase 5 checkpoint 2: engine heat and structural limits (26 Oct 2026)

**Done** (D62):
- coolant and oil temperatures for every engine, with the radiator, overheating, over-revving, wear and seizure;
- g limits (wrinkled airframe, wing failure) and diving limits (control-surface flutter);
- temperatures and damage in the text strip and F3, with warnings on the message line;
- tests in `tests/physics/cooling.test.js`, `tests/physics/structure.test.js`, `tests/ui/damageReports.test.js`.

**Gauges** (D63, D64): coolant and oil temperature gauges on every flyable aircraft's panel, placed as the product owner
asked; the Bf 110's with green normal bands. The Bf 109 panel rearranged with an ammunition counter whose tapes and
spinning windows follow each gun's rounds (D65; live once checkpoint 3 adds the guns); the Bf 110 panel drawn at the Bf 109's size.

**Known issues:** all radiator and structural constants are estimates (D61, D62); one radiator control for both of the
Bf 110's engines.

## Phase 5 checkpoint 1: research (26 Oct 2026)

**Done** (D60): guns, ammunition and ballistics, harmonisation, armour and tanks, engine temperatures and diving limits
recorded in AIRCRAFT_DATA.md from allowed sources (new S37-S41), with the official .303 Mk VII range table and Rechlin
firing tables for the German rounds, which the acceptance tests will check against.

**Left:** the product owner's decisions on nine proposals (D60), then checkpoint 2 (engine heat and structural limits).

**Known gaps:** see D60 and the gaps table (Spitfire rounds per gun, Luftwaffe harmonisation, armour thicknesses, g
limits, DB 601 boiling curve and more).

## Instrument panel hidden when looking away (26 Oct 2026)

**Done** (D58): in the cockpit the panel hides while the pilot looks to the side, up or behind (joystick hat or mouse)
and comes back on looking ahead. 910 tests pass; `npm run validate` unchanged.

**Known issue:** looking sideways shows the canopy frame but no cockpit sides until the 3D cockpits (Phase 7).

## Bf 109 yellow nose, wingtips and rudder (26 Oct 2026)

**Done** (D56): the Bf 109 E model has a yellow cowling, wingtips and rudder, after the product owner's photograph;
the paint now knows which part it is colouring. 908 tests pass; `npm run validate` unchanged.

## Phase 4 checkpoint 4: frame rate and the acceptance test (26 Oct 2026)

**Done** (D55): acceptance test agreed; the F3 overlay's top line shows the frame rate, the longest recent frame, the
work per frame and the draw calls and triangles. Measured on the development machine: 75 fps (the screen's limit)
everywhere, 1.5-1.9 ms of work per frame, so no detail distances were changed. Tests in `tests/ui/frameRate.test.js`;
903 tests pass; `npm run validate` unchanged.

**Signed off** by the product owner (D57).

**Known issues:** the frame rate can only be checked flying alone until the AI arrives (Phase 6); the work time covers
the processor only, not the graphics card.

## Phase 4 checkpoint 3: aircraft models (26 Oct 2026)

**Done** (D54):
- low-polygon models of all five aircraft built in code (`src/render/models/`), replacing the Phase 2 boxes;
- moving ailerons, elevators, rudders and flaps; undercarriage that folds with the gear; airscrews (blades when
  stopped, a disc when running, faint from the cockpit);
- summer-1940 camouflage and generic national markings;
- `modelpreview.html` (dev server only) shows all five side by side from the side, top, underneath, front or three-quarter,
  for checking the silhouettes;
- tests in `tests/render/aircraftModel.test.js`; 900 tests pass; `npm run validate` unchanged.

**Known issues:** the shapes and colours are display estimates (D54); no Bf 109 tailplane struts, aerials, guns or
exhausts yet; aileron and rudder travel on the models are estimates; the Bf 110 and He 111 have no dorsal or nose guns
drawn (Phase 5).

## Phase 4 checkpoint 2: the sky (26 Oct 2026)

**Done** (D53): the sun placed for 15 August 1940, 15:00 BST, with its disc and glow; low-polygon fair-weather cumulus
(bases 1,000-1,500 m) that fade near the camera. Tests in `tests/world/sky.test.js`; 855 tests pass.

## Phase 4 checkpoint 1: the land (26 Oct 2026)

**Done** (D51, D52):
- the real map from London to St-Omer: GMTED2010 heights, land and sea, the cliffs, built-up areas and the Thames;
- 16 airfields from the NGA gazetteer (cited, D52); RAF aircraft start at Hawkinge, Luftwaffe at Saint-Inglevert;
- terrain drawn in chunks with levels of detail; houses near the camera;
- tests in `tests/world/terrain.test.js`; 850 tests pass; `npm run validate` unchanged.

**Known issues:** today's built-up areas (larger than 1940); village-based airfield positions to about 1 km (Hawkinge
and Lympne sit low).

## Engine start/stop and twin lever fix (26 Oct 2026)

**Done** (D49): L starts or stops the engine(s) on every aircraft; ground starts begin with engines off; twin engines
follow the throttle lever's position (fixes the joystick slider problem after K); the DB 601 and Jumo now hold an idle.

## RAF undercarriage and flap displays (26 Oct 2026)

**Done** (D47): the Hurricane and Spitfire use the Luftwaffe-style undercarriage display (lever and three lamps) and the
upright flap indicator, from one shared module (`src/ui/panelControls.js`). Checked in Chrome, no console errors.

## Bf 110 engine columns and LANDING labels (26 Oct 2026)

**Done** (D46): Bf 110 engine instruments in two columns (left engine left, right engine right: rpm, boost, pitch,
fuel quantity); its fuel and oil pressure gauges removed; LANDING on every flap indicator. Checked in Chrome.

## Bf 110 panel changes and even spacing (26 Oct 2026)

**Done** (D44): Bf 110 turn and bank below the clock; new undercarriage display (lever, three lamps green down / red
up); TAKEOFF on all flap indicators; Bf 110 fuel and oil pressure gauges per engine with green normal bands; both
Luftwaffe panels on an even grid with equal gaps, nothing touching. Left and right wing fuel quantity gauges (litres)
in the Bf 110's two blank positions (D45). Checked in Chrome, no console errors.

**Known issues:** fuel use is not modelled, so the fuel quantity gauges read full; the pressure gauges show running
values (not modelled physically).

## Luftwaffe instruments to the reference drawings (26 Oct 2026)

**Done** (D43): airspeed, altimeter, turn and bank, variometer, Patin repeater compass and artificial horizon redrawn to
the product owner's drawings; all Luftwaffe dials share the drawings' mountings, bezels, faces and hands. Checked in
Chrome against the sheet, no console errors.

**Known issues:** the Bf 110 has no turn and slip indicator now (the drawn Wendehorizont has none); compass cardinal
points use E rather than the drawing's O (D41).

## Bf 109 cockpit after the product owner's E cockpit photograph (26 Oct 2026)

**Done** (D41): panel, canopy frame and reflector sight redrawn after the photograph; flap indicator, undercarriage
lever, fuel and oil pressure gauge and undercarriage lamps where the product owner placed them; N/E/S/W on the
compasses. Checked in Chrome with no console errors.

**Known issues:** fuel and oil pressures are display values only (not modelled); the fuel pressure bands are estimates.

**Next:** the product owner's Phase 3 flight test against the agreed acceptance test (D42).

## Phase 3 checkpoint 2: He 111 and flying the twins (26 Oct 2026)

**Done** (D40):
- **He 111 H** from the Soviet test of the H-6/H-11 (S29), with a Jumo 211F engine file; speeds within 2% to 7 km.
- **Keys 4 and 5** select the Bf 110 and He 111; the He 111 is flown from the outside views (no cockpit, AI only).
- **Twin controls:** K selects both/left/right engine levers, L cuts or restarts an engine, M feathers it (Bf 110).
- **Tests:** `tests/ui/twinLevers.test.js`, He 111 checks in `tests/physics/twinEngine.test.js`, validation rows. 819
  tests pass; checked in Chrome.

**Known issues** (FLIGHT_VALIDATION.md items 18-19):
1. He 111 ceiling 11% low and 8,000 m speed 10% low; climb to 3-7 km 7-15% quick; turn 20% quicker than S29.
2. He 111 airscrew diameter, gear ratio and positions are estimates; no feathering (not confirmed).
3. The He 111 is faster than a 1940 H-3 would be (H-6/H-11 engines).

## Bf 110 panel and upright Bf 109 flap indicator (26 Oct 2026)

**Done** (D39): the Bf 109's flap indicator stands upright (0° at the top, 40° at the bottom). The Bf 110 panel is drawn
after the product owner's photograph, with a set of engine instruments per engine and the C-4's two pitch indicators;
key 4 selects the Bf 110 so the panel can be seen. `tests/ui/bf110Panel.test.js` checks scales, layout and per-engine
readings. Checked in Chrome with no console errors.

**Known issues:** two dials on the photograph could not be identified for certain (drawn as altimeter and clock); the
coolant and oil gauges rest at typical values.

## Bf 109 panel after the product owner's photograph of an E panel (26 Oct 2026)

**Done** (D38): the Bf 109's instruments redrawn to look like the photograph: grey panel outline, black square
mountings, clock on the centre tab, airspeed, strip compass, ata, altimeter, turn and bank, rev counter and airscrew
pitch indicator, the pitch and magneto switches and placards. The flap indicator sits between the compass and the ata
gauge, as the product owner asked; the undercarriage lamps on the right. `tests/ui/bf109Panel.test.js` checks the
scales and layout. Checked in Chrome with no console errors.

## Phase 3 checkpoint 1: twin-engine physics and the Bf 110 (25 Oct 2026)

**Done** (D36):
- **Engines as a list** (`src/physics/powerplant.js`): per-engine thrust, torque, slipstream, failure and feathering. The
  fighters' results are unchanged.
- **Bf 110 data file** (`src/aircraft/bf110c4.js`) with every value in AIRCRAFT_DATA.md (C-2 data, S23-S25); drag and
  flaps-down lift fitted to S23; positions estimated (no scaled drawing found).
- **Validation:** S23 level speeds within 3%; the climb shape and ceiling are outside tolerance (item 14).
- **Single-engine tests** (`src/dev/twinTests.js`, `tests/physics/twinEngine.test.js`): holds height and climbs on either
  engine feathered, noticeably worse windmilling (S25); held straight with rudder and trim; the right engine is critical.
- 672 tests pass.

**Known issues** (FLIGHT_VALIDATION.md items 14-17):
1. Bf 110 climbs 17-23% slow to 2 km; ceiling 6.6% high (span efficiency lowered to 0.7 by the product owner, D37).
2. Ground run-up 2,410 rpm against S24's 2,200 rpm.
3. S24's uncontrollable swing with full flap on one engine is not reproduced; the model stays controllable.
4. The 110 cannot be flown in the browser yet (checkpoint 2).

**Left in Phase 3:**
- **Checkpoint 2:** He 111 data file from S29; keys 4 and 5; twin controls (both engines, one engine, cut, feather);
  Bf 110 cockpit and panel (needs a photograph from the product owner); ground handling with differential power.
- **Checkpoint 3:** the product owner's flight test and the acceptance test.

## Phase 2 checkpoint 3: take-off and landing checks (25 Oct 2026)

**Done:** `tests/physics/takeoffLanding.test.js` checks behaviour against the sources:
- **Swing:** the RAF fighters swing left on take-off and the Bf 109 right.
- **Landings:** straight three-point landings with no ground loop.
- **Tail-first landings:** possible.
- **Spitfire elevator at touchdown:** within NACA's range.
- **Bf 109 brakes:** full brakes do not lift the tail.
- **Elevator travel** added to the data: 29° Spitfire (S11), 26° Hurricane (S12), 31.6° Bf 109 (S32).

**Known issue:** the Bf 109's swing does not change to the left once airborne, as S20 describes (FLIGHT_VALIDATION.md,
item 13). The propeller's direction of rotation, given under DIN 9001, needs checking.

**Left:**
- the product owner's flight test (take off, fly a circuit and land each fighter);
- tuning of the estimates from that flight;
- agreement of the Phase 2 acceptance test.

## Phase 2 checkpoint 2: aerodrome, views, instruments and controls (25 Oct 2026)

**Done** (D32):
- **Aerodrome:** a generic grass aerodrome on farmland, with the coast and sea to the south.
- **Starts:** on the ground (default), on the approach at 1,000 ft, or in the air; N cycles them.
- **Views:** the cockpit view with a simple cowling and windscreen frame; chase, fixed and orbit views outside; mouse
  and hat look-around.
- **Instruments:** 2D dials in each side's units.
- **Controls:** brakes (B, joystick thumb button), rudder trim, flap stops, joystick buttons for flaps, undercarriage
  and view, all set in the J panel.
- **Messages:** touchdown speed and sink rate, "Landed", or the crash cause.
- **Tests:** `tests/ui/phase2Controls.test.js` covers the aerodrome and starts, keyboard and joystick, cameras and
  instruments. 515 tests pass; checked in Chrome with no console errors.

**Known issues:**
1. **Swing at full power:** taking off needs firm rudder (about 70% from a standstill at full power), and with no rudder
   the aircraft ground-loops. To be judged in the flight test.
2. **Joystick:** the defaults are the product owner's own settings from the J panel (D32).
3. **Stand-in shapes:** the aircraft are still boxes; the cockpit is a simple frame.

## Phase 2 checkpoint 1: ground physics and take-off and landing validation (25 Oct 2026)

**Done:**
- **Research** (AIRCRAFT_DATA.md):
  - wheel track, wheel and tailwheel positions, and ground angles, measured from the scaled drawings in S11, S12 and S32;
  - centres of gravity (S11, S12, S32);
  - two new sources: S32 (RAE Morgan report on the Bf 109 E-3) and S33 (Spitfire I Pilot's Notes, Museum of Flight).
- **Ground model** (`src/physics/ground.js`, D28):
  - oleo and tyre springs, rolling resistance, slip-angle side force and brakes (brake plus rudder);
  - castoring tailwheels and ground effect;
  - crash rules: wingtip, nose-over, propeller strike, belly landing, collapsed undercarriage.
- **Starting on the ground:** `createOnGround` parks an aircraft with the engine idling.
- **Flaps by aircraft:** the Spitfire's are up or down only (S33); the Hurricane's and 109's can stop part-way.
- **Rudder trim:** Spitfire only.
- **Elevator trim times:** each aircraft has its own; the 109's tailplane takes 18 s (S20).
- **Scripted pilots and validation** (`src/dev/groundTests.js`, D29): run-up, take-off and landing, with the results
  added to `npm run validate` and FLIGHT_VALIDATION.md.
- **Tests:** `tests/physics/ground.test.js` covers parked attitude, wheel loads, brakes, run-up, ground effect, flaps and
  crash rules. The validation test gained the take-off and landing rows.

**Results:**
- **Parked attitude:** each aircraft sits at its sourced ground angle within 0.5°.
- **Spitfire full-throttle run-up:** 2,700 rpm (S33: 2,650-2,700). With the brakes on it tips onto its nose (S33: two men
  on the tail). The 109's tail stays down (S20, S32).
- **Distances within ±15%:** 4 of 8 (Hurricane take-off and landing, 109 landing, Spitfire take-off run).

**Known issues:**
1. **Spitfire take-off to 50 ft and landing run long:** +22% and +48%.
2. **Bf 109 take-off short:** -29% (run) and -23% (to 20 m).
3. **Taxiing needs constant rudder:** with no rudder a castoring-tailwheel aircraft swings into a ground loop, and can
   tip onto a wingtip. This is realistic but hard on the keyboard; the auto-rudder assist comes in Phase 8.
4. **Ground and sea in the test scene:** the test view still shows the sea, but the physics treats everywhere as level
   grass until the airfield arrives in checkpoint 2.

**Deviations accepted** by the product owner (D31).

## Bf 109 recalibrated from the RAE report (25 Oct 2026, D30)

**Done:**
- **Sourced from S32:** the mean chord, dihedral, wing twist (none), fine pitch stop, and the maximum lift clean and
  with flaps (calibrated airspeeds).
- **Fitted to S32:** the slat opening point, aileron heaviness and aileron power. The drag was refitted.
- **Validation:** the S32 stalls and the 400 mph bank times were added. The take-off and landing table was re-run.

**Results:**
- speeds, climbs and stalls unchanged or within 2.5%;
- the 109's take-off deviation reduced (-25% ground run);
- the handling checks all pass.

**New known deviation:** the RAE's 4 s to bank 45° at 400 mph is about three times the model's 1.2 s for both the
Spitfire and the 109. It is probably stick-movement time and wing twist, neither of which is modelled.

## Phase 1 checkpoint 3: handling checks and tuning (25 Oct 2026)

**Done:**
- **Scripted test flights** (`src/dev/flightTests.js`, `npm run handling`) and handling tests
  (`tests/physics/handling.test.js`) covering:
  - stall and wing drop;
  - spin entry and recovery (both directions, all three aircraft);
  - roll rate (NACA S13);
  - sideslip in a roll (S11);
  - stick force per g (S11, S12);
  - control heaviness (Spitfire at 300 mph; Bf 109 above 250 mph);
  - Bf 109 slats (S21);
  - torque swing.
- **Model changes** (D26): two-panel wing with washout; gentler stall; stalled nose-down moment; steadier spins; Bf 109
  slats that open near the closed-slat stall; documented wing-drop directions; low-wing dihedral correction; aileron and
  elevator forces fitted to NACA; rigging re-matched.
- **Results:**
  - stalls: Spitfire mildest with a slight right roll; Hurricane and Bf 109 drop the left wing;
  - spins: entered and recovered within half a turn;
  - roll at 230 mph within 4% of NACA; sideslip in a roll 17° (NACA 18°); stick force per g as NACA;
  - 45 of 52 performance checks within tolerance (FLIGHT_VALIDATION.md).
- **Tests:** 351 pass. Checked in Chrome: no console errors.

**Known issues:**
1. **Spins settle flat** (60-80° angle of attack). No sourced spin data were found.
2. **Spitfire full-aileron roll** 15% below NACA once the 30 lb roll is matched.
3. **Stall wing drops grow large** if full back stick is held for several seconds past the stall.
4. **Earlier deviations, unchanged:**
   - Spitfire ceiling −7%;
   - Hurricane mean-weight ceiling −5.6%;
   - Bf 109 specification climbs 8-16% slow.

**Proposed Phase 1 acceptance test (for the product owner to agree):**
1. **Performance:** level speeds within 5% of the sources, climbs within 10%, ceilings within 5%, stalls within 5 mph,
   and rolls within 15%, with the deviations above accepted as documented.
2. **Behaviour (automated):**
   - the Merlins cut out under negative g, the DB 601 does not;
   - the Bf 109's slats open in hard turns;
   - its controls are heavy above 250 mph;
   - stalls drop the wing in the documented direction;
   - spins can be entered and recovered.
3. **Your flight test** in Chrome with the keyboard and the Logitech joystick:
   - fly all three;
   - stall each one (throttle back, ease the stick back);
   - feel the controls stiffen in a dive;
   - push over to cut the Merlin;
   - pull hard in the 109 to feel the slats.

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
   and 1, twist axis 5, throttle slider axis 6 (−1 idle, +1 full). The product owner confirmed that pulling back
   raises the nose and twisting right yaws right, with no axis reversed. J shows the axes; "Reset to default" applies
   this mapping if an older one was saved. (Phase 2 update: the product owner later set the throttle slider to
   reversed in the J panel, and that is now the default, D32.)

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
- **Phase 1: Single-engine flight model.** Hurricane I, Spitfire I and Bf 109 E-4. Done and signed off (25 Oct 2026).
  - Model: six degrees of freedom, standard atmosphere, lift and drag curves with stall and spin, supercharged
    engines with boost and rpm, constant-speed and VDM airscrews, Merlin negative-g cut-out, 109 slats.
  - Tools: `npm run validate`, the F3 debug overlay, a simple test camera.
  - Acceptance: validation against the sourced speeds, climbs and roll rates within agreed tolerances, every deviation
    documented.
- **Phase 2: Controls, cameras, ground.** Done and signed off (25 Oct 2026).
  - Keyboard and mouse (joystick if chosen), cockpit, chase and free-look cameras, taxiing, take-off, landing,
    basic instruments.
  - Acceptance: take off, fly a circuit and land each fighter without the debug panel.
- **Phase 3: Twin-engine aircraft.** Bf 110 C-4 and He 111 H (H-6/H-11 data, D40). Done and signed off (26 Oct 2026).
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
