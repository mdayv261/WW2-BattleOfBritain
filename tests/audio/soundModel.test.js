// What each sound follows (Phase 7 checkpoint 5, D231): the engines' firing frequency, loudness and brightness with
// boost; the wind with airspeed; the rounds each gun fires, machine guns and cannon apart; and which other aircraft
// are heard, how loud, where and at what Doppler-shifted pitch.
import { describe, it, expect } from 'vitest';
import { Vector3, Quaternion } from 'three';
import { aircraftById, engines } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';
import { Simulation } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { firingFrequency, engineVoices, windVoice, ShotCounter, hearing, HEARING_RANGE, MAX_HEARD } from '../../src/audio/soundModel.js';

const DT = 1 / 120;

describe('the engine sound', () => {
  it('is pitched at the four-stroke firing frequency: a Merlin at 3,000 rpm fires 300 times a second', () => {
    for (const e of Object.values(engines)) expect(e.cylinders).toBe(12);
    expect(firingFrequency(3000 * UNIT.RPM, 12)).toBeCloseTo(300, 6);
    expect(firingFrequency(2400 * UNIT.RPM, 12)).toBeCloseTo(240, 6);
  });

  it('is louder and brighter at full boost than at closed throttle, and silent when stopped', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.step(DT);
    const plane = sim.plane;
    const at = (map) => {
      plane.last = { ...plane.last, map, engines: [{ map }] };
      return engineVoices(sim.ac, plane, sim.input)[0];
    };
    const idle = at(engines.merlin3.idleMap);
    const full = at(engines.merlin3.ratings.normal.map);
    expect(full.gain).toBeGreaterThan(idle.gain * 1.5);
    expect(full.cutoff).toBeGreaterThan(idle.cutoff);
    expect(full.freq).toBeCloseTo(firingFrequency(plane.engines[0].omega, 12), 6);
    sim.input.engines[0].failed = true;
    expect(engineVoices(sim.ac, plane, sim.input)[0].gain).toBe(0);
    sim.input.engines[0].failed = false;
    plane.engines[0].omega = 0;
    expect(engineVoices(sim.ac, plane, sim.input)[0].gain).toBe(0);
  });

  it('gives a twin a voice for each engine, which differ when the engines turn at different speeds', () => {
    for (const id of ['bf110c4', 'he111h']) {
      const sim = new Simulation(aircraftById[id], 'air');
      sim.step(DT);
      sim.plane.engines[1].omega *= 0.8;
      const v = engineVoices(sim.ac, sim.plane, sim.input);
      expect(v).toHaveLength(2);
      expect(v[1].freq).toBeCloseTo(v[0].freq * 0.8, 6);
    }
  });
});

describe('the wind', () => {
  it('is silent at rest and rises with the square of the airspeed, more with the undercarriage down', () => {
    expect(windVoice(0).gain).toBe(0);
    expect(windVoice(100).gain).toBeCloseTo(4 * windVoice(50).gain, 6);
    expect(windVoice(100).cutoff).toBeGreaterThan(windVoice(50).cutoff);
    expect(windVoice(80, { gear: 1 }).gain).toBeGreaterThan(windVoice(80).gain);
    expect(windVoice(400).gain).toBe(1);
  });
});

describe('the rounds fired', () => {
  it('counts a one-second burst of the Spitfire\'s eight Brownings: about 147 rounds, all machine gun', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    const counter = new ShotCounter();
    counter.count(sim.player);
    sim.input.fireMg = true;
    let total = 0;
    for (let i = 0; i < 120; i += 1) {
      sim.step(DT);
      total += counter.count(sim.player).mg;
    }
    expect(total).toBeGreaterThan(140);
    expect(total).toBeLessThan(155);
  });

  it('counts a Bf 109\'s cannon and machine guns apart', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    const counter = new ShotCounter();
    counter.count(sim.player);
    sim.input.fireCannon = true;
    for (let i = 0; i < 120; i += 1) sim.step(DT);
    const fired = counter.count(sim.player);
    expect(fired.mg).toBe(0);
    expect(fired.cannon).toBeGreaterThan(10);
  });

  it('counts an air gunner\'s rounds, and not a fresh drum as shots', () => {
    const he111 = new Craft(aircraftById.he111h);
    const counter = new ShotCounter();
    counter.count(he111);
    const [m] = he111.gunnery.mounts;
    m.rounds -= 5;
    expect(counter.count(he111)).toEqual({ mg: 5, cannon: 0 });
    m.rounds = m.capacity; // a drum changed
    expect(counter.count(he111)).toEqual({ mg: 0, cannon: 0 });
  });
});

describe('other aircraft heard', () => {
  const listener = (velocity = new Vector3()) => ({ position: new Vector3(0, 3000, 0), velocity, quaternion: new Quaternion() });
  /** A Bf 109 at (x, z) m from the listener, flying at `velocity`. */
  const at = (x, z, velocity = new Vector3()) => {
    const c = new Craft(aircraftById.bf109e4);
    c.plane.body.position.set(x, 3000, z);
    c.plane.body.velocity.copy(velocity);
    return c;
  };

  it('hears the nearest few within range, nearest first and louder, none beyond', () => {
    const crafts = [2000, 1400, 900, 100, 300, 500, 700, 1100, 1300].map((d) => at(d, 0));
    const heard = hearing(listener(), crafts);
    expect(heard).toHaveLength(MAX_HEARD);
    expect(heard.map((h) => Math.round(h.distance))).toEqual([100, 300, 500, 700, 900, 1100]);
    for (let i = 1; i < heard.length; i += 1) expect(heard[i].gain).toBeLessThan(heard[i - 1].gain);
    expect(hearing(listener(), [at(HEARING_RANGE + 1, 0)])).toHaveLength(0);
  });

  it('raises the pitch of one closing and lowers that of one going away (Doppler at the ISA speed of sound)', () => {
    const closing = hearing(listener(), [at(500, 0, new Vector3(-60, 0, 0))])[0];
    const going = hearing(listener(), [at(500, 0, new Vector3(60, 0, 0))])[0];
    expect(closing.doppler).toBeCloseTo(1.2, 1); // about 329 / (329 - 60) at 3,000 m
    expect(going.doppler).toBeLessThan(1);
    const passing = hearing(listener(), [at(500, 0, new Vector3(0, 0, 60))])[0];
    expect(passing.doppler).toBeCloseTo(1, 6);
  });

  it('pans by the bearing from the listener\'s nose: his right is +z in his own axes', () => {
    expect(hearing(listener(), [at(0, 400)])[0].pan).toBeCloseTo(1, 6);
    expect(hearing(listener(), [at(0, -400)])[0].pan).toBeCloseTo(-1, 6);
    expect(hearing(listener(), [at(400, 0)])[0].pan).toBeCloseTo(0, 6);
  });
});
