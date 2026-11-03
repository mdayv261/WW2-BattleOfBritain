// The Bf 110 C's pitch change with flaps (D193), as S24 describes it: "the nose first rears up, then sinks, and the
// eventual change of trim is very small". A passing moment while the flaps move (aero.flapCmLag, controls.flapLagTime),
// nose up as they go down and nose down as they come up, on top of the small final change (aero.flapCm). Flown hands
// off from trimmed level flight; each case is compared with the same flight without the passing moment.
import { describe, it, expect } from 'vitest';
import { start, run } from '../../src/dev/flightTests.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const base = aircraftById.bf110c4;
const without = { ...base, aero: { ...base.aero, flapCmLag: 0 } };
const deg = (rad) => rad / UNIT.DEG;
const at = (trace, s) => trace[Math.round(s * 120)];

/** Hands off at `kmh`, the flaps commanded by `flaps(t)`; `down` starts with them already down and settled. */
function fly(ac, { kmh = 220, seconds = 20, flaps, down = false }) {
  const { plane, input } = start(ac, { eas: kmh * UNIT.KMH });
  if (down) {
    plane.surfaces.flaps = 1;
    plane.surfaces.flapsLag = 1;
  }
  return run(plane, input, seconds, (t, p, inp) => { inp.flaps = flaps(t); });
}

describe('Bf 110 C flaps: the nose rears up, then sinks (S24, D193)', () => {
  it('rears the nose up about 2 degrees as the flaps go down, then lets it sink', () => {
    const trace = fly(base, { flaps: () => 1 });
    const start0 = deg(trace[0].pitch);
    const rise = trace.slice(0, 10 * 120).map((r) => deg(r.pitch) - start0);
    const peak = Math.max(...rise);
    expect(peak).toBeGreaterThan(1.5);
    expect(peak).toBeLessThan(4);
    const tPeak = rise.indexOf(peak) / 120;
    expect(tPeak).toBeGreaterThan(4); // while the flaps travel (8 s)
    expect(tPeak).toBeLessThan(10);
    expect(deg(at(trace, 20).pitch) - start0).toBeLessThan(0); // then it sinks
  });

  it('pitches nose up compared with the same flight without the passing moment', () => {
    const a = fly(base, { flaps: () => 1 });
    const b = fly(without, { flaps: () => 1 });
    for (const s of [2, 4, 8]) expect(deg(at(a, s).pitch - at(b, s).pitch), `${s} s`).toBeGreaterThan(0);
  });

  it('dips the nose as the flaps come up, compared with the same flight without it', () => {
    const a = fly(base, { flaps: () => 0, down: true, kmh: 200, seconds: 10 });
    const b = fly(without, { flaps: () => 0, down: true, kmh: 200, seconds: 10 });
    for (const s of [1, 2, 4]) expect(deg(at(a, s).q - at(b, s).q), `${s} s`).toBeLessThan(0);
    expect(deg(at(a, 4).pitch - at(b, 4).pitch)).toBeLessThan(-0.5);
  });

  it('leaves only the small final change once the flaps stop: the passing moment dies away', () => {
    const { plane, input } = start(base, { eas: 200 * UNIT.KMH });
    run(plane, input, 20, (t, p, inp) => { inp.flaps = 1; });
    expect(plane.surfaces.flaps).toBe(1);
    expect(plane.surfaces.flapsLag).toBeGreaterThan(0.99); // the lag has caught up: no passing moment left
  });

  it('gives the other aircraft no passing moment: their flaps behave as before', () => {
    for (const id of ['bf109e4', 'spitfire', 'hurricane', 'he111h']) {
      expect(aircraftById[id].aero.flapCmLag, id).toBeUndefined();
      const { plane, input } = start(aircraftById[id], { eas: 200 * UNIT.KMH });
      run(plane, input, 1, (t, p, inp) => { inp.flaps = 1; });
      expect(plane.surfaces.flapsLag, id).toBe(plane.surfaces.flaps); // no lag: the term is always 0
    }
  });
});
