// The Bf 110's rear MG 15 in 3D (Phase 7 checkpoint 7, D234): a plain barrel, its breech and a saddle drum on the
// mount's pivot, swung each frame to the gun's bore (src/weapons/mounts.js), so the player sees it from the gunner's
// view and the pilot sees it over his shoulder. Its ring-and-bead sight (S25 para. 20) is drawn over the view by
// src/ui/gunnerHud.js. Sizes are display estimates.

import * as THREE from 'three';

const BARREL = { length: 0.75, radius: 0.012 }; // m, ahead of the pivot along the bore (to the muzzle, mounts.rear.muzzle)
const BREECH = { length: 0.35, size: 0.07 }; // m, behind the pivot
const DRUM = { radius: 0.055, width: 0.045, out: 0.08 }; // m: the 75-round saddle drum, a half each side of the breech

/** The gun as a group whose +x is its bore (place it at the pivot, turned to the bore). */
export function buildMg15() {
  const group = new THREE.Group();
  group.name = 'mg15';
  const metal = new THREE.MeshLambertMaterial({ color: 0x2a2b2c, emissive: 0x080808 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(BARREL.radius, BARREL.radius, BARREL.length, 8), metal);
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.x = BARREL.length / 2;
  const breech = new THREE.Mesh(new THREE.BoxGeometry(BREECH.length, BREECH.size, BREECH.size * 0.8), metal);
  breech.position.x = -BREECH.length / 2 + 0.05;
  group.add(barrel, breech);
  // The saddle drum straddles the gun, low on each side, clear of the gunner's line of sight over the breech.
  for (const side of [-1, 1]) {
    const half = new THREE.Mesh(new THREE.CylinderGeometry(DRUM.radius, DRUM.radius, DRUM.width, 14), metal);
    half.rotation.x = Math.PI / 2; // its flat faces to the sides
    half.position.set(-0.08, -0.05, side * DRUM.out);
    group.add(half);
  }
  return group;
}

const _up = new THREE.Vector3();
const _side = new THREE.Vector3();
const _m = new THREE.Matrix4();

/** Places the gun model on its mount (body axes): at the pivot, turned to the bore, kept upright (no roll). */
export function placeMg15(model, mount) {
  const { bore } = mount;
  _up.set(0, 1, 0).addScaledVector(bore, -bore.y).normalize(); // the aircraft's up, square to the bore
  _side.crossVectors(bore, _up);
  model.position.copy(mount.position);
  model.quaternion.setFromRotationMatrix(_m.makeBasis(bore, _up, _side));
}
