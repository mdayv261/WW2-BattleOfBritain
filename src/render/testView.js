// Test view: the aircraft model (src/render/models, D54) with its moving parts, the cockpit frame for the pilot's
// view, and the camera rig. Body axes match Three.js object axes (+X nose, +Y up, +Z right wing), so the physics
// quaternion is used directly.

import * as THREE from 'three';
import { CameraRig } from './cameras.js';
import { buildCockpitFrame } from './cockpitFrame.js';
import { buildReticle, buildSightBody } from './gunsight.js';
import { buildAircraftModel } from './models/aircraftModel.js';
import { DESIGNS } from './models/designs.js';
import { buildMuzzleFlashes } from './projectiles.js';
import { hideLost } from './wrecks.js';

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

  /** Draws the target aircraft (D68), if there is one, blended between its last two physics steps. */
  updateTarget(sim, alpha, dt) {
    const t = sim.target;
    if (this.targetFor && this.targetFor !== t) {
      this.scene.remove(this.targetModel.group);
      this.targetFor = null;
    }
    if (!t) return;
    if (this.targetFor !== t) {
      this.targetModel = buildAircraftModel(t.ac, DESIGNS[t.ac.id]);
      this.scene.add(this.targetModel.group);
      this.targetFor = t;
    }
    const g = this.targetModel.group;
    g.position.lerpVectors(t.previous.position, t.plane.body.position, alpha);
    g.quaternion.slerpQuaternions(t.previous.quaternion, t.plane.body.quaternion, alpha);
    this.targetModel.update(t.plane, dt);
  }

  /**
   * Once the player's aircraft breaks up or its pilot is killed (D69): the parts that broke off are hidden (they fall as
   * debris, src/render/wrecks.js), and the view moves outside to watch it go down.
   */
  followLoss(sim) {
    if (!(sim.wreck || sim.uncontrolled) || this.lossFor === sim.plane) return;
    this.lossFor = sim.plane;
    hideLost(this.model, sim.plane.damage.failed?.parts);
    if (this.rig.inCockpit) this.rig.mode = this.rig.outside;
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
    this.followLoss(sim);
    // Muzzle flashes for this flight's guns (rebuilt when the aircraft or its armament changes).
    if (this.flashesFor !== sim.armament) {
      this.flashes = buildMuzzleFlashes(sim.armament);
      this.model.add(this.flashes.group);
      this.flashesFor = sim.armament;
    }
    this.flashes.update(sim.plane.time);
    this.updateTarget(sim, alpha, dt);

    this.rig.update(sim.ac, { position: this._pos, quaternion: this._quat }, body.velocity, dt);
    const cam = this.rig.camera.position;
    this.scene.getObjectByName('sky')?.position.copy(cam);
    // Keep the sea under the camera, moved in whole texture tiles so its pattern stays put.
    const tile = this.sea.userData.tile;
    this.sea.position.x = Math.round(cam.x / tile) * tile;
    this.sea.position.z = Math.round(cam.z / tile) * tile;
  }
}
