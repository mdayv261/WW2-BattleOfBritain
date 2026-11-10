// Multiplayer settings shared by the room server and the browser (Phase 9, D243; adapted from Dawn Patrol's
// src/mp/netConfig.js, with the product owner's approval): room sizes, timings, room codes, the teams and their
// aircraft, and the match settings the host may choose. Network and game-flow values only: the flight physics and
// aircraft data stay in src/aircraft/ and are never changed by multiplayer.

import { sunPosition } from '../world/sun.js';

// Raised whenever a message changes shape, so an old cached page and a new server refuse each other ("please reload").
export const PROTOCOL_VERSION = 1;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const REJOIN_GRACE_S = 60; // a dropped player keeps their place this long
export const PING_INTERVAL_S = 2; // how often the browser measures its ping
export const SILENT_DROP_S = 20; // a connection silent this long is treated as dropped (a laptop asleep, Wi-Fi lost)
export const MAX_MESSAGE_BYTES = 4096; // larger text messages are ignored
export const MAX_BAD_MESSAGES = 50; // a socket sending more malformed messages than this is closed
export const RECONNECT_DELAYS_S = [1, 2, 4]; // the browser's own retries after a dropped connection

// ---- flying together ------------------------------------------------------------------------------
export const TICK_HZ = 120; // the server's physics steps per second (the same fixed step as single player)
export const TICK_MS = 1000 / TICK_HZ;
export const SNAPSHOT_EVERY = 4; // ticks between snapshots: 30 a second
export const INPUTS_PER_MESSAGE = 4; // ticks of controls in one message from a browser: 30 messages a second
export const SERVER_INTERVAL_MS = 16; // how often the room's timer runs the ticks that are due
export const MAX_TICKS_PER_CALLBACK = 24; // more than this (a stalled server) is dropped, not raced through
export const INPUT_AHEAD_MAX = TICK_HZ; // controls more than 1 s ahead of the server are refused
export const HANDS_OFF_TICKS = TICK_HZ; // no controls for this long: stick and rudder centred, throttle kept
export const LEAD_TARGET_TICKS = 2; // how early a browser's controls should reach the server, plus the jitter
export const CLOCK_RATE = 0.02; // the browser runs up to 2% fast or slow to keep that lead
export const CLOCK_RESET_TICKS = 30; // further off than this, the browser's clock jumps instead
export const HISTORY_TICKS = 2 * TICK_HZ; // own controls and states kept for replaying corrections
export const CORRECT = { position: 0.02, velocity: 0.02, angle: (0.1 * Math.PI) / 180, rate: 0.01, other: 1e-6 }; // differences (m, m/s, rad, rad/s, any) that make a correction
export const SMOOTH_S = 0.05; // time constant of fading out a correction (95% gone in 0.15 s)
export const SNAP_DISTANCE = 50; // m: a correction this big (a respawn) is not faded
export const INTERP_DELAY_MS = 100; // other aircraft are drawn this far in the past...
export const INTERP_DELAY_MAX_MS = 200; // ...rising to this on a jittery connection
export const EXTRAPOLATE_MAX_S = 0.5; // past the newest snapshot, carry on for at most this long
export const CATCH_UP_SPEED = 20; // m/s: a drawn aircraft that fell behind its true path closes the gap no faster
export const RESPAWN_S = 10; // back in the air this long after going down

// ---- combat -----------------------------------------------------------------------------------------
// Lag compensation: a round is tested against the targets where its shooter saw them, up to 0.4 s back (Dawn Patrol's
// cap: at 150 ms ping the round trip, the browser's lead and the drawing delay come to about 0.3-0.4 s).
export const MAX_REWIND_TICKS = Math.round(0.4 * TICK_HZ);
export const POSE_HISTORY_TICKS = TICK_HZ + 4; // the server keeps a second of every aircraft's poses
export const KILL_CREDIT_S = 15; // going down this soon after an enemy's hit is their kill
export const FX_MAX = 60; // impacts sent in one message at most
export const HIT_NOTICE_S = 2; // "You are hit!" at most this often
export const NAME_TAG_RANGE = 2000; // m: other players' names are shown out to this distance (the product owner, D245)

// ---- match flow -------------------------------------------------------------------------------------
export const RESULTS_S = 20; // the results stay up this long, then everyone is back in the lobby
export const EMPTY_TEAM_S = 30; // a team with nobody in the sky this long ends the match
export const END_CHECK_TICKS = TICK_HZ; // how often the match checks whether it is over

// Room codes: capitals and digits without the look-alikes I, O, 0 and 1.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

// The two teams and their fighters (GAME_SPEC §12: fighters only, no He 111).
export const TEAMS = { raf: 'RAF', luftwaffe: 'Luftwaffe' };
export const TEAM_IDS = Object.keys(TEAMS);
export const TEAM_AIRCRAFT = { raf: ['hurricane', 'spitfire'], luftwaffe: ['bf109e4', 'bf110c4'] };
export const NAME_MAX = 16;

/** The daylight start times on 15 August 1940: half-hours with the sun at least 5° up (as the mission setup, D225). */
export const DAYLIGHT_HOURS = Array.from({ length: 48 }, (_, i) => i / 2)
  .filter((h) => sunPosition({ year: 1940, month: 8, day: 15, hoursUtc: h }).elevation >= 5);

// What the host can set, with the first-time values. Where a match starts and where a pilot comes back after going down
// (the product owner, 10 Nov 2026): on the side's airfield apron, or in the air at AIR_SPAWN.altitude (8,000 ft),
// AIR_SPAWN.distance (5 km) from the nearest enemy player.
export const SETTING_CHOICES = {
  start: ['air', 'apron'],
  respawn: ['air', 'apron'],
  hoursUtc: DAYLIGHT_HOURS,
  scoreLimit: [3, 5, 10, 20], // team kills to win
  timeLimit: [5, 10, 15, 20], // minutes
  friendlyFire: [false, true],
  structuralDamage: [true, false],
};
export const DEFAULT_SETTINGS = { start: 'air', respawn: 'air', hoursUtc: 13, scoreLimit: 5, timeLimit: 10, friendlyFire: false, structuralDamage: true };
export const AIR_SPAWN = { altitude: 8000 * 0.3048, distance: 5000, spacing: 300 }; // m: 8,000 ft, 5 km, 300 m apart

/** Settings from anything: each value must be one of its choices, else it stays as in `base`. */
export function cleanSettings(raw, base = DEFAULT_SETTINGS) {
  const out = { ...base };
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, choices] of Object.entries(SETTING_CHOICES)) if (key in raw && choices.includes(raw[key])) out[key] = raw[key];
  return out;
}
