// The fixed guns (D67): rates and how long the ammunition lasts, harmonisation on the sight line, belts and each RAF
// gun's own kind of round, rounds leaving with the aircraft's velocity, recoil only while firing, and the counters.
import { describe, it, expect } from 'vitest';
import { aircraftById, aircraftList } from '../../src/aircraft/index.js';
import { ballistics } from '../../src/aircraft/ammunition.js';
import { createArmament, stepGuns, counters, groupRounds } from '../../src/weapons/guns.js';
import { stepRound } from '../../src/weapons/ballistics.js';
import { createAircraft } from '../../src/physics/flightModel.js';
import { Simulation } from '../../src/core/simulation.js';

const DT = 1 / 120;

/** Fires `input` for `seconds` (or until every gun fired is empty) and returns { rounds, time, last }. */
function fire(ac, input, seconds = 120) {
  const plane = createAircraft(ac, { altitude: 1500, speed: 110 });
  const arm = createArmament(ac);
  const rounds = [];
  let t = 0;
  while (t < seconds) {
    stepGuns(arm, plane, input, DT, t, (r) => rounds.push(r));
    t += DT;
    if (arm.filter((g) => g.firing).length === 0 && t > DT * 2) break;
  }
  return { rounds, time: t, arm, plane };
}

describe('rates and endurance', () => {
  it('Spitfire and Hurricane: eight Brownings fire their 334 rounds each in about 18 seconds', () => {
    for (const id of ['spitfire', 'hurricane']) {
      const { rounds, time } = fire(aircraftById[id], { fireMg: true });
      expect(rounds.length, id).toBe(8 * 334);
      expect(time, id).toBeGreaterThan(17.5);
      expect(time, id).toBeLessThan(19);
    }
  });

  it('Bf 109: the synchronised MG 17s fire 1,000 rounds each in a minute; the cannon empty their 60 in about 7.6 s', () => {
    const mg = fire(aircraftById.bf109e4, { fireMg: true });
    expect(mg.rounds.length).toBe(2000);
    expect(mg.time).toBeGreaterThan(59);
    expect(mg.time).toBeLessThan(61);
    const cannon = fire(aircraftById.bf109e4, { fireCannon: true });
    expect(cannon.rounds.length).toBe(120);
    expect(cannon.time).toBeGreaterThan(7.3);
    expect(cannon.time).toBeLessThan(7.9);
  });

  it('Bf 110: the unsynchronised nose MG 17s fire faster (1,100 rounds/min)', () => {
    const { time } = fire(aircraftById.bf110c4, { fireMg: true });
    expect(time).toBeGreaterThan(54);
    expect(time).toBeLessThan(55.5);
  });

  it('fires the first round as the trigger is pressed, and stops at empty', () => {
    const ac = aircraftById.bf109e4;
    const plane = createAircraft(ac, {});
    const arm = createArmament(ac);
    let n = 0;
    stepGuns(arm, plane, { fireCannon: true }, DT, 0, () => { n += 1; });
    expect(n).toBe(2); // one from each cannon at once
    for (const g of arm) g.rounds = 0;
    stepGuns(arm, plane, { fireMg: true, fireCannon: true }, DT, 1, () => { n += 1; });
    expect(n).toBe(2);
  });

  it('He 111 carries no fixed guns (its gunners come in Phase 6)', () => {
    expect(createArmament(aircraftById.he111h)).toEqual([]);
  });
});

describe('harmonisation', () => {
  for (const ac of aircraftList.filter((a) => a.guns)) {
    it(`${ac.id}: every gun's rounds cross the sight line at ${ac.harmonisation} m`, () => {
      for (const gun of createArmament(ac)) {
        // Fired level from rest at sea level: where is the round when it has come the harmonisation range forward?
        const b = ballistics[gun.ballistics];
        const p = { x: gun.position.x, y: gun.position.y, z: gun.position.z };
        const v = { x: gun.bore.x * b.muzzleVelocity, y: gun.bore.y * b.muzzleVelocity, z: gun.bore.z * b.muzzleVelocity };
        const end = ac.eye.x + ac.harmonisation;
        while (p.x < end) stepRound(b, p, v, 1 / 2000);
        expect(Math.hypot(p.y - ac.eye.y, p.z), gun.id).toBeLessThan(0.15);
      }
    });
  }
});

describe('belts and rounds', () => {
  it('RAF: each gun fires its own kind, by Dowding\'s arrangement (2 old incendiary, 1 de Wilde, 2 AP, 3 ball)', () => {
    const { rounds } = fire(aircraftById.spitfire, { fireMg: true }, 0.01);
    const kinds = rounds.map((r) => r.kind).sort();
    expect(kinds).toEqual(['ap303', 'ap303', 'ball303', 'ball303', 'ball303', 'deWilde303', 'incendiary303', 'incendiary303']);
    const arm = createArmament(aircraftById.spitfire);
    const outer = arm.filter((g) => /Outer/.test(g.id));
    expect(outer.every((g) => g.spec.round === 'incendiary303')).toBe(true);
  });

  it('MG 17 belts cycle armour-piercing, incendiary and observing; the cannon drums alternate', () => {
    const ac = aircraftById.bf109e4;
    const plane = createAircraft(ac, {});
    const arm = createArmament(ac).filter((g) => g.id === 'mg17Left' || g.id === 'cannonLeft');
    const seen = { mg17Left: [], cannonLeft: [] };
    for (let t = 0; t < 0.5; t += DT) {
      for (const g of arm) {
        stepGuns([g], plane, { fireMg: true, fireCannon: true }, DT, t, (r) => seen[g.id].push(r.kind));
      }
    }
    expect(seen.mg17Left.slice(0, 4)).toEqual(['ap792', 'incendiary792', 'observing792', 'ap792']);
    expect(seen.cannonLeft.slice(0, 3)).toEqual(['heIncendiary20', 'heTracer20', 'heIncendiary20']);
  });

  it('releases rounds at the muzzle with the aircraft\'s velocity added to the muzzle velocity', () => {
    const { rounds, plane } = fire(aircraftById.hurricane, { fireMg: true }, 0.001);
    const r = rounds[0];
    const relative = r.velocity.clone().sub(plane.body.velocity).length();
    expect(relative).toBeCloseTo(ballistics.mk7.muzzleVelocity, -1);
    expect(r.velocity.length()).toBeGreaterThan(ballistics.mk7.muzzleVelocity + 80);
    expect(r.position.distanceTo(plane.body.position)).toBeGreaterThan(1.5); // out in the wing
  });
});

