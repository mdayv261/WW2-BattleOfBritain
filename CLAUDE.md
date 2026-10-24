# Battle of Britain 1940

Full specification: @docs/GAME_SPEC.md
Current status: read docs/PROGRESS.md at the start of every session.
Design decisions: docs/DECISIONS.md. Aircraft data: docs/AIRCRAFT_DATA.md.

## Commands
- npm run dev       start the dev server
- npm test          run all tests
- npm run build     production build
- npm run validate  compare each flight model with its published performance

## Rules
- Work on one phase at a time. Do not start the next phase until I confirm the
  current one passes its acceptance test.
- Always propose a plan in plan mode before writing code.
- SI units internally. Physics constants live in src/aircraft/*.js data files,
  never inline in code. Convert only for display (RAF: mph, ft, lb/sq in boost;
  Luftwaffe: km/h, m, ata).
- Never invent aircraft data. Every value in docs/AIRCRAFT_DATA.md has: value,
  unit, original figure, source ID, confidence (high/medium/estimate).
  Estimates give a reason. Unfound values go under "Open research gaps".
- Sources: museum records, period test reports (A&AEE, RAE, Rechlin), Pilot's
  Notes and Luftwaffe handbooks, published reference books, NACA/NASA reports.
  No Wikipedia, Reddit or forums. Game-company pages are not sources.
- Flag every deviation from historical or published figures to me and record it.
- Write or update tests for every physics, weapons, AI and network change.
  Run npm test before saying a task is done.
- Keep files under about 400 lines; split modules when larger.
- This codebase is separate from Dawn Patrol. Do not copy its code unless I
  approve that module.
- Never push to GitHub, deploy to Cloudflare, create accounts or spend money
  without my permission each time.
- Explain results in plain English, tell me exactly what to test in the
  browser, and list any decisions you need from me.
- At the end of each task, update docs/PROGRESS.md (done, left, known issues)
  and record significant choices with reasons in docs/DECISIONS.md.
