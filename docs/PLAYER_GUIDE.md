# Battle of Britain 1940: player's guide

A flight simulator of the air battle over south-east England and the Channel in the summer of 1940. You fly the
Hurricane or Spitfire for the RAF, or the Bf 109 or Bf 110 for the Luftwaffe, against computer pilots or against other
people. The aircraft behave as the period test reports and pilot's notes describe them, so they take some learning.

The game runs in Chrome on a desktop or laptop computer. A joystick helps, but the keyboard and mouse work too.

## Getting started

1. **Test flight** is the place to learn. You start on your side's airfield with the engine off.
   - Press **1** to **4** for the Hurricane, Spitfire, Bf 109 or Bf 110 (**5** gives the He 111 bomber).
   - Press **N** to move to the next start: on the ground, on the approach to land, or in the air.
   - Press **R** to restart.
2. **Fly a mission** when you're ready to fight.
3. **Multiplayer** lets 2 to 4 people fly against each other: see "Multiplayer" below.

Press **H** in flight for the full list of keys, and **Esc** to pause.

## Flying the aircraft

### The main controls (keyboard)

- **Stick:** the arrow keys. **↑** pushes the nose down, **↓** pulls it up; **←** and **→** roll.
- **Rudder:** **Z** left, **X** right.
- **Throttle:** **W** opens it, **S** closes it.
- **Propeller:** **E** and **D** move the rpm lever (RAF), or make the pitch finer or coarser (Bf 109 and Bf 110).
- **Elevator trim:** **T** nose up, **G** nose down.
- **Rudder trim:** **,** left, **.** right. **/** sets the take-off rudder trim, or puts it back to neutral.
- **Flaps:** **F** down a stop, **Shift+F** up a stop. **U** raises or lowers the undercarriage. **B** holds the brakes.
- **Radiator:** **O** opens or shuts the radiator flap.
- **Engine:** **L** starts or stops it.
- **Guns:** **Space** fires the machine guns, **Enter** the cannon (Bf 109 and Bf 110).

Every key can be changed in **Settings → Controls**, and your keys are remembered.

### Joystick and mouse

- **Joystick:** plug it in and move the stick. Press **J** in flight for the joystick panel: choose which axis does
  what, reverse an axis, set its sensitivity and dead zone, set the neutral (hands off), and choose what each button
  does.
- **Mouse flying:** switch it on in **Settings**, then click the view to take the mouse. The mouse moves the stick, the
  wheel works the throttle, and the middle button (or **Num 5**) centres the stick.

### Views

- **C** switches between the cockpit and the outside views; **V** steps through the outside views.
- **Num 4 / 6 / 2 / 8** look left, right, behind and up while held.
- **I** hides or shows the instruments.
- **F2** shows a text readout of the flight; **F3** a panel of detailed numbers.

### Engines and their handling

- **The Merlin (Hurricane and Spitfire)** has a constant-speed propeller: set the rpm with the lever and the governor
  holds it.
  - Normal boost is +6¼ lb/sq in. **Q** pulls the boost cut-out for +12 lb/sq in emergency power, for short periods
    only.
  - The Merlin's carburettor cuts out under negative g: push the stick forward sharply and the engine stops for a
    moment.
- **The DB 601 (Bf 109 and Bf 110)** has fuel injection and keeps running under negative g.
  - The Bf 109's propeller pitch is automatic (**A** switches to manual). The Bf 110 has a pitch switch,
    Automatik / Hand (**Shift+P**).
- **The twins (Bf 110):** **K** chooses which engines the levers move (both, left or right), **M** feathers the chosen
  engine's propeller. The Bf 110 flies on one engine, better with the dead propeller feathered.
- **Heat:** high power at low speed heats the coolant. Open the radiator (**O**) before it gets too hot. An engine run
  too hot, or over its rpm limit for too long, is damaged and can seize.
- **The Bf 109's slats** open by themselves at high angles of attack and delay the stall.
- **At high speed the controls grow heavy,** as in the real aircraft: the Spitfire's ailerons especially, and all the
  Bf 109's controls.

### Taking off

The aircraft swing as the power comes on, and with no rudder they ground-loop. From a ground start:

1. Start the engine (**L**). Propeller lever or pitch fully forward. Flaps as each aircraft takes off (the Bf 109 used
   20°; the RAF fighters none).
2. In the Spitfire the rudder trim is already set fully right, as the Pilot's Notes say. **/** centres it after
   take-off.
3. Open the throttle fully and smoothly. Catch the swing with the rudder; ease the stick forward to raise the tail.
4. Let it fly itself off, then raise the undercarriage (**U**).

The **auto-rudder** assist holds your heading on the take-off run if you switch it on.

### Landing

