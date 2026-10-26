// Phase 2 checkpoint 2: the aerodrome and starts, keyboard and joystick controls, cameras and instruments.
import { describe, it, expect } from 'vitest';
import { Vector3, Quaternion, Euler } from 'three';
import { Keyboard, stepFlaps } from '../../src/input/keyboard.js';
import { Joystick, hatDirection, DEFAULT_MAPPING } from '../../src/input/joystick.js';
import { cockpitQuaternion, eyePosition, CameraRig, HAT_LOOKS } from '../../src/render/cameras.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { rafAirspeedAngle } from '../../src/ui/airspeed.js';
import { rafRpmAngle } from '../../src/ui/engineGauges.js';
import { airfieldTerrain, onAirfield, AIRFIELD, STARTS } from '../../src/world/airfield.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

const { spitfire, hurricane, bf109e4 } = aircraftById;
const DT = 1 / 120;

/** A keyboard listening to a fake target, so key presses can be sent directly. */
function fakeKeyboard() {
  const handlers = {};
  const kb = new Keyboard({ addEventListener: (type, fn) => { handlers[type] = fn; } });
  const send = (type, code) => handlers[type]({ code, repeat: false, preventDefault() {} });
  return { kb, press: (code) => { send('keydown', code); send('keyup', code); }, down: (c) => send('keydown', c), up: (c) => send('keyup', c) };
}

describe('aerodrome and starts', () => {
  it('is land at the aerodrome and sea south of the coast', () => {
    expect(airfieldTerrain.surfaceAt(0, 0).water).toBe(false);
    expect(airfieldTerrain.surfaceAt(0, AIRFIELD.coastZ + 10).water).toBe(true);
    expect(onAirfield(STARTS.ground.x, STARTS.ground.z)).toBe(true);
  });

  it('starts on the ground at the aerodrome, at rest, engine off until L starts it (D49)', () => {
    const sim = new Simulation(spitfire);
    const { position } = sim.plane.body;
    expect(onAirfield(position.x, position.z)).toBe(true);
    expect(sim.plane.ground.touching).toEqual([true, true, true]);
    expect(sim.plane.body.velocity.length()).toBeLessThan(0.05);
    expect(sim.plane.omega / UNIT.RPM).toBe(0);
    expect(sim.input.engines[0].failed).toBe(true);
    sim.engineKey('startStop');
    expect(sim.plane.omega / UNIT.RPM).toBeGreaterThan(500);
    expect(sim.input.gear).toBe(1);
  });

  it('cycles to the approach start: airborne at 1,000 ft heading north, then the air start', () => {
    const sim = new Simulation(hurricane);
    sim.nextStart();
    expect(sim.mode).toBe('approach');
    expect(sim.plane.body.position.y).toBeCloseTo(305, 0);
    expect(instrumentReadings(sim).heading % 360).toBeLessThan(1);
    for (let t = 0; t < 5; t += DT) sim.step(DT);
    expect(sim.crashed).toBe(false);
    expect(Math.abs(sim.plane.body.position.y - 305)).toBeLessThan(40);
    sim.nextStart();
    expect(sim.mode).toBe('air');
    sim.nextStart();
    expect(sim.mode).toBe('ground');
  });

  it('ends the flight with a ditching when the wheels touch the sea', () => {
    const sim = new Simulation(spitfire);
    sim.plane.body.position.z = AIRFIELD.coastZ + 200;
    sim.plane.body.position.y += 0.3;
    sim.plane.ground.touching = [false, false, false];
    sim.plane.ground.onGround = false;
    for (let t = 0; t < 1; t += DT) sim.step(DT);
    expect(sim.plane.ground.crash?.cause).toMatch(/Ditched/);
  });
});

