// Scripted test flights for checking and tuning handling (Phase 1 checkpoint 3). Each flight starts
// in balanced level flight, applies a timed sequence of inputs, and returns measurements. Used by
// tests/physics/handling.test.js and scripts/handling.mjs.

import { Euler, Vector3 } from 'three';
import { createAircraft, stepAircraft } from '../physics/flightModel.js';
import { levelThrottle } from '../core/simulation.js';
import { trueAirspeed, equivalentAirspeed } from '../physics/atmosphere.js';
import { stallSpeed } from '../physics/performance.js';
import { UNIT } from '../core/constants.js';

const DT = 1 / 120;
const DEG = UNIT.DEG;

/** Bank and pitch attitude (rad) of a body quaternion. */
export function attitude(q) {
  const e = new Euler().setFromQuaternion(q, 'YZX');
  return { bank: e.x, pitch: e.z };
}

/** Starts an aircraft in level flight at an equivalent airspeed (throttle for level flight unless given). */
export function start(ac, { altitude = 2000, eas, throttle, rpm = 1, heading = 0 }) {
  const speed = trueAirspeed(eas, altitude);
  const t = throttle ?? Math.min(1, levelThrottle(ac, altitude, speed, rpm));
  const plane = createAircraft(ac, { altitude, speed, heading, throttle: t, rpm });
  const input = { throttle: t, rpm, trim: plane.trim, engineAssist: true, pitch: 0, roll: 0, yaw: 0 };
  return { plane, input };
}

/** Steps for `seconds`, calling `control(t, plane, input)` before each step; records a trace. */
export function run(plane, input, seconds, control) {
  const trace = [];
  for (let t = 0; t < seconds; t += DT) {
    control?.(t, plane, input);
    stepAircraft(plane, input, DT);
    const { bank, pitch } = attitude(plane.body.quaternion);
    const w = plane.body.angularVelocity;
    trace.push({
      t, bank, pitch, p: w.x, q: w.z, r: -w.y, ...plane.last,
      stalled: Math.max(plane.last.stalledLeft, plane.last.stalledRight),
    });
  }
  return trace;
}

/** Power-off stall speed (equivalent airspeed) at 2000 m. */
export const stallEas = (ac) => equivalentAirspeed(stallSpeed(ac, { speed: ac.propeller.rpmMax, throttle: 0 }, 2000), 2000);

/** Stall: from 1.3 Vs at idle, pull the stick back steadily over 4 s and hold it. */
export function stallTest(ac) {
  const { plane, input } = start(ac, { eas: 1.3 * stallEas(ac), throttle: 0 });
  const trace = run(plane, input, 9, (t, p, i) => {
    i.throttle = 0;
    i.pitch = Math.min(1, t / 4);
  });
  const onset = trace.find((s) => s.stalled > 0.5);
  const after = onset ? trace.filter((s) => s.t >= onset.t && s.t <= onset.t + 3) : [];
  const bankAt = (s) => s.bank;
  const minBank = Math.min(...after.map(bankAt));
  const maxBank = Math.max(...after.map(bankAt));
  const drop = Math.abs(minBank) > Math.abs(maxBank) ? minBank : maxBank;
  return { stalled: !!onset, onsetTime: onset?.t, wingDrop: drop / DEG, onsetEas: onset ? onset.eas : null };
}

/**
 * Spin: full back stick and full rudder at idle for 6 s; then full opposite rudder with the stick
 * eased forward until the rotation stops, then controls central (the usual recovery).
 */
export function spinTest(ac, side = -1) {
  const { plane, input } = start(ac, { eas: 1.25 * stallEas(ac), throttle: 0 });
  let stopped = null;
  const trace = run(plane, input, 16, (t, p, i) => {
    i.throttle = 0;
    if (t < 6) {
      i.pitch = 1;
      i.yaw = side;
      return;
    }
    const r = -p.body.angularVelocity.y;
    if (stopped === null && t > 6.5 && Math.abs(r) < 0.3) stopped = t;
    if (stopped === null) {
      i.pitch = -0.3;
      i.yaw = -side;
    } else {
      i.pitch = 0;
      i.yaw = 0;
    }
    i.roll = 0;
  });
  const spinning = trace.filter((s) => s.t > 3 && s.t < 6);
  const turns = trace.filter((s) => s.t < 6).reduce((a, s) => a + s.r * DT, 0) / (2 * Math.PI);
  const turnsToRecover = stopped === null ? Infinity
    : Math.abs(trace.filter((s) => s.t >= 6 && s.t < stopped).reduce((a, s) => a + s.r * DT, 0)) / (2 * Math.PI);
  return {
    meanYawRate: spinning.reduce((a, s) => a + Math.abs(s.r), 0) / spinning.length,
    turnsIn6s: turns,
    stalledInSpin: spinning.reduce((a, s) => a + s.stalled, 0) / spinning.length,
    recoveredAfter: stopped === null ? Infinity : stopped - 6,
    turnsToRecover,
    altitudeLost: trace[0].altitude - trace[trace.length - 1].altitude,
  };
}

/** Steady roll rate with full stick (pilot strength limited) at an indicated airspeed and height. */
export function rollTest(ac, eas, altitude) {
  const { plane, input } = start(ac, { eas, altitude });
  const trace = run(plane, input, 2.5, (t, p, i) => {
    i.roll = t > 0.2 ? 1 : 0;
  });
  const late = trace.filter((s) => s.t > 1.5 && s.t < 2.5);
  const p = late.reduce((a, s) => a + s.p, 0) / late.length;
  const maxBeta = Math.max(...trace.map((s) => Math.abs(s.beta)));
  return { rollRate: p / DEG, pb2v: (p * ac.geometry.span) / (2 * plane.last.airspeed), maxSideslip: maxBeta / DEG };
}

/** Hard pull: abrupt full back stick at a speed, recording slats, bank excursion and peak g. */
export function hardPull(ac, eas, altitude = 2000, seconds = 2.5) {
  const { plane, input } = start(ac, { eas, altitude, throttle: 1 });
  const trace = run(plane, input, seconds, (t, p, i) => {
    i.pitch = t > 0.2 ? 1 : 0;
    i.throttle = 1;
  });
  const banks = trace.map((s) => s.bank);
  return {
    peakG: Math.max(...trace.map((s) => s.loadFactor)),
    bankExcursion: (Math.max(...banks.map(Math.abs))) / DEG,
    maxSlatDifference: Math.max(...trace.map((s) => Math.abs((s.slatLeft ?? 0) - (s.slatRight ?? 0)))),
    slatsOpened: Math.max(...trace.map((s) => Math.max(s.slatLeft ?? 0, s.slatRight ?? 0))),
    stalled: Math.max(...trace.map((s) => s.stalled)),
  };
}

/** Swing at full power and low speed with the rudder central: sideslip after 3 s (positive = nose left). */
export function swingTest(ac) {
  const { plane, input } = start(ac, { eas: 65, altitude: 500, throttle: 1 });
  const trace = run(plane, input, 3, (t, p, i) => {
    i.throttle = 1;
  });
  const last = trace[trace.length - 1];
  return { sideslip: last.beta / DEG, bank: last.bank / DEG, heading: new Vector3(1, 0, 0).applyQuaternion(plane.body.quaternion) };
}
