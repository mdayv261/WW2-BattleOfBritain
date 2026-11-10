// The frequent flight messages, packed as bytes (Phase 9, D243; after Dawn Patrol's src/mp/binary.js, with the product
// owner's approval, carrying this game's controls and aircraft state):
//   inputs    browser -> server, 30 a second: a few ticks of the player's controls (after their own assists, so the
//             server needs none), with their seat in a Bf 110 and, on its rear gun, their aim and trigger (the server's AI
//             then flies: the product owner, 10 Nov 2026);
//   snapshot  server -> browser, 30 a second: your own aircraft exactly (src/mp/planeState.js), the others compactly.

import { Quaternion, Vector3 } from 'three';

export const MSG_INPUTS = 1;
export const MSG_SNAPSHOT = 2;
const MAX_INPUTS = 16;
const S16 = 32767;
const U16 = 65535;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 0));
const s16 = (v) => Math.round(clamp(v, -1, 1) * S16) / S16;
const u16 = (v) => Math.round(clamp(v, 0, 1) * U16) / U16;
const step = (v) => Math.sign(clamp(Math.round(v), -1, 1));
const ANGLE = 10000; // the gun's aim in 1/10,000 rad
const angle = (v) => Math.round(clamp(Math.atan2(Math.sin(v), Math.cos(v)), -Math.PI, Math.PI) * ANGLE) / ANGLE;

// ---- controls ---------------------------------------------------------------------------------------

/**
 * Controls rounded to the steps they are sent in: the browser flies its own prediction with exactly these values, so its
 * aircraft and the server's get identical controls. Rounding an already rounded input changes nothing.
 */
export function quantiseInput(i) {
  const out = {
    pitch: s16(i.pitch), roll: s16(i.roll), yaw: s16(i.yaw), throttle: u16(i.throttle), rpm: u16(i.rpm ?? 1),
    trim: s16(i.trim), rudderTrim: s16(i.rudderTrim ?? 0), flaps: u16(i.flaps ?? 0), brake: u16(i.brake ?? 0),
    pitchSwitch: step(i.pitchSwitch ?? 0), gear: i.gear ? 1 : 0, radiator: i.radiator ? 1 : 0,
    emergency: !!i.emergency, engineAssist: !!i.engineAssist, fireMg: !!i.fireMg, fireCannon: !!i.fireCannon, bailOut: !!i.bailOut,
    seat: i.seat === 'gunner' ? 'gunner' : 'pilot', gunAz: angle(i.gunAz ?? Math.PI), gunEl: angle(i.gunEl ?? 0), gunTrigger: !!i.gunTrigger,
  };
  // A twin's two engines (its own levers); a single engine runs on the main throttle and rpm.
  if (i.engines?.length === 2) {
    out.engines = i.engines.slice(0, 2).map((e) => ({
      throttle: u16(e.throttle ?? out.throttle), rpm: u16(e.rpm ?? out.rpm), pitchSwitch: step(e.pitchSwitch ?? 0), failed: !!e.failed, feather: !!e.feather,
    }));
  }
  return out;
}

const INPUT_BYTES = 25;
const ENGINE_BYTES = 6;
const inputSize = (i) => INPUT_BYTES + (i.engines?.length ?? 0) * ENGINE_BYTES;

