// Phase 1 test view: a simple stand-in shape for the aircraft (real span, length and wing area, but
// no detail; proper models come in Phase 4) and a chase camera. Body axes match Three.js object axes
// (+X nose, +Y up, +Z right wing), so the physics quaternion is used directly.

import * as THREE from 'three';

const COLOURS = { RAF: 0x5e6b3a, Luftwaffe: 0x6f7a6a };
const UNDERSIDE = { RAF: 0xc9c5b0, Luftwaffe: 0x9db4c4 };

/** Builds the stand-in shape from the aircraft's dimensions. */
export function buildStandIn(ac) {
  const { span, wingArea, length } = ac.geometry;
  const chord = wingArea / span;
  const top = new THREE.MeshLambertMaterial({ color: COLOURS[ac.side] });
  const under = new THREE.MeshLambertMaterial({ color: UNDERSIDE[ac.side] });
  const group = new THREE.Group();

  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(length, 1.0, 0.9), top);
  fuselage.position.x = -0.1 * length;
  group.add(fuselage);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(chord, 0.18, span), [top, top, top, under, top, top]);
  wing.position.set(0.1 * length, -0.35, 0);
  group.add(wing);

  const tailplane = new THREE.Mesh(new THREE.BoxGeometry(0.35 * chord, 0.1, 0.33 * span), top);
  tailplane.position.set(-0.55 * length, 0.05, 0);
  group.add(tailplane);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4 * chord, 1.5, 0.1), top);
  fin.position.set(-0.55 * length, 0.75, 0);
  group.add(fin);

  // A propeller disc so the nose is obvious, and a yellow marker on the right wingtip.
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(ac.propeller.diameter / 2, 24),
    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
  );
  disc.rotation.y = Math.PI / 2;
  disc.position.x = 0.4 * length;
  group.add(disc);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xd8b02a }));
  tip.position.set(0.1 * length, -0.35, span / 2);
  group.add(tip);
  return group;
}

export class TestView {
  constructor(scene, camera, sea) {
    this.scene = scene;
    this.camera = camera;
    this.sea = sea;
    this.mode = 'chase';
    this.model = null;
    this.camPos = new THREE.Vector3();
    this.first = true;
    this._pos = new THREE.Vector3();
    this._quat = new THREE.Quaternion();
  }

  setAircraft(ac) {
    if (this.model) this.scene.remove(this.model);
    this.model = buildStandIn(ac);
    this.scene.add(this.model);
    this.first = true;
  }

  toggleMode() {
    this.mode = this.mode === 'chase' ? 'fixed' : 'chase';
  }

  /** Places the model (blended between the last two physics steps) and moves the camera. */
  update(sim, alpha, dt) {
    const body = sim.plane.body;
    this._pos.lerpVectors(sim.previous.position, body.position, alpha);
    this._quat.slerpQuaternions(sim.previous.quaternion, body.quaternion, alpha);
    this.model.position.copy(this._pos);
    this.model.quaternion.copy(this._quat);

    let target;
    if (this.mode === 'fixed') {
      // Rigidly behind and above, rolling with the aircraft.
      target = new THREE.Vector3(-22, 5, 0).applyQuaternion(this._quat).add(this._pos);
      this.camera.up.set(0, 1, 0).applyQuaternion(this._quat);
    } else {
      // Behind along the flight path, level horizon.
      const dir = body.velocity.lengthSq() > 1 ? body.velocity.clone().normalize() : new THREE.Vector3(1, 0, 0).applyQuaternion(this._quat);
      target = this._pos.clone().addScaledVector(dir, -24).add(new THREE.Vector3(0, 6, 0));
      this.camera.up.set(0, 1, 0);
    }
    const k = this.first ? 1 : 1 - Math.exp(-dt * 8);
    this.camPos.lerp(target, k);
    this.first = false;
    this.camPos.y = Math.max(this.camPos.y, 2);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this._pos);

    this.scene.getObjectByName('sky')?.position.copy(this.camPos);
    // Keep the sea under the camera, moved in whole texture tiles so its pattern stays put.
    const tile = this.sea.userData.tile;
    this.sea.position.x = Math.round(this.camPos.x / tile) * tile;
    this.sea.position.z = Math.round(this.camPos.z / tile) * tile;
  }
}
