// Wings, tailplanes and fins for the aircraft models (D54), with their control surfaces cut from the trailing edge and
// hung on hinges so they can move. A spec describes one half (span along +Z from `root` to `semi`):
//   { root, semi, chord: (s) -> m, le: (s) -> leading-edge x, y: (s) -> chord-line height, t: (s) -> thickness ratio,
//     cuts: [{ name, from, to, depth }] (span positions in m, depth as a fraction of chord), steps }
// buildHalf returns { fixed: geometry, movers: [{ name, geometry, hinge: { a, b } }] } in body axes.

import * as THREE from 'three';
import { surface, merge } from './geometry.js';

/** Span positions: evenly spaced, plus every cut's ends. */
function spanPoints(spec) {
  const { root, semi, cuts = [], steps = 10 } = spec;
  const set = new Set(Array.from({ length: steps + 1 }, (_, k) => root + ((semi - root) * k) / steps));
  for (const c of cuts) {
    set.add(c.from);
    set.add(c.to);
  }
  return [...set].filter((s) => s >= root - 1e-9 && s <= semi + 1e-9).sort((a, b) => a - b);
}

const station = (spec, s) => ({ s, le: spec.le(s), chord: spec.chord(s), y: spec.y(s), t: spec.t(s) });

/** One half of a lifting surface, its control surfaces separate. */
export function buildHalf(spec) {
  const points = spanPoints(spec);
  const cutAt = (s0, s1) => (spec.cuts ?? []).find((c) => s0 >= c.from - 1e-9 && s1 <= c.to + 1e-9);
  const fixed = [];
  let run = [];
  let runCut;
  const flush = () => {
    if (run.length > 1) fixed.push(surface(run.map((s) => station(spec, s)), { to: runCut ? 1 - runCut.depth : 1 }));
    run = [];
  };
  for (let i = 0; i < points.length - 1; i += 1) {
    const cut = cutAt(points[i], points[i + 1]);
    if (run.length && cut !== runCut) flush();
    runCut = cut;
    if (!run.length) run.push(points[i]);
    run.push(points[i + 1]);
  }
  flush();
  const movers = (spec.cuts ?? []).map((c) => {
    const span = points.filter((s) => s >= c.from - 1e-9 && s <= c.to + 1e-9);
    const stations = span.map((s) => station(spec, s));
    const hingePoint = (st) => new THREE.Vector3(st.le - (1 - c.depth) * st.chord, st.y, st.s);
    return {
      name: c.name,
      geometry: surface(stations, { from: 1 - c.depth }),
      hinge: { a: hingePoint(stations[0]), b: hingePoint(stations[stations.length - 1]) },
    };
  });
  return { fixed: merge(fixed), movers };
}

/** Chord of an elliptical planform at span s, never below `least` (a rounded tip). */
export const elliptic = (rootChord, semi, least = 0.15) => (s) => rootChord * Math.max(least, Math.sqrt(Math.max(0, 1 - (s / semi) ** 2)));

/** A straight taper from rootChord at s = 0 to tipChord at semi, rounded off over the last `round` of the span. */
export const tapered = (rootChord, tipChord, semi, round = 0) => (s) => {
  const c = rootChord + (tipChord - rootChord) * Math.min(1, s / semi);
  if (!round || s < semi * (1 - round)) return c;
  const k = (s - semi * (1 - round)) / (semi * round);
  return c * Math.sqrt(Math.max(0.04, 1 - k * k));
};

/** A linear function of s from v0 at s = 0 to v1 at s = semi. */
export const linear = (v0, v1, semi) => (s) => v0 + ((v1 - v0) * s) / semi;
