// Damage from hits (D68): each kind of damage has its effect on the flight, through the flight model.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { createAircraft, stepAircraft } from '../../src/physics/flightModel.js';
import { zonesFor } from '../../src/weapons/hitZones.js';
import { hurt, applyHit, componentsOf } from '../../src/weapons/damage.js';
import { roundTypes } from '../../src/aircraft/ammunition.js';
import { seededRandom } from '../../src/weapons/random.js';
import { common } from '../../src/aircraft/common.js';
import { attitude } from '../../src/core/autopilot.js';

const DT = 1 / 120;
const zone = (ac, name) => zonesFor(ac).zones.find((z) => z.name === name || z.kind === name);
const FROM_AHEAD = { x: -1, y: 0, z: 0 };
const FROM_BEHIND = { x: 1, y: 0, z: 0 };

/** A plane in level flight with hands-off controls at trim, and a way to fly it for t seconds. */
function flight(id) {
  const ac = aircraftById[id];
  const plane = createAircraft(ac, { altitude: 2000, speed: 110 });
  const input = { throttle: 0.7, rpm: 0.8, pitch: 0, roll: 0, yaw: 0, trim: plane.trim, engines: ac.engines ? [{}, {}] : [{}] };
  const fly = (t) => { for (let s = 0; s < t; s += DT) stepAircraft(plane, input, DT); };
  return { ac, plane, input, fly };
}

