// The binary flight messages (Phase 9, D243): controls and snapshots survive the trip as the receiver needs them;
// controls are clamped to their legal ranges; malformed bytes are refused.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { createAircraft } from '../../src/physics/flightModel.js';
import { createArmament } from '../../src/weapons/guns.js';
import { captureState } from '../../src/mp/planeState.js';
import { encodeInputs, decodeInputs, quantiseInput, encodeSnapshot, decodeSnapshot, compactOf, messageKind, MSG_INPUTS, MSG_SNAPSHOT } from '../../src/mp/binary.js';

const sample = (k) => ({
  pitch: 0.31 * k, roll: -0.2, yaw: 0.05, throttle: 0.8, rpm: 0.9, trim: 0.1, rudderTrim: -0.05, flaps: 0.25, brake: 0,
  pitchSwitch: 1, gear: 1, radiator: 0, emergency: true, engineAssist: false, fireMg: k % 2 === 0, fireCannon: true, bailOut: false,
  seat: 'pilot', gunAz: Math.PI, gunEl: 0, gunTrigger: false,
});

describe('the controls message', () => {
  it('carries a few ticks of controls exactly as quantised, single and twin-engined, with the seat and gun aim', () => {
    const inputs = [sample(0), sample(1), { ...sample(2), seat: 'gunner', gunAz: 2.9, gunEl: 0.4, gunTrigger: true, engines: [{ throttle: 0.7, rpm: 1, failed: true }, { throttle: 0.6, rpm: 0.8, feather: true }] }];
    const buf = encodeInputs(1234, 1200, inputs);
    expect(messageKind(buf)).toBe(MSG_INPUTS);
    const d = decodeInputs(buf);
    expect([d.firstTick, d.viewTick]).toEqual([1234, 1200]);
    expect(d.inputs).toEqual(inputs.map(quantiseInput));
    expect(d.inputs[2].engines[0].failed).toBe(true);
    expect(d.inputs[2].seat).toBe('gunner');
    expect(quantiseInput(quantiseInput(inputs[2]))).toEqual(quantiseInput(inputs[2])); // quantising twice changes nothing
  });

  it('clamps every value to its legal range, and refuses malformed bytes', () => {
    const q = quantiseInput({ pitch: 9, roll: -9, yaw: NaN, throttle: 2, rpm: -1, trim: 3, flaps: 5, brake: 7, pitchSwitch: 4 });
    expect([q.pitch, q.roll, q.yaw, q.throttle, q.rpm, q.trim, q.flaps, q.brake, q.pitchSwitch]).toEqual([1, -1, 0, 1, 0, 1, 1, 1, 1]);
    expect(decodeInputs(new ArrayBuffer(3))).toBeNull();
    const buf = encodeInputs(1, 1, [sample(0)]);
    expect(decodeInputs(buf.slice(0, buf.byteLength - 1))).toBeNull();
    expect(decodeInputs('nonsense')).toBeNull();
  });
});

describe('the snapshot', () => {
  it('carries the player\'s own aircraft exactly and the others compactly', () => {
    const ac = aircraftById.bf110c4;
    const plane = createAircraft(ac, { altitude: 2400, speed: 120 });
    const guns = createArmament(ac);
    const { numbers, rest } = captureState(plane, guns);
    const other = compactOf(3, 2, createAircraft(aircraftById.spitfire, { altitude: 2000, x: 500 }), { shots: { mg: 12, cannon: 0 } });
    const buf = encodeSnapshot({ tick: 900, lead: 3, you: { slot: 1, spawn: 1, numbers, rest }, others: [other] });
    expect(messageKind(buf)).toBe(MSG_SNAPSHOT);
    const d = decodeSnapshot(buf);
    expect([d.tick, d.lead, d.you.slot]).toEqual([900, 3, 1]);
    expect([...d.you.numbers]).toEqual([...numbers]); // bit for bit
    expect(d.you.rest).toEqual(rest);
    const o = d.others[0];
    expect(o.slot).toBe(3);
    expect(o.position[0]).toBeCloseTo(500, 1);
    expect(o.position[1]).toBeCloseTo(2000, 1);
    expect(o.shots).toEqual({ mg: 12, cannon: 0 });
    expect(o.rpm).toHaveLength(1);
    expect(decodeSnapshot(buf.slice(0, buf.byteLength - 2))).toBeNull();
  });
});
