// Wrecks and losses (D69): a broken airframe falls and turns the way its loss turns it; broken-off parts fall away on
// their own; reaching the ground marks a crash site; the player's flight ends with the wreck falling, and a target whose
// pilot is killed flies on uncontrolled until the ground.
import { describe, it, expect } from 'vitest';
import { Vector3, Quaternion } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Wreck, breakUp, wreckSpin, partCentre } from '../../src/core/wreck.js';
import { Simulation } from '../../src/core/simulation.js';
import { common } from '../../src/aircraft/common.js';
import { attitude } from '../../src/core/autopilot.js';

const DT = 1 / 120;
const flat = { surfaceAt: () => ({ height: 0 }) };
const pose = (y = 3000) => ({ position: new Vector3(0, y, 0), velocity: new Vector3(0, 0, -100), quaternion: new Quaternion() });
const fly = (w, t, terrain = null) => { for (let s = 0; s < t; s += DT) w.step(DT, terrain); };

describe('wreck', () => {
  it('falls and settles at its terminal speed (at sea level, the set figure)', () => {
    const low = new Wreck(pose(0), new Vector3(), common.wreck.terminalSpeed);
    low.body.velocity.set(0, -common.wreck.terminalSpeed, 0);
    fly(low, 1);
    expect(Math.abs(low.body.velocity.y + common.wreck.terminalSpeed)).toBeLessThan(2); // nearly steady
    const high = new Wreck(pose(6000), new Vector3(), common.wreck.terminalSpeed);
    fly(high, 30);
    expect(-high.body.velocity.y).toBeGreaterThan(common.wreck.terminalSpeed); // thinner air: falls faster
  });

  it('rolls towards a lost wing and pitches over without its tail', () => {
    const right = new Wreck(pose(), wreckSpin(['wingRight']), 90);
    const left = new Wreck(pose(), wreckSpin(['wingLeft']), 90);
    const tail = new Wreck(pose(), wreckSpin(['tail']), 90);
    fly(right, 0.6);
    fly(left, 0.6);
    fly(tail, 0.6);
    expect(attitude({ body: right.body }).bank).toBeGreaterThan(0.2); // right wing down
    expect(attitude({ body: left.body }).bank).toBeLessThan(-0.2);
    expect(attitude({ body: tail.body }).pitch).toBeLessThan(-0.2); // nose down
  });

  it('stops on the ground and says where', () => {
    const w = new Wreck(pose(300), new Vector3(), 90);
    fly(w, 20, flat);
    expect(w.landed).not.toBeNull();
    expect(w.landed.y).toBe(0);
    expect(w.body.velocity.length()).toBe(0);
  });

  it('a broken-off wing starts where it was on the aircraft and falls away behind', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.plane.damage.failed = { cause: 'The right wing broke', parts: ['wingRight'] };
    const { wreck, debris } = breakUp(sim.plane);
    expect(debris).toHaveLength(1);
    const centre = partCentre(aircraftById.spitfire, 'wingRight');
    expect(centre.z).toBeGreaterThan(1.5);
    expect(debris[0].wreck.body.position.distanceTo(sim.plane.body.position)).toBeCloseTo(centre.length(), 3);
    fly(wreck, 5);
    fly(debris[0].wreck, 5);
    expect(debris[0].wreck.body.position.y).toBeGreaterThan(wreck.body.position.y); // flutters down more slowly
  });
});

describe('losses in the simulation', () => {
  it('the player\'s broken aircraft ends the flight and falls as a wreck, its wing tumbling away, to a crash site', () => {
    const sim = new Simulation(aircraftById.hurricane, 'air');
    sim.plane.damage.failed = { cause: 'The left wing broke', parts: ['wingLeft'] };
    sim.step(DT);
    expect(sim.crashed).toBe(true);
    expect(sim.crashCause).toBe('The left wing broke');
    expect(sim.wreck).not.toBeNull();
    expect(sim.falling.map((f) => f.part ?? 'airframe')).toEqual(['airframe', 'wingLeft']);
    const y0 = sim.plane.body.position.y;
    for (let i = 0; i < 240; i += 1) sim.step(DT);
    expect(sim.plane.body.position.y).toBeLessThan(y0 - 10); // the model follows the falling wreck
    for (let i = 0; i < 120 * 120 && sim.falling.length; i += 1) sim.step(DT);
    expect(sim.falling).toHaveLength(0);
    expect(sim.crashSites).toHaveLength(1);
  });

  it('with the player\'s pilot killed the flight ends, but the aircraft flies on, uncontrolled, to the ground', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.plane.damage.pilot = 0;
    sim.plane.damage.failed = { cause: 'The pilot was killed', pilotKilled: true, parts: [] };
    sim.input.pitch = 0.2;
    sim.step(DT);
    expect(sim.crashed).toBe(true);
    expect(sim.uncontrolled).not.toBeNull();
    sim.input.pitch = -1; // the dead pilot's controls no longer follow the stick
    const x0 = sim.plane.body.position.clone();
    for (let i = 0; i < 120 * 300 && !sim.plane.ground.crash; i += 1) sim.step(DT);
    expect(sim.plane.body.position.distanceTo(x0)).toBeGreaterThan(500);
    expect(sim.plane.ground.crash).toBeTruthy();
    expect(sim.crashSites).toHaveLength(1);
  });

  it('a target whose wing breaks becomes a falling wreck and a falling wing', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.nextTarget();
    sim.target.plane.damage.failed = { cause: 'The right wing broke', parts: ['wingRight'] };
    sim.step(DT);
    expect(sim.target).toBeNull();
    expect(sim.notice.text).toBe('Target destroyed: The right wing broke');
    expect(sim.falling.map((f) => f.part ?? 'airframe')).toEqual(['airframe', 'wingRight']);
    expect(sim.falling[0].ac).toBe(aircraftById.hurricane);
  });

  it('a target whose pilot is killed flies on, uncontrolled, until it crashes', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.nextTarget();
    const t = sim.target;
    t.plane.damage.pilot = 0;
    t.plane.damage.failed = { cause: 'The pilot was killed', pilotKilled: true, parts: [] };
    t.input.pitch = 0.3; // frozen with the stick part back
    sim.step(DT);
    expect(sim.target).toBe(t);
    expect(sim.notice.text).toBe("Target's pilot killed");
    sim.plane.body.position.y = 1e5; // keep the player out of the way
    for (let i = 0; i < 120 * 300 && sim.target; i += 1) sim.step(DT);
    expect(sim.target).toBeNull();
    expect(sim.notice.text).toBe('Target crashed');
    expect(sim.crashSites.length).toBeGreaterThan(0);
  });

  it('hits are kept, with their points in the world, for the flashes', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.nextTarget();
    const t = sim.target;
    const ahead = t.plane.body.position.clone().sub(sim.plane.body.position).setLength(250);
    t.plane.body.position.copy(sim.plane.body.position).add(ahead);
    t.plane.body.velocity.copy(sim.plane.body.velocity);
    t.autopilot.hold.speed = sim.plane.body.velocity.length();
    sim.input.fireMg = true;
    for (let i = 0; i < 240 && sim.hitEvents.length === 0; i += 1) sim.step(DT);
    // The first hits, on the target as it is now: within its length of its centre.
    const e = sim.hitEvents.at(-1);
    expect(e.point.distanceTo(sim.target.plane.body.position)).toBeLessThan(aircraftById.hurricane.geometry.length);
    expect(e.velocity.length()).toBeGreaterThan(50);
  });
});
