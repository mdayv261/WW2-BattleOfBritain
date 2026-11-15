// Help on the take-off (D248): the take-off rudder trim of S33 (a ground start begins there, and a key toggles it and
// neutral), and the auto-rudder holding the heading on the ground. Flown with the scripted take-off of Phase 2
// (src/dev/groundTests.js), whose own test pilot steers unless told otherwise.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { takeoffRudderTrim, toggleTakeoffTrim } from '../../src/core/takeoffTrim.js';
import { ASSIST, assistedYaw } from '../../src/core/assists.js';
import { takeoffTest } from '../../src/dev/groundTests.js';
import { Bindings, KEYS_KEY } from '../../src/input/bindings.js';
import { Keyboard } from '../../src/input/keyboard.js';

const DT = 1 / 120;
const { spitfire, hurricane, bf109e4, bf110c4 } = aircraftById;
const FIGHTERS = [spitfire, hurricane, bf109e4, bf110c4];

/** The auto-rudder as the take-off test's rudder: the assist alone, with the test pilot's feet off the pedals. */
const autoRudder = () => {
  const memory = {};
  return (plane, input) => assistedYaw(plane, { ...input, yaw: 0 }, { autoRudder: true }, memory);
};

describe('the take-off rudder trim (S33)', () => {
  it('is fully right in the Spitfire only: the Hurricane and Bf 109 have no tab, and none is given for the Bf 110', () => {
    expect(takeoffRudderTrim(spitfire)).toBe(1);
    for (const ac of [hurricane, bf109e4, bf110c4]) expect(takeoffRudderTrim(ac)).toBeNull();
  });

  it('a ground start begins there; an air start and the other aircraft begin neutral', () => {
    expect(new Simulation(spitfire, 'ground').input.rudderTrim).toBe(1);
    expect(new Simulation(spitfire, 'air').input.rudderTrim ?? 0).toBe(0);
    for (const ac of [hurricane, bf109e4, bf110c4]) expect(new Simulation(ac, 'ground').input.rudderTrim).toBe(0);
  });

  it('the toggle goes take-off -> neutral -> take-off, and says so; elsewhere it explains and changes nothing', () => {
    const input = { rudderTrim: 1 };
    expect(toggleTakeoffTrim(spitfire, input)).toBe('Rudder trim: neutral');
    expect(input.rudderTrim).toBe(0);
    expect(toggleTakeoffTrim(spitfire, input)).toBe('Rudder trim: take-off (fully right)');
    expect(input.rudderTrim).toBe(1);
    input.rudderTrim = 0.4; // trimmed by hand: the key goes to the take-off setting
    toggleTakeoffTrim(spitfire, input);
    expect(input.rudderTrim).toBe(1);
    const other = { rudderTrim: 0.2 };
    expect(toggleTakeoffTrim(bf110c4, other)).toBe('No take-off rudder trim given for the Bf 110 C-4');
    expect(toggleTakeoffTrim(hurricane, other)).toBe('The Hurricane Mk I has no rudder trim tab');
    expect(toggleTakeoffTrim(bf109e4, other)).toBe('The Bf 109 E-4 has no rudder trim tab');
    expect(other.rudderTrim).toBe(0.2);
  });

  it('reduces the Spitfire\'s swing to the left on take-off', () => {
    const neutral = takeoffTest(spitfire, { flaps: 0 });
    const trimmed = takeoffTest(spitfire, { flaps: 0, rudderTrim: 1 });
    expect(trimmed.crash).toBeNull();
    expect(Math.abs(trimmed.maxSwing)).toBeLessThan(Math.abs(neutral.maxSwing) * 0.75);
  });
});

describe('the take-off trim key', () => {
  const memory = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  };

  it('is "/" by default, and keys saved before it existed gain it', () => {
    expect(new Bindings(null).of('rudderTrimTakeoff')).toEqual(['Slash']);
    const store = memory();
    store.setItem(KEYS_KEY, JSON.stringify({ version: 1, keys: { gear: ['KeyN'] } }));
    const b = new Bindings(store);
    expect(b.of('gear')).toEqual(['KeyN']);
    expect(b.of('rudderTrimTakeoff')).toEqual(['Slash']);
  });

  it('starts unbound, keeping the player\'s keys, if "/" was already put to another use', () => {
    const store = memory();
    store.setItem(KEYS_KEY, JSON.stringify({ version: 1, keys: { gear: ['Slash'] } }));
    const b = new Bindings(store);
    expect(b.of('gear')).toEqual(['Slash']);
    expect(b.of('rudderTrimTakeoff')).toEqual([]);
  });

  it('pressing it toggles the trim and leaves the message for the message line', () => {
    const kb = new Keyboard(null);
    const input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, rpm: 1, trim: 0, rudderTrim: 1, flaps: 0, gear: 1 };
    const e = { code: 'Slash', repeat: false, metaKey: false, ctrlKey: false, shiftKey: false, target: null, preventDefault() {} };
    kb.keyDown(e);
    kb.update(input, spitfire, DT);
    expect(input.rudderTrim).toBe(0);
    expect(kb.message).toBe('Rudder trim: neutral');
  });
});

describe('the auto-rudder on the ground', () => {
  it('holds the heading it took, rudders against a swing, gives way to the pilot and lets go at lift-off', () => {
    const sim = new Simulation(hurricane, 'ground');
    sim.step(DT);
    const memory = {};
    const assists = { autoRudder: true };
    expect(assistedYaw(sim.plane, sim.input, assists, memory)).toBeCloseTo(0, 1);
    expect(memory.heading).not.toBeNull();
    memory.heading -= 0.05; // as if the nose had swung 0.05 rad (about 3°) right of the held heading
    expect(assistedYaw(sim.plane, sim.input, assists, memory)).toBeLessThan(-0.5 * ASSIST.groundRudderMax); // left rudder
    sim.input.yaw = 0.4; // the pilot steers
    expect(assistedYaw(sim.plane, sim.input, assists, memory)).toBe(0.4);
    expect(memory.heading).toBeNull();
    sim.input.yaw = 0; // and lets go: the new heading is held
    assistedYaw(sim.plane, sim.input, assists, memory);
    expect(memory.heading).not.toBeNull();
    sim.plane.last.onGround = false; // airborne: the sideslip rule, and the heading let go
    sim.plane.last.beta = 0.02;
    expect(assistedYaw(sim.plane, sim.input, assists, memory)).toBeCloseTo(ASSIST.rudderGain * 0.02, 6);
    expect(memory.heading).toBeNull();
  });

  for (const ac of FIGHTERS) {
    it(`${ac.name}: holds the take-off run straighter than the test pilot, with the same ground run`, () => {
      const pilot = takeoffTest(ac, { flaps: ac.controls.flapTakeoff });
      const auto = takeoffTest(ac, { flaps: ac.controls.flapTakeoff, rudder: autoRudder() });
      expect(auto.crash).toBeNull();
      expect(Math.abs(auto.maxSwing)).toBeLessThan(2.5);
      expect(Math.abs(auto.maxSwing)).toBeLessThan(Math.abs(pilot.maxSwing) * 0.6);
      expect(Math.abs(auto.groundRun - pilot.groundRun) / pilot.groundRun).toBeLessThan(0.03);
    });
  }

  it('without it, hands off, the single-engined fighters ground-loop: the reason for the help', () => {
    for (const ac of [spitfire, hurricane, bf109e4]) expect(takeoffTest(ac, { flaps: ac.controls.flapTakeoff, rudder: 'none' }).crash).not.toBeNull();
  });
});
