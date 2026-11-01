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
import { BF109_AIM, BF109_PANEL, FUSELAGE_CENTRE_OFFSET } from '../ui/bf109Panel.js';
import { panelRadius } from '../ui/instruments.js';

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

  /**
   * While a 2D sight shows (D87), the 3D sight body and reticle are hidden. With the Bf 109's, its front frame is drawn
   * with the panel (src/ui/bf109Frame.js, D90), so the 3D windscreen, nose and wings hide too (not the airscrew, D97).
   */
  showSight2D(on) {
    for (const part of this.sight3D ?? []) part.visible = !on;
    this.frontView = on && this.frameDrawn;
  }

  /**
   * Shows or hides the parts seen from the cockpit (`inside`): the cockpit frame, and the parts the front view hides. In
   * the Bf 109's front view the airscrew is drawn on the drawn fuselage centre line (D98) on a screen `width` x `height`.
   */
  showParts(inside, { width = globalThis.innerWidth ?? 1600, height = globalThis.innerHeight ?? 900 } = {}) {
    const front = inside && this.frontView;
    this.model.getObjectByName('fuselage').visible = !inside;
    this.cockpit.visible = inside && !front;
    for (const part of this.frontHidden) part.visible = !front && !this.lost.has(part.name);
    const shift = front ? this.screwShift(width, height) : 0;
    this.aircraft.screws.forEach((s, i) => {
      s.group.position.z = this.screwHome[i] + shift;
      s.spinner.visible = !front; // with the nose hidden, the spinner alone would float ahead of the panel
    });
  }

  /**
   * How far sideways (m, body axes) the airscrew is drawn in the Bf 109's front view so that its hub falls on the drawn
   * fuselage centre line, FUSELAGE_CENTRE_OFFSET dial radii from the guns' line (D98): the drawn offset in pixels over
   * the view's pixels per radian, at the hub's distance ahead of the eye.
   */
  screwShift(width, height) {
    if (!this.fuselageOffset) return 0;
    const offset = this.fuselageOffset * panelRadius(BF109_PANEL, width, height);
    const perRadian = height / 2 / Math.tan((this.rig.camera.fov * Math.PI) / 360);
    const ahead = this.aircraft.screws[0].group.position.x - this.eyeX;
    return (offset / perRadian) * ahead;
  }

  setAircraft(ac) {
    if (this.model) this.scene.remove(this.model);
    this.aircraft = buildAircraftModel(ac, DESIGNS[ac.id]);
    this.model = this.aircraft.group;
    this.cockpit = buildCockpitFrame(ac);
    // The Bf 109's, Hurricane's and Spitfire's front frames are drawn with their panels (D90, D99).
    this.frameDrawn = ['bf109e4', 'hurricane', 'spitfire'].includes(ac.id);
    this.fuselageOffset = ac.id === 'bf109e4' ? FUSELAGE_CENTRE_OFFSET : 0; // the RAF's GM 2 is on the centre line
    this.rig.aim = ac.id === 'bf109e4' ? BF109_AIM : 0.5; // its guns' line above the middle of the screen (D93)
    this.frontView = false;
    // The wings hide in the front view; the airscrew stays, its arc spinning ahead of the panel (D97).
    this.frontHidden = [this.model.getObjectByName('wingLeft'), this.model.getObjectByName('wingRight')];
    this.lost = new Set();
    this.screwHome = this.aircraft.screws.map((s) => s.group.position.z);
    this.eyeX = ac.eye.x;
    // The AI-only He 111 has no pilot's sight. The RAF's is drawn square-on in front of the panel while the pilot looks
    // ahead (src/ui/reflectorSight.js, D87): showSight2D hides these 3D parts meanwhile.
    this.sight3D = ac.sight ? [buildSightBody(ac), buildReticle(ac)] : [];
    if (this.sight3D.length) this.cockpit.add(...this.sight3D);
    this.model.add(this.cockpit);
    this.scene.add(this.model);
    this.rig.first = true;
    // Aircraft without a cockpit (AI only) are seen from outside.
    this.rig.cockpitAllowed = ac.cockpit !== false;
    if (!this.rig.cockpitAllowed && this.rig.inCockpit) this.rig.mode = this.rig.outside;
  }

  /**
   * Draws every AI aircraft (D68, D79), each blended between its last two physics steps, with its muzzle flashes. Models
   * are built once per aircraft and dropped when it has gone (a wreck is drawn by src/render/wrecks.js).
   */
  updateOthers(sim, alpha, dt) {
    this.others ??= new Map();
    const live = new Set(sim.others);
    for (const [craft, drawn] of this.others) {
      if (!live.has(craft)) {
        this.scene.remove(drawn.model.group);
        this.others.delete(craft);
      }
    }
    for (const craft of sim.others) {
      let drawn = this.others.get(craft);
      if (!drawn) {
        const model = buildAircraftModel(craft.ac, DESIGNS[craft.ac.id]);
        const flashes = buildMuzzleFlashes([...craft.armament, ...(craft.gunnery?.mounts ?? [])]);
        model.group.add(flashes.group);
        this.scene.add(model.group);
        drawn = { model, flashes };
        this.others.set(craft, drawn);
      }
      const g = drawn.model.group;
      g.position.lerpVectors(craft.previous.position, craft.plane.body.position, alpha);
      g.quaternion.slerpQuaternions(craft.previous.quaternion, craft.plane.body.quaternion, alpha);
      drawn.model.update(craft.plane, dt);
      drawn.flashes.update(craft.plane.time);
    }
  }

  /**
   * Once the player's aircraft breaks up or its pilot is killed (D69): the parts that broke off are hidden (they fall as
   * debris, src/render/wrecks.js), and the view moves outside to watch it go down.
   */
  followLoss(sim) {
    if (!(sim.wreck || sim.uncontrolled) || this.lossFor === sim.plane) return;
    this.lossFor = sim.plane;
    hideLost(this.model, sim.plane.damage.failed?.parts);
    this.lost = new Set(sim.plane.damage.failed?.parts ?? []);
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
    this.showParts(inside);
    this.aircraft.update(sim.plane, dt, { inside });
    this.followLoss(sim);
    // Muzzle flashes for this flight's guns (rebuilt when the aircraft or its armament changes).
    if (this.flashesFor !== sim.armament) {
      this.flashes = buildMuzzleFlashes([...sim.armament, ...(sim.player.gunnery?.mounts ?? [])]);
      this.model.add(this.flashes.group);
      this.flashesFor = sim.armament;
    }
    this.flashes.update(sim.plane.time);
    // In the Bf 109's front view its cowling guns flash on the drawn coaming instead (D94).
    if (this.frontView) for (const f of this.flashes.flashes) if (f.gun.spec.synchronised) f.mesh.visible = false;
    this.updateOthers(sim, alpha, dt);

    // Once the player has bailed out, the orbit view follows him down under his parachute (D80).
    const j = sim.playerJumper;
    if (j && this.jumperFor !== j) {
      this.jumperFor = j;
      this.rig.mode = 'orbit';
    }
    if (j) this.rig.update(sim.ac, { position: j.position, quaternion: j.facing ?? this._quat }, j.velocity, dt);
    else this.rig.update(sim.ac, { position: this._pos, quaternion: this._quat }, body.velocity, dt);
    const cam = this.rig.camera.position;
    this.scene.getObjectByName('sky')?.position.copy(cam);
    // Keep the sea under the camera, moved in whole texture tiles so its pattern stays put.
    const tile = this.sea.userData.tile;
    this.sea.position.x = Math.round(cam.x / tile) * tile;
    this.sea.position.z = Math.round(cam.z / tile) * tile;
  }
}
