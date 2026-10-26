// The shapes of the five aircraft models (D54): display estimates only, sized from each aircraft's flight data (span,
// length, dihedral, engine and wheel positions) and kept consistent with its crash contact points (belly, tail and
// wingtips) and the pilot's eye. Fuselage, canopy and gondola sections are [fraction of length from the nose,
// half-width, top, bottom] in metres; nacelle sections are [x from the airscrew hub, half-width, top, bottom]. Wings,
// tails and fins are specs for src/render/models/surfaces.js.
// What makes each recognisable: the Spitfire's elliptical wing; the Hurricane's deep, hump-backed fuselage and thick
// wing; the Bf 109 E's square-cut wingtips, high-set tailplane and slim nose; the Bf 110's twin fins and long
// glasshouse; the He 111's glazed nose, elliptical wing and ventral gondola.

import { elliptic, tapered, linear } from './surfaces.js';
import { thicknessAt } from './geometry.js';

/** A wing (or tailplane) half: planform `chord`, quarter-chord line at x `quarter` swept back by `sweep` per metre. */
function liftingSpec(ac, w, dihedral) {
  const semi = w.semi ?? ac.geometry.span / 2;
  return {
    root: w.root, semi, steps: w.steps ?? 12,
    chord: w.chord,
    le: (s) => w.quarter - (w.sweep ?? 0) * s + 0.25 * w.chord(s),
    y: (s) => w.y + s * Math.tan(dihedral),
    t: linear(w.tRoot, w.tTip, semi),
    cuts: w.cuts,
    breaks: w.breaks,
  };
}

const wingOf = (w) => (ac) => {
  const semi = ac.geometry.span / 2;
  const cut = (name, [from, to, depth]) => ({ name, from: from * semi, to: to * semi, depth });
  return liftingSpec(ac, { ...w, cuts: [cut('flap', w.flap), cut('aileron', w.aileron)] }, ac.aero.dihedral);
};

/** A design's wing, with a station where yellow wingtips begin so their edge is straight. */
const wingWithTips = (design, w) => (ac) => {
  const tips = design.yellow?.tipsFrom;
  return wingOf({ ...w, breaks: tips ? [tips] : [] })(ac);
};

const tailOf = (t) => (ac) => liftingSpec(ac, {
  ...t, root: 0.05, cuts: [{ name: 'elevator', from: 0.05, to: t.semi * 0.97, depth: t.elevator }],
}, 0);

/** A fin of height h with its rudder, its leading edge at x `le`, standing on y `base` at z. */
const finOf = ({ h, chord, le, base, z = 0, rudder = 0.45 }) => ({
  spec: {
    root: 0, semi: h, steps: 8, chord,
    le: (s) => le - 0.5 * (chord(0) - chord(s)), y: () => 0, t: () => 0.09,
    cuts: [{ name: 'rudder', from: 0, to: h * 0.96, depth: rudder }],
  },
  at: { x: 0, y: base, z },
});

/** Where a marking sits on a wing's upper (or lower) surface at span s: [x, y], clear of the thickest point. */
function onWing(spec, s, lower = false) {
  const chord = spec.chord(s);
  const half = thicknessAt(0.3, spec.t(s)) * chord + 0.012;
  return [spec.le(s) - 0.4 * chord, spec.y(s) + (lower ? -half : half)];
}

/** How far a fin marking at height h stands out from the fin's centre plane: clear of its thickest point. */
const finSide = (fin, h) => thicknessAt(0.3, fin.spec.t(h)) * fin.spec.chord(h) + 0.012;

/** A fuselage's half-width, half-height and centre height at a fraction of its length (linear between sections). */
export function sectionAt(design, f) {
  const s = design.fuselage;
  const i = Math.min(s.length - 1, Math.max(1, s.findIndex((p) => p[0] >= f)));
  const [f0, w0, top0, bottom0] = s[i - 1];
  const [f1, w1, top1, bottom1] = s[i];
  const k = Math.min(1, Math.max(0, (f - f0) / (f1 - f0 || 1)));
  const top = top0 + (top1 - top0) * k;
  const bottom = bottom0 + (bottom1 - bottom0) * k;
  return { w: w0 + (w1 - w0) * k, h: (top - bottom) / 2, y: (top + bottom) / 2, top, bottom };
}

/** Turns for flat markings (drawn facing +Z): onto an upper or lower wing surface tilted by the dihedral, or a side. */
const UP = (side, dihedral) => [-Math.PI / 2 - side * dihedral, 0, 0];
const DOWN = (side, dihedral) => [Math.PI / 2 - side * dihedral, 0, 0];
const SIDE = (side) => (side > 0 ? [0, 0, 0] : [0, Math.PI, 0]);

