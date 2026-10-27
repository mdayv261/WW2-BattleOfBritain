// Falling wrecks and the parts that broke off them (Phase 5 checkpoint 5, D69), drawn from sim.falling
// (src/core/losses.js): an airframe is its aircraft's model with the lost parts hidden; a broken-off part is that part
// of the model alone (its 'wingLeft', 'wingRight' or 'tail' group), turning about its own middle. The player's own
// wreck is drawn by the test view's model, which follows it.

import * as THREE from 'three';
import { buildAircraftModel } from './models/aircraftModel.js';
import { DESIGNS } from './models/designs.js';

/** Hides the parts of a model that broke off. */
export function hideLost(group, parts = []) {
  for (const part of parts) {
    const g = group.getObjectByName(part);
    if (g) g.visible = false;
  }
}

/** The object drawn for one falling entry: an airframe without its lost parts, or one broken-off part. */
export function buildFalling(entry) {
  const model = buildAircraftModel(entry.ac, DESIGNS[entry.ac.id]);
  if (!entry.part) {
    hideLost(model.group, entry.lost);
    return model.group;
  }
  // The part alone, moved so that its middle sits at the pivot the debris turns about.
  const part = model.group.getObjectByName(entry.part);
  part.removeFromParent();
  part.position.copy(entry.centre).negate();
  const pivot = new THREE.Group();
  pivot.add(part);
  return pivot;
}

export class WreckView {
  constructor(scene) {
    this.scene = scene;
    this.objects = new Map(); // falling entry -> its object
  }

  /** Draws every falling entry other than the player's airframe, blended between its last two steps. */
  update(sim, alpha) {
    for (const [entry, object] of this.objects) {
      if (!sim.falling.includes(entry)) {
        this.scene.remove(object);
        this.objects.delete(entry);
      }
    }
    for (const entry of sim.falling) {
      if (entry.plane === sim.plane) continue;
      let object = this.objects.get(entry);
      if (!object) {
        object = buildFalling(entry);
        this.scene.add(object);
        this.objects.set(entry, object);
      }
      const { wreck } = entry;
      object.position.lerpVectors(wreck.previous.position, wreck.body.position, alpha);
      object.quaternion.slerpQuaternions(wreck.previous.quaternion, wreck.body.quaternion, alpha);
    }
  }
}
