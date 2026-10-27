// The reflector gunsight (Phase 2, product owner's request): the sight's glowing reticle, collimated so it
// appears at infinity along the aircraft's line of sight, plus the sight body on the coaming. Drawn only in
// the cockpit view. Reticle patterns (D33):
//   RAF, Barr & Stroud GM 2: a ring, range bars either side of a central gap, a short post below, a centre dot
//   Luftwaffe, Revi C/12C: a ring crossed by horizontal and vertical lines, a centre dot
// The ring's angular size is aircraft data (`sight.ringMils`, an estimate until the gunsights are
// researched for Phase 5).

import * as THREE from 'three';

const DISTANCE = 60; // m: where the reticle plane is placed ahead of the eye (it reads as at infinity)
const FIELD = 1.6; // the texture covers this many ring diameters
const GLOW = '#ffb45a';

/** Canvas texture of the reticle; the ring fills 1/FIELD of the width. */
function reticleTexture(style) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const c = size / 2;
  const ring = size / (2 * FIELD);
  g.strokeStyle = GLOW;
  g.fillStyle = GLOW;
  g.lineWidth = 5;
  g.shadowColor = GLOW;
  g.shadowBlur = 8;
  g.beginPath();
  g.arc(c, c, ring, 0, Math.PI * 2);
  g.stroke();
  const line = (x0, y0, x1, y1) => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  };
  const gap = ring * 0.25;
  if (style === 'Revi') {
    line(c - ring * 1.25, c, c - gap * 0.5, c);
    line(c + gap * 0.5, c, c + ring * 1.25, c);
    line(c, c - ring * 1.25, c, c - gap * 0.5);
    line(c, c + gap * 0.5, c, c + ring * 1.25);
  } else {
    line(c - ring, c, c - gap, c);
    line(c + gap, c, c + ring, c);
    line(c, c + ring, c, c + ring * 0.45);
  }
  g.beginPath();
  g.arc(c, c, 6, 0, Math.PI * 2);
  g.fill();
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
export const SIGHT_GLASS = { ahead: 0.55, revi: { width: 0.11, height: 0.12 }, raf: { width: 0.1, height: 0.09 } };

/**
 * The sight body on the coaming just ahead of the pilot, with its tilted reflector glass. The glass is centred on the
 * line of sight from the pilot's eye, so the reticle (collimated, straight ahead) shows in the middle of the glass
 * (product owner, D41). The Revi has a leather crash pad on the back of its body, as photographed.
 */
export function buildSightBody(ac) {
  const group = new THREE.Group();
  const { eye } = ac;
  const revi = ac.side !== 'RAF';
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.09), new THREE.MeshLambertMaterial({ color: 0x1d1d1b }));
  body.position.set(eye.x + 0.55, eye.y - 0.12, 0);
  group.add(body);
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