/** RAF markings: Type B roundels above the wings, A1 on the fuselage, the fin flash. */
function rafMarkings(design, { roundelAt = 0.62, wingRoundel, fuselageAt, flash }) {
  return (ac) => {
    const wing = design.wing(ac);
    const s = roundelAt * (ac.geometry.span / 2);
    const f = sectionAt(design, fuselageAt);
    const fx = design.nose - fuselageAt * ac.geometry.length;
    const fin = design.fins(ac)[0];
    const h = fin.spec.semi * 0.35;
    const finX = fin.spec.le(h) - 0.45 * fin.spec.chord(h);
    return [1, -1].flatMap((side) => [
      { kind: 'roundelB', size: [wingRoundel], at: [...onWing(wing, s), side * s], turn: UP(side, ac.aero.dihedral), on: 'wing' },
      { kind: 'roundelA1', size: [f.h * 1.4], at: [fx, f.y, side * (f.w + 0.012)], turn: SIDE(side) },
      { kind: 'finFlash', size: flash, at: [finX, fin.at.y + h, side * finSide(fin, h)], turn: SIDE(side) },
    ]);
  };
}

/** Luftwaffe markings: Balkenkreuz above and below the wings and on the fuselage; the swastika on the fin(s) (D16). */
function lwMarkings(design, { crossAt = 0.68, wingCross, fuselageAt }) {
  return (ac) => {
    const wing = design.wing(ac);
    const s = crossAt * (ac.geometry.span / 2);
    const f = sectionAt(design, fuselageAt);
    const fx = design.nose - fuselageAt * ac.geometry.length;
    const list = [1, -1].flatMap((side) => [
      { kind: 'balkenkreuz', size: [wingCross], at: [...onWing(wing, s), side * s], turn: UP(side, ac.aero.dihedral), on: 'wing' },
      { kind: 'balkenkreuz', size: [wingCross], at: [...onWing(wing, s, true), side * s], turn: DOWN(side, ac.aero.dihedral), on: 'wing' },
      { kind: 'balkenkreuz', size: [f.h * 1.3], at: [fx, f.y, side * (f.w + 0.012)], turn: SIDE(side) },
    ]);
    for (const fin of design.fins(ac)) {
      const h = fin.spec.semi * 0.55;
      const x = fin.spec.le(h) - 0.3 * fin.spec.chord(h);
      for (const side of [1, -1]) {
        list.push({ kind: 'swastika', size: [fin.spec.chord(h) * 0.42], at: [x, fin.at.y + h, fin.at.z + side * finSide(fin, h)], turn: SIDE(side) });
      }
    }
    return list;
  };
}

const spitfire = {
  scheme: 'raf', nose: 2.55, band: [-4.75, -5.1],
  fuselage: [[0, 0.03, 0.02, -0.02], [0.04, 0.33, 0.33, -0.33], [0.12, 0.4, 0.42, -0.55], [0.25, 0.43, 0.45, -0.75],
    [0.4, 0.42, 0.47, -0.75], [0.55, 0.33, 0.5, -0.6], [0.75, 0.2, 0.4, -0.42], [0.88, 0.11, 0.33, -0.33], [1, 0.03, 0.25, 0]],
  glazing: [[[0.36, 0.02, 0.47, 0.4], [0.39, 0.22, 0.72, 0.4], [0.45, 0.25, 0.78, 0.4], [0.52, 0.22, 0.74, 0.4], [0.57, 0.04, 0.52, 0.4]]],
  radiators: [{ x: -0.2, y: -0.8, z: 1.25, l: 1.0, w: 0.4, h: 0.3 }, { x: -0.1, y: -0.74, z: -1.25, l: 0.8, w: 0.25, h: 0.22 }],
  gear: { top: -0.55, retract: 'out' },
};
spitfire.wing = wingOf({ root: 0.4, chord: elliptic(2.54, 11.252 / 2, 0.12), quarter: 0.15, y: -0.55, tRoot: 0.13, tTip: 0.06, aileron: [0.6, 0.92, 0.28], flap: [0.1, 0.55, 0.22] });
spitfire.tailplane = tailOf({ semi: 1.65, chord: elliptic(1.15, 1.65, 0.25), quarter: -5.55, y: 0.1, tRoot: 0.1, tTip: 0.07, elevator: 0.4 });
spitfire.fins = () => [finOf({ h: 1.25, chord: elliptic(1.35, 1.25, 0.2), le: -5.2, base: 0.25 })];
spitfire.markings = rafMarkings(spitfire, { wingRoundel: 1.42, fuselageAt: 0.68, flash: [0.68, 0.6] });

