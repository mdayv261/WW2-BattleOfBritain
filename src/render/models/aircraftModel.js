// Builds a low-polygon aircraft model from its flight data (span, length, engine and wheel positions) and a design
// (src/render/models/designs.js: the shapes, display estimates only, D54), with moving parts:
//   ailerons, elevators, rudders and flaps from the control surfaces; undercarriage legs that fold with the gear;
//   airscrews that turn with the engines (blades at low speed, a blurred disc at speed).
// The fuselage, canopy and tail are grouped as 'fuselage' (hidden in the cockpit view); wings and engines stay visible.

import * as THREE from 'three';
import { loft, paint, mirrorZ } from './geometry.js';
import { buildHalf } from './surfaces.js';
import { scheme, PAINT } from './paint.js';
import { roundelA1, roundelB, finFlash, balkenkreuz, swastika } from './markings.js';
import { engineMounts } from '../../physics/powerplant.js';
import { sectionAt } from './designs.js';

const DEG = Math.PI / 180;
// Display estimates where the data have no figure (D54): aileron and rudder travel; the elevator's down travel is drawn
// equal to its recorded up travel (controls.elevatorUp).
const DEFLECTION = { aileron: 20 * DEG, rudder: 25 * DEG };
const BLADES_UNTIL = 700; // rpm: blades drawn below this, a disc above
const DISC = { outside: 0.3, inside: 0.06 }; // the disc's greatest opacity, seen from outside and from the cockpit

const skin = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
const glass = () => new THREE.MeshLambertMaterial({
  color: 0x9fb4c0, transparent: true, opacity: 0.45, flatShading: true, side: THREE.DoubleSide, depthWrite: false,
});

/** A painted mesh from a geometry in body axes. */
const painted = (geometry, colourOf) => new THREE.Mesh(paint(geometry, colourOf), skin());

/** A control surface hung on its hinge: { pivot, axis, sign } (positive deflection moves the trailing edge down, or
 * right for a rudder). */
function hinged(mover, colourOf, sign) {
  const { a, b } = mover.hinge;
  const geometry = paint(mover.geometry.clone(), colourOf).translate(-a.x, -a.y, -a.z); // a copy: the original is mirrored next
  const pivot = new THREE.Group();
  pivot.position.copy(a);
  pivot.add(new THREE.Mesh(geometry, skin()));
  return { pivot, axis: new THREE.Vector3().subVectors(b, a).normalize(), sign, name: mover.name };
}

/** Both halves of a horizontal surface (wing or tailplane): meshes into `group`, movers returned. */
function pair(spec, colourOf, group) {
  const half = buildHalf(spec);
  group.add(painted(half.fixed, colourOf), painted(mirrorZ(half.fixed), colourOf));
  const movers = [];
  for (const m of half.movers) {
    movers.push({ ...hinged(m, colourOf, 1), side: 1 });
    const mirrored = {
      name: m.name, geometry: mirrorZ(m.geometry),
      hinge: { a: m.hinge.a.clone().setZ(-m.hinge.a.z), b: m.hinge.b.clone().setZ(-m.hinge.b.z) },
    };
    movers.push({ ...hinged(mirrored, colourOf, -1), side: -1 });
  }
  for (const m of movers) group.add(m.pivot);
  return movers;
}

/** A fin: built as a horizontal half and stood upright at (x0, y0, z0). */
function fin(spec, colourOf, group, at) {
  const half = buildHalf(spec);
  const stand = (g) => g.rotateX(-Math.PI / 2).translate(at.x, at.y, at.z);
  const upright = (v) => new THREE.Vector3(v.x + at.x, v.z + at.y, -v.y + at.z);
  group.add(painted(stand(half.fixed), colourOf));
  return half.movers.map((m) => {
    const mover = hinged({ name: m.name, geometry: stand(m.geometry), hinge: { a: upright(m.hinge.a), b: upright(m.hinge.b) } }, colourOf, 1);
    group.add(mover.pivot);
    return mover;
  });
}

/** An airscrew at a hub: spinner, three blades and a disc. */
function airscrew(ac, hub, bladeColour) {
  const group = new THREE.Group();
  group.position.set(hub.x, hub.y, hub.z ?? 0);
  const radius = ac.propeller.diameter / 2;
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 10).rotateZ(-Math.PI / 2).translate(0.15, 0, 0),
    new THREE.MeshLambertMaterial({ color: bladeColour, flatShading: true }));
  const blades = new THREE.Group();
  for (let k = 0; k < 3; k += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, radius, 0.22).translate(0, radius / 2, 0),
      new THREE.MeshLambertMaterial({ color: bladeColour }));
    blade.rotation.x = (k * 2 * Math.PI) / 3;
    blades.add(blade);
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 32).rotateY(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  group.add(spinner, blades, disc);
  return { group, blades, disc };
}

/** A main undercarriage leg and wheel, folding about its top: { pivot, axis }. */
function leg(ac, design, z) {
  const { main } = ac.gear;
  const top = new THREE.Vector3(main.x, design.gear.top, z);
  const length = top.y - main.y;
  const pivot = new THREE.Group();
  pivot.position.copy(top);
  const metal = new THREE.MeshLambertMaterial({ color: 0x55585a });
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, length, 6).translate(0, -length / 2, 0), metal);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(main.radius, main.radius, 0.16, 14).rotateX(Math.PI / 2)
    .translate(0, -length, 0), new THREE.MeshLambertMaterial({ color: 0x1c1c1c }));
  pivot.add(strut, wheel);
  // Folding: sideways (outward or inward) about the fore-and-aft axis, or backward into a nacelle.
  const outward = Math.sign(z);
  const axis = design.gear.retract === 'back' ? new THREE.Vector3(0, 0, -1)
    : new THREE.Vector3(design.gear.retract === 'in' ? outward : -outward, 0, 0);
  return { pivot, axis };
}

