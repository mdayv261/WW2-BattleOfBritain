// The visible damage (D69): the particle pool keeps within its budget and recycles its particles; damaged aircraft
// leave trails behind them, strikes leave flashes and puffs, fast crashes burn; wrecks and broken-off parts are drawn
// from the right pieces of the model.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ParticlePool } from '../../src/render/particles.js';
import { EffectsView } from '../../src/render/effects.js';
import { WreckView, buildFalling } from '../../src/render/wrecks.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { partCentre } from '../../src/core/wreck.js';

const camera = new THREE.PerspectiveCamera(60, 1.5, 0.5, 50000);
const DT = 1 / 120;
const at = { x: 0, y: 0, z: 0 };
const puff = { position: at, velocity: { x: 0, y: 0, z: 10 }, life: 1, size: [1, 3], colour: new THREE.Color(1, 1, 1), alpha: 0.5 };

describe('particle pool', () => {
  it('never holds more than its budget, and frees particles at the end of their life', () => {
    const pool = new ParticlePool(10);
    for (let i = 0; i < 15; i += 1) pool.emit(puff);
    expect(pool.count).toBe(10);
    expect(pool.emit(puff)).toBe(false);
    pool.update(0.5);
    expect(pool.count).toBe(10);
    pool.update(0.6);
    expect(pool.count).toBe(0);
    expect(pool.emit(puff)).toBe(true);
  });

  it('its shader has the chunks the logarithmic depth buffer needs (else land behind would hide every particle)', () => {
    const { vertexShader, fragmentShader } = new ParticlePool(1).material;
    for (const chunk of ['common', 'logdepthbuf_pars_vertex', 'logdepthbuf_vertex']) expect(vertexShader).toContain(`#include <${chunk}>`);
    for (const chunk of ['logdepthbuf_pars_fragment', 'logdepthbuf_fragment']) expect(fragmentShader).toContain(`#include <${chunk}>`);
  });

  it('a particle drifts, grows and fades out', () => {
    const pool = new ParticlePool(4);
    pool.emit({ ...puff, drag: 1, rise: 2 });
    pool.update(0.5);
    expect(pool.pos[2]).toBeGreaterThan(2); // drifted on with its velocity, slowed by drag
    expect(pool.pos[2]).toBeLessThan(5);
    expect(pool.pos[1]).toBeCloseTo(1, 5); // risen
    expect(pool.size[0]).toBeGreaterThan(2);
    const midAlpha = pool.alpha[0];
    pool.update(0.4);
    expect(pool.alpha[0]).toBeLessThan(midAlpha);
  });
});

/** A simulation in the air with its effects, flown for t seconds with the effects drawn each frame. */
function flying(id = 'spitfire') {
  const sim = new Simulation(aircraftById[id], 'air');
  const view = new EffectsView(new THREE.Scene());
  const run = (t) => {
    for (let s = 0; s < t; s += 1 / 60) {
      sim.step(DT);
      sim.step(DT);
      view.update(sim, 1 / 60, camera, 800);
    }
  };
  return { sim, view, run };
}

describe('effects', () => {
  it('an undamaged flight shows nothing', () => {
    const { view, run } = flying();
    run(1);
    expect(view.pools.smoke.count + view.pools.glow.count).toBe(0);
  });

  it('a coolant leak leaves a glycol trail behind the aircraft', () => {
    const { sim, view, run } = flying();
    sim.plane.engines[0].heat.coolantLeak = 0.01;
    run(1.5);
    const pool = view.pools.smoke;
    expect(pool.count).toBeGreaterThan(40);
    // The oldest particles are well behind the aircraft (it flies on past them).
    const behind = new THREE.Vector3(pool.pos[0], pool.pos[1], pool.pos[2]).distanceTo(sim.plane.body.position);
    expect(behind).toBeGreaterThan(50);
  });

  it('a fire shows flames and smoke', () => {
    const { sim, view, run } = flying('hurricane');
    sim.plane.damage.fire = { kind: 'fuel fire', time: 0, zone: 'wingInnerLeft' };
    run(0.5);
    expect(view.pools.glow.count).toBeGreaterThan(5);
    expect(view.pools.smoke.count).toBeGreaterThan(5);
  });

  it('strikes leave flashes and puffs, and are used up', () => {
    const { sim, view } = flying();
    const point = sim.plane.body.position.clone();
    sim.hitEvents.push({ point, kind: 'heTracer20', velocity: new THREE.Vector3() }, { point, kind: 'ball303', velocity: new THREE.Vector3() });
    view.update(sim, 1 / 60, camera, 800);
    expect(view.pools.glow.count).toBe(1); // the shell's flash; the ball round only puffs
    expect(view.pools.smoke.count).toBe(2);
    expect(sim.hitEvents).toHaveLength(0);
  });

  it('a fast crash bursts into a fireball and smokes for a while; a slow one does not', () => {
    const { sim, view } = flying();
    sim.crashSites.push({ position: new THREE.Vector3(0, 100, 0), speed: 10, time: 0 });
    view.update(sim, 1 / 60, camera, 800);
    expect(view.pools.glow.count).toBe(0);
    sim.crashSites.push({ position: new THREE.Vector3(0, 100, 0), speed: 80, time: 0 });
    view.update(sim, 1 / 60, camera, 800);
    expect(view.pools.glow.count).toBeGreaterThan(10);
    for (let i = 0; i < 60; i += 1) view.update(sim, 1 / 60, camera, 800);
    expect(view.columns).toHaveLength(1);
    expect(view.pools.smoke.count).toBeGreaterThan(5);
  });
});

describe('wrecks on screen', () => {
  it('an airframe is drawn without its lost wing; the wing alone turns about its own middle', () => {
    const ac = aircraftById.bf109e4;
    const airframe = buildFalling({ ac, lost: ['wingRight'] });
    expect(airframe.getObjectByName('wingRight').visible).toBe(false);
    expect(airframe.getObjectByName('wingLeft').visible).toBe(true);
    const centre = partCentre(ac, 'wingRight');
    const wing = buildFalling({ ac, part: 'wingRight', centre });
    expect(wing.getObjectByName('wingRight')).toBeDefined();
    expect(wing.getObjectByName('fuselage')).toBeUndefined();
    wing.updateMatrixWorld(true);
    const middle = new THREE.Box3().setFromObject(wing).getCenter(new THREE.Vector3());
    expect(middle.length()).toBeLessThan(1); // centred on the pivot
  });

  it('draws each falling piece of a broken target, and drops them when they land', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const scene = new THREE.Scene();
    const view = new WreckView(scene);
    sim.nextTarget();
    sim.target.plane.damage.failed = { cause: 'The tail broke away', parts: ['tail'] };
    sim.step(DT);
    view.update(sim, 1);
    expect(view.objects.size).toBe(2);
    sim.falling.length = 0;
    view.update(sim, 1);
    expect(view.objects.size).toBe(0);
    expect(scene.children).toHaveLength(0);
  });
});