const hurricane = {
  scheme: 'raf', nose: 2.62, band: [-4.95, -5.35],
  fuselage: [[0, 0.03, 0.02, -0.02], [0.04, 0.32, 0.32, -0.32], [0.13, 0.44, 0.48, -0.58], [0.25, 0.5, 0.52, -0.85],
    [0.36, 0.5, 0.44, -0.9], [0.5, 0.45, 0.82, -0.85], [0.65, 0.35, 0.68, -0.78], [0.8, 0.22, 0.5, -0.72],
    [0.92, 0.1, 0.4, -0.55], [1, 0.04, 0.3, -0.2]],
  glazing: [[[0.3, 0.02, 0.44, 0.35], [0.33, 0.25, 0.78, 0.35], [0.42, 0.27, 0.9, 0.35], [0.48, 0.25, 0.88, 0.35], [0.5, 0.05, 0.82, 0.35]]],
  radiators: [{ x: -0.6, y: -1.02, z: 0, l: 1.4, w: 0.6, h: 0.35 }],
  gear: { top: -0.75, retract: 'in' },
};
hurricane.wing = wingOf({ root: 0.45, chord: tapered(2.62, 1.35, 12.192 / 2, 0.08), quarter: 0.2, y: -0.64, tRoot: 0.19, tTip: 0.12, aileron: [0.62, 0.95, 0.25], flap: [0.1, 0.55, 0.2] });
hurricane.tailplane = tailOf({ semi: 1.6, chord: tapered(1.3, 0.8, 1.6, 0.3), quarter: -5.9, y: 0.25, tRoot: 0.1, tTip: 0.08, elevator: 0.4 });
hurricane.fins = () => [finOf({ h: 1.4, chord: tapered(1.55, 0.6, 1.4, 0.35), le: -5.35, base: 0.4, rudder: 0.5 })];
hurricane.markings = rafMarkings(hurricane, { wingRoundel: 1.42, fuselageAt: 0.66, flash: [0.7, 0.6] });

const bf109 = {
  scheme: 'lwFighter', nose: 2.76,
  fuselage: [[0, 0.03, 0.02, -0.02], [0.04, 0.28, 0.28, -0.28], [0.15, 0.4, 0.38, -0.5], [0.3, 0.42, 0.4, -0.62],
    [0.4, 0.4, 0.38, -0.6], [0.55, 0.32, 0.45, -0.4], [0.72, 0.22, 0.42, -0.1], [0.88, 0.12, 0.42, 0.17], [1, 0.04, 0.4, 0.25]],
  glazing: [[[0.33, 0.02, 0.38, 0.3], [0.355, 0.24, 0.7, 0.3], [0.46, 0.24, 0.74, 0.3], [0.54, 0.2, 0.5, 0.3], [0.56, 0.04, 0.44, 0.3]]],
  radiators: [{ x: -0.3, y: -0.6, z: 1.6, l: 0.9, w: 0.45, h: 0.18 }, { x: -0.3, y: -0.6, z: -1.6, l: 0.9, w: 0.45, h: 0.18 },
    { x: 1.5, y: -0.55, z: 0, l: 0.6, w: 0.3, h: 0.2 }],
  gear: { top: -0.45, retract: 'out' },
  // Yellow cowling (back to just ahead of the windscreen), wingtips (outer 0.95 m) and rudder: the product owner's
  // choice from a photograph (D56), extents by eye.
  yellow: { noseFrom: -0.1, tipsFrom: 4.0, rudder: true },
};
bf109.wing = wingWithTips(bf109, { root: 0.4, chord: tapered(2.2, 1.15, 9.9 / 2, 0.02), quarter: 0.35, y: -0.4, tRoot: 0.142, tTip: 0.11, aileron: [0.6, 0.97, 0.25], flap: [0.15, 0.58, 0.25] });
bf109.tailplane = tailOf({ semi: 1.55, chord: tapered(1.05, 0.6, 1.55, 0.25), quarter: -4.85, y: 0.62, tRoot: 0.1, tTip: 0.08, elevator: 0.38 });
bf109.fins = () => [finOf({ h: 1.0, chord: tapered(1.1, 0.55, 1.0, 0.4), le: -4.6, base: 0.38, rudder: 0.5 })];
bf109.markings = lwMarkings(bf109, { wingCross: 0.95, fuselageAt: 0.7 });