/** inputs: one per tick from firstTick on (quantised); viewTick: the tick of the other aircraft on the player's screen. */
export function encodeInputs(firstTick, viewTick, inputs) {
  const qs = inputs.map(quantiseInput);
  const buf = new ArrayBuffer(10 + qs.reduce((a, i) => a + inputSize(i), 0));
  const d = new DataView(buf);
  d.setUint8(0, MSG_INPUTS);
  d.setUint32(1, firstTick);
  d.setUint8(5, qs.length);
  d.setUint32(6, Math.max(0, viewTick));
  let o = 10;
  for (const i of qs) {
    [i.pitch, i.roll, i.yaw, i.trim, i.rudderTrim].forEach((v, k) => d.setInt16(o + k * 2, Math.round(v * S16)));
    [i.throttle, i.rpm, i.flaps, i.brake].forEach((v, k) => d.setUint16(o + 10 + k * 2, Math.round(v * U16)));
    d.setInt8(o + 18, i.pitchSwitch);
    d.setUint8(o + 19, (i.gear ? 1 : 0) | (i.radiator ? 2 : 0) | (i.emergency ? 4 : 0) | (i.engineAssist ? 8 : 0)
      | (i.fireMg ? 16 : 0) | (i.fireCannon ? 32 : 0) | (i.bailOut ? 64 : 0) | (i.engines ? 128 : 0));
    d.setUint8(o + 20, (i.seat === 'gunner' ? 1 : 0) | (i.gunTrigger ? 2 : 0));
    d.setInt16(o + 21, Math.round(i.gunAz * ANGLE));
    d.setInt16(o + 23, Math.round(i.gunEl * ANGLE));
    o += INPUT_BYTES;
    for (const e of i.engines ?? []) {
      d.setUint16(o, Math.round(e.throttle * U16));
      d.setUint16(o + 2, Math.round(e.rpm * U16));
      d.setInt8(o + 4, e.pitchSwitch);
      d.setUint8(o + 5, (e.failed ? 1 : 0) | (e.feather ? 2 : 0));
      o += ENGINE_BYTES;
    }
  }
  return buf;
}

/** { firstTick, viewTick, inputs } or null if the bytes are not a well-formed inputs message. */
export function decodeInputs(buf) {
  if (!(buf instanceof ArrayBuffer) || buf.byteLength < 10) return null;
  const d = new DataView(buf);
  const n = d.getUint8(5);
  if (d.getUint8(0) !== MSG_INPUTS || n < 1 || n > MAX_INPUTS) return null;
  const inputs = [];
  let o = 10;
  for (let k = 0; k < n; k += 1) {
    if (o + INPUT_BYTES > buf.byteLength) return null;
    const [pitch, roll, yaw, trim, rudderTrim] = [0, 1, 2, 3, 4].map((j) => d.getInt16(o + j * 2) / S16);
    const [throttle, rpm, flaps, brake] = [0, 1, 2, 3].map((j) => d.getUint16(o + 10 + j * 2) / U16);
    const f = d.getUint8(o + 19);
    const input = {
      pitch: clamp(pitch, -1, 1), roll: clamp(roll, -1, 1), yaw: clamp(yaw, -1, 1), throttle, rpm, trim: clamp(trim, -1, 1),
      rudderTrim: clamp(rudderTrim, -1, 1), flaps, brake, pitchSwitch: step(d.getInt8(o + 18)), gear: f & 1 ? 1 : 0, radiator: f & 2 ? 1 : 0,
      emergency: !!(f & 4), engineAssist: !!(f & 8), fireMg: !!(f & 16), fireCannon: !!(f & 32), bailOut: !!(f & 64),
      seat: d.getUint8(o + 20) & 1 ? 'gunner' : 'pilot', gunTrigger: !!(d.getUint8(o + 20) & 2),
      gunAz: d.getInt16(o + 21) / ANGLE, gunEl: d.getInt16(o + 23) / ANGLE,
    };
    o += INPUT_BYTES;
    if (f & 128) {
      if (o + 2 * ENGINE_BYTES > buf.byteLength) return null;
      input.engines = [0, 1].map(() => {
        const e = { throttle: d.getUint16(o) / U16, rpm: d.getUint16(o + 2) / U16, pitchSwitch: step(d.getInt8(o + 4)), failed: !!(d.getUint8(o + 5) & 1), feather: !!(d.getUint8(o + 5) & 2) };
        o += ENGINE_BYTES;
        return e;
      });
    }
    inputs.push(input);
  }
  if (o !== buf.byteLength) return null;
  return { firstTick: d.getUint32(1), viewTick: d.getUint32(6), inputs };
}

