# Progress

Read this at the start of every session.

## Current status (9 Nov 2026)

- **Phase 0** (foundations and research): signed off (24 Oct 2026, D14). The game is live at
  https://mdayv261.github.io/WW2-BattleOfBritain/ (repository https://github.com/mdayv261/WW2-BattleOfBritain).
- **Phase 1** (single-engine flight model): signed off (25 Oct 2026, D27).
- **Phase 2** (controls, cameras, ground): signed off (25 Oct 2026, D35).
- **Phase 3** (twin-engine aircraft: Bf 110 C-4 and He 111 H): signed off (26 Oct 2026, D50).
- **Phase 4** (world and visuals): signed off (26 Oct 2026, D57).
- **Phase 5** (weapons and damage): signed off (27 Oct 2026, D75).
- **Phase 6** (AI pilots and gunners): signed off (8 Nov 2026, D223), against the acceptance test in D222. Checkpoints
  1-5 done (D77-D83, D216-D222). Known limitation carried forward: the AI Bf 109 can't yet attack a single RAF fighter
  (D220).
- **Phase 7** (missions and the game loop): plan approved 8 Nov 2026 (D224). Checkpoint 1 (menus and the game loop)
  done (D225); checkpoint 2 (interception, escort, friendly wingmen) done (D227), the raid missions halved in length
  (D228); checkpoint 3 (ranks) done (D229); next, checkpoint 4 (the RAF radar display), after its plan.
- **Pushed:** Phases 1-4 pushed and deployed on 26 Oct 2026; Phase 5 pushed on 27 Oct 2026; Phase 6 work to D88 pushed and deployed on 1 Nov 2026; D106-D116 pushed and deployed on 3 Nov 2026; D117-D193 (the Bf 110 cockpit and panel, the flap pitch change) pushed and deployed on 3 Nov 2026 (run 41637042751); D194-D215 pushed on 5 Nov 2026; D216-D223 (Phase 6 checkpoint 5 and sign-off) pushed and deployed on 8 Nov 2026 (run 42451157383); D224-D226 (Phase 7 plan, checkpoint 1, joystick) pushed and deployed on 9 Nov 2026 (run 42568733677); D227-D228 (checkpoint 2, shorter raids) pushed and deployed on 9 Nov 2026 (run 42590639571). D229 pushed on 9 Nov 2026.

## Phase 7 checkpoint 3: ranks (9 Nov 2026)

**Done** (D229):
- **Ranks:** five officers' ranks for each side.
  - RAF: Pilot Officer, Flying Officer, Flight Lieutenant, Squadron Leader, Wing Commander (S44).
  - Luftwaffe: Leutnant, Oberleutnant, Hauptmann, Major, Oberstleutnant (S45).
  - They are earned at 0, 2, 5, 10 and 20 weighted kills. A shared kill counts ½. The steps are game design,
    confirmed by the product owner.
- **Careers:** one per side, kept in the browser's storage.
  - Only missions count. A mission counts once, as its results show; one abandoned to the main menu doesn't.
- **Main menu:** each side's rank and record, and a two-click "Reset careers".
- **Results:** the career line, and "Promoted" when the mission earned a rank.

**Tests:** 1,896 pass; the validation output is unchanged.

**Known issues:**
- Careers live in one browser only.
- S45 is a 1943 handbook (flagged in D229).

**Left in Phase 7:** checkpoints 4-8 (radar, sound, cockpit sides and settings, the Bf 110 swap, the acceptance test).

## The raid missions halved in length (9 Nov 2026)