/** A loft section from a design's [position, half-width, top, bottom], placing the position with `at`. */
const ring = (at) => ([p, w, top, bottom]) => ({ x: at(p), w, h: (top - bottom) / 2, y: (top + bottom) / 2 });

/** Sections with more added (interpolated) at the fractions `fs`. */
function withSections(sections, fs) {
  const out = [...sections];
  for (const f of fs) {
    const i = out.findIndex((s) => s[0] > f);
    if (i < 1) continue;
    const a = out[i - 1];
    const b = out[i];
    const k = (f - a[0]) / (b[0] - a[0]);
    out.splice(i, 0, a.map((v, j) => v + (b[j] - v) * k));
  }
  return out;
}

/** The model of an aircraft. Returns { group, update(plane, dt, { inside }) } and its moving parts (movers, legs, screws). */
export function buildAircraftModel(ac, design) {
  const colourOf = scheme(design.scheme, { band: design.band });
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.name = 'fuselage';
  group.add(body);
  const L = ac.geometry.length;
  const x = (f) => design.nose - f * L;

  // Fuselage (with extra sections at the Sky band's edges, so the band is painted square), canopy, any gondola and nacelles.
  const fuselage = withSections(design.fuselage, (design.band ?? []).map((bx) => (design.nose - bx) / L));
  body.add(painted(loft(fuselage.map(ring(x))), colourOf));
  for (const c of design.glazing) body.add(new THREE.Mesh(loft(c.map(ring(x)), { round: 2 }), glass()));
  for (const g of design.extras ?? []) body.add(painted(loft(g.map(ring(x))), colourOf));
  for (const n of design.nacelles ?? []) {
    for (const mount of engineMounts(ac)) {
      const rings = n.map(([dx, w, top, bottom]) => ring((d) => mount.x + d)([dx, w, top + mount.y, bottom + mount.y]));
      group.add(painted(loft(rings, { round: 2.2 }).translate(0, 0, mount.z), colourOf));
    }
  }
  for (const r of design.radiators ?? []) {
    group.add(painted(new THREE.BoxGeometry(r.l, r.h, r.w).toNonIndexed().translate(r.x, r.y, r.z), colourOf));
  }

  // Wings, tailplane and fins with their moving surfaces.
  const wings = new THREE.Group();
  group.add(wings);
  const movers = [...pair(design.wing(ac), colourOf, wings), ...pair(design.tailplane(ac), colourOf, body)];
  for (const f of design.fins(ac)) movers.push(...fin(f.spec, colourOf, body, f.at));

  // Undercarriage, and the fixed tailwheel.
  const legs = [-1, 1].map((s) => leg(ac, design, s * ac.gear.main.z));
  for (const l of legs) group.add(l.pivot);
  const tw = ac.gear.tail;
  const tailWheel = new THREE.Mesh(new THREE.CylinderGeometry(tw.radius, tw.radius, 0.08, 10).rotateX(Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x1c1c1c }));
  tailWheel.position.set(tw.x, tw.y, 0);
  group.add(tailWheel);
  const strut = sectionAt(design, (design.nose - tw.x) / L).bottom - tw.y; // up to the fuselage
  if (strut > tw.radius) {
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, strut, 6).translate(tw.x, tw.y + strut / 2, 0),
      new THREE.MeshLambertMaterial({ color: 0x55585a })));
  }

  // Airscrews.
  const bladeColour = design.scheme === 'raf' ? PAINT.black : PAINT.rlm70;
  const hubs = ac.engines ? Object.values(ac.engines) : [{ ...ac.propHub, z: 0 }];
  const screws = hubs.map((hub) => airscrew(ac, hub, bladeColour));
  for (const s of screws) group.add(s.group);

  // Markings.
  for (const m of design.markings(ac)) {
    const shape = { roundelA1, roundelB, finFlash, balkenkreuz, swastika }[m.kind](...m.size);
    shape.position.set(...m.at);
    shape.rotation.set(...(m.turn ?? [0, 0, 0]));
    shape.userData.marking = m.kind;
    (m.on === 'wing' ? wings : body).add(shape);
  }

  const turn = new THREE.Quaternion();
  const update = (plane, dt, { inside = false } = {}) => {
    const s = plane.surfaces;
    const flap = s.flaps * ac.controls.flapTravel;
    for (const m of movers) {
      const angle = m.name === 'aileron' ? -m.side * s.aileron * DEFLECTION.aileron
        : m.name === 'flap' ? flap
          : m.name === 'elevator' ? -s.elevator * ac.controls.elevatorUp
            : s.rudder * DEFLECTION.rudder;
      m.pivot.quaternion.copy(turn.setFromAxisAngle(m.axis, angle * m.sign));
    }
    for (const l of legs) l.pivot.quaternion.copy(turn.setFromAxisAngle(l.axis, (1 - s.gear) * (Math.PI / 2)));
    screws.forEach((sc, i) => {
      const omega = plane.engines[i]?.omega ?? 0;
      const rpm = (omega * 60) / (2 * Math.PI);
      sc.blades.rotation.x += omega * ac.propeller.gearRatio * ac.propeller.rotation * dt;
      sc.blades.visible = rpm < BLADES_UNTIL;
      sc.disc.material.opacity = rpm < BLADES_UNTIL ? 0 : Math.min(inside ? DISC.inside : DISC.outside, rpm / 6000);
    });
  };
  return { group, update, movers, legs, screws };
}
