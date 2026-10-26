// Test view: the aircraft model (src/render/models, D54) with its moving parts, the cockpit frame for the pilot's
// view, and the camera rig. Body axes match Three.js object axes (+X nose, +Y up, +Z right wing), so the physics
// quaternion is used directly.

import * as THREE from 'three';
import { CameraRig } from './cameras.js';
import { buildCockpitFrame } from './cockpitFrame.js';
import { buildReticle, buildSightBody } from './gunsight.js';
import { buildAircraftModel } from './models/aircraftModel.js';
import { DESIGNS } from './models/designs.js';

export class TestView {
  constructor(scene, camera, sea) {
    this.scene = scene;
    this.sea = sea;
    this.rig = new CameraRig(camera);
    this.model = null;
    this.aircraft = null;
    this.cockpit = null;
    this._pos = new THREE.Vector3();
    this._quat = new THREE.Quaternion();
  }

  setAircraft(ac) {
    if (this.model) this.scene.remove(this.model);
    this.aircraft = buildAircraftModel(ac, DESIGNS[ac.id]);
    this.model = this.aircraft.group;
    this.cockpit = buildCockpitFrame(ac);
    if (ac.sight) this.cockpit.add(buildSightBody(ac), buildReticle(ac)); // the AI-only He 111 has no pilot's sight
    this.model.add(this.cockpit);
    this.scene.add(this.model);
    this.rig.first = true;
    // Aircraft without a cockpit (AI only) are seen from outside.
    this.rig.cockpitAllowed = ac.cockpit !== false;
    if (!this.rig.cockpitAllowed && this.rig.inCockpit) this.rig.mode = this.rig.outside;
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
    this.aircraft.update(sim.plane, dt, { inside });

    this.rig.update(sim.ac, { position: this._pos, quaternion: this._quat }, body.velocity, dt);
    const cam = this.rig.camera.position;
    this.scene.getObjectByName('sky')?.position.copy(cam);
    // Keep the sea under the camera, moved in whole texture tiles so its pattern stays put.
    const tile = this.sea.userData.tile;
    this.sea.position.x = Math.round(cam.x / tile) * tile;
    this.sea.position.z = Math.round(cam.z / tile) * tile;
  }
}