// ---- snapshots ----------------------------------------------------------------------------------------
// One snapshot for one player: { tick, lead (ticks their controls arrived early), you, others }.
//   you: { slot, spawn, numbers (Float64Array), rest (plain object: damage, touchdown, crash, rearGun) } or null;
//   others: compact aircraft: { slot, spawn, down, position, quaternion, velocity, rates, surfaces { elevator, aileron,
//     rudder, flaps, gear }, rpm [one per engine], smoke (bits: 1 coolant, 2 oil, 4 fire), shots { mg, cannon },
//     rearGun { az, el, shots } or null }.

const HEAD = 11;
const COMPACT_BYTES = 58;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** An aircraft summarised for the others' snapshots. */
export function compactOf(slot, spawn, plane, { down = false, shots = { mg: 0, cannon: 0 }, rearGun = null } = {}) {
  const b = plane.body;
  const s = plane.surfaces;
  const heat = plane.engines.map((e) => e.heat);
  const smoke = (heat.some((h) => h.coolantLeak > 0) ? 1 : 0) | (heat.some((h) => h.oilLeak > 0) ? 2 : 0) | (plane.damage.fire ? 4 : 0);
  return {
    slot, spawn, down, smoke, shots, rearGun,
    position: [b.position.x, b.position.y, b.position.z],
    quaternion: [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w],
    velocity: [b.velocity.x, b.velocity.y, b.velocity.z],
    rates: [b.angularVelocity.x, b.angularVelocity.y, b.angularVelocity.z],
    surfaces: { elevator: s.elevator, aileron: s.aileron, rudder: s.rudder, flaps: s.flaps, gear: s.gear },
    rpm: plane.engines.map((e) => (e.omega * 60) / (2 * Math.PI)),
  };
}

export function encodeSnapshot({ tick, lead, you, others }) {
  const restBytes = you ? encoder.encode(JSON.stringify(you.rest)) : new Uint8Array(0);
  const youBytes = you ? 5 + you.numbers.length * 8 + 2 + restBytes.length : 0;
  const buf = new ArrayBuffer(HEAD + youBytes + others.length * COMPACT_BYTES);
  const d = new DataView(buf);
  d.setUint8(0, MSG_SNAPSHOT);
  d.setUint32(1, tick);
  d.setInt16(5, clamp(Math.round(lead), -32768, 32767));
  d.setUint16(7, you ? you.slot : 0);
  d.setUint8(9, others.length);
  d.setUint8(10, 0);
  let o = HEAD;
  if (you) {
    d.setUint16(o, you.slot);
    d.setUint8(o + 2, you.spawn & 255);
    d.setUint16(o + 3, you.numbers.length);
    you.numbers.forEach((v, k) => d.setFloat64(o + 5 + k * 8, v));
    o += 5 + you.numbers.length * 8;
    d.setUint16(o, restBytes.length);
    new Uint8Array(buf, o + 2, restBytes.length).set(restBytes);
    o += 2 + restBytes.length;
  }
  for (const c of others) {
    d.setUint16(o, c.slot);
    d.setUint8(o + 2, c.spawn & 255);
    d.setUint8(o + 3, (c.down ? 1 : 0) | (c.rearGun ? 2 : 0) | ((c.smoke & 7) << 2));
    c.position.forEach((v, k) => d.setFloat32(o + 4 + k * 4, v));
    c.quaternion.forEach((v, k) => d.setInt16(o + 16 + k * 2, Math.round(clamp(v, -1, 1) * S16)));
    c.velocity.forEach((v, k) => d.setInt16(o + 24 + k * 2, Math.round(clamp(v * 100, -32768, 32767))));
    c.rates.forEach((v, k) => d.setInt16(o + 30 + k * 2, Math.round(clamp(v * 1000, -32768, 32767))));
    ['elevator', 'aileron', 'rudder'].forEach((key, k) => d.setInt8(o + 36 + k, Math.round(clamp(c.surfaces[key], -1, 1) * 127)));
    d.setUint8(o + 39, Math.round(clamp(c.surfaces.flaps, 0, 1) * 255));
    d.setUint8(o + 40, Math.round(clamp(c.surfaces.gear, 0, 1) * 255));
    d.setUint8(o + 41, c.rpm.length);
    [0, 1].forEach((k) => d.setUint16(o + 42 + k * 2, Math.round(clamp(c.rpm[k] ?? 0, 0, U16))));
    d.setUint8(o + 46, clamp(c.shots.mg, 0, 255));
    d.setUint8(o + 47, clamp(c.shots.cannon, 0, 255));
    const g = c.rearGun ?? { az: 0, el: 0, shots: 0 };
    d.setInt16(o + 48, Math.round(clamp(g.az, -Math.PI, Math.PI) * 10000));
    d.setInt16(o + 50, Math.round(clamp(g.el, -Math.PI / 2, Math.PI / 2) * 10000));
    d.setUint8(o + 52, clamp(g.shots, 0, 255));
    o += COMPACT_BYTES;
  }
  return buf;
}

