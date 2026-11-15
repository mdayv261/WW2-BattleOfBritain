# Battle of Britain 1940: release notes

## 1.0.0 (November 2026)

The first full release. Play at https://mdayv261.github.io/WW2-BattleOfBritain/.

### What's in it
- **Aircraft:** Hurricane Mk I and Spitfire Mk I (Merlin III, 100-octane fuel, +12 lb/sq in emergency boost, as in
  mid-August 1940); Bf 109 E-4 and Bf 110 C-4 (DB 601A); the He 111 H flown by the computer.
- **Flight model:**
  - six degrees of freedom at 120 steps a second, with the International Standard Atmosphere;
  - supercharged engines with their full-throttle heights;
  - constant-speed and VDM propellers;
  - stalls, wing drop and spins; the Bf 109's slats;
  - coolant heat and engine damage; the Merlin's negative-g cut-out;
  - the twins on one engine, with feathering;
  - control forces that grow with speed;
  - ground handling, ground loops and nose-overs.
  Each model is validated against its published figures (`npm run validate`, docs/FLIGHT_VALIDATION.md).
- **Weapons and damage:** each aircraft's period guns, ballistics and ammunition. Damage to the engine, coolant, oil,
  fuel, crew, armour, structure, controls, flaps and undercarriage feeds back into the flight. Smoke, glycol and fire.
- **The computer's pilots and gunners** fly the same aircraft and controls as you, at three skill levels, with the RAF's
  and the Luftwaffe's formations and tactics. The gunners aim with lead and error, and change drums.
- **Missions:** dogfights, RAF interceptions of He 111 raids, and Luftwaffe escorts; wingmen; ranks from kills.
- **Cockpits** for the four flyable aircraft, in each side's units, with each one's reflector sight. Also: the RAF
  radar display, an optional modern HUD, enemy pointers, and four optional assists.
- **Controls:** keyboard, joystick (calibrated in the J panel) and mouse flying; every key can be rebound.
- **Take-off help:** the Spitfire's take-off rudder trim from its Pilot's Notes (the **/** key), and an auto-rudder that
  holds the heading on the ground.
- **Multiplayer:** 2-4 players, RAF against Luftwaffe, in private rooms joined with a code. An authoritative room
  server on Cloudflare runs the same flight model for everyone and decides every hit. In the Bf 110, swap between the
  pilot's seat and the rear gun.
- **The player's guide** in the game (main menu → Guide) and in docs/PLAYER_GUIDE.md.

### Tested
- 2,093 automated tests; each flight model validated against its sources.
- Chrome on a Mac. Multiplayer between different home networks (the family test).

### Not tested
- **Firefox:** never tested (the product owner's choice for 1.0). The specification targets Chrome and Firefox.
- **A mid-range laptop:** the target of 60 fps there is unverified (the product owner's choice). On the Mac used for
  development the game runs at 75 fps with eleven computer aircraft.

### Known limitations
- **The computer's Bf 109 can't yet attack a lone RAF fighter** (D220): in an RAF dogfight against Bf 109s alone, they
  make few attacks.
- **Multiplayer:**
  - the first seconds of a match on Cloudflare run slightly fast;
  - the AI gunner's rounds in your own Bf 110 show a moment late;
  - the free server plan allows about 4½ hours of four-player flying a day, shared with Dawn Patrol;
  - updating the server ends any open rooms.
- **The radar** plots every enemy on the map. Radar cover and plotting errors aren't modelled.
- **Careers** live in one browser.
- **Differences from the published figures** remain in some performance and handling numbers. Each is listed with its
  size and reason in docs/FLIGHT_VALIDATION.md and docs/DECISIONS.md. They include the Spitfire's and Hurricane's
  ceilings, the Bf 109's and Bf 110's climb, the Spitfire's full-aileron roll, take-off and landing distances, flat
  spins, and the He 111, which flies with later engines than the 1940 H-3's.
- **Estimates where no source was found:** hit-zone sizes and damage, gun positions, gunner aim, crew exit times,
  parachutes, and the sights' 100-mil rings. Each is marked as an estimate in docs/AIRCRAFT_DATA.md, and the open
  research gaps are listed there.
- **Playability choices, flagged:**
  - the aircraft are rigged to fly straight at full power;
  - the Hurricane uses the Spitfire's panel layout;
  - the Bf 110's nose guns fire one tracer in four;
  - the Bf 109 brakes with the RAF's lever-and-rudder scheme, not its toe brakes (the joystick has none).
