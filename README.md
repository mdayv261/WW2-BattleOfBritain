# Battle of Britain 1940

A browser flight simulator of the air battle over south-east England and the Channel in the summer of 1940. Fly the
Hurricane or Spitfire for the RAF, or the Bf 109 or Bf 110 for the Luftwaffe, against computer pilots in dogfights,
interceptions and escorts, or against 1-3 other people in multiplayer. The aircraft behave as the period test reports
and pilot's notes describe them.

**Play:** https://mdayv261.github.io/WW2-BattleOfBritain/ (Chrome, on a desktop or laptop; a joystick helps).

The player's guide is in the game (main menu → Guide) and in [docs/PLAYER_GUIDE.md](docs/PLAYER_GUIDE.md).

## What's in it

- **A six-degrees-of-freedom flight model** at 120 steps a second:
  - supercharged engines with their full-throttle heights;
  - constant-speed and VDM propellers;
  - lift and drag through the stall, and spins;
  - the Bf 109's slats;
  - coolant heat, and the Merlin's negative-g cut-out;
  - twin-engine flight on one engine;
  - ground handling.
- **Period guns and damage** to engines, coolant, fuel, crew, controls and structure.
- **AI pilots and air gunners** that fly the same aircraft as the player, at three skill levels.
- **Missions and careers:**
  - RAF dogfights and interceptions of He 111 raids, Luftwaffe dogfights and escorts;
  - ranks from kills;
  - the RAF radar display.
- **Period cockpits** in each side's units (mph, ft and lb/sq in boost for the RAF; km/h, m and ata for the Luftwaffe),
  with an optional modern HUD and optional assists.
- **Multiplayer** for 2-4 players, RAF against Luftwaffe, in private rooms, on an authoritative room server on
  Cloudflare. See [docs/MULTIPLAYER_GUIDE.md](docs/MULTIPLAYER_GUIDE.md).

## Running it

```
npm install
npm run dev        # the game at http://localhost:5173/WW2-BattleOfBritain/
npm test           # all the automated tests
npm run validate   # each flight model against its published performance
npm run build      # the production build (dist/)
```

Multiplayer on this computer: `npm run mp:setup` once, then `npm run mp:server` (the room server at
http://localhost:8787), and `npm run dev` in another terminal. `npm run mp:smoke` and `npm run mp:load` check a running
server.

A push to `main` runs the tests, builds and publishes the game to GitHub Pages (`.github/workflows/deploy.yml`).

## Documents

- [docs/GAME_SPEC.md](docs/GAME_SPEC.md): what the game is to be.
- [docs/AIRCRAFT_DATA.md](docs/AIRCRAFT_DATA.md): every aircraft figure with its value, unit, original figure, source
  and confidence; estimates give a reason; open research gaps at the end.
- [docs/FLIGHT_VALIDATION.md](docs/FLIGHT_VALIDATION.md): the flight models against their published performance.
- [docs/DECISIONS.md](docs/DECISIONS.md): every significant decision, with its reasons.
- [docs/PROGRESS.md](docs/PROGRESS.md): what's done, what's left, known issues.
- [docs/MULTIPLAYER_SPEC.md](docs/MULTIPLAYER_SPEC.md): the multiplayer design.

## Sources and licences

- **Aircraft data** come from period test reports (A&AEE, RAE, Rechlin), pilot's notes and handbooks, museum records,
  NACA reports and published reference books, each listed in docs/AIRCRAFT_DATA.md.
- **Map data** are public domain: USGS GMTED2010 heights and Natural Earth towns and rivers.
- **Software:** Three.js, Vite and Vitest (MIT licence). The aircraft, cockpits, sounds and scenery are all made in the
  game's own code. No paid or copyrighted assets are used.