**Done** (D228, the product owner's choice): a raid now starts over mid-Channel, halfway from Saint-Inglevert to its
target, and its route ends back there.
- An unstopped interception is over in 282 s (Hawkinge), 324 s (Lympne) or 353 s (Manston); Hawkinge took 572 s
  before.
- An escort to Lympne ends when the raid is back over mid-Channel: 712 s, against about 1375 s before. The RAF
  attackers appear about 110 s in.
- The results say "N of M bombers escorted back to mid-Channel from X".

**Tests:** 1,884 pass, among them a new check that an unstopped interception ends in under six minutes. The validation
output is unchanged.

## Phase 7 checkpoint 2: the bomber missions and friendly wingmen (9 Nov 2026)

**Done** (D227):
- interception (RAF) and escort (Luftwaffe) missions on raids from Calais to Hawkinge, Lympne or Manston (3 or 6 He
  111s, the raid's own Bf 109 escort in an interception);
- friendly wingmen in every mission (a vic, a Rotte or a Schwarm);
- the setup keeps every mission within twelve aircraft;
- the results report the bombers' and wingmen's fates.

**Decision for the product owner:** a full escort mission took about 23 minutes, an unstopped interception about 9½.
Decided: halve them (D228, above).

**Left in Phase 7:** checkpoints 3-8 (ranks, radar, sound, cockpit sides and settings, the Bf 110 swap, the acceptance
test).

## Phase 7 checkpoint 1: menus and the game loop (8 Nov 2026)

**Done** (D225):
- the game opens on a main menu (Fly a mission, Test flight, Settings);
- mission setup (side, aircraft, enemy type and number, skill, height in each side's units, daylight time);
- dogfight missions, a pause menu (Esc), results with kill credit, and Fly again or back to the menu without
  reloading;
- the sun moves to the mission's time;
- the test flight keeps all its keys.

**Left in Phase 7:** checkpoints 2-8 (missions, ranks, radar, sound, cockpit sides and settings, the Bf 110 swap, the
acceptance test), each after its own plan.

**Known issues:**
- times are shown in UTC only;
- the settings screen is a placeholder;
- the HUD's crash notice still says "press R to restart", which works only in the test flight (a mission shows its
  results instead).

## Phase 6 checkpoint 5: skill levels (6 Nov 2026)

**Done** (D216, 5-6 Nov 2026): aggression added to the skills (`press`, `attackMargin`); `npm run duels`; head-on
passes broken off (no more head-on collisions); the AI pilot out of trouble, which took the duels' ground crashes from
21 in 100 to none:
- the buffet rule eases the stick back at a negative stall instead of pushing on into a tumble;
- the ground rule makes a diving pilot pull out even when his target is above him;
- spin recovery: throttle closed, opposite rudder, stick forward, held until the wing flies again.

**Done** (D217, 6-7 Nov 2026):
- the duels pit each skill against a Regular of the other side (the fights the game has), each side 1,000 m higher
  in turn;
- AI fighters use +12 lb in a fight;
- the 109's smooth zoom, escapes chosen by real performance, the dive that gives up, slow head-on targets and the
  minimum zoom;
- threats only if they can reach; out-matched only within 400 m;
- the phase bug (dive and zoom flipping) fixed.

**Done** (D218, 7-8 Nov 2026):
- the +12 lb RAF performance checked against sources: the model's power matches; a period trial (new S43, A.F.C. 99)
  has the constant-speed Spitfire out-climbing the 109; the flight model is unchanged;
- duels now fight at 6,000 m (and low for comparison);
- every AI pilot keeps within his diving limit and allows for the pull-out (no more high-dive crashes).

Low down all four duel groups now separate the skills by net hits; at 6,000 m two do.

**Left:**
**Done** (D220-D222, 8 Nov 2026):
- the 109's limitation recorded (D220);
- the gunner skill proof already existed (checkpoint 4);
- twelve aircraft hold 75 fps (the screen's rate) with 4 ms of work per frame, in both views (D221);
- new Shift+7 loads twelve aircraft;
- the proposed Phase 6 acceptance test written (D222).

**Left:** nothing in Phase 6: signed off (D223). Next, Phase 7 after a plan.

**Known issues:**
- **AI Bf 109 can't yet attack a single RAF fighter** (D218-D220; recorded and deferred, product owner 8 Nov). It
  needs a stern-approach guidance plus spotting that takes time, as a dedicated later plan. Not measured against the
  player or against RAF fighters busy with bombers.
- Before he recognises a spin, a pilot's speed-hold opens the throttle (ordinary hands, unchanged).

## Bf 110 C panel after the product owner's picture #34 (3 Nov 2026)

**Done** (D140): the panel redrawn after "Bf110C panel_5.jpg" (#34).
- **Layout:** in src/ui/bf110Layout.js, at the Bf 109's instrument size, the Revi over the turn and bank.
- **New, working:** the round counter for the two cannon and the outside air thermometer.
- **Placards:** with the sourced 650 and 250 km/h.
- **Removed:** the trim gauge, the speed card, the strip compass and the old ammunition counter.
- **Guns' line:** now 0.406 of the screen.

**Adjustments** (product owner, one at a time):
- D141: the panel is lowered so the coolant thermometers touch the screen's foot (the gunsight is kept where it was),
  and the Preßluft gauge is placed below the lever box.
- D142: the Preßluft gauge reads 0 with the engines stopped and 150 with them running.
- D143: the windscreen frame group is raised so the reticle is in the windscreen's middle; the panel and the gunsight
  stay.
- D144: the dash covers end at the Revi's brown pad, and the panel's top is filled up to them.
- D145, D146, replaced by D147: the panel's right corner ends just past the Heizung placard, drops a little, then
  angles down to touch the right fuselage side.
- D148 (inner windscreen widened) undone; D149: the outer windscreen frame's base is widened by two frame widths, its
  top unchanged; D150: widened again by the same amount.
- D151: the panel's top right edge runs three quarters of the way along the right dash cover, then angles down to the
  post.
- D152: the panel's lower right edge runs down the right fuselage side (the post, then the sheet).
- D153: the panel's left edge runs down at 75 degrees from just left of the clock, then level to the lever box; the
  undercarriage lights box moved right and narrowed (flagged); D154: replaced by a straight edge from about 10 mm left of
  the clock to the lever box (the lights box back); D155: that edge carried on to touch the left fuselage sheet, then
  straight down.
- D156: the clock is mounted directly in the panel; its bracket is removed.
- D157: the undercarriage indicator lights are in a round housing.
- D158: the undercarriage lights housing is the round counter's diameter.
- D159: the course box is as wide as the repeater compass, under it.
- D160: the dials' markings and hands are white, and the screws black.
- D161: an elevator trim indicator (0 at 9 o'clock) below the airspeed indicator, in the AEG indicator's place.
- D162: the airspeed indicator, altimeter, undercarriage lights and round counter stand in the turn and slip
  indicator's black mounting (the red bezels gone).
- D163: the airscrew pitch indicators are removed (the Bf 110 C had none, product owner).
- D164: the elevator trim indicator is redrawn after #34's AEG instrument (five marks, a very short pointer, the rudder
  trim's L R shown only).
- D165: the right engine's rev counter and manifold pressure gauge moved 25 mm right.
- D166, D167: the left engine's moved 15 mm, then 5 mm more, right; D168: all four engine gauges 5 mm up.
- D169: the outside air thermometer lined up with the left manifold pressure gauge, 5 mm up.
- D170: the rev counters a further 3 mm up.
- D171: plate round the manifold pressure gauges (recess removed); D172: the round counter and Heizung placard 4 mm up.
- D173-D175: the turn and slip indicator, the elevator trim indicator and the climb indicator the airspeed indicator's
  size.
- D176: the two-bar window above the altimeter 2 mm up.
- D177: the artificial horizon 15% larger than the airspeed indicator.
- D178: the Heizung placard lined up with the outside air thermometer.
- D179: the altimeter raised level with the trim indicator.
- D180: the Kurs strip, turn and slip, horizon, altimeter, climb indicator and round counter 5 mm right.
- D181: the artificial horizon has a round glass face, level marks at 9 and 3 o'clock, and no L or R.
- D182: the engine gauges keep their own size, and the gunsight stays on the panel's middle line, 5 mm left of the
  turn and slip (product owner's decisions).
- D183: the elevator trim indicator lined up under the airspeed indicator.
- D184: the turn and slip indicator on the artificial horizon's centre line.
- D185: the climb indicator as far from the turn and slip as that is from the airspeed indicator.
- D186: the round counter and the altimeter on the climb indicator's centre line.
- D187: the Kurssteuerung indicator on the Kurs strip's centre line.
- D188: the pitch control switches show a white knob at Automatik or Hand; Shift+P toggles them (Automatik is the
  automatic pitch, Hand is E/D).
- D189: the pitch levers' knobs in the Heizung knob's green.
- D190: the pitch levers' knobs 25 px across.
- D191: the pitch levers' knobs follow each engine's airscrew pitch (größer at fine, kleiner at coarse).
- D192: the engines moved out to 2.75 m (estimate) so the airscrew arcs clear the fuselage; the 3.1 m diameter is
  kept. The main wheels' track not moved (decision pending).
- D193: the Bf 110's nose rears up as the flaps go down, then sinks (S24); it dips as they come up. Size and duration
  are estimates.
- D194: the main wheels moved out with the engines to 2.75 m (track 5.5 m, estimate), under the nacelles (S24).
- D195: the four MG 17s checked (all fire on the MG trigger, 1,000 rounds each, about 54.5 s); each SKK 404-2 lamp
  lights red when its MG 17 is empty (product owner's choice; the block's real purpose is unsourced).
- D196: the SKK 404-2 block redrawn after the replica's photographs (raised lamp plate, Ein/Aus toggle, four ringed
  push-buttons), keeping Gerät-Nr. 102-84; the photos recorded as replica pictures (D195).
- D197: the round counter redrawn round after #34 (rivets, four-screw flange, raised lens plate, digit drums, ringed
  buttons), its lenses the SKK 404-2's, its size the climb indicator's.
- D198: the flap and undercarriage levers centred between the lever box and the compass, their T levers 15% larger.
- D199: the Fahrwerk and Landeklappe controls redrawn as push/pull valves, two bigger T-grips each (EIN, AUS), the
  one matching the movement shown pushed in (show only, keys unchanged); from unapproved leads, flagged.
- D200: the valve T-grips 20% then 10% bigger, the EIN / AUS label on the middle of each bar (the thumb's push).
- D201: the trim indicator's right side is now a flap indicator (Ein at 12 o'clock, Aus at 4 o'clock, a mark every 10°); the dark window
  at its top removed.
- D202: the trim and flap pointers twice as long.
- D203: a magnetic compass on a light grey bracket next to the Heizung placard, after #36 (its top right corner over
  the panel's edge); its card follows the heading
  (true, no variation).
- D204: the magnetic compass's lamp removed; its lubber line runs the face's full height.
- D205: the magnetic compass's face 4 mm wider (2 mm twice).
- D206: the dive placard, the Umschaltwarnung placard (with its lamps) and the two-bar window centred under the
  airspeed, turn and slip and climb indicators.
- D207: the Fahrwerk label level with the Landeklappe label.
- D208: the Achtung placard's lettering 1.5 times larger (the plate widened to 112 px, its lines broken shorter).
- D209: the airscrew lever box 10 mm shorter from its foot; the pitch knobs' travel adjusted to clear their labels.
- D210: the Achtung placard's Landeklappe warning above its Fahrwerk warning.
- D211: a second Fahrwerk label, 1.5 times the first's size, 1 mm below the lever box's foot at its right edge (the
  first still shown).
- D212: the Preßluft gauge 5 mm from the Fahrwerk and Landeklappe labels either side.
- D213: knurled emergency hand-wheels (44 mm in life) under the Fahrwerk and Landeklappe labels, shown only.
- D214: the Luftwaffe turn indicator's ball ran the wrong way (Bf 109 and Bf 110): fixed; the Bf 110 course box's
  ball now follows the sideways push too.
- D215: the twelve-aircraft timing test warms up for 3 s (GitHub's slower runner was still warming up after 1 s);
  its 100 ms budget unchanged.
- D194-D215 pushed (5 Nov 2026).

**Left:** the product owner's further adjustments; an approved source for the valves (the Bf 110 C handbook) if one
is bought; then Phase 6 checkpoint 5 after a plan.

**Known issues:**
- half rudder at cruise gives about 20° of sideslip and over 1 g sideways in the Bf 110 (D214): to check against sources;
- flaps jammed by damage leave the Landeklappe AUS T pushed in (D199);
- the left dash cover hides the top of the SKK block;
- the pitch indicators are small.

## Bf 110 C cockpit view (3 Nov 2026)

**Done** (D117-D139): the Bf 110's cockpit view drawn from #32 on the Bf 109's frame code. The product owner asked for
the windscreen frame first:
- the dash covers are removed;
- the corner grab handles are arcs from the top bar to the posts (D119);
- the outer posts stop at the panel's top corners (D120);
- the fuselage frames run from there to the foot of the screen (D121), now thin sheets from the posts' outside edges
  at 70° (D139);
- the windscreen's top bar ends at its own posts, and the corner gussets are removed (D122);
- thin posts join the windscreen frame's top corners to the outer frame's, behind the grab handles (D123, D124);
- the windscreen's top bar is raised to touch the handles, and the ledge knobs, canopy latch and lever are removed
  (D125);
- bars join the windscreen's top corners to the outer posts just below the handles, angled up slightly into the
  corners (D126, D127);
- the windscreen's bottom ledge is an arc, its ends a little lower (D128);
- lower windscreen frames run from the windscreen's lower corners out to the outer posts, level with the red button
  (D134, D135);
- dash covers: padded grey covers as on the product owner's photograph (#33), the top edge along the ledge's lower
  edge (an arc), the front edge straight to the outer posts, over the panel's top (D136-D138). Known issue: the left cover hides the top of the
  ammunition counter (decision pending).
- the panel is lowered until only the top halves of the lowest gauges show, and the Revi, the guns' line (now 0.450 of
  the screen) and the frame move down with it (D129);
- the Revi-110: the Bf 110's gunsight with a round glass as wide as its body, in a holder frame of the body's width
  (D130). Its body is cut to the brown pad's size, with the reticle in the glass's middle; the guns' line is now 0.474
  of the screen (D131). It has no mounting block or knob (D132). It stands on the panel's top, without its sun filter
  lever; the guns' line is now 0.447 of the screen (D133).
- **Frame:** the outer canopy frame with the corner grab handles, the fuselage frames, the armoured
  windscreen's own frame, and the dark cockpit sides.
- **3D:** the 3D frame hides looking ahead; the wings, engines and airscrews stay in view.

**Left:** the product owner's review of the windscreen frame and the dash covers; then Phase 6 checkpoint 5 after a
plan.

## Bf 110 C speed card and flap placard (3 Nov 2026)

**Done** (D116):
- the pilot's speed card below the trim gauge (155, 132, 170, 160, 220 km/h);
- the flap placard below the flap lever (250 km/h, take-off 0°, landing 50°), white on black;
- the pitch indicators at the clock's size.

The product owner considers the Bf 110 C panel finished (3 Nov 2026).

## Bf 110 C coolant thermometers (3 Nov 2026)

**Done** (D115):
- the Bf 109's coolant thermometer for each engine, either side of the fuel gauge, which is now the same size;
- the oil temperatures are no longer shown.

## Bf 110 C T-bar levers (3 Nov 2026)

**Done** (D114): the flap and undercarriage levers are upright T bars.

## Bf 110 C ammunition counter (3 Nov 2026)

**Done** (D113): the Bf 110's ammunition counter is now the one first built for the Bf 109 (D64, D65): spinning
windows, tapes, red lights when empty, and the EIN/AUS switch.

## Bf 110 C right shoulder and side (3 Nov 2026)

**Done** (D112):
- the right shoulder mirrors the left, and the top edge ends over the clock;
- the right-hand side leans out at 75°;
- the engine gauges stand close by that edge;
- the lower row's gaps are 15 px.

## Bf 110 C even instrument gaps (3 Nov 2026)

**Done** (D111):
- one even 10 px gap between the flying instruments in both rows;
- the strip compass's left edge lined up with the Patin compass's;
- the panel's right-hand side moved out 30 px to make room;
- the Revi stays above the climb indicator.

## Bf 110 C trim gauge (3 Nov 2026)

**Done** (D110): the Bf 110's trim indicator is now the Spitfire's trim gauge, at the clock's size. It is not original
to the Bf 110; the product owner chose it.

## Bf 110 C airscrew pitch indicators (2 Nov 2026)

**Done** (D109): the two gauges above the rev counters are now the Bf 109's airscrew pitch indicators, one for each
engine. They replace the fuel and oil pressure gauges.

## Bf 110 C flying instruments rearranged (2 Nov 2026)

**Done** (D108):
- **Removed:** the "00 00" instrument and the "4 MG / 2 MG" and "Umschalterstellung" strips.
- **Upper row:** the Patin compass, the turn and bank and the climb indicator (under the Revi), their bottoms aligned.
- **Lower row:** the strip compass, the enlarged horizon, the airspeed indicator and the altimeter, their bottoms
  aligned.

## Bf 109 instruments and Revi on the Bf 110 C panel (2 Nov 2026)

**Done** (D107):
- the Bf 110's airspeed indicator, altimeter, turn and bank and strip compass are now the Bf 109's, at its size on
  screen, with red bezels and setting knobs;
- the "L … R" instrument is replaced by the Bf 109's Revi, its body 20% shorter, standing above the turn and bank;
- the guns' line is raised to 0.41 of the screen to meet the Revi's glass.

**Left:** the rest of the Bf 110's cockpit view (its frame), when the product owner asks.

## Bf 110 C panel from the product owner's pictures (2 Nov 2026)

**Done** (D106): the Bf 110 C panel redrawn from #31 and #32, on its own outline. Working:
- the ammunition counter;
- the Landeklappe and Fahrwerk switches;
- the EIN/AUS lights;
- the radiator switches;
- the trim indicator;
- the fuel gauge (front left tank).

The rev counters read to 3,600. The added flap, undercarriage and trim displays are gone.

**Left:** the Bf 110's cockpit view (frame, Revi), from the product owner's pictures.

## Luftwaffe luminous dials (2 Nov 2026)

**Done** (D105): the Bf 110's and Bf 109's dials with light yellow (radium luminous) markings and hands: all but the
fuel gauges (and the Bf 109's fuel and oil pressure gauge).

## Welded cockpit frames (2 Nov 2026)

**Done** (D104): every front-view frame joint blends as welded (outlines drawn first, joining bars over the bars they
meet, their edges trimmed); RAF frames dark green with panel-coloured inside walls, Bf 109 frames dark grey; tests in
`tests/ui/frameBars.test.js`.

## RAF frames in the Bf 109's style (1 Nov 2026)

**Done** (D102): the Hurricane's and Spitfire's windscreen, coaming and fuselage side frames in the Bf 109 frames' style,
dark green with rivets; their fuselage inside walls in the panel's colour.

## Bf 109 front view as the museum photograph (1 Nov 2026)

**Done** (D103): the Bf 109's front frame redrawn as #16 with square joins: the posts closer together and leaning in 5°
to a cross bar above the Revi, then angling out to a narrower flat top frame's corners, with corner braces; the hood's sides meeting the steeper
fuselage sides, which run close by the panel to the foot of the screen; a thinner coaming between the posts; no band across the foot of the view; every frame in the coaming's style, dark grey
with rivets.

## Spitfire front view (1 Nov 2026)

**Done** (D102): the Spitfire's front view as the Hurricane's, with #29's differences: the outer windscreen legs leaning
in about 20° to a flat top bar with rounded corners and the rear-view mirror, and struts rising from the armoured
windscreen.

## Hurricane front view refined (1 Nov 2026)

**Done** (D101): thinner frames, the windshield 25% lower with its outer legs leaning in 15° and a shorter crown,
halfway frames on the side panes, the sills at the Bf 109's slope, the coaming close round the panel, and the GM 2 raised
so its glass stands above the coaming.

## Hurricane front view from the museum photograph (1 Nov 2026)

**Done** (D100): the Hurricane's outer windscreen frame, armoured windscreen, broad coaming and fuselage sides (sills,
side walls, dark interior) as the product owner's photograph #28.

## Hurricane and Spitfire front cockpit views (1 Nov 2026)

**Done** (D99): the Bf 109's treatment for the RAF fighters: their windscreen and canopy frames drawn with the panel
(the Spitfire's bows, the Hurricane's hoop), no nose or wings in the front view, the propeller arc kept; tests in
`tests/ui/rafFrame.test.js`.

**Left:** the Bf 110 panel, Revi and front view, from the product owner's pictures; then Phase 6 checkpoint 5.

## Bf 109 propeller arc centred (1 Nov 2026)

**Done** (D98): in the front view the propeller arc is centred on the drawn fuselage centre (between the windscreen
posts); the floating spinner is hidden there.

## Propeller arc; HUD and reticle in the outside views (1 Nov 2026)

**Done** (D97): a spinning propeller arc from the cockpit (the Bf 109's airscrew shows in its front view again); in the
outside views the panel hides, the reticle shows where the guns converge, and a HUD on the right gives the readings.

## Joystick propeller pitch buttons (1 Nov 2026)

**Done** (D96): Propeller pitch fine and coarse buttons in the joystick panel (J), 7 and 9 by default; on the RAF
fighters they move the rpm lever.

## Bf 109 pitch lever, undercarriage switch and lights, trim indicator (1 Nov 2026)

**Done** (D95):
- the lever switch between the turn and bank and the rev counter is the propeller pitch lever (Fine / Coarse), moving
  with the blade angle;
- the Fahrwerk selector is the undercarriage switch (U);
- the EIN/AUS lamps glow red with the undercarriage up and green with it down;
- the strip below the hand pump shows the elevator trim, 0 in the middle.

## Bf 109 MG 17 flashes on the coaming; hood bars removed (1 Nov 2026)

**Done** (D94): the MG 17 flashes on top of the coaming lip in the front view, well apart; the hood's cross bar and
corner braces removed.

## Whole Bf 109 panel in view; undercarriage and flap levers (1 Nov 2026)

**Done** (D93):
- the whole Bf 109 panel shows looking ahead: the guns' line 30% down the screen, the 3D picture lens-shifted to match;
- the switch between the turn and bank and the rev counter is the undercarriage lever (the product owner), labelled UP
  and DN, its knob following the undercarriage (key U);
- the left ball lever swings with the flaps (a deviation: the real flaps used a handwheel);
- the hat pushed forward looks up and ahead again.

## UP and DN on the Bf 109's undercarriage selector (1 Nov 2026)

**Done** (D92): UP beside Ein and DN beside Aus on the Fahrwerk selector, its placard drawn a little wider for them.

## Pilot's speed cards (1 Nov 2026)

**Done** (D91):
- a white speed card on the RAF panel left of the GM 2 and on the Bf 109's in place of the deviation card;
- the period sources' figures where found, the product owner's otherwise (the take-off speeds and the Hurricane's
  approach);
- tests in `tests/ui/speedCard.test.js`.

**Known issue:** the take-off speeds and the Hurricane's approach speed have no source yet (research gaps).

## Bf 109 front cockpit frame (1 Nov 2026)

**Done** (D90):
- the front view framed as the product owner's picture: the coaming's lip over the panel, the windscreen posts and the
  side frames, with the cockpit's dark interior round the panel;
- no nose, wings or airscrew in the front view; they and the 3D frame show again when looking round;
- tests in `tests/ui/bf109Frame.test.js`.

**Known issue:** on the ground, the view straight ahead is no longer blocked by the nose (the product owner's choice).

## Bf 109 E panel and Revi from the product owner's pictures (1 Nov 2026)

**Done** (D89):
- the restored Bf 109 E panel of the product owner's pictures, redrawn in code, with its own upper and lower plates;
- working: the flight and engine instruments, fuel contents (400 L, full), clock and the undercarriage selector
  (Fahrwerk Ein / Ruhe / Aus); the rest shown only;
- looking down (hat pushed forward, or drag the mouse down) slides the whole panel into view; the hat pulled back still
  looks behind;
- the Revi drawn square-on in front of the panel, its reticle redrawn from the product owner's photograph;
- removed: the ammunition counter, and the Bf 109's flap, trim and GEAR displays;
- the rev counter rescaled to the photographed 600-3,400 rpm (the Bf 110 shares it);
- tests in `tests/ui/bf109Panel.test.js` and `tests/ui/reflectorSight.test.js`.

**Left:**
- the product owner's browser test;
- then the Bf 110 panel and its Revi from their pictures.

**Known issues:**
- two lower-panel items are unidentified (shown only);
- the Revi's 100-mil ring is still an estimate (D33).

## Faster twelve-aircraft simulation (1 Nov 2026)

**Done** (D88):
- the push of 1 Nov reached GitHub but the deploy's timing test failed, so the live game was not updated;
- twelve aircraft now take 15.5 ms per simulated second, against 23 before;
- the bombers' cruising speed is no longer re-solved, and the stall angle is read off exact solutions while slats or
  flaps are part-way;
- the validation is unchanged.

**Pushed** with permission on 1 Nov 2026; the deploy succeeded and the live game is up to date.

## RAF reflector sight (1 Nov 2026)

**Done** (D87):
- the Barr & Stroud GM 2 drawn square-on in front of the panel, after the product owner's reference picture, with its
  reflector glass held in two short brackets (the product owner's photograph);
- the reticle only on the glass, on the guns' line;
- a simple GM 2 shape in 3D for looking round;
- tests in `tests/ui/reflectorSight.test.js`.

**Known issues:**
- the reticle's 100-mil ring is still an estimate (D33);
- the Luftwaffe sights are unchanged.

## Hurricane and Spitfire panel from the reference picture (1 Nov 2026)

**Done** (D86):
- the Spitfire I panel of the product owner's reference picture, redrawn in code, for both RAF fighters;
- working: flight and engine instruments, trim gauge, UP/DOWN indicator, flap lever, clock (local time);
- the rest shows normal operation;
- the green and orange bands kept;
- the MAP gauge removed;
- tests in `tests/ui/rafPanel.test.js`.

**Known issues:**
- on screen the instruments are smaller than on the old strip panel (the whole panel is shown, kept below the sight);
- the Hurricane uses the Spitfire's panel (flagged);
- the fuel gauge is static until fuel use is modelled.

## RAF engine gauges (28 Oct 2026)

**Done** (D85):
- a MAP gauge (in. Hg) below the rev counter, the same size; "in.Hg" above a larger MAP caption, "PSI" above BOOST;
- oil, radiator and boost gauges small, in a column right of them;
- green normal bands from the Spitfire I Pilot's Notes (S33), orange over +12 lb;
- tests in `tests/ui/tempGauges.test.js`.

**Known issue:** the in. Hg MAP gauge is not period RAF equipment (flagged, product owner's request).

## Air start rigged for full power (28 Oct 2026)

**Done** (D84):
- the air start is at full throttle and full rpm, radiator open, at the speed that holds level at 1,500 m;
- every aircraft is rigged there, so it flies straight and level hands-off;
- the joystick's throttle slider no longer takes over a new flight until it is moved;
- aileron powers refitted to keep the sourced roll figures matched;
- the stall test follows the bank continuously.

**Known issues:**
- at lower power the aircraft want a little opposite stick (about 1% at 90%, up to 5% at cruise);
- rigging for full power is a playability deviation (flagged).

## Phase 6 checkpoint 4: bombers and air gunners (28 Oct 2026)

**Done** (D83):
- flexible guns: the Bf 110's rear MG 15 and the He 111's five MG 15s and fixed tail MG 17, each within its arc,
  swinging at 60°/s, with 75-round drums and drum changes;
- AI air gunners: they aim with lead and error by skill, fire in bursts, hold fire with a friend in the line, can't
  shoot above 2 g, and can be wounded or killed; the player's Bf 110 rear gunner is AI;
- crewmen besides the pilot can be hit; killed ones don't bail out;
- bombers fly a route, close up when fighters come near, straggle home when badly damaged, and hand on the lead;
- tracers in the MG 15 drums (estimate); flashes at the flexible guns; F3 gunner lines;
- two fixes to the AI's hands in gentle turns;
- tests in `tests/weapons/mounts.test.js`, `tests/ai/gunner.test.js`, `tests/ai/bomber.test.js`.

**Known issues:**
- gunner ranges, aim error, bursts and the formation distances are estimates;
- the tracer burn time and drum loading are estimates (flagged);
- a single hand-held gun's recoil is left out;
- scenario 7 is the only bomber route until Phase 7's missions.

## Mid-air collisions (28 Oct 2026)

**Done** (D82):
- aircraft that fly into each other, the player's included, collide;
- both break up, losing the wing or tail struck, with the usual wreck, bail-out and messages;
- tests in `tests/core/collisions.test.js`.

**Known issue:** wrecks, falling parts and parachutists don't collide.

## Phase 6 checkpoint 3: fighter tactics and formations (28 Oct 2026)

**Done** (D81):
- fighters patrol, engage, attack, evade and disengage;
- the Bf 109 and Bf 110 boom-and-zoom by the Luftwaffe's doctrine (S22), and escape by climbing away, pushing over,
  a split-S or extending;
- the Bf 110 meets an attacker head-on when it sees him early (S25);
- RAF fighters turn and break;
- RAF fighters attack bombers from ahead or below (S29, S38);
- wingmen cover their leaders; escorts guard their bombers;
- F3 shows each AI's state;
- tests in `tests/ai/tactics.test.js`.

**Known issues:**
- the thresholds are estimates;
- no Bf 110 defensive circle;
- head-on passes between RAF fighters are often decisive;
- bombers had no gunners until checkpoint 4 (now done, D83).

## Phase 6 checkpoint 2b: bailing out and parachutes (27 Oct 2026)

**Done** (D80):
- crews bail out of lost or badly damaged aircraft, one man after another (He 111: 5, Bf 110: 2, fighters: 1);
- parachutes: free fall, the canopy opening after a count of three, then coming down at about 4.9 m/s (S42);
- the player bails out automatically when the aircraft is lost, or by holding Backspace (or joystick button 8) for
  1 s;
- the view follows the player down;
- tests in `tests/core/parachute.test.js` and `tests/core/bailout.test.js`.

**Known issues:**
- the same parachute figures serve the Luftwaffe (no German figures found);
- crew seats and exit times are estimates;
- the gunners' own wounds come in checkpoint 4.

## Phase 6 checkpoint 2: many aircraft and the AI pilot's hands (27 Oct 2026)

**Done** (D79):
- every aircraft is a craft in one simulation, the player's and the AI's alike, on the same flight model;
- the AI pilot's hands: steering, pulling, throttle, engine management, gunnery with lead, ground avoidance, formation
  places;
- simple behaviours: fighters pursue and fire, escorts keep station until enemies come near, bombers fly in a Kette;
- the skill table: Novice, Regular, Ace;
- scenario keys 6, 7, 8, 0;
- F3 lines;
- tests in `tests/ai/pilot.test.js` and `tests/core/scenarios.test.js`.

**Known issues:**
- the fighters' tactics are simple pursuit until checkpoint 3;
- the bombers have no gunners until checkpoint 4;
- draw calls grow about 75 per aircraft, to measure at 12.

## Phase 6 checkpoint 1: research (27 Oct 2026)

**Found** (D77):
- MG 15: 1,000-1,100 rounds/min and 75-round drums (S27, S25, S28);
- the Bf 110's rear gun: ±30° by 0-60°, 10 spare drums, about 10 s to change one, no aiming under g (S25);
- the He 111's five MG 15 positions, their mounts and drums (52 in all), and the fixed tail MG 17 (S28);
- the He 111 firing sectors and blind spots from the H-6/H-11 (S29, a close variant);
- Luftwaffe doctrine against Spitfires and Hurricanes (S22);
- Bf 110 tactics (S25);
- escort placement and RAF attacks on raids (S38).

**Left (open research gaps):** formation spacing; the H-3's own firing sectors; gun traverse rates and gunners' aim;
the He 111's formation cruise speed; the Bf 110 defensive circle.

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
