// Ground contact (Phase 2): wheels, brakes, ground effect, parked attitude and crash rules.
import { describe, it, expect } from 'vitest';
import { Vector3, Euler } from 'three';
import { createOnGround, createAircraft, stepAircraft, groundEffectFactor } from '../../src/physics/flightModel.js';
import { staticShares, springRates, brakeSplit, propellerClearance } from '../../src/physics/ground.js';
import { flapTarget } from '../../src/physics/controls.js';
import { aeroCoefficients } from '../../src/physics/aero.js';
import { attitude } from '../../src/dev/flightTests.js';
import { runUp, headingRad } from '../../src/dev/groundTests.js';
import { aircraftList, aircraftById } from '../../src/aircraft/index.js';
import { G, UNIT } from '../../src/core/constants.js';

const DT = 1 / 120;
const DEG = UNIT.DEG;
const { spitfire, hurricane, bf109e4 } = aircraftById;

/** Steps a plane for `seconds` with fixed inputs. */
function hold(plane, input, seconds) {
  for (let t = 0; t < seconds; t += DT) stepAircraft(plane, input, DT);
  return plane;
}
const parkedInput = (o = {}) => ({ throttle: 0, rpm: 1, gear: 1, brake: 1, trim: 0, pitch: 0, roll: 0, yaw: 0, ...o });

describe('parked on the ground', () => {
  for (const ac of aircraftList) {
    it(`${ac.id}: sits at its sourced ground angle within 0.5 degrees, on all three wheels, at rest`, () => {
      const plane = hold(createOnGround(ac), parkedInput(), 3);
      expect(Math.abs(attitude(plane.body.quaternion).pitch - ac.gear.groundAngle) / DEG).toBeLessThan(0.5);
      expect(plane.ground.touching).toEqual([true, true, true]);
      expect(plane.body.velocity.length()).toBeLessThan(0.05);
      expect(plane.ground.crash).toBeNull();
    });

    it(`${ac.id}: wheel loads add up to the weight, with the static share on the tailwheel`, () => {
      const plane = hold(createOnGround(ac), parkedInput(), 3);
      const loads = plane.last.wheelLoads;
      const total = loads.reduce((a, b) => a + b, 0);
      expect(total / (ac.mass.flying * G)).toBeCloseTo(1, 1);
      expect(loads[2] / total).toBeCloseTo(staticShares(ac).tail, 1);
      // Engine torque presses one main wheel a little harder than the other.
      expect(Math.abs(loads[0] - loads[1]) / total).toBeLessThan(0.12);
    });
  }

  it('puts far more of the Bf 109 weight on its tailwheel than the RAF fighters (S32: CG well behind the wheels)', () => {
    expect(staticShares(bf109e4).tail).toBeGreaterThan(1.5 * staticShares(spitfire).tail);
    expect(staticShares(bf109e4).tail).toBeGreaterThan(1.5 * staticShares(hurricane).tail);
  });

  it('sets each leg so the parked weight squashes it by its stated deflection', () => {
    for (const ac of aircraftList) {
      const k = springRates(ac).main.k;
      expect((ac.mass.flying * G * staticShares(ac).main) / k).toBeCloseTo(ac.gear.mainDeflection, 6);
    }
  });

  it('clears the propeller on the ground in the three-point attitude', () => {
    for (const ac of aircraftList) {
      const plane = createOnGround(ac);
      expect(propellerClearance(plane, plane.terrain)).toBeGreaterThan(0.3);
    }
  });
});

describe('brakes and engine run-up', () => {
  it('splits the brake by rudder as the RAF relay valve did', () => {
    expect(brakeSplit(1, 0)).toEqual({ left: 1, right: 1 });
    expect(brakeSplit(1, -1)).toEqual({ left: 1, right: 0 });
    expect(brakeSplit(1, 1)).toEqual({ left: 0, right: 1 });
    expect(brakeSplit(0.5, 0.5)).toEqual({ left: 0.25, right: 0.5 });
  });

  it('holds a parked aircraft still against idle thrust with the brakes on', () => {
    const plane = hold(createOnGround(hurricane), parkedInput(), 5);
    expect(plane.body.velocity.length()).toBeLessThan(0.02);
  });

  it('reaches 2650-2700 rpm at full throttle on the ground in the Spitfire (Pilot\'s Notes, S33)', () => {
    const r = runUp(spitfire);
    expect(r.rpm).toBeGreaterThan(2620);
    expect(r.rpm).toBeLessThan(2730);
  });

  it('tips a braked Spitfire onto its nose at full power, as the "two men on the tail" rule implies (S33)', () => {
    expect(runUp(spitfire).tailLifted).toBe(true);
  });

  it('keeps the Bf 109 tail down with the brakes full on (S20, S32)', () => {
    const r = runUp(bf109e4);
    expect(r.tailLifted).toBe(false);
    expect(r.crash).toBeNull();
  });

  it('turns a taxiing aircraft toward the braked wheel', () => {
    const plane = createOnGround(spitfire);
    const heading = () => headingRad(plane);
    const input = parkedInput({ brake: 0, throttle: 0.2 });
    for (let t = 0; t < 4; t += DT) {
      // Taxi straight: rudder against any swing (a castoring tailwheel gives no steering of its own).
      input.yaw = Math.max(-1, Math.min(1, -6 * heading() + 3 * plane.body.angularVelocity.y));
      stepAircraft(plane, input, DT);
    }
    const before = heading();
    hold(plane, { ...input, brake: 0.6, yaw: 1 }, 2); // right rudder: right brake
    expect(heading() - before).toBeGreaterThan(0.1);
    expect(plane.ground.crash).toBeNull();
  });
});

