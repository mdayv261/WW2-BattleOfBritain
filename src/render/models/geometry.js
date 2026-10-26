// Shapes for the low-polygon aircraft models (D54). All in the aircraft's body axes (metres from the centre of
// gravity: +X forward, +Y up, +Z right), as triangle lists ready for flat shading.
//   loft(sections)                 - a body of revolution-like shape through cross-sections (fuselages, nacelles)
//   surface(stations, options)     - a lifting surface (wing half, tailplane half, fin) through chordwise stations
//   paint(geometry, colourOf)      - per-triangle vertex colours from the triangle's centre and normal

import * as THREE from 'three';

/** A triangle-list BufferGeometry from an array of [x, y, z] triples (three per triangle). */
export function triangles(points) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  g.computeVertexNormals();
  return g;
}

const quad = (out, a, b, c, d) => out.push(a, b, c, a, c, d);

/**
 * A lofted body through cross-sections running nose to tail: each { x, w, h, y } (half-width and half-height in m, y
 * the section's centre height), drawn as a rounded box (super-ellipse of exponent `round`, 2 = ellipse) with `sides`
 * points round it. The ends are closed.
 */
export function loft(sections, { sides = 14, round = 2.4 } = {}) {
  const ring = (s) => Array.from({ length: sides }, (_, k) => {
    const a = (k / sides) * Math.PI * 2;
    const c = Math.cos(a);
    const n = Math.sin(a);
    const e = 2 / round;
    return [s.x, s.y + s.h * Math.sign(c) * Math.abs(c) ** e, s.w * Math.sign(n) * Math.abs(n) ** e];
  });
  const rings = sections.map(ring);
  const out = [];
  for (let i = 0; i < rings.length - 1; i += 1) {
    for (let k = 0; k < sides; k += 1) {
      const k2 = (k + 1) % sides;
      quad(out, rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]);
    }
  }
  const cap = (r, s, flip) => {
    const centre = [s.x, s.y, 0];
    for (let k = 0; k < sides; k += 1) {
      const k2 = (k + 1) % sides;
      if (flip) out.push(centre, r[k2], r[k]);
      else out.push(centre, r[k], r[k2]);
    }
  };
  cap(rings[0], sections[0], true);
  cap(rings[rings.length - 1], sections[sections.length - 1], false);
  return triangles(out);
}

/** Half-thickness of a symmetrical aerofoil (NACA 4-digit form) at chord fraction f, for thickness ratio t. */
export const thicknessAt = (f, t) => 5 * t * (0.2969 * Math.sqrt(f) - 0.126 * f - 0.3516 * f * f + 0.2843 * f ** 3 - 0.1036 * f ** 4);

const CHORD_POINTS = [0, 0.03, 0.1, 0.2, 0.3, 0.45, 0.6, 0.75, 0.88, 1];

/**
 * A lifting surface through spanwise stations, each { s, le, chord, y, t }: span position s (m along +Z), leading edge
 * x, chord (m), height y of the chord line and thickness ratio t. Only the chord fractions from `from` to `to` are
 * drawn (so a control surface can be cut from the trailing edge), with both ends closed.
 */
export function surface(stations, { from = 0, to = 1 } = {}) {
  const fractions = [from, ...CHORD_POINTS.filter((f) => f > from && f < to), to];
  const section = (st) => fractions.map((f) => {
    const x = st.le - f * st.chord;
    const half = Math.max(thicknessAt(f, st.t) * st.chord, 0.004);
    return { top: [x, st.y + half, st.s], bottom: [x, st.y - half, st.s] };
  });
  const sections = stations.map(section);
  const out = [];
  for (let i = 0; i < sections.length - 1; i += 1) {
    const a = sections[i];
    const b = sections[i + 1];
    for (let k = 0; k < fractions.length - 1; k += 1) {
      quad(out, a[k].top, b[k].top, b[k + 1].top, a[k + 1].top);
      quad(out, a[k].bottom, a[k + 1].bottom, b[k + 1].bottom, b[k].bottom);
    }
    // Leading and trailing faces of the drawn chord range (closed where a control surface is cut away).
    quad(out, a[0].bottom, b[0].bottom, b[0].top, a[0].top);
    const n = fractions.length - 1;
    quad(out, a[n].top, b[n].top, b[n].bottom, a[n].bottom);
  }
  // The end ribs.
  for (const [sec, flip] of [[sections[0], true], [sections[sections.length - 1], false]]) {
    for (let k = 0; k < fractions.length - 1; k += 1) {
      if (flip) quad(out, sec[k].top, sec[k + 1].top, sec[k + 1].bottom, sec[k].bottom);
      else quad(out, sec[k].top, sec[k].bottom, sec[k + 1].bottom, sec[k + 1].top);
    }
  }
  return triangles(out);
}

/** A copy of a geometry mirrored left to right (z to -z), with its triangles turned so they still face outward. */
export function mirrorZ(geometry) {
  const g = geometry.clone();
  g.scale(1, 1, -1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      const t = p.getComponent(i + 1, a);
      p.setComponent(i + 1, a, p.getComponent(i + 2, a));
      p.setComponent(i + 2, a, t);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Joins triangle-list geometries into one. */
export function merge(geometries) {
  const points = [];
  for (const g of geometries) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 1) points.push([p.getX(i), p.getY(i), p.getZ(i)]);
  }
  return triangles(points);
}

/**
 * Gives each triangle a single colour, from colourOf(centre, normal) -> THREE.Color, where centre and normal are in
 * the aircraft's body axes (the geometry's own coordinates plus `offset`, for parts built at a pivot).
 */
export function paint(geometry, colourOf, offset = new THREE.Vector3()) {
  const p = geometry.attributes.position;
  const colours = new Float32Array(p.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize().negate(); // outward, as the parts are wound
    const centre = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3).add(offset);
    const colour = colourOf(centre, n);
    for (let k = 0; k < 3; k += 1) colour.toArray(colours, (i + k) * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  return geometry;
}
