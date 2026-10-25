// Ground contact (Phase 2): the undercarriage wheels, and the hard points that must not touch.
//
// Each wheel is its oleo leg and tyre together: a spring and damper pushing straight up from the ground
// at the bottom of the tyre. The spring is set so the parked weight squashes each leg by its stated
// deflection, and the damper gives a fraction of critical damping. The tyre forces lie in the ground plane:
//   - rolling resistance against the wheel's motion, plus braking on the main wheels;
//   - side force from the slip angle (between where the wheel points and where it is going), rising to
//     the tyre's grip at the peak slip angle;
//   - a castoring tailwheel swings round to follow its motion, so it only drags a little sideways.
// Both are capped together by the tyre's grip (a friction circle).
//
// A terrain is { surfaceAt(x, z) } -> { height (m), water (bool), tyre: { rolling, friction, slipPeak } }.

import { Vector3 } from 'three';
import { common } from '../aircraft/common.js';
import { G } from '../core/constants.js';
import { clamp } from './interp.js';

const UP = new Vector3(0, 1, 0);
const GRASS = { height: 0, water: false, tyre: common.grass };

/** Level grass everywhere at sea level (tests, and anywhere off the map). */
export const flatGrass = { surfaceAt: () => GRASS };

/** The wheels in body axes (centre of each wheel, legs extended): left main, right main, tail. */
export function wheelList(ac) {
  const { main, tail } = ac.gear;
  return [
    { name: 'leftMain', pos: new Vector3(main.x, main.y, -main.z), radius: main.radius, main: true, side: -1 },
    { name: 'rightMain', pos: new Vector3(main.x, main.y, main.z), radius: main.radius, main: true, side: 1 },
    { name: 'tail', pos: new Vector3(tail.x, tail.y, 0), radius: tail.radius, main: false, castor: !!tail.castor },
  ];
}

/** Share of the parked weight on each main wheel and on the tailwheel, at the sourced ground angle. */
export function staticShares(ac) {
  const { main, tail, groundAngle } = ac.gear;
  // Forward distance from the centre of gravity of a tyre's contact point with the nose raised.
  const ahead = (x, y) => x * Math.cos(groundAngle) - y * Math.sin(groundAngle);
  const m = ahead(main.x, main.y - main.radius);
  const t = ahead(tail.x, tail.y - tail.radius);
  const onTail = m / (m - t);
  return { main: (1 - onTail) / 2, tail: onTail };
}

/** Spring rate (N/m) and damping (N s/m) of a main leg and of the tailwheel. */
export function springRates(ac) {
  const g = ac.gear;
  const shares = staticShares(ac);
  const rate = (share, deflection) => {
    const k = (ac.mass.flying * G * share) / deflection;
    return { k, c: 2 * g.dampingRatio * Math.sqrt(k * ac.mass.flying * share) };
  };
  return { main: rate(shares.main, g.mainDeflection), tail: rate(shares.tail, g.tailDeflection) };
}

/** Ground-contact state carried by an aircraft. */
export function createGround(ac) {
  return {
    wheels: wheelList(ac), springs: springRates(ac), touching: [false, false, false],
    onGround: false, touchdown: null, crash: null,
  };
}

/**
 * Brake on each main wheel from the brake control and the rudder (RAF relay valve: with the rudder
 * central both brakes work equally; full rudder brakes that side only). Used for all three types (D28).
 */
export function brakeSplit(brake, yaw) {
  return { left: brake * clamp(1 - yaw, 0, 1), right: brake * clamp(1 + yaw, 0, 1) };
}

/** Fraction of a friction force that acts at a sliding speed u (fades out near standstill). */
const fade = (u) => clamp(u / common.slipSpeed, -1, 1);

/**
 * Forces from the wheels on the ground, for the current state (nothing is changed).
 * Returns { force (world, N), moment (body, N m, about the centre of gravity), wheels: [per wheel or null] }.
 */
