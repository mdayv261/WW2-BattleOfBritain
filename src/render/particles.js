// A pool of particles for smoke, vapour, flames and flashes (Phase 5 checkpoint 5, D69): soft round sprites in the
// world, each with its own size, colour and opacity, drawn in one call. Each particle is laid at a point with a velocity
// that the air slows (drag, per second) and a steady rise; over its life it grows (or shrinks) from one size to another
// and fades out. The pool has a fixed budget: when it is full, new particles are skipped. The shader includes Three.js's
// logarithmic depth chunks, since the renderer uses a logarithmic depth buffer (src/render/scene.js): without them the
// particles' depth would not match the land's, and land behind them would hide them.

import * as THREE from 'three';

const vertexShader = `
attribute float aSize;
attribute vec3 aColour;
attribute float aAlpha;
uniform float uScale;
varying vec3 vColour;
varying float vAlpha;
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
void main() {
  vColour = aColour;
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(-mvPosition.z, 0.1);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`;

const fragmentShader = `
varying vec3 vColour;
varying float vAlpha;
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(vColour, vAlpha * (1.0 - d * d));
  #include <fog_fragment>
}`;

const FADE_IN = 0.02; // share of its life over which a particle fades in (short, so a trail shows from its source)

export class ParticlePool {
  /** A pool of up to `max` particles; `additive` for glowing ones (flames, flashes). */
  constructor(max, { additive = false } = {}) {
    this.max = max;
    this.count = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.colour = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    // Per particle: age, life, start and end size, opacity, drag, rise.
    this.state = new Float32Array(max * 7);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geometry.setAttribute('aColour', new THREE.BufferAttribute(this.colour, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    geometry.setDrawRange(0, 0);
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uScale: { value: 500 } }]),
      vertexShader, fragmentShader, fog: true, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  /**
   * Adds a particle: position and velocity (anything with x, y, z), life (s), size [start, end] (m), colour (THREE.Color),
   * alpha (its greatest opacity), drag (per second), rise (m/s). Returns false when the pool is full.
   */
  emit({ position, velocity, life, size, colour, alpha = 1, drag = 0, rise = 0 }) {
    if (this.count >= this.max) return false;
    const i = this.count;
    this.count += 1;
    this.pos.set([position.x, position.y, position.z], i * 3);
    this.vel.set([velocity.x, velocity.y, velocity.z], i * 3);
    this.colour.set([colour.r, colour.g, colour.b], i * 3);
    this.state.set([0, life, size[0], size[1], alpha, drag, rise], i * 7);
    this.size[i] = size[0];
    this.alpha[i] = 0;
    return true;
  }

  /** Ages and moves every particle by dt, dropping those at the end of their life. */
  update(dt) {
    const { pos, vel, state } = this;
    let i = 0;
    while (i < this.count) {
      const s = i * 7;
      state[s] += dt;
      const t = state[s] / state[s + 1];
      if (t >= 1) {
        this.remove(i);
        continue;
      }
      const slow = Math.exp(-state[s + 5] * dt);
      for (let k = 0; k < 3; k += 1) {
        vel[i * 3 + k] *= slow;
        pos[i * 3 + k] += vel[i * 3 + k] * dt;
      }
      pos[i * 3 + 1] += state[s + 6] * dt;
      this.size[i] = state[s + 2] + (state[s + 3] - state[s + 2]) * Math.sqrt(t);
      this.alpha[i] = state[s + 4] * Math.min(1, t / FADE_IN) * (1 - t);
      i += 1;
    }
    const g = this.points.geometry;
    g.setDrawRange(0, this.count);
    for (const name of ['position', 'aColour', 'aSize', 'aAlpha']) g.attributes[name].needsUpdate = true;
  }

  /** Removes particle i by moving the last one into its place. */
  remove(i) {
    const last = this.count - 1;
    if (i !== last) {
      this.pos.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.vel.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.colour.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.state.copyWithin(i * 7, last * 7, last * 7 + 7);
      this.size[i] = this.size[last];
      this.alpha[i] = this.alpha[last];
    }
    this.count = last;
  }

  /** Sizes particles in metres on screen: pixels per metre at 1 m for a camera and drawing height (pixels). */
  setView(camera, height) {
    this.material.uniforms.uScale.value = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
  }

  clear() {
    this.count = 0;
    this.points.geometry.setDrawRange(0, 0);
  }
}