const bf110 = {
  scheme: 'lwFighter', nose: 4.45,
  fuselage: [[0, 0.2, 0.25, -0.25], [0.05, 0.42, 0.5, -0.6], [0.2, 0.5, 0.6, -0.9], [0.4, 0.5, 0.6, -0.95], [0.6, 0.38, 0.55, -0.65],
    [0.8, 0.24, 0.45, -0.35], [0.94, 0.14, 0.38, -0.12], [1, 0.07, 0.3, 0]],
  glazing: [[[0.18, 0.03, 0.6, 0.45], [0.21, 0.38, 1.05, 0.45], [0.45, 0.38, 1.08, 0.45], [0.52, 0.3, 0.9, 0.45], [0.55, 0.04, 0.6, 0.45]]],
  nacelles: [[[0.1, 0.05, 0.05, -0.05], [0, 0.42, 0.45, -0.45], [-0.6, 0.5, 0.55, -0.65], [-2.2, 0.45, 0.45, -0.65], [-3.6, 0.2, 0.2, -0.3]]],
  radiators: [{ x: -0.2, y: -0.62, z: 3.6, l: 1.0, w: 0.7, h: 0.2 }, { x: -0.2, y: -0.62, z: -3.6, l: 1.0, w: 0.7, h: 0.2 }],
  gear: { top: -0.3, retract: 'back' },
};
bf110.wing = wingOf({ root: 0.5, chord: tapered(3.1, 1.6, 16.2 / 2, 0.08), quarter: 0.45, sweep: 0.03, y: -0.4, tRoot: 0.18, tTip: 0.1, aileron: [0.62, 0.95, 0.27], flap: [0.12, 0.6, 0.25] });
bf110.tailplane = tailOf({ semi: 2.4, chord: tapered(1.4, 1.0, 2.4), quarter: -6.6, y: 0.35, tRoot: 0.1, tTip: 0.08, elevator: 0.4 });
bf110.fins = () => [-2.4, 2.4].map((z) => finOf({ h: 1.5, chord: tapered(1.25, 0.9, 1.5, 0.3), le: -6.25, base: -0.25, z }));
bf110.markings = lwMarkings(bf110, { wingCross: 1.2, fuselageAt: 0.7 });

const he111 = {
  scheme: 'lwBomber', nose: 6.45,
  fuselage: [[0.11, 0.85, 0.95, -1.1], [0.3, 0.88, 1.0, -1.15], [0.45, 0.8, 0.95, -1.15], [0.65, 0.55, 0.8, -0.8],
    [0.85, 0.3, 0.62, -0.35], [0.97, 0.14, 0.5, -0.1], [1, 0.08, 0.45, 0.05]],
  glazing: [[[0, 0.05, 0.0, -0.2], [0.04, 0.62, 0.65, -0.88], [0.11, 0.85, 0.95, -1.1]]], // the glazed nose
  extras: [[[0.28, 0.05, -1.0, -1.05], [0.32, 0.35, -0.95, -1.35], [0.5, 0.38, -0.95, -1.35], [0.6, 0.05, -0.85, -0.9]]], // ventral gondola
  nacelles: [[[0.1, 0.05, 0.05, -0.05], [0, 0.5, 0.52, -0.52], [-0.7, 0.62, 0.65, -0.75], [-2.8, 0.55, 0.52, -0.72], [-4.5, 0.2, 0.2, -0.3]]],
  gear: { top: -0.5, retract: 'back' },
};
he111.wing = wingOf({ root: 0.9, chord: elliptic(4.9, 22.6 / 2, 0.25), quarter: 0.9, sweep: 0.04, y: -0.8, tRoot: 0.17, tTip: 0.1, aileron: [0.62, 0.92, 0.27], flap: [0.12, 0.6, 0.25] });
he111.tailplane = tailOf({ semi: 3.9, chord: elliptic(2.2, 3.9, 0.3), quarter: -8.8, y: 0.5, tRoot: 0.1, tTip: 0.08, elevator: 0.4 });
he111.fins = () => [finOf({ h: 2.4, chord: elliptic(2.4, 2.4, 0.3), le: -8.2, base: 0.55 })];
he111.markings = lwMarkings(he111, { wingCross: 1.6, fuselageAt: 0.72 });

export const DESIGNS = { spitfire, hurricane, bf109e4: bf109, bf110c4: bf110, he111h: he111 };