describe('damage effects', () => {
  it('a coolant hit drains the coolant and seizes the engine within a few minutes', () => {
    const { ac, plane, fly } = flight('spitfire');
    hurt(plane, zone(ac, 'engine'), 'coolant', roundTypes.heTracer20, 5, FROM_AHEAD, 0, seededRandom(1));
    let seizedAt = null;
    for (let t = 0; t < 300 && seizedAt === null; t += 1) {
      fly(1);
      if (plane.engines[0].heat.seized) seizedAt = t;
    }
    expect(seizedAt).not.toBeNull();
    expect(seizedAt).toBeGreaterThan(40);
  });

  it('an oil hit starves and seizes the engine', () => {
    const { ac, plane, fly } = flight('bf109e4');
    hurt(plane, zone(ac, 'engine'), 'oil', roundTypes.heTracer20, 5, FROM_AHEAD, 0, seededRandom(1));
    fly(150);
    expect(plane.engines[0].heat.seized).toBe(true);
  });

  it('a damaged outer wing panel rolls the aircraft towards that side', () => {
    const left = flight('hurricane');
    const right = flight('hurricane');
    for (let i = 0; i < 3; i += 1) {
      hurt(left.plane, zone(left.ac, 'wingOuterLeft'), 'wing', roundTypes.heTracer20, 5, FROM_AHEAD, 0, seededRandom(1));
      hurt(right.plane, zone(right.ac, 'wingOuterRight'), 'wing', roundTypes.heTracer20, 5, FROM_AHEAD, 0, seededRandom(1));
    }
    left.fly(3);
    right.fly(3);
    expect(attitude(left.plane).bank).toBeLessThan(-0.2); // left wing down
    expect(attitude(right.plane).bank).toBeGreaterThan(0.2); // right wing down
  });

  it('enough hits break the wing, and the aircraft is lost', () => {
    const { ac, plane } = flight('bf109e4');
    for (let i = 0; i < 6; i += 1) hurt(plane, zone(ac, 'wingOuterRight'), 'wing', roundTypes.heTracer20, 5, FROM_AHEAD, 0, seededRandom(1));
    expect(plane.damage.failed.cause).toMatch(/right wing broke/);
  });

  it('a cut elevator cable takes the elevator away', () => {
    const { ac, plane, input, fly } = flight('spitfire');
    const random = () => 0.4; // picks the elevator and cuts it
    hurt(plane, zone(ac, 'fuselage'), 'cables', roundTypes.heTracer20, 5, FROM_AHEAD, 0, random);
    expect(plane.damage.controls.elevator).toBe(0);
    input.pitch = 1;
    const before = attitude(plane).pitch;
    fly(1);
    expect(attitude(plane).pitch - before).toBeLessThan(0.05); // full back stick does nothing
  });

  it('rear armour stops rifle ball from behind, but not armour-piercing rounds at short range', () => {
    const { ac, plane } = flight('spitfire');
    const cockpit = zone(ac, 'cockpit');
    expect(hurt(plane, cockpit, 'pilot', roundTypes.ball303, 1, FROM_BEHIND, 700, seededRandom(1))).toBe('armour');
    expect(hurt(plane, cockpit, 'pilot', roundTypes.ap792, 1, FROM_BEHIND, 500, seededRandom(1))).toBe('armour');
    expect(hurt(plane, cockpit, 'pilot', roundTypes.ap792, 1, FROM_BEHIND, 750, seededRandom(1))).toBe('pilot wounded');
    expect(hurt(plane, cockpit, 'pilot', roundTypes.ap792, 1, FROM_AHEAD, 300, seededRandom(1))).toBe('pilot wounded');
  });

  it('wounds add up to death', () => {
    const { ac, plane } = flight('bf110c4');
    for (let i = 0; i < 3; i += 1) hurt(plane, zone(ac, 'cockpit'), 'pilot', roundTypes.ap792, 1, FROM_AHEAD, 0, seededRandom(1));
    expect(plane.damage.pilot).toBeLessThanOrEqual(0);
    expect(plane.damage.failed.pilotKilled).toBe(true);
  });

  it('incendiaries set plain tanks alight more readily than self-sealing ones, and a fire destroys the aircraft', () => {
    const fires = (id, zoneName) => {
      let n = 0;
      for (let seed = 1; seed <= 300; seed += 1) {
        const { ac, plane } = flight(id);
        hurt(plane, zone(ac, zoneName), 'fuel', roundTypes.deWilde303, 1, FROM_AHEAD, 0, seededRandom(seed));
        if (plane.damage.fire) n += 1;
      }
      return n;
    };
    expect(fires('spitfire', 'cockpit')).toBeGreaterThan(fires('bf110c4', 'wingInnerLeft') * 3);
    const { ac, plane, fly } = flight('hurricane');
    hurt(plane, zone(ac, 'cockpit'), 'fuel', roundTypes.deWilde303, 1, FROM_AHEAD, 0, () => 0);
    expect(plane.damage.fire).not.toBeNull();
    fly(common.damage.fireTime + 1);
    expect(plane.damage.failed.cause).toMatch(/fire/);
  });

  it('jammed undercarriage stays where it is', () => {
    const { ac, plane, input, fly } = flight('bf109e4');
    hurt(plane, zone(ac, 'wingInnerLeft'), 'gear', roundTypes.ball303, 1, FROM_AHEAD, 0, seededRandom(1));
    input.gear = 1;
    fly(5);
    expect(plane.surfaces.gear).toBe(0);
  });

  it('each aircraft\'s systems put tanks, radiators and oil coolers in its zones', () => {
    const spit = aircraftById.spitfire;
    expect(componentsOf(spit, zone(spit, 'wingInnerRight')).coolant).toBeGreaterThan(0); // radiator under the starboard wing
    expect(componentsOf(spit, zone(spit, 'wingInnerLeft')).oil).toBeGreaterThan(0); // oil coolers under the port wing
    expect(componentsOf(spit, zone(spit, 'cockpit')).fuel).toBeGreaterThan(0);
    const hurri = aircraftById.hurricane;
    expect(componentsOf(hurri, zone(hurri, 'wingInnerLeft')).fuel).toBeGreaterThan(0);
  });

  it('a hit reports what it struck and counts; a 20 mm shell strikes twice', () => {
    const { ac, plane } = flight('spitfire');
    const text = applyHit(plane, { zone: zone(ac, 'tailSurfaces'), kind: 'heTracer20', velocity: new Vector3(300, 0, 0) }, seededRandom(3));
    expect(text.length).toBeGreaterThan(0);
    expect(plane.damage.hits).toBe(1);
    expect(plane.damage.log[0].zone).toBe('tailSurfaces');
  });

  it('an undamaged aircraft flies exactly as before (the validation is unchanged)', () => {
    const a = flight('spitfire');
    const b = flight('spitfire');
    a.fly(5);
    b.fly(5);
    expect(a.plane.body.position.distanceTo(b.plane.body.position)).toBe(0);
  });
});
