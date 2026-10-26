// National markings of summer 1940 for the aircraft models (D54), generic (no unit codes, D14), as flat shapes facing
// +Z in their own plane; the model builder turns and places them on the surfaces.
//   RAF: Type B roundel (blue and red, upper wings), Type A1 roundel (yellow, blue, white, red, fuselage sides), fin
//   flash (red, white, blue). Luftwaffe: Balkenkreuz (black with white borders) and the swastika on the fin (D16).
// Colours are display approximations (D54), not sourced paint data.

import * as THREE from 'three';

export const MARKING_COLOURS = {
  rafBlue: 0x2b3f7a, rafRed: 0xa3312b, white: 0xf1efe6, yellow: 0xe3bd3b, black: 0x151515,
};

const material = (colour) => new THREE.MeshLambertMaterial({
  color: colour, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
});

/** Concentric discs, outermost first; `rings` are [colour, radius] pairs. */
function discs(rings) {
  const group = new THREE.Group();
  rings.forEach(([colour, radius], i) => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 28), material(colour));
    disc.position.z = i * 0.002;
    group.add(disc);
  });
  return group;
}

/** Type B roundel of diameter d: blue with a red centre (two-fifths of the diameter). */
export const roundelB = (d) => discs([[MARKING_COLOURS.rafBlue, d / 2], [MARKING_COLOURS.rafRed, d / 5]]);

/** Type A1 roundel of diameter d: yellow outline, blue, white, red centre (proportions 1 : 3 : 5 : 7 of the radius). */
export const roundelA1 = (d) => discs([
  [MARKING_COLOURS.yellow, d / 2], [MARKING_COLOURS.rafBlue, (d / 2) * (6 / 7)],
  [MARKING_COLOURS.white, (d / 2) * (4 / 7)], [MARKING_COLOURS.rafRed, (d / 2) * (2 / 7)],
]);

/** Rectangles: [colour, x, y, w, h] (centre, size), layered in order. */
function rects(list) {
  const group = new THREE.Group();
  list.forEach(([colour, x, y, w, h], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material(colour));
    m.position.set(x, y, i * 0.002);
    group.add(m);
  });
  return group;
}

/** Fin flash h high and w wide: red at the front, white, blue at the back (equal widths). */
export const finFlash = (h, w) => rects([
  [MARKING_COLOURS.rafRed, w / 3, 0, w / 3, h], [MARKING_COLOURS.white, 0, 0, w / 3, h],
  [MARKING_COLOURS.rafBlue, -w / 3, 0, w / 3, h],
]);

/** Balkenkreuz of overall size s: a black cross with white borders. */
export function balkenkreuz(s) {
  const arm = s / 5; // the black arms' width
  const border = s / 10;
  return rects([
    [MARKING_COLOURS.white, 0, 0, s, arm + 2 * border], [MARKING_COLOURS.white, 0, 0, arm + 2 * border, s],
    [MARKING_COLOURS.black, 0, 0, s - 2 * border, arm], [MARKING_COLOURS.black, 0, 0, arm, s - 2 * border],
  ]);
}

/** The swastika on the fin, overall size s, black with a thin white border, turned 45 degrees as carried in 1940. */
export function swastika(s) {
  const t = s / 6; // stroke width
  const border = t / 3;
  const shape = (colour, grow) => {
    const pieces = [
      [0, 0, t + grow, s + grow], [0, 0, s + grow, t + grow], // the cross
      // The hooks, turning clockwise: top arm to the right, right arm down, bottom arm left, left arm up.
      [s / 4 + t / 4, s / 2 - t / 2, s / 2 + t / 2 + grow, t + grow],
      [s / 2 - t / 2, -s / 4 - t / 4, t + grow, s / 2 + t / 2 + grow],
      [-s / 4 - t / 4, -s / 2 + t / 2, s / 2 + t / 2 + grow, t + grow],
      [-s / 2 + t / 2, s / 4 + t / 4, t + grow, s / 2 + t / 2 + grow],
    ];
    return pieces.map(([x, y, w, h]) => [colour, x, y, w, h]);
  };
  const group = rects([...shape(MARKING_COLOURS.white, 2 * border), ...shape(MARKING_COLOURS.black, 0)]);
  group.rotation.z = Math.PI / 4;
  const holder = new THREE.Group();
  holder.add(group);
  return holder;
}
