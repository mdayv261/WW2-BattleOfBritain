// Flexible guns (D83): a gun never points or fires outside its arc (through dead astern, and the dorsal gun's forward
// limit); it swings no faster than the traverse rate; an empty drum stops fire for the change, then the next drum
// fires; with no drums left it is silent; the rounds leave along the gun with the aircraft's velocity.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { createAircraft } from '../../src/physics/flightModel.js';
import { createMounts, aimMount, stepMount, inArc, direction, roundsLeft } from '../../src/weapons/mounts.js';
import { common } from '../../src/aircraft/common.js';
import { weapons, ballistics } from '../../src/aircraft/ammunition.js';

const DEG = Math.PI / 180;
const DT = 1 / 120;
const mountOf = (id, name) => createMounts(aircraftById[id]).find((m) => m.id === name);

/** Swings a gun towards a direction (az, el in degrees) for `t` s. */
function swing(m, az, el, t) {
  const want = direction(az * DEG, el * DEG);
  for (let s = 0; s < t; s += DT) aimMount(m, want, DT);
}

const pointing = (m) => ({ az: Math.atan2(m.bore.z, m.bore.x) / DEG, el: Math.asin(m.bore.y) / DEG });

describe('flexible gun arcs', () => {
  it('the Bf 110 rear gun covers 150°-210° through dead astern, 0°-60° up (S25)', () => {
    const { spec } = mountOf('bf110c4', 'rear');
    expect(inArc(spec, 180 * DEG, 30 * DEG)).toBe(true);
    expect(inArc(spec, -170 * DEG, 10 * DEG)).toBe(true); // 190°
    expect(inArc(spec, 140 * DEG, 10 * DEG)).toBe(false);
    expect(inArc(spec, 180 * DEG, -5 * DEG)).toBe(false); // nothing below the horizontal
    expect(inArc(spec, 0, 10 * DEG)).toBe(false);
  });

  it('a gun aimed outside its arc stops at the nearer edge, and never swings through the gap', () => {
    const m = mountOf('bf110c4', 'rear');
    swing(m, 120, 20, 3); // off to the right of the arc
    expect(pointing(m).az).toBeCloseTo(150, 0);
    swing(m, -120, 20, 3); // off to the left: back through dead astern, not round through the nose
    expect(Math.abs(pointing(m).az)).toBeCloseTo(150, 0);
    expect(pointing(m).az).toBeLessThan(0);
    swing(m, 0, -40, 3); // dead ahead and below: as far as it goes
    expect(pointing(m).el).toBeCloseTo(0, 3);
  });

  it('the He 111 dorsal gun goes all the way round, but forward only from 30° up (S29)', () => {
    const m = mountOf('he111h', 'dorsal');
    swing(m, 170, 5, 6);
    expect(pointing(m).el).toBeCloseTo(5, 0);
    swing(m, 10, 5, 6);
    expect(pointing(m).az).toBeCloseTo(10, 0);
    expect(pointing(m).el).toBeCloseTo(30, 0);
    expect(inArc(m.spec, 10 * DEG, 5 * DEG)).toBe(false);
    expect(inArc(m.spec, 170 * DEG, 5 * DEG)).toBe(true);
  });

  it('it swings no faster than the traverse rate', () => {
    const m = mountOf('he111h', 'dorsal');
    swing(m, 180, 30, 6);
    const before = m.bore.clone();
    swing(m, 90, 30, 0.5);
    const rate = before.angleTo(m.bore) / 0.5;
    expect(rate).toBeLessThanOrEqual(common.gunners.traverseRate * 1.01);
    expect(rate).toBeGreaterThan(common.gunners.traverseRate * 0.5);
  });

  it('the tail MG 17 is fixed dead astern', () => {
    const m = mountOf('he111h', 'tail');
    swing(m, 150, 20, 3);
    expect(m.bore.x).toBeCloseTo(-1, 6);
  });
});

describe('firing and drums', () => {
  const plane = () => createAircraft(aircraftById.bf110c4, { altitude: 2000, speed: 100, heading: 0 });

  it('fires at the MG 15 rate along the gun, with the aircraft\'s velocity added', () => {
    const p = plane();
    const m = mountOf('bf110c4', 'rear');
    swing(m, 180, 20, 3);
    const out = [];
    for (let t = 0; t < 1; t += DT) stepMount(m, p, DT, t, true, 10, (r) => out.push(r));
    expect(out.length).toBeGreaterThanOrEqual(Math.floor(weapons.mg15.rate) - 1);
    expect(out.length).toBeLessThanOrEqual(Math.ceil(weapons.mg15.rate) + 1);
    const relative = out[0].velocity.clone().sub(p.body.velocity);
    const world = m.bore.clone().applyQuaternion(p.body.quaternion);
    expect(relative.length()).toBeCloseTo(ballistics.mg17.muzzleVelocity, -1);
    expect(relative.normalize().angleTo(world)).toBeLessThan(0.01);
    expect(out.some((r) => r.kind === 'tracer792')).toBe(true);
  });

  it('an empty drum stops fire for the change time, then the next drum fires; with none left it is silent', () => {
    const p = plane();
    const m = mountOf('bf110c4', 'rear');
    m.drums = 1;
    let shots = 0;
    let lastFirst = -1;
    let resumed = null;
    const drumTime = 10;
    for (let t = 0; t < 30; t += DT) {
      stepMount(m, p, DT, t, true, drumTime, () => { shots += 1; });
      if (m.changingUntil !== null && lastFirst < 0) lastFirst = t;
      if (lastFirst >= 0 && resumed === null && m.firing) resumed = t;
    }
    expect(shots).toBe(2 * weapons.mg15.drum);
    expect(resumed - lastFirst).toBeCloseTo(drumTime, 1);
    expect(roundsLeft(m)).toBe(0);
    expect(m.firing).toBe(false);
  });

  it('every gun of both aircraft starts loaded, pointing inside its arc', () => {
    for (const id of ['bf110c4', 'he111h']) {
      for (const m of createMounts(aircraftById[id])) {
        const az = Math.atan2(m.bore.z, m.bore.x);
        const el = Math.asin(m.bore.y);
        expect(inArc(m.spec, az, el), `${id} ${m.id}`).toBe(true);
        expect(m.rounds).toBeGreaterThan(0);
        expect(m.bore.length()).toBeCloseTo(1, 6);
      }
    }
  });
});
