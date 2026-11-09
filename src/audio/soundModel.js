// What each sound is made from (Phase 7 checkpoint 5, D231), read from the simulation and free of the Web Audio API so
// it can be tested in Node; src/audio/audioEngine.js plays it. Audio only reads the simulation (D3).
//   Engine: one voice per engine, pitched at the four-stroke firing frequency (crankshaft rev/s × cylinders / 2), its
//     loudness and brightness rising with the manifold pressure (boost or ata). A stopped engine is silent.
//   Wind: loudness with the square of the indicated airspeed, brighter as it rises, a little more with the undercarriage
//     and flaps down.
//   Guns: the rounds each gun fired since the last frame, machine guns and cannon apart, fixed guns and air gunners'.
//   Other aircraft (the product owner, 9 Nov 2026): the nearest few within HEARING_RANGE, fading with distance, panned
//     by their bearing and pitched by the Doppler effect at the ISA speed of sound.
// Every loudness and tone curve here, HEARING_RANGE and MAX_HEARD are game design, tuned by ear (D231).

import { Vector3, Quaternion } from 'three';
import { engineFor } from '../aircraft/index.js';
import { atmosphere } from '../physics/atmosphere.js';

export const HEARING_RANGE = 1500; // m: other aircraft further than this aren't heard
export const MAX_HEARD = 6; // the nearest this many are heard
const RUNNING = 30; // rad/s (about 290 rpm): an engine turning slower than this isn't firing
const WIND_FULL = 200; // m/s EAS at which the wind is at full loudness
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** The firing frequency (Hz) of a four-stroke engine of `cylinders` turning at `omega` (rad/s, crankshaft). */
export const firingFrequency = (omega, cylinders) => (omega / (2 * Math.PI)) * (cylinders / 2);

/** How far the manifold pressure is from closed throttle to the highest rating: 0-1. */
function boostShare(engine, map) {
  const top = Math.max(...Object.values(engine.ratings).map((r) => r.map));
  return clamp01((map - engine.idleMap) / (top - engine.idleMap));
}

/**
 * Each engine's voice for an aircraft: [{ freq (Hz), gain (0-1), cutoff (Hz) }]. `plane` is its flight-model state,
 * `input` its controls (a failed engine is silent).
 */
export function engineVoices(ac, plane, input) {
  const engine = engineFor(ac);
  const last = plane.last;
  return plane.engines.map((e, i) => {
    const omega = e.omega;
    const running = omega > RUNNING && !input?.engines?.[i]?.failed;
    const share = boostShare(engine, last?.engines?.[i]?.map ?? last?.map ?? engine.idleMap);
    const cut = last?.cutout ?? 1; // the Merlin's negative-g cut-out (D23)
    const pace = clamp01(omega / engine.maxSpeed);
    return {
      freq: firingFrequency(omega, engine.cylinders),
      gain: running ? (0.25 + 0.75 * share) * (0.4 + 0.6 * pace) * (0.3 + 0.7 * cut) : 0,
      cutoff: 350 + 2650 * share,
    };
  });
}

/** The wind's voice at `eas` (m/s): { gain (0-1), cutoff (Hz) }; `gear` and `flaps` are 0-1. */
export function windVoice(eas, { gear = 0, flaps = 0 } = {}) {
  const v = Math.max(0, eas);
  return { gain: clamp01((v / WIND_FULL) ** 2 * (1 + 0.25 * gear + 0.15 * flaps)), cutoff: 300 + 12 * v };
}

/** Counts the rounds each aircraft's guns fired since it was last asked: a drum or belt refilled is not a shot. */
export class ShotCounter {
  constructor() {
    this.last = new WeakMap(); // gun or mount → its rounds when last counted
  }

  /** The rounds `craft` fired since the last call: { mg, cannon }. */
  count(craft) {
    const out = { mg: 0, cannon: 0 };
    const tally = (gun, group) => {
      const before = this.last.get(gun);
      this.last.set(gun, gun.rounds);
      if (before !== undefined && gun.rounds < before) out[group] += before - gun.rounds;
    };
    for (const gun of craft.armament ?? []) tally(gun, gun.group);
    for (const m of craft.gunnery?.mounts ?? []) tally(m, 'mg'); // the air gunners' MG 15s and MG 17s
    return out;
  }
}

const _q = new Quaternion();
const _rel = new Vector3();
const _u = new Vector3();

/**
 * The other aircraft heard from `listener` (a body: position, velocity, quaternion): up to MAX_HEARD within
 * HEARING_RANGE, nearest first, each { craft, distance, gain (0-1), doppler (pitch factor), pan (-1 left to 1 right) }.
 */
export function hearing(listener, crafts) {
  const c = atmosphere(listener.position.y).soundSpeed;
  _q.copy(listener.quaternion).invert();
  return crafts
    .map((craft) => ({ craft, distance: craft.plane.body.position.distanceTo(listener.position) }))
    .filter((h) => h.distance < HEARING_RANGE)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_HEARD)
    .map(({ craft, distance }) => {
      const body = craft.plane.body;
      _u.copy(body.position).sub(listener.position);
      if (distance > 1e-6) _u.divideScalar(distance);
      // The listener closing on the source raises the pitch; the source going away lowers it.
      const doppler = (c + listener.velocity.dot(_u)) / (c + body.velocity.dot(_u));
      _rel.copy(_u).applyQuaternion(_q); // in the listener's body axes: x the nose, z his right
      return { craft, distance, gain: (1 - distance / HEARING_RANGE) ** 2, doppler, pan: Math.max(-1, Math.min(1, _rel.z)) };
    });
}
