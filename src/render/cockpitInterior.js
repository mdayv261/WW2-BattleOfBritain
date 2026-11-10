// The 3D cockpit round the pilot (Phase 7 checkpoint 6b, D233): seen when he looks away from the 2D panel (D224). Low-
// polygon shapes in the aircraft's body axes, sized from its model (src/render/models/designs.js) and eye position:
//   side walls from the panel back to the seat, up to the sill (the canopy glazing's lower edge), with a few ribs and a
//   console each side (the throttle box on the left);
//   the seat back and a headrest;
//   a bulkhead closing the fuselage just behind the seat. The player's own fuselage behind it is drawn (clipped at
//   `clipX`, src/render/testView.js), so looking back shows its spine, the rear glazing and the fin.
// Every size here is an estimate (no cockpit drawings among the sources); the colours are the 2D panels' interiors.
// Display shapes only: nothing here affects the physics.

import * as THREE from 'three';
import { sectionAt } from './models/designs.js';

const PANEL_AHEAD = 0.62; // m: the instrument panel's distance ahead of the eye (the walls start here)
const SEAT_BACK = 0.32; // m: the seat back behind the eye
const BULKHEAD = 0.42; // m: the bulkhead (and the clipping plane) behind the eye
const FLOOR_BELOW = 1.0; // m: the cockpit floor below the eye
const WALL_IN = 0.04; // m: the walls this far inside the fuselage skin
const COLOURS = {
  RAF: { wall: 0x4a5246, dark: 0x2d2f2c, seat: 0x3a3428 },
  Luftwaffe: { wall: 0x52575a, dark: 0x2b2e31, seat: 0x3b3b38 },
};

const box = (sx, sy, sz, material, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  m.position.set(x, y, z);
  return m;
};

/** The fuselage section (half width w, top, bottom; body axes) at body x. */
const sectionAtX = (ac, design, x) => sectionAt(design, (design.nose - x) / ac.geometry.length);

/** The sill's height: the lowest edge of the canopy glazing over the cockpit, else the fuselage top at the eye. */
function sillHeight(ac, design) {
  const glass = design.glazing?.[0];
  if (glass) return Math.min(...glass.map((r) => r[3]));
  return sectionAtX(ac, design, ac.eye.x).top;
}

/**
 * The cockpit interior of `ac` with its model `design`: { group, clipX, sill, halfWidth }. `clipX` is the body x of the
 * bulkhead: the player's own fuselage is drawn only behind it.
 */
export function buildCockpitInterior(ac, design) {
  const group = new THREE.Group();
  group.name = 'cockpitInterior';
  const colours = COLOURS[ac.side];
  const wall = new THREE.MeshLambertMaterial({ color: colours.wall, emissive: 0x111111, side: THREE.DoubleSide });
  const dark = new THREE.MeshLambertMaterial({ color: colours.dark, emissive: 0x0a0a0a });
  const seat = new THREE.MeshLambertMaterial({ color: colours.seat, emissive: 0x0a0a0a });
  const { eye } = ac;
  const front = eye.x + PANEL_AHEAD;
  const back = eye.x - BULKHEAD;
  const sill = sillHeight(ac, design);
  const floor = eye.y - FLOOR_BELOW;
  const half = sectionAtX(ac, design, eye.x).w - WALL_IN;
  const length = front - back;
  const midX = (front + back) / 2;
  for (const s of [-1, 1]) {
    // The wall, the sill's rail along its top, and ribs down it.
    group.add(box(length, sill - floor, 0.012, wall, midX, (sill + floor) / 2, s * half));
    group.add(box(length, 0.035, 0.06, dark, midX, sill - 0.012, s * (half - 0.025)));
    for (let x = back + 0.2; x < front - 0.1; x += 0.26) group.add(box(0.025, sill - floor, 0.03, dark, x, (sill + floor) / 2, s * (half - 0.02)));
    // A console along the wall below the sill: the throttle box on the left, a box of switches on the right.
    const consoleTop = sill - 0.28;
    group.add(box(0.5, 0.12, 0.1, dark, eye.x + 0.15, consoleTop - 0.06, s * (half - 0.06)));
  }
  // The throttle lever on the left console.
  group.add(box(0.03, 0.16, 0.025, seat, eye.x + 0.25, sill - 0.2, -(half - 0.09)));
  // The seat back and the headrest, kept below the eye: the view turns about the eye (the head can't lean as a pilot's
  // could), so a headrest at head height would hide the whole view astern.
  const seatX = eye.x - SEAT_BACK;
  group.add(box(0.05, 0.55, Math.min(0.44, 2 * half - 0.1), seat, seatX, eye.y - 0.58, 0));
  group.add(box(0.06, 0.13, 0.2, seat, seatX - 0.02, eye.y - 0.2, 0));
  // The floor.
  group.add(box(length, 0.012, 2 * half, dark, midX, floor, 0));
  // The bulkhead closing the fuselage behind the seat, its shape the fuselage section there.
  const s = sectionAtX(ac, design, back);
  const ry = (s.top - s.bottom) / 2;
  const shape = new THREE.Shape().absellipse(0, 0, s.w, ry, 0, Math.PI * 2);
  const bulkhead = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), wall);
  bulkhead.rotation.y = Math.PI / 2; // facing forward, towards the pilot
  bulkhead.position.set(back - 0.005, (s.top + s.bottom) / 2, 0);
  group.add(bulkhead);
  return { group, clipX: back, sill, halfWidth: half };
}
