// Test view: a simple stand-in shape for the aircraft (real span, length and wing area, but no detail;
// proper models come in Phase 4), the cockpit frame for the pilot's view, and the camera rig. Body axes
// match Three.js object axes (+X nose, +Y up, +Z right wing), so the physics quaternion is used directly.

import * as THREE from 'three';
import { CameraRig } from './cameras.js';
import { buildCockpitFrame } from './cockpitFrame.js';
import { buildReticle, buildSightBody } from './gunsight.js';

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
  fuselage.name = 'fuselage';
  group.add(fuselage);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(chord, 0.18, span), [top, top, top, under, top, top]);
  wing.position.set(0.1 * length, -0.6, 0);
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
    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
  );
  disc.rotation.y = Math.PI / 2;
  disc.position.set(ac.propHub.x, ac.propHub.y, 0);
  group.add(disc);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xd8b02a }));
  tip.position.set(0.1 * length, -0.6, span / 2);
  group.add(tip);

  // Wheels, shown while the undercarriage is down.
  const wheels = new THREE.Group();
  wheels.name = 'wheels';
  const tyre = new THREE.MeshLambertMaterial({ color: 0x1d1d1d });
  const { main, tail } = ac.gear;
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(main.radius, main.radius, 0.15, 16), tyre);
    w.rotation.x = Math.PI / 2;
    w.position.set(main.x, main.y, s * main.z);
    wheels.add(w);
  }
  group.add(wheels);
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(tail.radius, tail.radius, 0.08, 12), tyre);
  tw.rotation.x = Math.PI / 2;
  tw.position.set(tail.x, tail.y, 0);
  group.add(tw);
  return group;
}

export class TestView {
  constructor(scene, camera, sea) {
    this.scene = scene;
    this.sea = sea;
    this.rig = new CameraRig(camera);
    this.model = null;
    this.cockpit = null;
    this._pos = new THREE.Vector3();
    this._quat = new THREE.Quaternion();
  }

  setAircraft(ac) {
    if (this.model) this.scene.remove(this.model);
    this.model = buildStandIn(ac);
    this.cockpit = buildCockpitFrame(ac);
    this.cockpit.add(buildSightBody(ac), buildReticle(ac));
    this.model.add(this.cockpit);
    this.scene.add(this.model);
    this.rig.first = true;
  }

  /** Places the model (blended between the last two physics steps) and moves the camera. */
  update(sim, alpha, dt) {
    const body = sim.plane.body;
    this._pos.lerpVectors(sim.previous.position, body.position, alpha);
    this._quat.slerpQuaternions(sim.previous.quaternion, body.quaternion, alpha);
    this.model.position.copy(this._pos);
    this.model.quaternion.copy(this._quat);
    const inside = this.rig.inCockpit;
    this.model.getObjectByName('fuselage').visible = !inside;
    this.cockpit.visible = inside;
    this.model.getObjectByName('wheels').visible = sim.plane.surfaces.gear > 0.5;

    this.rig.update(sim.ac, { position: this._pos, quaternion: this._quat }, body.velocity, dt);
    const cam = this.rig.camera.position;
    this.scene.getObjectByName('sky')?.position.copy(cam);
    // Keep the sea under the camera, moved in whole texture tiles so its pattern stays put.
    const tile = this.sea.userData.tile;
    this.sea.position.x = Math.round(cam.x / tile) * tile;
    this.sea.position.z = Math.round(cam.z / tile) * tile;
  }
}