- Slow down, lower the undercarriage (**U**) and the flaps (**F**), and fly the approach speed on the speed card in the
  cockpit.
- Close the throttle over the airfield, hold off, and touch down on all three wheels. Brake (**B**) once the tail is
  down.

### Trouble

- **Spins:** throttle closed, opposite rudder, stick forward, then ease out of the dive.
- **Bailing out:** hold **Backspace** for one second. The crew jump and the parachute opens.
- **Damage:** a hit in the radiator leaks glycol, then the engine overheats and seizes. Hits can also stop the engine,
  start a fire, wound the pilot or break controls.

## Missions

**Fly a mission** opens the mission setup:

- **Side and aircraft.**
- **Mission:**
  - **Dogfight:** RAF against Bf 109s or Bf 110s; Luftwaffe against Hurricanes or Spitfires.
  - **Interception (RAF):** stop a raid of He 111 bombers on Hawkinge, Lympne or Manston, with or without Bf 109
    escorts.
  - **Escort (Luftwaffe):** bring the bombers through the RAF's attackers.
- **Numbers:** the enemy, your wingmen, and the bombers. Up to twelve aircraft in all.
- **Enemy skill:** Novice, Regular or Ace. Skill changes reaction time, aim, energy and when they break off, never the
  aircraft's performance: the computer pilots fly the same aircraft as you do.
- **Start height and time of day** (15 August 1940).

A mission ends when its business is done, when you land at your own airfield, or when you're shot down. The results
show what happened and who scored. **Esc** pauses a mission; from the pause menu you can end it.

### Ranks

Each side has a career, kept in your browser. Ranks come from your mission kills; a shared kill counts half.

| Kills | RAF | Luftwaffe |
|---|---|---|
| 0 | Pilot Officer | Leutnant |
| 2 | Flying Officer | Oberleutnant |
| 5 | Flight Lieutenant | Hauptmann |
| 10 | Squadron Leader | Major |
| 20 | Wing Commander | Oberstleutnant |

## The RAF radar display

In the RAF aircraft, a round screen at the top left shows the enemy as blips on a compass ring. The ring turns with
your aircraft, so a blip at the top is dead ahead. A blip gives the bearing only, not height or numbers, and the plot
is updated every 20 seconds. **F4** hides or shows it.

## Settings and assists

**Settings** holds the volume (and the engine's own volume), the graphics level, the modern HUD in the cockpit, the
enemy pointers, mouse flying and your keys.

There is one realistic mode. Each assist is off until you switch it on:

- **Auto-rudder:** in the air, rudder against sideslip; on the ground, it holds your heading on the take-off and
  landing runs. Your own rudder always overrides it.
- **Stall warning** and **g warning.**
- **Engine management:** the automatic propeller pitch, and the radiator opened and shut for you.
- **Overspeed warning:** an engine over its rpm limit, or a dive near the airframe's limit.

## Multiplayer

2 to 4 people fly fighters against each other, RAF against Luftwaffe, in a private room joined with a code.

1. One player clicks **Multiplayer**, types a name and clicks **Create a room**, then sends the code to the others.
2. The others click **Multiplayer**, type their name and the code, and click **Join the room**.
3. Everyone picks a side and a fighter and clicks **I am ready**; the host clicks **Start the match**.

In a match:
- the score line at the top shows the score and the time left;
- names float over the other aircraft;
- shot down, you're back in the air 10 seconds later;
- in the Bf 110, **Tab** swaps you between the pilot's seat and the rear gun;
- **Esc** opens the match menu (the match doesn't pause);
- **F3** shows your ping and corrections.

## If something goes wrong

- **The keys don't fly the aircraft:** click the view first, so the game has the keyboard.
- **The joystick isn't found:** move the stick or press a button, then check the **J** panel.
- **The aircraft yaws or rolls with the stick centred:** set the joystick's neutral in the **J** panel.
- **Multiplayer can't join:** check the code (it never uses I, O, 0 or 1) and reload the page. Strict work or school
  networks can block the connection.
- **It runs slowly:** choose a lower graphics level in **Settings**.

## About

- **Aircraft data:** every performance figure comes from period test reports (A&AEE, RAE, Rechlin), pilot's notes
  and handbooks, museum records, NACA reports and published reference books. Each one, its source and how sure it is,
  are listed in the project's aircraft data document. Where nothing was found, the figure is an estimate and says why.
- **Map:** public-domain data (USGS GMTED2010 heights; Natural Earth towns and rivers).
- **Software:** Three.js and Vite (MIT licence). Everything else, the aircraft, cockpits, sounds and scenery, is made in
  the game's own code.
- **Markings** are typical of summer 1940, not those of particular squadrons or pilots.