describe('keyboard controls', () => {
  it('steps flaps by the aircraft\'s stops; the Spitfire\'s go straight down or up (S33)', () => {
    expect(stepFlaps(spitfire, 0, 1)).toBe(1);
    expect(stepFlaps(spitfire, 1, 1)).toBe(0);
    expect(stepFlaps(bf109e4, 0, 1)).toBe(0.25);
    expect(stepFlaps(bf109e4, 0.5, -1)).toBe(0.25);
    expect(stepFlaps(bf109e4, 1, 1)).toBe(1);
    expect(stepFlaps(hurricane, 0, -1)).toBe(0);
  });

  it('holds the brakes with B, moves rudder trim with , and ., and trims the 109 at its own (slower) rate', () => {
    const { kb, down, up } = fakeKeyboard();
    const input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, trim: 0, rpm: 1, flaps: 0, gear: 1 };
    down('KeyB');
    down('Period');
    kb.update(input, spitfire, 1);
    expect(input.brake).toBe(1);
    expect(input.rudderTrim).toBeGreaterThan(0);
    up('KeyB');
    kb.update(input, spitfire, 0.1);
    expect(input.brake).toBe(0);
    up('Period');
    down('KeyT');
    const rafInput = { ...input, trim: 0 };
    const lwInput = { ...input, trim: 0 };
    kb.update(rafInput, spitfire, 1);
    kb.update(lwInput, bf109e4, 1);
    expect(lwInput.trim).toBeCloseTo((rafInput.trim * spitfire.controls.trimTime) / bf109e4.controls.trimTime, 6);
  });

  it('lowers and raises flaps a stop with F and Shift+F', () => {
    const { kb, press, down, up } = fakeKeyboard();
    const input = { pitch: 0, roll: 0, yaw: 0, throttle: 0, trim: 0, rpm: 1, flaps: 0, gear: 1 };
    press('KeyF');
    kb.update(input, bf109e4, DT);
    expect(input.flaps).toBe(0.25);
    down('ShiftLeft');
    press('KeyF');
    kb.update(input, bf109e4, DT);
    up('ShiftLeft');
    expect(input.flaps).toBe(0);
  });
});

describe('joystick buttons and hat', () => {
  it('decodes the eight hat directions and the centred hat', () => {
    expect(hatDirection(-1)).toBe(0);
    expect(hatDirection(-1 + 2 / 7)).toBe(1);
    expect(hatDirection(-1 + 4 / 7)).toBe(2);
    expect(hatDirection(1)).toBe(7);
    expect(hatDirection(1.2857)).toBeNull();
    expect(hatDirection(undefined)).toBeNull();
  });

  it('uses the product owner\'s layout from the J panel (trim 5 and 3, flaps 4 and 6, brakes 12, gear 11, view 10)', () => {
    const printed = (name) => DEFAULT_MAPPING.buttons[name] + 1;
    expect([printed('trimUp'), printed('trimDown'), printed('flapsUp'), printed('flapsDown')]).toEqual([5, 3, 4, 6]);
    expect([printed('brake'), printed('gear'), printed('view')]).toEqual([12, 11, 10]);
    expect(DEFAULT_MAPPING.throttle.invert).toBe(true);
  });

  it('trims the elevator while the trim buttons are held, at the aircraft\'s own rate', () => {
    const joy = new Joystick();
    const buttons = Array.from({ length: 12 }, () => ({ pressed: false }));
    joy.poll = () => (joy.pad = { axes: [0, 0, 0, 0, 0, 0, -1, 0, 0, 1.2857], buttons });
    const input = { flaps: 0, gear: 1, throttle: 0, trim: 0 };
    buttons[DEFAULT_MAPPING.buttons.trimUp].pressed = true;
    joy.update(input, bf109e4, 1);
    expect(input.trim).toBeCloseTo(2 / bf109e4.controls.trimTime, 6);
    buttons[DEFAULT_MAPPING.buttons.trimUp].pressed = false;
    buttons[DEFAULT_MAPPING.buttons.trimDown].pressed = true;
    joy.update(input, bf109e4, 1);
    expect(input.trim).toBeCloseTo(0, 6);
  });

  it('works the brakes, flaps, undercarriage and view from the mapped buttons', () => {
    const joy = new Joystick();
    const buttons = Array.from({ length: 12 }, () => ({ pressed: false }));
    const axes = [0, 0, 0, 0, 0, 0, -1, 0, 0, 1.2857];
    joy.poll = () => (joy.pad = { axes, buttons });
    const input = { flaps: 0, gear: 1, throttle: 0 };
    const b = DEFAULT_MAPPING.buttons;
    buttons[b.brake].pressed = true;
    buttons[b.flapsDown].pressed = true;
    let out = joy.update(input, hurricane);
    expect(input.brake).toBe(1);
    expect(input.flaps).toBe(0.25);
    expect(out.hat).toBeNull();
    out = joy.update(input, hurricane); // still held: no second step
    expect(input.flaps).toBe(0.25);
    buttons[b.gear].pressed = true;
    buttons[b.view].pressed = true;
    axes[9] = -1 + 4 / 7;
    out = joy.update(input, hurricane);
    expect(input.gear).toBe(0);
    expect(out.view).toBe(true);
    expect(out.hat).toBe(2);
  });
});

