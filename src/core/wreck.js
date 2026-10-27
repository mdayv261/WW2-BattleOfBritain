// A destroyed aircraft falling, and the parts that broke off it (Phase 5 checkpoint 5, D69). A broken airframe no longer
// flies, so it is not run on the flight model: it is a simple body falling under gravity and air drag (reaching its
// terminal speed, which grows with height as the air thins) and turning at a set rate the way its loss would turn it:
// rolling towards a lost wing, pitching over without its tail. Constants in common.wreck (estimates). It stops where it
// reaches the ground, which marks a crash site.

import { Vector3, Quaternion } from 'three';
import { common } from '../aircraft/common.js';
import { G } from './constants.js';
import { atmosphere } from '../physics/atmosphere.js';
import { zonesFor } from '../weapons/hitZones.js';

const SEA_LEVEL_DENSITY = atmosphere(0).density;

export class Wreck {
  /** From a pose { position, velocity, quaternion } (copied), turning towards `spin` (body axes, rad/s). */
  constructor({ position, velocity, quaternion }, spin, terminalSpeed) {
    this.body = { position: position.clone(), velocity: velocity.clone(), quaternion: quaternion.clone() };
    this.previous = { position: position.clone(), quaternion: quaternion.clone() };
    this.spin = spin.clone();
    this.omega = new Vector3();
    this.terminalSpeed = terminalSpeed;
    this.landed = null; // the point where it reached the ground
  }

  /** Advances the fall by dt; stops on the terrain (anything with surfaceAt(x, z).height), if given. */
  step(dt, terrain) {
    if (this.landed) return;
    const { position, velocity, quaternion } = this.body;
    this.previous.position.copy(position);
    this.previous.quaternion.copy(quaternion);
    // Drag in proportion to the square of the speed, balancing gravity at the terminal speed for this air density.
    const density = atmosphere(Math.max(position.y, 0)).density;
    const speed = velocity.length();
    const drag = (G * speed * speed * density) / (SEA_LEVEL_DENSITY * this.terminalSpeed ** 2);
    if (speed > 0) velocity.addScaledVector(velocity, (-drag / speed) * dt);
    velocity.y -= G * dt;
    position.addScaledVector(velocity, dt);
    // Takes up its spin, then turns at it (body axes).
    this.omega.lerp(this.spin, Math.min(1, dt / common.wreck.spinUp));
    const angle = this.omega.length() * dt;
    if (angle > 0) quaternion.multiply(new Quaternion().setFromAxisAngle(this.omega.clone().normalize(), angle)).normalize();
    const ground = terrain ? terrain.surfaceAt(position.x, position.z).height : -Infinity;
    if (position.y <= ground) {
      position.y = ground;
      velocity.set(0, 0, 0);
      this.landed = position.clone();
    }
  }
}

/** The spin (body axes, rad/s) of an airframe that lost `parts`: a lost wing rolls it towards that side (+x rolls the
 * right wing down), a lost tail pitches it nose down (-z), anything else tumbles it slowly nose down. */
export function wreckSpin(parts) {
  const w = common.wreck;
  const left = parts.includes('wingLeft');
  const right = parts.includes('wingRight');
  if (left !== right) return new Vector3(right ? w.wingSpin : -w.wingSpin, 0, -w.fallSpin);
  if (parts.includes('tail')) return new Vector3(0, 0, -w.tailSpin);
  return new Vector3(0, 0, -w.fallSpin);
}

/** Where a part sits on the aircraft (body axes): the middle of its hit zones. */
export function partCentre(ac, part) {
  const names = { wingLeft: ['wingInnerLeft', 'wingOuterLeft'], wingRight: ['wingInnerRight', 'wingOuterRight'], tail: ['tailSurfaces'] }[part];
  const zones = zonesFor(ac).zones.filter((z) => names.includes(z.name));
  const c = new Vector3();
  for (const z of zones) c.add(z.min).add(z.max);
  return c.multiplyScalar(0.5 / zones.length);
}

/**
 * Breaks up an aircraft (`plane`, its damage.failed naming the parts lost): the airframe becomes a falling wreck, and
 * each lost part a piece of debris starting where it was on the aircraft, moving with it, then tumbling away on its own.
 * Returns { wreck, debris: [{ part, centre (body axes), wreck }] }.
 */
export function breakUp(plane) {
  const parts = plane.damage.failed?.parts ?? [];
  const { body } = plane;
  const w = common.wreck;
  const wreck = new Wreck(body, wreckSpin(parts), w.terminalSpeed);
  const debris = parts.map((part, i) => {
    const centre = partCentre(plane.ac, part);
    const position = centre.clone().applyQuaternion(body.quaternion).add(body.position);
    const axis = new Vector3(0.8, 0.3 * (i % 2 ? -1 : 1), centre.z >= 0 ? 0.6 : -0.6).normalize();
    return { part, centre, wreck: new Wreck({ ...body, position }, axis.multiplyScalar(w.debrisSpin), w.debrisTerminalSpeed) };
  });
  return { wreck, debris };
}
