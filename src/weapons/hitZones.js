// Hit zones (Phase 5, D68): each aircraft as a few boxes in its body axes (x forward, y up, z right), built from its
// data: the fuselage sections (`hitZones.sections`: engine or nose, cockpit, rear fuselage, tail), the wing halves split
// into inner and outer panels (allowing for dihedral), the tail surfaces and, on the twins, the engine nacelles. The
// sizes are estimates taken from the aircraft models (keyed rows in AIRCRAFT_DATA.md). A round's path over one physics
// step is tested against them; the first box it enters is the hit. Free of rendering, so the server can use it too.

import { Vector3, Quaternion } from 'three';
import { common } from '../aircraft/common.js';

const box = (name, kind, x0, x1, y0, y1, z0, z1, extra = {}) => ({
  name, kind, ...extra,
  min: new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
  max: new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
});

/** The zones of an aircraft (cached on its data): [{ name, kind, min, max, side?, engine? }], and a bounding radius. */
export function zonesFor(ac) {
  if (ac._zones) return ac._zones;
  const h = ac.hitZones;
  const zones = [];
  // Fuselage sections, nose to tail.
  for (const [kind, [front, back]] of Object.entries(h.sections)) {
    zones.push(box(kind, kind, front, back, h.bottom, h.top, -h.halfWidth, h.halfWidth, kind === 'engine' ? { engine: 0 } : {}));
  }
  // Wing halves: inner and outer panels, their height following the dihedral.
  const semi = ac.geometry.span / 2;
  const split = semi * common.hitZones.innerShare;
  const tanD = Math.tan(ac.aero.dihedral);
  const w = h.wing;
  for (const [side, label] of [[-1, 'Left'], [1, 'Right']]) {
    for (const [kind, z0, z1] of [['wingInner', h.halfWidth, split], ['wingOuter', split, semi]]) {
      zones.push(box(`${kind}${label}`, kind, w.front, w.back,
        w.y + z0 * tanD - w.halfThickness, w.y + z1 * tanD + w.halfThickness, side * z0, side * z1, { side }));
    }
  }
  // Tail surfaces: the tailplane's span and the fin's height over the tail section's length.
  const [tailFront, tailBack] = h.sections.tail;
  zones.push(box('tailSurfaces', 'tail', tailFront, tailBack, h.bottom, h.finTop, -h.tailSpan / 2, h.tailSpan / 2));
  // Engine nacelles (twins): from each airscrew hub back, the engine's index for damage.
  if (ac.engines && h.nacelle) {
    Object.values(ac.engines).forEach((m, i) => {
      const n = h.nacelle;
      zones.push(box(i === 0 ? 'engineLeft' : 'engineRight', 'engine', m.x, m.x - n.length,
        m.y - n.halfHeight, m.y + n.halfHeight, m.z - n.halfWidth, m.z + n.halfWidth, { engine: i, side: Math.sign(m.z) }));
    });
  }
  const radius = Math.max(...zones.flatMap((z) => [z.min.length(), z.max.length()]));
  ac._zones = { zones, radius };
  return ac._zones;
}

/** Where a segment from a to b (body axes) first enters a box: the fraction along it (0-1), or null if it misses. */
export function segmentEnters(a, b, min, max) {
  let t0 = 0;
  let t1 = 1;
  for (const axis of ['x', 'y', 'z']) {
    const d = b[axis] - a[axis];
    if (Math.abs(d) < 1e-12) {
      if (a[axis] < min[axis] || a[axis] > max[axis]) return null;
      continue;
    }
    let ta = (min[axis] - a[axis]) / d;
    let tb = (max[axis] - a[axis]) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return t0;
}

const _q = new Quaternion();
const _a = new Vector3();
const _b = new Vector3();

/**
 * The first zone of an aircraft (its data `ac`, its body { position, quaternion }) that a round's path from p0 to p1
 * (world) crosses, or null: { zone, at (fraction along the path), point (body axes) }.
 */
export function firstHit(ac, body, p0, p1) {
  const { zones, radius } = zonesFor(ac);
  // Quick rejection: the path must pass within the aircraft's bounding sphere.
  _a.copy(p0).sub(body.position);
  _b.copy(p1).sub(body.position);
  const d = _b.clone().sub(_a);
  const t = Math.max(0, Math.min(1, -_a.dot(d) / Math.max(d.lengthSq(), 1e-12)));
  if (_a.clone().addScaledVector(d, t).length() > radius) return null;
  _q.copy(body.quaternion).invert();
  _a.applyQuaternion(_q);
  _b.applyQuaternion(_q);
  let best = null;
  for (const zone of zones) {
    const at = segmentEnters(_a, _b, zone.min, zone.max);
    if (at !== null && (!best || at < best.at)) best = { zone, at };
  }
  if (best) best.point = _a.clone().lerp(_b, best.at);
  return best;
}
