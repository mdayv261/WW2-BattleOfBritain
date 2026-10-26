// Camouflage of summer 1940 for the aircraft models (D54), as a colour for each triangle from its position and facing.
// The colours are display approximations of the period paints, not sourced colour data:
//   RAF fighters: Dark Earth and Dark Green in broad curving areas above, Sky below, a Sky band round the rear fuselage.
//   Luftwaffe fighters: RLM 71 and 02 in a straight-edged splinter pattern above, RLM 65 below and on the lower sides,
//   mottled where the sides meet the top. He 111: RLM 70 and 71 splinter above and on the sides, RLM 65 below.
// Optional yellow identification areas of summer 1940 (RLM 04): engine cowling, wingtips and rudder (Bf 109, D56).

import * as THREE from 'three';

export const PAINT = {
  darkEarth: new THREE.Color(0x5e4c35), darkGreen: new THREE.Color(0x3a4a2e), sky: new THREE.Color(0xb6c3a0),
  rlm71: new THREE.Color(0x4c5641), rlm02: new THREE.Color(0x7a7a63), rlm65: new THREE.Color(0x9cb0be),
  rlm70: new THREE.Color(0x343d31), black: new THREE.Color(0x1d1d1b), yellow: new THREE.Color(0xe0b02a),
};

const UNDER = -0.3; // faces pointing further down than this (normal's y) are undersides

/** Broad curving RAF pattern: true for Dark Earth, false for Dark Green. */
const rafPattern = (p) => Math.sin(0.55 * p.x + 0.8 * p.z) + Math.sin(0.9 * p.z - 0.35 * p.x + 1.3) + Math.sin(1.4 * p.y + 0.5 * p.x) > 0;

/** Straight-edged splinter pattern: true for the darker colour. */
const splinter = (p) => (Math.floor((0.8 * p.x + 0.6 * p.z) / 1.1) + Math.floor((-0.5 * p.x + 0.85 * p.z) / 1.3) + Math.floor((0.7 * p.y + 0.3 * p.x) / 0.9)) % 2 === 0;

/** Small mottle spots. */
const mottle = (p) => Math.sin(5.1 * p.x) * Math.sin(4.3 * p.y + 1.1) * Math.sin(3.7 * p.z + 0.4) > 0.25;

/**
 * The colour function for a scheme: (centre, normal, part) -> THREE.Color, where part names what is being painted
 * ('fuselage', 'radiator', 'wing', 'tail', 'fin', or a control surface: 'aileron', 'flap', 'elevator', 'rudder').
 * `band` is the RAF Sky band's [front, back] x positions on the fuselage, if any. `yellow` paints identification areas:
 * { noseFrom: the cowling's rear x, tipsFrom: the wingtips' inner |z|, rudder: true }.
 */
export function scheme(name, { band, yellow } = {}) {
  const base = camouflage(name, band);
  if (!yellow) return base;
  return (p, n, part) => (isYellow(yellow, p, part) ? PAINT.yellow : base(p, n, part));
}

/** Whether a triangle centred at p, on the named part, lies in a yellow identification area. */
function isYellow(yellow, p, part) {
  if ((part === 'fuselage' || part === 'radiator') && yellow.noseFrom !== undefined && p.x > yellow.noseFrom) return true;
  if ((part === 'wing' || part === 'aileron' || part === 'flap') && yellow.tipsFrom !== undefined && Math.abs(p.z) > yellow.tipsFrom) return true;
  return part === 'rudder' && !!yellow.rudder;
}

/** The camouflage itself: (centre, normal) -> THREE.Color. */
function camouflage(name, band) {
  if (name === 'raf') {
    return (p, n) => {
      if (n.y < UNDER) return PAINT.sky;
      if (band && p.x < band[0] && p.x > band[1] && Math.abs(p.z) < 1.2) return PAINT.sky;
      return rafPattern(p) ? PAINT.darkEarth : PAINT.darkGreen;
    };
  }
  if (name === 'lwFighter') {
    return (p, n) => {
      if (n.y < UNDER) return PAINT.rlm65;
      if (n.y > 0.55) return splinter(p) ? PAINT.rlm71 : PAINT.rlm02;
      if (p.y > 0.15) return mottle(p) ? PAINT.rlm02 : PAINT.rlm71; // the mottled upper sides
      return mottle(p) ? PAINT.rlm02 : PAINT.rlm65;
    };
  }
  return (p, n) => {
    if (n.y < UNDER) return PAINT.rlm65;
    return splinter(p) ? PAINT.rlm70 : PAINT.rlm71;
  };
}