describe('recoil', () => {
  it('pushes back only while firing: eight Brownings about 1.2 kN', () => {
    const ac = aircraftById.spitfire;
    const plane = createAircraft(ac, {});
    const arm = createArmament(ac);
    const silent = stepGuns(arm, plane, {}, DT, 0, () => {});
    expect(silent.force.length()).toBe(0);
    const firing = stepGuns(arm, plane, { fireMg: true }, DT, 0, () => {});
    expect(firing.force.x).toBeLessThan(-1100);
    expect(firing.force.x).toBeGreaterThan(-1300);
  });

  it('slows the aircraft in the simulation while it fires', () => {
    const fired = new Simulation(aircraftById.spitfire, 'air');
    const quiet = new Simulation(aircraftById.spitfire, 'air');
    fired.input.fireMg = true;
    for (let i = 0; i < 240; i += 1) {
      fired.step(DT);
      quiet.step(DT);
    }
    expect(fired.plane.body.velocity.length()).toBeLessThan(quiet.plane.body.velocity.length() - 0.3);
    expect(fired.projectiles.live.length).toBeGreaterThan(200);
  });
});

describe('counters and readouts', () => {
  it('the Bf 109 counter columns sum their guns, the cannon column both drums', () => {
    const arm = createArmament(aircraftById.bf109e4);
    expect(counters(arm)).toEqual({
      mg17Left: { rounds: 1000, capacity: 1000 }, mg17Right: { rounds: 1000, capacity: 1000 }, cannon: { rounds: 120, capacity: 120 },
    });
    expect(groupRounds(arm)).toEqual({ mg: { rounds: 2000, capacity: 2000 }, cannon: { rounds: 120, capacity: 120 } });
  });

  it('rounds fired in the simulation show on the counter', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.input.fireCannon = true;
    for (let i = 0; i < 120; i += 1) sim.step(DT);
    expect(sim.guns.cannon.rounds).toBeLessThan(120);
    expect(sim.guns.mg17Left.rounds).toBe(1000);
  });

  it('rounds in flight leave the world after five seconds', () => {
    const sim = new Simulation(aircraftById.bf109e4, 'air');
    sim.input.fireCannon = true;
    sim.step(DT);
    sim.input.fireCannon = false;
    expect(sim.projectiles.live.length).toBe(2);
    for (let i = 0; i < 5.1 * 120; i += 1) sim.step(DT);
    expect(sim.projectiles.live.length).toBe(0);
  });
});

describe('Bf 109 cowling-gun flashes (D67)', () => {
  it('lie outside the Revi glass, seen from the pilot\'s eye', async () => {
    const { SIGHT_GLASS } = await import('../../src/render/gunsight.js');
    const { FLASH_AHEAD, FLASH_SIZE } = await import('../../src/render/projectiles.js');
    const ac = aircraftById.bf109e4;
    const glass = SIGHT_GLASS.revi;
    // The glass leans back 45°: its height seen from the eye is height x sin 45°.
    const halfUp = Math.atan((glass.height * Math.SQRT1_2) / 2 / SIGHT_GLASS.ahead);
    const halfSide = Math.atan(glass.width / 2 / SIGHT_GLASS.ahead);
    for (const gun of createArmament(ac).filter((g) => g.spec.type === 'mg17')) {
      const flash = gun.position.clone().addScaledVector(gun.bore, FLASH_AHEAD);
      const ahead = flash.x - ac.eye.x;
      const radius = Math.atan(FLASH_SIZE.mg / ahead); // the flash ball's own angular size
      const up = Math.atan2(flash.y - ac.eye.y, ahead) + radius; // its top edge
      const side = Math.atan2(Math.abs(flash.z), ahead) - radius; // its inner edge
      expect(up < -halfUp || side > halfSide, `${gun.id}: ${(up * 57.3).toFixed(1)}° up, ${(side * 57.3).toFixed(1)}° aside`).toBe(true);
    }
  });
});

describe('muzzle flash colour (D67)', () => {
  it('is yellow and not added onto the sky (which would wash it white)', async () => {
    const THREE = await import('three');
    const { buildMuzzleFlashes } = await import('../../src/render/projectiles.js');
    const { material } = buildMuzzleFlashes(createArmament(aircraftById.spitfire));
    const c = material.color.clone().convertLinearToSRGB();
    expect(c.r).toBeGreaterThan(0.9);
    expect(c.g).toBeGreaterThan(0.7);
    expect(c.b).toBeLessThan(0.2);
    expect(material.blending).toBe(THREE.NormalBlending);
  });
});