describe('ground effect', () => {
  it('cuts induced drag near the ground and fades out above a span', () => {
    expect(groundEffectFactor(1, 11)).toBeLessThan(0.7);
    expect(groundEffectFactor(11, 11)).toBeGreaterThan(0.99);
    expect(groundEffectFactor(2, 11)).toBeGreaterThan(groundEffectFactor(1, 11));
  });

  it('gives more lift and less drag at the same angle of attack near the ground', () => {
    const flow = { alpha: 6 * DEG, beta: 0, p: 0, q: 0, r: 0, airspeed: 40, qBar: 980, slipQ: 0 };
    const s = { elevator: 0, aileron: 0, rudder: 0, trim: 0, flaps: 0, gear: 1, radiator: 0, slatLeft: 1, slatRight: 1 };
    const free = aeroCoefficients(spitfire, flow, s);
    const near = aeroCoefficients(spitfire, { ...flow, groundEffect: 0.6 }, s);
    expect(near.cl).toBeGreaterThan(free.cl);
    expect(near.cd).toBeLessThan(free.cd);
  });
});

describe('flaps by aircraft', () => {
  it('gives the Spitfire only up or fully down (S33), the others part-way stops', () => {
    expect(flapTarget(spitfire, 0.3)).toBe(0);
    expect(flapTarget(spitfire, 0.6)).toBe(1);
    expect(flapTarget(bf109e4, 0.5)).toBe(0.5);
    expect(flapTarget(hurricane, 0.25)).toBe(0.25);
  });
});

describe('crash rules', () => {
  /** An aircraft just above the ground, descending at `sink` m/s, in the attitude given. */
  function dropped(ac, { sink, pitch = ac.gear.groundAngle, bank = 0, gear = 1, speed = 0 }) {
    const plane = createOnGround(ac);
    plane.surfaces.gear = gear;
    plane.body.quaternion.setFromEuler(new Euler(bank, Math.PI / 2, pitch, 'YZX')); // facing north
    plane.body.position.y += 0.5;
    plane.body.velocity.set(0, -sink, 0).add(new Vector3(0, 0, -speed));
    plane.ground.onGround = false;
    plane.ground.touching = [false, false, false];
    return plane;
  }

  it('lands normally from a gentle sink and records the touchdown', () => {
    const plane = hold(dropped(spitfire, { sink: 1 }), parkedInput({ gear: 1 }), 2);
    expect(plane.ground.crash).toBeNull();
    expect(plane.ground.touchdown.sink).toBeGreaterThan(0.9);
  });

  it('collapses the undercarriage in a very hard landing', () => {
    const plane = hold(dropped(spitfire, { sink: 5 }), parkedInput({ gear: 1 }), 1);
    expect(plane.ground.crash?.cause).toMatch(/Undercarriage collapsed/);
  });

  it('calls a landing with the wheels up a belly landing', () => {
    const plane = hold(dropped(hurricane, { sink: 1, gear: 0, pitch: 2 * DEG }), parkedInput({ gear: 0 }), 2);
    expect(plane.ground.crash?.cause).toMatch(/Belly landing/);
  });

  it('ends the flight when a wingtip touches', () => {
    const plane = hold(dropped(bf109e4, { sink: 1, bank: 35 * DEG }), parkedInput(), 2);
    expect(plane.ground.crash?.cause).toMatch(/wingtip/);
  });

  it('strikes the propeller when a taildragger lands nose-down on its main wheels', () => {
    const plane = hold(dropped(spitfire, { sink: 1.5, pitch: -6 * DEG }), parkedInput(), 2);
    expect(plane.ground.crash?.cause).toMatch(/Propeller|Nosed over/);
  });

  it('never touches the ground in normal flight at height', () => {
    const plane = createAircraft(spitfire, { altitude: 1500, speed: 110, throttle: 0.6 });
    hold(plane, { throttle: 0.6, rpm: 0.8, trim: plane.trim }, 2);
    expect(plane.ground.onGround).toBe(false);
    expect(plane.ground.crash).toBeNull();
  });
});