describe('cameras', () => {
  it('looks along the nose from the pilot\'s eye, turning with the aircraft', () => {
    const body = new Quaternion().setFromEuler(new Euler(0, 0.7, 0.2, 'YXZ'));
    const q = cockpitQuaternion(body, { yaw: 0, pitch: 0 });
    const view = new Vector3(0, 0, -1).applyQuaternion(q);
    const nose = new Vector3(1, 0, 0).applyQuaternion(body);
    expect(view.distanceTo(nose)).toBeLessThan(1e-9);
    const eye = eyePosition(spitfire, new Vector3(), new Quaternion());
    expect(eye.x).toBe(spitfire.eye.x);
    expect(eye.y).toBe(spitfire.eye.y);
  });

  it('looks out over the left wing when the hat is pushed left', () => {
    const q = cockpitQuaternion(new Quaternion(), HAT_LOOKS[6]);
    const view = new Vector3(0, 0, -1).applyQuaternion(q);
    expect(view.z).toBeLessThan(-0.9); // body -Z is the left wing
  });

  it('switches between the cockpit and the outside views', () => {
    const rig = new CameraRig({ fov: 60, updateProjectionMatrix() {} });
    expect(rig.mode).toBe('cockpit');
    rig.nextOutside();
    expect(rig.mode).toBe('chase');
    rig.nextOutside();
    expect(rig.mode).toBe('fixed');
    rig.toggleCockpit();
    expect(rig.mode).toBe('cockpit');
    rig.toggleCockpit();
    expect(rig.mode).toBe('fixed');
  });
});

describe('instruments', () => {
  it('reads each side\'s units', () => {
    const raf = new Simulation(spitfire, 'air');
    const lw = new Simulation(bf109e4, 'air');
    const r = instrumentReadings(raf);
    const l = instrumentReadings(lw);
    expect(r.airspeed).toBeCloseTo(raf.plane.last.eas / UNIT.MPH, 6);
    expect(r.altitude).toBeCloseTo(1500 / UNIT.FT, 0);
    expect(l.airspeed).toBeCloseTo(lw.plane.last.eas / UNIT.KMH, 6);
    expect(l.altitude).toBeCloseTo(1500, 0);
    expect(r.pitchClock).toBeNull();
  });

  it('turns the RAF airspeed needle twice: 160 and 360 mph at the top, 400 mph at about three o\'clock', () => {
    const turn = (mph) => rafAirspeedAngle(mph) / (2 * Math.PI);
    expect(turn(160)).toBeCloseTo(0, 6);
    expect(turn(360)).toBeCloseTo(1, 6);
    expect(turn(400) - 1).toBeCloseTo(0.2, 2);
    expect(rafAirspeedAngle(20)).toBe(rafAirspeedAngle(50)); // resting on its stop
  });

  it('spreads the RAF rev counter\'s 1,000 to 4,000 rpm over 300 degrees, 10 at seven o\'clock and 40 at five', () => {
    expect(rafRpmAngle(1000) / UNIT.DEG).toBeCloseTo(-150, 6);
    expect(rafRpmAngle(2500)).toBeCloseTo(0, 9);
    expect(rafRpmAngle(4000) / UNIT.DEG).toBeCloseTo(150, 6);
    expect(rafRpmAngle(5000)).toBe(rafRpmAngle(4000)); // held at the top of the scale
  });

  it('shows the propeller pitch clock at twelve on the fine stop, ten minutes per degree (S32)', () => {
    const sim = new Simulation(bf109e4);
    sim.plane.beta = bf109e4.propeller.betaMin;
    expect(instrumentReadings(sim).pitchClock.minutes).toBeCloseTo(0, 6);
    sim.plane.beta = bf109e4.propeller.betaMin + 3 * UNIT.DEG;
    expect(instrumentReadings(sim).pitchClock.minutes).toBeCloseTo(30, 6);
  });

  it('turns the turn needle the way the aircraft turns, and lights the undercarriage lamps', () => {
    const sim = new Simulation(spitfire, 'air');
    sim.plane.body.angularVelocity.set(0, -0.05, 0); // body +Y rotation is nose left, so this is a right turn
    expect(instrumentReadings(sim).turnRate).toBeGreaterThan(0);
    expect(instrumentReadings(sim).gearUp).toBe(true);
    expect(instrumentReadings(new Simulation(spitfire)).gearDown).toBe(true);
  });
});
