// Mid-air collisions (D82). After each physics step every pair of aircraft still flying is checked: first their hit-zone
// bounding spheres (src/weapons/hitZones.js), then, when they are close, the path each of one aircraft's sample points
// (the corners and centre of each of its hit zones) took over the step, seen in the other aircraft's body axes, against
// the other's zones (segmentEnters, the rounds' own test). Testing the paths, not just where the points end up, catches a
// thin wing passed through at closing speeds of a couple of metres a step. Both ways round.
// A collision wrecks both aircraft (game design: at these speeds even a touch is fatal): each loses the part it was
// struck on (a wing half or the tail; a blow to the fuselage or engine leaves it whole to tumble), and the break-up,
// the crews' bail-out and the reports follow as for any other loss (D69, D80). A flash marks the point of contact.

import { Vector3 } from 'three';
import { zonesFor, segmentEnters } from '../weapons/hitZones.js';

/** The sample points of an aircraft type (body axes): each hit zone's eight corners and centre (cached on its data). */
function samplesOf(ac) {
  if (ac._collisionSamples) return ac._collisionSamples;
  const out = [];
  for (const z of zonesFor(ac).zones) {
    for (const x of [z.min.x, z.max.x]) for (const y of [z.min.y, z.max.y]) for (const s of [z.min.z, z.max.z]) out.push({ point: new Vector3(x, y, s), zone: z });
    out.push({ point: z.min.clone().add(z.max).multiplyScalar(0.5), zone: z });
  }
  ac._collisionSamples = out;
  return out;
}

const _now = new Vector3();
const _then = new Vector3();

/**
 * Whether any of `a`'s sample points crossed into one of `b`'s zones over the step. `a` and `b` are { ac, body
 * (now: position, quaternion), previous (position, quaternion) }. Returns { zoneA, zoneB, point (world) } or null.
 */
function pointsInto(a, b) {
  const invNow = b.body.quaternion.clone().invert();
  const invThen = b.previous.quaternion.clone().invert();
  const { zones } = zonesFor(b.ac);
  for (const { point, zone } of samplesOf(a.ac)) {
    const worldNow = point.clone().applyQuaternion(a.body.quaternion).add(a.body.position);
    const worldThen = point.clone().applyQuaternion(a.previous.quaternion).add(a.previous.position);
    _now.copy(worldNow).sub(b.body.position).applyQuaternion(invNow);
    _then.copy(worldThen).sub(b.previous.position).applyQuaternion(invThen);
    for (const z of zones) {
      if (segmentEnters(_then, _now, z.min, z.max) !== null) return { zoneA: zone, zoneB: z, point: worldNow };
    }
  }
  return null;
}

/** The collision between two aircraft this step, or null (both ways round). */
export function collide(a, b) {
  const reach = zonesFor(a.ac).radius + zonesFor(b.ac).radius;
  const moved = a.body.position.clone().sub(a.previous.position).sub(b.body.position.clone().sub(b.previous.position)).length();
  if (a.body.position.distanceTo(b.body.position) > reach + moved) return null;
  const ab = pointsInto(a, b);
  if (ab) return ab;
  const ba = pointsInto(b, a);
  return ba ? { zoneA: ba.zoneB, zoneB: ba.zoneA, point: ba.point } : null;
}

/** The part a collision on `zone` takes off: that wing half, the tail, or nothing in particular (the fuselage). */
export function partStruck(zone) {
  if (zone.kind === 'wingInner' || zone.kind === 'wingOuter') return [zone.side < 0 ? 'wingLeft' : 'wingRight'];
  if (zone.kind === 'tail') return ['tail'];
  return [];
}

/** Wrecks an aircraft in a collision (unless it is already lost; a dead pilot's aircraft can still be struck). */
function wreck(plane, zone, other) {
  const d = plane.damage;
  if (d.failed && !d.failed.pilotKilled) return;
  d.failed = { cause: `Mid-air collision with ${other}`, parts: partStruck(zone), collision: true };
}

/** Checks every pair of aircraft still flying and wrecks those that have collided this step. */
export function stepCollisions(sim) {
  const flying = sim.others.filter((c) => c.alive).map((c) => ({ ac: c.ac, body: c.plane.body, previous: c.previous, plane: c.plane, name: c.label }));
  if (!sim.crashed && !sim.plane.damage.failed && !sim.plane.ground.crash) {
    flying.push({ ac: sim.ac, body: sim.plane.body, previous: sim.previous, plane: sim.plane, name: 'you', player: true });
  }
  for (let i = 0; i < flying.length; i += 1) {
    for (let j = i + 1; j < flying.length; j += 1) {
      const a = flying[i];
      const b = flying[j];
      const hit = collide(a, b);
      if (!hit) continue;
      wreck(a.plane, hit.zoneA, b.name);
      wreck(b.plane, hit.zoneB, a.name);
      sim.hitEvents.push({ point: hit.point, kind: 'heTracer20', velocity: a.body.velocity.clone().add(b.body.velocity).multiplyScalar(0.5) });
    }
  }
}