export function groundLoads(plane, input, terrain) {
  const { ac, body, surfaces, ground } = plane;
  const q = body.quaternion;
  const inverse = q.clone().invert();
  const force = new Vector3();
  const moment = new Vector3();
  const spin = body.angularVelocity.clone().applyQuaternion(q);
  const fwd = new Vector3(1, 0, 0).applyQuaternion(q).setY(0);
  if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0);
  fwd.normalize();
  const right = new Vector3(-fwd.z, 0, fwd.x);
  const brakes = brakeSplit(clamp(input.brake ?? 0, 0, 1), clamp(input.yaw ?? 0, -1, 1));

  const wheels = ground.wheels.map((wheel) => {
    if (wheel.main && surfaces.gear < 0.98) return null; // retracted, or not yet locked down
    const offset = wheel.pos.clone().applyQuaternion(q);
    const surface = terrain.surfaceAt(body.position.x + offset.x, body.position.z + offset.z);
    const depth = surface.height - (body.position.y + offset.y - wheel.radius);
    if (depth <= 0) return null;
    offset.y -= wheel.radius; // the bottom of the tyre
    const v = new Vector3().crossVectors(spin, offset).add(body.velocity);
    const spring = wheel.main ? ground.springs.main : ground.springs.tail;
    const load = Math.max(0, spring.k * depth - spring.c * v.y);
    const tyre = surface.tyre;
    const along = v.dot(fwd);
    const across = v.dot(right);
    const braking = wheel.main ? (wheel.side < 0 ? brakes.left : brakes.right) * ac.gear.brake : 0;
    let fx = -load * (tyre.rolling + braking) * fade(along);
    let fy;
    if (wheel.castor) fy = -load * common.castorFriction * fade(across);
    else {
      const slip = Math.atan2(across, Math.max(Math.abs(along), 2));
      fy = -load * tyre.friction * clamp(slip / tyre.slipPeak, -1, 1);
    }
    const grip = tyre.friction * load;
    const total = Math.hypot(fx, fy);
    if (total > grip) {
      fx *= grip / total;
      fy *= grip / total;
    }
    const f = new Vector3().addScaledVector(UP, load).addScaledVector(fwd, fx).addScaledVector(right, fy);
    force.add(f);
    moment.add(new Vector3().crossVectors(offset.applyQuaternion(inverse), f.clone().applyQuaternion(inverse)));
    return { load, depth, sink: -v.y, along, across, water: surface.water };
  });
  return { force, moment, wheels };
}

const CAUSES = {
  leftTip: 'Left wingtip hit the ground',
  rightTip: 'Right wingtip hit the ground',
  nose: 'Nosed over',
  belly: 'Belly landing',
  tail: 'Tail hit the ground',
};

/** Height of the lowest point of the propeller disc above the ground, at the hub's position. */
export function propellerClearance(plane, terrain) {
  const { ac, body } = plane;
  const hub = new Vector3(ac.propHub.x, ac.propHub.y, 0).applyQuaternion(body.quaternion).add(body.position);
  const axis = new Vector3(1, 0, 0).applyQuaternion(body.quaternion);
  const reach = (ac.propeller.diameter / 2) * Math.sqrt(Math.max(0, 1 - axis.y * axis.y));
  return hub.y - reach - terrain.surfaceAt(hub.x, hub.z).height;
}

/**
 * After a physics step: records touchdowns, and ends the flight on a crash (undercarriage collapsed by a
 * hard landing, a hard point or the propeller touching, or touching water). `loads` is the step's
 * groundLoads result.
 */
export function updateGround(plane, loads, terrain, time) {
  const g = plane.ground;
  if (g.crash) return g;
  const { ac, body } = plane;
  const crash = (cause) => {
    g.crash = { cause, time, speed: body.velocity.length() };
  };
  loads.wheels.forEach((w, i) => {
    if (w && !g.touching[i]) {
      if (w.water) crash('Ditched in the sea');
      else if (w.sink > common.sinkLimit) crash('Undercarriage collapsed: landed too hard');
    }
  });
  const touching = loads.wheels.map(Boolean);
  if (!g.onGround && touching.some(Boolean) && !g.crash) {
    g.touchdown = { time, sink: -body.velocity.y, speed: body.velocity.length() };
  }
  g.touching = touching;
  g.onGround = touching.some(Boolean);
  const wheelsUp = plane.surfaces.gear < 0.98;
  for (const [name, p] of Object.entries(ac.contacts)) {
    const at = new Vector3(p.x, p.y, p.z).applyQuaternion(body.quaternion).add(body.position);
    const surface = terrain.surfaceAt(at.x, at.z);
    if (at.y < surface.height) {
      crash(surface.water ? 'Ditched in the sea' : wheelsUp ? 'Belly landing: undercarriage up' : CAUSES[name]);
      return g;
    }
  }
  if (propellerClearance(plane, terrain) < 0) crash(wheelsUp ? 'Belly landing: undercarriage up' : 'Propeller hit the ground');
  return g;
}

