# Release checklist: 1.0.0

Phase 10's acceptance test is the product owner's sign-off on this checklist (D250). Results: **Pass**, **Fail** (with
a note), or **Not tested** (with the reason). "Earlier" means confirmed at an earlier phase's sign-off or test, with the
decision that records it.

## Automated (Claude, 15 Nov 2026)

| # | Check | Result | Note |
|---|---|---|---|
| A1 | `npm test` | Pass | 2,093 tests, 99 files |
| A2 | `npm run validate` | Pass | Output unchanged since Phase 9 (md5 c1732d9); deviations listed in FLIGHT_VALIDATION.md |
| A3 | `npm run build` | Pass | |
| A4 | Multiplayer smoke test against the Cloudflare server | Pass | Four scripted players: create, join, start, fly, results, host passing on |
| A5 | 10-minute load test against Cloudflare | Pass | D246: 30 snapshots a second each, nobody cut off |
| A6 | Load size of the live site | Pass | About 660 KB compressed on first visit (D252) |
| A7 | No console errors in the Chrome checks | Pass | Every checkpoint's Chrome check (D245-D253) |

## Flying (product owner)

| # | Check | Result | Note |
|---|---|---|---|
| F1 | Each flyable aircraft (Hurricane, Spitfire, Bf 109, Bf 110) takes off, flies and lands | Earlier: Pass | Phases 1-3 sign-offs (D27, D35, D50); take-off help (D248) |
| F2 | Stall, spin and recovery; the Merlin's negative-g cut-out | Earlier: Pass | Phase 1 (D27): stalls, and spins (flat, an accepted deviation); the cut-out by automated tests (tests/physics/engine.test.js) |
| F3 | The Bf 110 on one engine, and feathering | Earlier: Pass | Phase 3 (D50) |
| F4 | Overheating, overspeed and the assists' warnings | Earlier: Pass | Heat and engine damage, Phase 5 (D75); overspeed and the warnings, Phase 8 (D242) |

## Missions and careers (product owner)

| # | Check | Result | Note |
|---|---|---|---|
| M1 | A dogfight from the menu to the results and back | Earlier: Pass | Phase 7 (D236, D237) |
| M2 | An RAF interception and a Luftwaffe escort | Earlier: Pass | Phase 7 (D236) |
| M3 | Ranks change with kills; a reload keeps them | Earlier: Pass | Phase 7 (D229, D236) |
| M4 | After a crash in a mission, the message says the results follow | Pass | New in D251; Accepted at the sign-off (15 Nov 2026) |

## Controls and settings (product owner)

| # | Check | Result | Note |
|---|---|---|---|
| C1 | Keyboard only | Earlier: Pass | Phase 8 (D242) |
| C2 | Joystick, with the J panel | Earlier: Pass | Phases 2 and 8 |
| C3 | Mouse flying | Earlier: Pass | Phase 8 (D239, D242) |
| C4 | Rebinding survives a reload | Earlier: Pass | Phase 8 (D242) |
| C5 | Settings, sound, HUD, assists | Earlier: Pass | Phase 7 (D232, D236) |
| C6 | The take-off trim key (/) and the auto-rudder on the ground | Earlier: Pass | D248 ("it works well") |
| C7 | Main menu → Guide: the guide reads correctly; Back | Pass | New in D253; Accepted at the sign-off (15 Nov 2026) |
| C8 | The About line shows version 1.0.0 | Pass | 1.0.0 confirmed in the live site's script after the push; Accepted at the sign-off (15 Nov 2026) |

## Multiplayer (product owner)

| # | Check | Result | Note |
|---|---|---|---|
| P1 | A match between different home networks, with fair hits | Earlier: Pass | Phase 9 acceptance (D249) |
| P2 | The lobby's lists, "I am ready" and Start | Earlier: Pass | D247 |
| P3 | A host who reloads stays host, in the same aircraft | Pass | New in D251; Accepted at the sign-off (15 Nov 2026) |
| P4 | The Bf 110's rear-gun swap in a match | Earlier: Pass | D245, D249 |

## Browsers and performance

| # | Check | Result | Note |
|---|---|---|---|
| B1 | Chrome | Pass | Every checkpoint's checks |
| B2 | Firefox | Not tested | The product owner's choice for 1.0 (D252); stated in the release notes |
| B3 | 60 fps on a mid-range laptop | Not tested | The product owner's choice (D250); 75 fps on the development Mac |

## Records

| # | Check | Result | Note |
|---|---|---|---|
| R1 | Licences: only MIT-licensed software and public-domain map data; no paid or copyrighted assets | Pass | D1, D17; the guide's About |
| R2 | Privacy: no accounts; multiplayer names kept only in the room's memory; no server logs | Pass | docs/MULTIPLAYER_SPEC.md §6 |
| R3 | Known limitations and deviations listed | Pass | docs/RELEASE_NOTES.md |

## Sign-off

- [x] The product owner has checked M4, C7, C8 and P3 (after the push and the server deployment) and accepts the
  checklist and the release notes as they stand.

Signed off by the product owner on 15 Nov 2026 (D255): Phase 10 passes its acceptance test.
