// One aircraft's state, exactly (Phase 9 checkpoint 1, D243): everything its next physics step depends on, captured
// and put back bit for bit. The room server sends a player's own aircraft this way, and the browser keeps its own past
// states to replay a correction (prediction, as Dawn Patrol's, D243). Two parts:
//   numbers: a Float64Array in a fixed order: the rigid body, the control surfaces, the clock and trim, each engine
//     (speed, blade angle, slipstream, the carburettor cut-out, heat and wear), the ground contact, and the fixed
//     guns' state (rounds, rounds owed, belt position, firing);
//   rest: a small plain object for the irregular parts: the damage record (its log cut to the last few entries, which
//     only the readouts use), the touchdown and crash records.
// The aircraft's data and terrain are not state: the receiver's own aircraft of the same type supplies them.

const SURFACES = ['elevator', 'aileron', 'rudder', 'trim', 'rudderTrim', 'flaps', 'flapsLag', 'gear', 'radiator', 'slatLeft', 'slatRight'];
const CUTOUT = ['factor', 'negTime', 'posTime', 'cut'];
const HEAT = ['coolant', 'oil', 'coolantLeft', 'coolantLeak', 'oilLeft', 'oilLeak', 'wear', 'seized', 'overTime'];
const GUN = ['rounds', 'owed', 'belt', 'firing', 'lastShot'];
const LOG_KEPT = 8;

const BODY = 13;
const PER_ENGINE = 3 + CUTOUT.length + HEAT.length;
const GROUND = 4;

/** How many numbers an aircraft with `engines` engines and `guns` fixed guns takes. */
export const numbersLength = (engines, guns) => BODY + SURFACES.length + 2 + engines * PER_ENGINE + GROUND + guns * GUN.length;

/** Is the aircraft of a captured state (with `engines` engines) on the ground? */
export const onGroundIn = (numbers, engines) => numbers[BODY + SURFACES.length + 2 + engines * PER_ENGINE + 3] === 1;

const num = (v) => (v === undefined || v === null ? NaN : typeof v === 'boolean' ? (v ? 1 : 0) : v);
const bool = (v) => v === 1;
const back = (v) => (Number.isNaN(v) ? undefined : v);

/** The state of `plane` (and its fixed guns, `armament`): { numbers: Float64Array, rest }. */
export function captureState(plane, armament = []) {
  const out = new Float64Array(numbersLength(plane.engines.length, armament.length));
  let k = 0;
  const put = (v) => { out[k++] = num(v); };
  const { position: p, velocity: v, quaternion: q, angularVelocity: w } = plane.body;
  [p.x, p.y, p.z, v.x, v.y, v.z, q.x, q.y, q.z, q.w, w.x, w.y, w.z].forEach(put);
  for (const key of SURFACES) put(plane.surfaces[key]);
  put(plane.time);
  put(plane.trim);
  for (const e of plane.engines) {
    put(e.omega);
    put(e.beta);
    put(e.slipQ);
    for (const key of CUTOUT) put(e.cutout[key]);
    for (const key of HEAT) put(e.heat[key]);
  }
  const g = plane.ground;
  for (let i = 0; i < 3; i += 1) put(g.touching[i]);
  put(g.onGround);
  for (const gun of armament) for (const key of GUN) put(gun[key] === -Infinity ? -1e9 : gun[key]);
  const { log, ...damage } = plane.damage;
  const rest = { damage: { ...structuredClone(damage), log: log.slice(-LOG_KEPT) }, touchdown: g.touchdown, crash: g.crash };
  return { numbers: out, rest: structuredClone(rest) };
}

/** Puts a captured state back into `plane` (an aircraft of the same type) and its `armament`. */
export function restoreState(plane, { numbers: a, rest }, armament = []) {
  let k = 0;
  const take = () => a[k++];
  const { position: p, velocity: v, quaternion: q, angularVelocity: w } = plane.body;
  p.set(take(), take(), take());
  v.set(take(), take(), take());
  q.set(take(), take(), take(), take());
  w.set(take(), take(), take());
  for (const key of SURFACES) {
    const x = back(take());
    if (x === undefined) delete plane.surfaces[key];
    else plane.surfaces[key] = x;
  }
  plane.time = take();
  plane.trim = take();
  for (const e of plane.engines) {
    e.omega = take();
    e.beta = take();
    e.slipQ = take();
    for (const key of CUTOUT) e.cutout[key] = key === 'cut' ? bool(take()) : take();
    for (const key of HEAT) e.heat[key] = key === 'seized' ? bool(take()) : take();
  }
  const g = plane.ground;
  g.touching = [bool(take()), bool(take()), bool(take())];
  g.onGround = bool(take());
  for (const gun of armament) {
    for (const key of GUN) {
      const x = take();
      gun[key] = key === 'firing' ? bool(x) : key === 'lastShot' && x === -1e9 ? -Infinity : x;
    }
  }
  const r = structuredClone(rest);
  plane.damage = r.damage;
  g.touchdown = r.touchdown;
  g.crash = r.crash;
}
