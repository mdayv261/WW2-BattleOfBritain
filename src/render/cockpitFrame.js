// A simple cockpit view for Phase 2 (D28): the engine cowling ahead of the pilot and the windscreen frame,
// built from each aircraft's dimensions so the view over the nose is about right. On the ground the nose
// hides the view straight ahead, as the period reports describe (S20: about 20° either side for the
// Bf 109). Full period cockpits come in Phase 7. These are display shapes only: nothing here affects the
// physics, so the sizes live here rather than in the aircraft data files.

import * as THREE from 'three';

const COWL_TOP_DROP = 0.2; // m: top of the cowling at the windscreen, below the pilot's eye
const COWL_TOP_FRONT = 0.35; // m: top of the cowling behind the spinner, above the thrust line
const COWL_HALF_WIDTH = { rear: 0.5, front: 0.38 };
const WINDSCREEN_AHEAD = 0.7; // m: from the eye to the base of the windscreen

/** A box-like solid between a rear and a front rectangle (x along the nose). */
function taperedBox(x0, x1, rear, front) {
  const v = [];
  const corners = (x, r) => [
    [x, r.top, -r.w], [x, r.top, r.w], [x, r.bottom, r.w], [x, r.bottom, -r.w],
  ];
  const a = corners(x0, rear);
  const b = corners(x1, front);
  const quad = (p, q, r, s) => v.push(...p, ...q, ...r, ...p, ...r, ...s);
  quad(a[0], a[1], b[1], b[0]); // top
  quad(a[1], a[2], b[2], b[1]); // right side
  quad(a[3], a[0], b[0], b[3]); // left side
  quad(b[0], b[1], b[2], b[3]); // front
  quad(a[1], a[0], a[3], a[2]); // rear: the instrument panel side, facing the pilot
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

/** A thin bar between two points (body axes). */
function bar(from, to, thickness, material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const m = new THREE.Mesh(new THREE.BoxGeometry(thickness, thickness, a.distanceTo(b)), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.lookAt(b);
  return m;
}

/**
 * The Bf 109 E's framed windscreen and hood as the product owner's photograph shows them from the seat (D41): the flat
 * front pane between two posts, crossed by a bar a little above eye level; the wide front arch of the hood, its sides
 * leaning in to a top bar; a diagonal brace across each upper corner; and the top rails running back over the head.
 * Positions are from the pilot's eye (m), judged from the photograph.
 */
function bf109Hood(eye, x0, base) {
  const group = new THREE.Group();
  const grey = new THREE.MeshLambertMaterial({ color: 0xa3aaa6, emissive: 0x2a2d2c });
  const t = 0.02; // tube thickness
  const top = eye.y + 0.32;
  const xTop = x0 - 0.45;
  const bar1 = eye.y + 0.12; // the cross bar of the front pane
  const xBar = x0 - 0.25;
  for (const s of [-1, 1]) {
    group.add(bar([x0, base, s * 0.2], [xTop, top, s * 0.19], t, grey)); // front pane posts
    group.add(bar([x0 - 0.05, base - 0.02, s * 0.5], [xTop, top, s * 0.4], t, grey)); // sides of the front arch
    group.add(bar([x0 - 0.3, eye.y + 0.12, s * 0.45], [xTop, top, s * 0.24], t, grey)); // corner braces
    group.add(bar([xTop, top, s * 0.38], [eye.x - 0.5, top, s * 0.36], t, grey)); // top rails back over the head
    group.add(bar([x0 - 0.05, base - 0.02, s * 0.5], [eye.x - 0.5, base - 0.02, s * 0.5], t, grey)); // sills
  }
  group.add(bar([xBar, bar1, -0.2], [xBar, bar1, 0.2], t, grey));
  group.add(bar([xTop, top, -0.4], [xTop, top, 0.4], t, grey));
  return group;
}

const TWIN_NOSE = { ahead: 2.2, below: 1.1 }; // m: a twin's nose from the pilot's eye (an estimate for the view)

/** The cowling and windscreen frame of an aircraft, in its body axes (centre of gravity at the origin). */
export function buildCockpitFrame(ac) {
  const group = new THREE.Group();
  const { eye } = ac;
  // Twins have no airscrew in the nose: the nose ends a little ahead of and below the windscreen.
  const propHub = ac.propHub ?? { x: eye.x + TWIN_NOSE.ahead, y: eye.y - TWIN_NOSE.below };
  const paint = new THREE.MeshLambertMaterial({ color: ac.side === 'RAF' ? 0x4f5a32 : 0x5d6658, side: THREE.DoubleSide });
  const frame = new THREE.MeshLambertMaterial({ color: 0x2b2b28 });
  const x0 = eye.x + WINDSCREEN_AHEAD;
  const x1 = propHub.x - 0.3;
  const rear = { top: eye.y - COWL_TOP_DROP, bottom: eye.y - 1.2, w: COWL_HALF_WIDTH.rear };
  const front = { top: propHub.y + COWL_TOP_FRONT, bottom: propHub.y - 0.6, w: COWL_HALF_WIDTH.front };
  group.add(new THREE.Mesh(taperedBox(x0, x1, rear, front), paint));

  const base = eye.y - COWL_TOP_DROP;
  if (ac.id === 'bf109e4') {
    group.add(bf109Hood(eye, x0, base));
  } else {
    // Windscreen: two side posts leaning back and a top bar, and (Bf 110) the extra panes of its framed hood.
    const top = eye.y + 0.2;
    const xt = x0 - 0.35;
    for (const s of [-1, 1]) group.add(bar([x0, base, s * 0.42], [xt, top, s * 0.3], 0.015, frame));
    group.add(bar([xt, top, -0.3], [xt, top, 0.3], 0.015, frame));
    if (ac.side === 'Luftwaffe') {
      for (const s of [-1, 1]) group.add(bar([x0 - 0.1, base, s * 0.47], [xt - 0.1, top, s * 0.33], 0.015, frame));
      group.add(bar([xt - 0.6, top, -0.3], [xt - 0.6, top, 0.3], 0.015, frame));
    }
  }
  // Canopy arch behind the head.
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.015, 6, 16, Math.PI), frame);
  arch.rotation.y = Math.PI / 2;
  arch.position.set(eye.x - 0.45, eye.y - 0.15, 0);
  group.add(arch);
  return group;
}
