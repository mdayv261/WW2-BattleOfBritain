// The reflector gunsight (Phase 2, product owner's request): the sight's glowing reticle, collimated so it
// appears at infinity along the aircraft's line of sight, plus the sight body on the coaming. Drawn only in
// the cockpit view. Reticle patterns (D33):
//   RAF, Barr & Stroud GM 2: a ring, range bars either side of a central gap, a short post below, a centre dot
//   Luftwaffe, Revi C/12C: a ring crossed by horizontal and vertical lines, a centre dot
// The ring's angular size is aircraft data (`sight.ringMils`, an estimate until the gunsights are
// researched for Phase 5).

import * as THREE from 'three';
import { drawReticle } from '../ui/reticle.js';

const DISTANCE = 60; // m: where the reticle plane is placed ahead of the eye (it reads as at infinity)
const FIELD = 1.6; // the texture covers this many ring diameters
/** Canvas texture of the reticle; the ring fills 1/FIELD of the width. */
function reticleTexture(style) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  drawReticle(canvas.getContext('2d'), size / 2, size / 2, size / (2 * FIELD), style, 5);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The reticle as a plane in the aircraft's body axes, straight ahead of the pilot's eye. */
export function buildReticle(ac) {
  const style = ac.side === 'RAF' ? 'GM2' : 'Revi';
  const angle = (ac.sight.ringMils / 1000) * FIELD; // rad covered by the texture
  const width = 2 * DISTANCE * Math.tan(angle / 2);
  const material = new THREE.MeshBasicMaterial({
    map: reticleTexture(style), transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const reticle = new THREE.Mesh(new THREE.PlaneGeometry(width, width), material);
  reticle.rotation.y = -Math.PI / 2; // face the pilot, image the right way round
  reticle.position.set(ac.eye.x + DISTANCE, ac.eye.y, 0);
  reticle.renderOrder = 10;
  return reticle;
}

/** The reflector glass: its distance ahead of the eye and its size (m), for each sight; the glass leans back 45°. */
export const SIGHT_GLASS = { ahead: 0.55, revi: { width: 0.11, height: 0.12 }, raf: { width: 0.12, height: 0.086 } }; // the GM 2's glass wider than its top ring (D87)

/**
 * The sight body on the coaming just ahead of the pilot, with its tilted reflector glass. The glass is centred on the
 * line of sight from the pilot's eye, so the reticle (collimated, straight ahead) shows in the middle of the glass
 * (product owner, D41). The Revi has a leather crash pad on the back of its body, as photographed.
 */
export function buildSightBody(ac) {
  const group = new THREE.Group();
  const { eye } = ac;
  const revi = ac.side !== 'RAF';
  if (!revi) gm2Body(group, eye);
  else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.09), new THREE.MeshLambertMaterial({ color: 0x1d1d1b }));
    body.position.set(eye.x + 0.55, eye.y - 0.12, 0);
    group.add(body);
  }
  if (revi) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.07), new THREE.MeshLambertMaterial({ color: 0x7a4a26 }));
    pad.position.set(eye.x + 0.45, eye.y - 0.1, 0);
    group.add(pad);
  }
  // The glass faces the pilot, leaning back 45 degrees, its centre on the line of sight.
  const { width: w, height: h } = SIGHT_GLASS[revi ? 'revi' : 'raf'];
  const plate = new THREE.PlaneGeometry(w, h).rotateY(-Math.PI / 2).rotateZ(Math.PI / 4);
  const glass = new THREE.Mesh(
    plate,
    new THREE.MeshBasicMaterial({ color: 0xa9c4c8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
  );
  glass.position.set(eye.x + SIGHT_GLASS.ahead, eye.y, 0);
  group.add(glass);
  return group;
}

/**
 * The GM 2's body in 3D (D87), for looking round: the same parts as the square-on drawing (src/ui/reflectorSight.js),
 * simply shaped: mounting block, scale rings, collar, cone, deep top ring and the two short brackets at its rim holding
 * the glass's lower edge.
 * Sizes are estimates on the drawing's proportions (no drawing of the sight was found).
 */
function gm2Body(group, eye) {
  const black = new THREE.MeshLambertMaterial({ color: 0x151515 });
  const x = eye.x + SIGHT_GLASS.ahead + 0.02;
  const top = eye.y - SIGHT_GLASS.raf.height / 2 - 0.005; // the top ring's rim, just under the glass
  const part = (geometry, y) => {
    const mesh = new THREE.Mesh(geometry, black);
    mesh.position.set(x, y, 0);
    group.add(mesh);
    return mesh;
  };
  part(new THREE.CylinderGeometry(0.05, 0.05, 0.034, 24), top - 0.017); // top ring
  part(new THREE.CylinderGeometry(0.047, 0.026, 0.032, 24), top - 0.05); // cone
  part(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 24), top - 0.073); // collar
  part(new THREE.CylinderGeometry(0.032, 0.032, 0.036, 24), top - 0.098); // RANGE and BASE rings
  part(new THREE.BoxGeometry(0.075, 0.04, 0.075), top - 0.136); // mounting block
  for (const z of [-0.045, 0.045]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.008), black);
    bracket.position.set(x, top + 0.015, z);
    group.add(bracket);
  }
}
