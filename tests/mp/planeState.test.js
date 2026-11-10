// One aircraft's state captured and put back (Phase 9, D243): a copy restored into a fresh aircraft of the same type
// flies on exactly as the original, bit for bit, with the same controls: in the air and on the ground, single and
// twin-engined, firing, damaged and overheating. The browser's prediction depends on it.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { createAircraft, createOnGround, stepAircraft } from '../../src/physics/flightModel.js';
import { createArmament, stepGuns } from '../../src/weapons/guns.js';
import { zonesFor } from '../../src/weapons/hitZones.js';
import { hurt } from '../../src/weapons/damage.js';
import { roundTypes } from '../../src/aircraft/ammunition.js';
import { seededRandom } from '../../src/weapons/random.js';
import { captureState, restoreState, numbersLength } from '../../src/mp/planeState.js';

const DT = 1 / 120;

/** The controls for step i: a varied flight (rolls, pulls, throttle, flaps, firing). */
function controls(i, ac) {
  const t = i * DT;
  const twin = !!ac.engines;
  const input = {
    pitch: 0.4 * Math.sin(t * 1.3), roll: 0.6 * Math.sin(t * 0.7), yaw: 0.2 * Math.cos(t), throttle: 0.6 + 0.4 * Math.sin(t * 0.3),
    rpm: 1, trim: 0.1, flaps: t > 3 && t < 6 ? 0.5 : 0, gear: 0, radiator: t > 2 ? 1 : 0, fireMg: Math.floor(t * 2) % 3 === 0,
    fireCannon: Math.floor(t) % 4 === 1, engineAssist: true,
  };
  if (twin) input.engines = [{ throttle: input.throttle, rpm: 1 }, { throttle: input.throttle * 0.9, rpm: 1 }];
  return input;
}

/** Flies `plane` (with its guns) for steps [from, to) and returns its body as an array. */
function fly(plane, guns, from, to) {
  for (let i = from; i < to; i += 1) {
    const input = controls(i, plane.ac);
    const recoil = stepGuns(guns, plane, input, DT, plane.time, () => {});
    plane.recoil = recoil.force.lengthSq() > 0 ? recoil : null;
    stepAircraft(plane, input, DT);
  }
  const b = plane.body;
  return [b.position.x, b.position.y, b.position.z, b.quaternion.x, b.quaternion.w, b.velocity.y, ...plane.engines.map((e) => e.omega), ...plane.engines.map((e) => e.heat.coolant)];
}

for (const id of ['hurricane', 'spitfire', 'bf109e4', 'bf110c4']) {
  describe(`${id}: state captured and restored`, () => {
    it('in the air, firing and manoeuvring, the copy flies on exactly as the original', () => {
      const ac = aircraftById[id];
      const a = createAircraft(ac, { altitude: 2000, speed: 120 });
      const gunsA = createArmament(ac);
      fly(a, gunsA, 0, 600);
      // A hit in the engine and one in a wing first, so the damage record and the leaks are in play.
      const random = seededRandom(5);
      const zones = zonesFor(ac).zones;
      hurt(a, zones.find((z) => z.kind === 'engine'), 'coolant', roundTypes.heTracer20, 5, { x: -1, y: 0, z: 0 }, 0, random);
      hurt(a, zones.find((z) => z.kind === 'wingOuter'), 'wing', roundTypes.heTracer20, 5, { x: -1, y: 0, z: 0 }, 0, random);
      const saved = captureState(a, gunsA);
      expect(saved.numbers.length).toBe(numbersLength(a.engines.length, gunsA.length));
      const b = createAircraft(ac, { altitude: 500, speed: 90 }); // somewhere else entirely
      const gunsB = createArmament(ac);
      restoreState(b, saved, gunsB);
      expect(fly(b, gunsB, 600, 1800)).toEqual(fly(a, gunsA, 600, 1800));
      expect(b.damage).toEqual({ ...a.damage, log: b.damage.log });
      expect(gunsB.map((g) => g.rounds)).toEqual(gunsA.map((g) => g.rounds));
    });

    it('on the ground, the copy rolls on exactly as the original', () => {
      const ac = aircraftById[id];
      const a = createOnGround(ac);
      const gunsA = createArmament(ac);
      const roll = (plane, guns, n) => {
        for (let i = 0; i < n; i += 1) stepAircraft(plane, { throttle: 0.7, rpm: 1, pitch: 0.3, roll: 0, yaw: 0.1, gear: 1, brake: 0, trim: 0 }, DT);
        return [plane.body.position.x, plane.body.position.z, plane.body.quaternion.y, plane.ground.onGround];
      };
      roll(a, gunsA, 240);
      const saved = captureState(a, gunsA);
      const b = createOnGround(ac, { x: 500 });
      restoreState(b, saved, createArmament(ac));
      expect(roll(b, [], 480)).toEqual(roll(a, [], 480));
    });
  });
}