export function decodeSnapshot(buf) {
  if (!(buf instanceof ArrayBuffer) || buf.byteLength < HEAD) return null;
  const d = new DataView(buf);
  if (d.getUint8(0) !== MSG_SNAPSHOT) return null;
  const out = { tick: d.getUint32(1), lead: d.getInt16(5), you: null, others: [] };
  const n = d.getUint8(9);
  let o = HEAD;
  try {
    if (d.getUint16(7)) {
      const count = d.getUint16(o + 3);
      const numbers = new Float64Array(count);
      for (let k = 0; k < count; k += 1) numbers[k] = d.getFloat64(o + 5 + k * 8);
      const at = o + 5 + count * 8;
      const len = d.getUint16(at);
      const rest = JSON.parse(decoder.decode(new Uint8Array(buf, at + 2, len)));
      out.you = { slot: d.getUint16(o), spawn: d.getUint8(o + 2), numbers, rest };
      o = at + 2 + len;
    }
  } catch {
    return null;
  }
  if (buf.byteLength !== o + n * COMPACT_BYTES) return null;
  for (let i = 0; i < n; i += 1) {
    const flags = d.getUint8(o + 3);
    const q = [0, 1, 2, 3].map((k) => d.getInt16(o + 16 + k * 2) / S16);
    const len = Math.hypot(...q) || 1;
    const engines = d.getUint8(o + 41);
    out.others.push({
      slot: d.getUint16(o), spawn: d.getUint8(o + 2), down: !!(flags & 1), smoke: (flags >> 2) & 7,
      position: [0, 1, 2].map((k) => d.getFloat32(o + 4 + k * 4)),
      quaternion: q.map((v) => v / len),
      velocity: [0, 1, 2].map((k) => d.getInt16(o + 24 + k * 2) / 100),
      rates: [0, 1, 2].map((k) => d.getInt16(o + 30 + k * 2) / 1000),
      surfaces: {
        elevator: d.getInt8(o + 36) / 127, aileron: d.getInt8(o + 37) / 127, rudder: d.getInt8(o + 38) / 127,
        flaps: d.getUint8(o + 39) / 255, gear: d.getUint8(o + 40) / 255,
      },
      rpm: [0, 1].slice(0, engines).map((k) => d.getUint16(o + 42 + k * 2)),
      shots: { mg: d.getUint8(o + 46), cannon: d.getUint8(o + 47) },
      rearGun: flags & 2 ? { az: d.getInt16(o + 48) / 10000, el: d.getInt16(o + 50) / 10000, shots: d.getUint8(o + 52) } : null,
    });
    o += COMPACT_BYTES;
  }
  return out;
}

/** What kind of message these bytes are (MSG_INPUTS, MSG_SNAPSHOT), or 0. */
export const messageKind = (buf) => (buf instanceof ArrayBuffer && buf.byteLength > 0 ? new DataView(buf).getUint8(0) : 0);

/** A compact aircraft's pose as three.js objects, for drawing. */
export const poseOf = (c) => ({
  position: new Vector3(...c.position), quaternion: new Quaternion(...c.quaternion), velocity: new Vector3(...c.velocity),
});
