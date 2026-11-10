// Your own aircraft in a match, flown at once in your browser ("prediction") and kept true to the server (Phase 9, D245;
// Dawn Patrol's src/net/prediction.js, with the product owner's approval, using this game's exact aircraft state,
// src/mp/planeState.js). Each tick the controls used and the state after the step are recorded. When the server's state
// for a tick arrives it is compared with the record for that tick; if they differ (a hit, controls that arrived late,
// the AI pilot's changing hand while you are on the Bf 110's rear gun), the aircraft is put back to the server's state
// and the controls since then are replayed. What you see does not jump: the difference fades out over about 0.15 s
// (unless it is over 50 m: a respawn).

import { Quaternion, Vector3 } from 'three';
import { captureState, restoreState } from '../mp/planeState.js';
import { HISTORY_TICKS, CORRECT, SMOOTH_S, SNAP_DISTANCE } from '../mp/netConfig.js';

const _q = new Quaternion();
const _id = new Quaternion();
const BODY = 13; // position, velocity, orientation, rates: the start of a captured state's numbers

/** The damage record as compared (its log is only for the readouts). */
const damageKey = (rest) => {
  const { log, ...d } = rest.damage;
  return JSON.stringify([d, rest.crash ?? null]);
};

/** Do two captured states differ by more than the correction limits? */
export function differs(mine, theirs) {
  const a = mine.numbers;
  const b = theirs.numbers;
  if (a.length !== b.length) return true;
  for (let k = 0; k < 3; k += 1) if (Math.abs(a[k] - b[k]) > CORRECT.position) return true;
  for (let k = 3; k < 6; k += 1) if (Math.abs(a[k] - b[k]) > CORRECT.velocity) return true;
  const dot = Math.abs(a[6] * b[6] + a[7] * b[7] + a[8] * b[8] + a[9] * b[9]);
  if (2 * Math.acos(Math.min(1, dot)) > CORRECT.angle) return true;
  for (let k = 10; k < BODY; k += 1) if (Math.abs(a[k] - b[k]) > CORRECT.rate) return true;
  for (let k = BODY; k < a.length; k += 1) {
    if (Number.isNaN(a[k]) !== Number.isNaN(b[k])) return true;
    if (!Number.isNaN(a[k]) && Math.abs(a[k] - b[k]) > CORRECT.other * Math.max(1, Math.abs(b[k]))) return true;
  }
  return damageKey(mine.rest) !== damageKey(theirs.rest);
}

export class Prediction {
  /**
   * own: { plane, armament } (your aircraft and its fixed guns, read afresh each time: a respawn replaces them);
   * fly(tick, input): flies one tick of `input` with no effects (the same steps as the server's, src/mp/flyTick.js).
   */
  constructor({ own, fly }) {
    Object.assign(this, { own, fly });
    this.history = new Map(); // tick -> { input, state }
    this.offset = new Vector3(); // shown position minus true position, fading to nothing
    this.turn = new Quaternion(); // the same for the orientation
    this.corrections = 0; // count, for the F3 numbers
    this.lastError = 0; // m, the size of the last correction
    this.largest = 0; // m, the largest correction faded so far
  }

  /** After flying tick `tick` with `input`. */
  record(tick, input) {
    this.history.set(tick, { input, state: captureState(this.own.plane, this.own.armament) });
    this.history.delete(tick - HISTORY_TICKS);
  }

  /**
   * The server's state for `tick` ({ numbers, rest }); `now`: the last tick flown here. hard: a respawn or a restart, so
   * no comparing and no fading. Returns true if a correction was made.
   */
  onServerState(tick, state, now, hard = false) {
    const mine = this.history.get(tick);
    if (!hard && mine && !differs(mine.state, state)) return false;
    const body = this.own.plane.body;
    const before = body.position.clone();
    const beforeQ = body.quaternion.clone();
    restoreState(this.own.plane, state, this.own.armament);
    this.history.set(tick, { input: mine?.input ?? null, state });
    this.replay(tick, now);
    const jump = before.distanceTo(body.position);
    this.lastError = jump;
    if (hard || !mine || jump > SNAP_DISTANCE || this.offset.length() + jump > SNAP_DISTANCE) {
      this.offset.set(0, 0, 0);
      this.turn.identity();
    } else {
      this.offset.add(before.sub(body.position));
      this.turn.premultiply(_q.copy(beforeQ).multiply(body.quaternion.clone().invert()));
      this.corrections += 1;
      this.largest = Math.max(this.largest, jump);
    }
    return true;
  }

  /** Flies again from `from` to `now` with the recorded controls (a tick never recorded repeats the one before, as the server does). */
  replay(from, now) {
    let input = this.history.get(from)?.input ?? null;
    for (let t = from + 1; t <= now; t += 1) {
      const h = this.history.get(t);
      input = h?.input ?? input;
      if (!input) break;
      this.fly(t, input);
      this.history.set(t, { input, state: captureState(this.own.plane, this.own.armament) });
    }
  }

  /** Fades the shown difference (once a frame). */
  fade(realDt) {
    const k = Math.exp(-realDt / SMOOTH_S);
    this.offset.multiplyScalar(k);
    this.turn.slerp(_id, 1 - k);
  }

  /** Where to draw the aircraft: its true pose plus what is left of the difference. */
  shown(position, quaternion) {
    position.add(this.offset);
    quaternion.premultiply(this.turn);
  }

  clear() {
    this.history.clear();
    this.offset.set(0, 0, 0);
    this.turn.identity();
  }
}
