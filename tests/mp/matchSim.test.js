// A match on the room server (Phase 9, D243): starts and respawns where the host's settings say, the Bf 110's seat swap
// (the AI only in the Bf 110's other seat), kill credit, the end of a match, and the server stepping exactly as a
// browser's prediction will.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createTerrain } from '../../src/world/terrain.js';
import { realWorld, flatWorld } from '../../src/world/world.js';
import { airfieldNamed, HOME } from '../../src/world/airfields.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { createAircraft, stepAircraft } from '../../src/physics/flightModel.js';
import { createArmament, stepGuns } from '../../src/weapons/guns.js';
import { MatchSim } from '../../src/mp/matchSim.js';
import { DEFAULT_SETTINGS, AIR_SPAWN, TICK_MS, TICK_HZ } from '../../src/mp/netConfig.js';
import { decodeSnapshot, quantiseInput } from '../../src/mp/binary.js';
import { restoreState, captureState } from '../../src/mp/planeState.js';

const bytes = readFileSync(new URL('../../public/data/terrain.bin', import.meta.url));
const world = realWorld(createTerrain(new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2)));
const ann = { id: 'p1', slot: 1, name: 'Ann', team: 'raf', aircraft: 'spitfire' };
const max = { id: 'p2', slot: 2, name: 'Max', team: 'luftwaffe', aircraft: 'bf110c4' };
const match = (settings = {}, w = world, players = [ann, max]) => {
  const m = new MatchSim({ settings: { ...DEFAULT_SETTINGS, ...settings }, world: w, combat: { rng: () => 0.5 } });
  for (const p of players) m.addPlayer(p, { start: true });
  return m;
};
/** Runs `seconds` of the match in the room's 16 ms calls; what came out, gathered. */
const run = (m, seconds) => {
  const end = m.tick + Math.round(seconds * TICK_HZ);
  const all = { snapshots: [], notices: [], result: null };
  while (m.tick < end) {
    const out = m.advanceTo(m.startMs + Math.min(end, m.tick + 2) * TICK_MS + 0.01);
    all.snapshots.push(...out.snapshots);
    all.notices.push(...out.notices);
    all.result ??= out.result;
  }
  return all;
};
const pos = (m, id) => m.players.get(id).plane.body.position;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

describe('starts and respawns', () => {
  it('an air start puts the teams 5 km apart at 8,000 ft, facing each other', () => {
    const m = match();
    const [a, b] = [pos(m, 'p1'), pos(m, 'p2')];
    expect(a.y).toBeCloseTo(AIR_SPAWN.altitude, 0);
    expect(b.y).toBeCloseTo(AIR_SPAWN.altitude, 0);
    expect(flat(a, b)).toBeCloseTo(5000, -2);
    const nose = (id) => m.players.get(id).plane.body.velocity;
    expect(nose('p1').dot(b.clone().sub(a))).toBeGreaterThan(0); // flying towards each other
    expect(nose('p2').dot(a.clone().sub(b))).toBeGreaterThan(0);
  });

  it('with two a side, team-mates start 300 m apart in line abreast, each 5 km opposite an enemy', () => {
    const m = new MatchSim({ settings: { ...DEFAULT_SETTINGS }, world });
    m.addPlayers([ann, max, { ...ann, id: 'p3', slot: 3, name: 'Bob' }, { ...max, id: 'p4', slot: 4, name: 'Udo' }], { start: true });
    expect(flat(pos(m, 'p1'), pos(m, 'p3'))).toBeCloseTo(300, 0);
    expect(flat(pos(m, 'p2'), pos(m, 'p4'))).toBeCloseTo(300, 0);
    expect(flat(pos(m, 'p1'), pos(m, 'p2'))).toBeCloseTo(5000, 0);
    expect(flat(pos(m, 'p3'), pos(m, 'p4'))).toBeCloseTo(5000, 0);
  });

  it('an apron start puts each side on its own home airfield, at rest', () => {
    const m = match({ start: 'apron' });
    run(m, 2);
    for (const [id, side] of [['p1', 'RAF'], ['p2', 'Luftwaffe']]) {
      const p = m.players.get(id);
      expect(p.down, id).toBe(false);
      expect(p.plane.ground.onGround, id).toBe(true);
      expect(flat(p.plane.body.position, airfieldNamed(HOME[side]))).toBeLessThan(500);
    }
  });

  it('respawns 10 s after going down: in the air 5 km from the nearest enemy, or on the apron', () => {
    for (const respawn of ['air', 'apron']) {
      const m = match({ respawn });
      run(m, 1);
      const p = m.players.get('p1');
      m.combat.goDown(p, m.tick, 'crashed');
      const down = m.tick;
      run(m, 9.9);
      expect(p.spawn).toBe(1);
      while (p.spawn === 1) run(m, 1 / TICK_HZ);
      expect(m.tick - down).toBe(10 * TICK_HZ);
      expect(p.down).toBe(false);
      if (respawn === 'air') {
        expect(pos(m, 'p1').y).toBeCloseTo(AIR_SPAWN.altitude, -1);
        expect(flat(pos(m, 'p1'), pos(m, 'p2'))).toBeCloseTo(5000, -2);
      } else {
        expect(p.plane.ground.onGround).toBe(true);
        expect(flat(pos(m, 'p1'), airfieldNamed(HOME.RAF))).toBeLessThan(500);
      }
    }
  });
});

describe('the Bf 110: the AI only in the seat its player is not in', () => {
  it('with the player on the rear gun the AI pilot flies; back at the controls, the AI gunner mans the gun', () => {
    const m = match();
    const p = m.players.get('p2');
    const hold = quantiseInput({ ...p.last, pitch: 0.4, seat: 'gunner', gunAz: Math.PI, gunEl: 0.2 });
    const send = (input, seconds) => {
      for (let k = 0; k < seconds * TICK_HZ; k += 4) {
        m.receiveInputs('p2', { firstTick: m.tick + 1, viewTick: m.tick, inputs: Array(4).fill(input) });
        run(m, 4 / TICK_HZ);
      }
    };
    // On the gun: the AI pilot's controls, not the player's held-back stick; the player's aim on the MG 15.
    m.receiveInputs('p2', { firstTick: m.tick + 1, viewTick: m.tick, inputs: Array(4).fill(hold) });
    run(m, 4 / TICK_HZ);
    expect(p.relief).not.toBeNull();
    expect(p.craft.input).not.toBe(hold);
    expect(p.craft.input.pitch).not.toBe(0.4);
    expect(p.craft.gunnery.manned.seat).toBeTruthy();
    expect(p.craft.gunnery.manned.aim.x).toBeLessThan(-0.9); // azimuth 180°: straight back
    send(hold, 5);
    expect(p.down).toBe(false);
    expect(Math.abs(pos(m, 'p2').y - AIR_SPAWN.altitude)).toBeLessThan(300); // the AI pilot holds the aircraft level
    // Back at the controls: the player's own input flies it and the gunner is the AI again.
    const fly = { ...hold, seat: 'pilot' };
    m.receiveInputs('p2', { firstTick: m.tick + 1, viewTick: m.tick, inputs: Array(4).fill(fly) });
    run(m, 4 / TICK_HZ);
    expect(p.relief).toBeNull();
    expect(p.craft.gunnery.manned).toBeNull();
    expect(p.craft.input.pitch).toBeCloseTo(0.4, 2);
  });

  it("the AI gunner fires at an enemy behind, and its rounds count as the pilot's", () => {
    const m = match();
    const p = m.players.get('p2');
    const e = m.players.get('p1');
    // The Spitfire 250 m behind the Bf 110 and 60 m above, on its course (the MG 15 doesn't fire below level).
    const b = p.plane.body;
    const back = b.velocity.clone().normalize().multiplyScalar(-250);
    e.plane.body.position.copy(b.position).add(back);
    e.plane.body.position.y += 60;
    e.plane.body.quaternion.copy(b.quaternion);
    e.plane.body.velocity.copy(b.velocity);
    e.history.clear();
    run(m, 6);
    expect(p.tally.shots).toBeGreaterThan(0);
    expect(p.armament.length).toBeGreaterThan(0);
  });
});

describe('lag compensation', () => {
  it('a round is tested where the shooter saw the target, up to 0.4 s back', () => {
    // A Bf 109 sat still in the history at (0, 1000, 0) until tick 60, then 30 m to one side; a round fired at tick 100
    // straight down at the old place hits it when the shooter's view was old enough, and misses with no rewind.
    const shoot = (rewind) => {
      const m = match({}, flatWorld, [ann, { ...max, aircraft: 'bf109e4' }]);
      const target = m.players.get('p2');
      const shooter = m.players.get('p1');
      const body = { position: target.plane.body.position.set(0, 1000, 0), quaternion: target.plane.body.quaternion, velocity: target.plane.body.velocity.set(0, 0, 0) };
      target.history.clear();
      for (let t = 1; t <= 100; t += 1) {
        body.position.x = t <= 60 ? 0 : 30;
        target.history.record(t, body);
      }
      m.combat.fire(shooter, { position: { x: 0, y: 1020, z: 0 }, velocity: { x: 0, y: -800, z: 0 }, ballistics: 'mk7', kind: 'ball303' }, rewind);
      for (let t = 101; t <= 140; t += 1) m.combat.moveRounds(t, [target]);
      return shooter.tally.hits;
    };
    expect(shoot(0)).toBe(0);
    expect(shoot(48)).toBe(1); // 0.4 s: tested against ticks 53-56, where it was
    expect(shoot(500)).toBe(1); // capped at 0.4 s
  });
});

describe('kill credit and the end of a match', () => {
  it('the last enemy to hit within 15 s gets the kill; a crash with no recent hit scores nothing', () => {
    const m = match();
    const [a, b] = [m.players.get('p1'), m.players.get('p2')];
    b.lastHit = { by: a, tick: m.tick };
    m.combat.goDown(b, m.tick + 14 * TICK_HZ, 'pilot killed');
    expect([a.tally.kills, b.tally.deaths, m.combat.teams.raf]).toEqual([1, 1, 1]);
    a.lastHit = { by: b, tick: 0 };
    m.combat.goDown(a, 16 * TICK_HZ, 'crashed');
    expect([b.tally.kills, a.tally.deaths, m.combat.teams.luftwaffe]).toEqual([0, 1, 0]);
    expect(m.combat.notices.some((n) => n.text === 'You shot down Max (pilot killed)')).toBe(true);
  });

  it('ends at the score limit, at the time limit, and when a team has gone', () => {
    const m1 = match({ scoreLimit: 3 });
    m1.combat.teams.raf = 3;
    expect(run(m1, 1.1).result).toMatchObject({ winner: 'raf', reason: 'score' });
    const m2 = match({ timeLimit: 0.05 });
    expect(run(m2, 2.5).result).toBeNull();
    const end = run(m2, 1);
    expect(end.result).toMatchObject({ winner: 'draw', reason: 'time', seconds: 3 });
    expect(end.result.players.map((p) => p.name)).toEqual(['Ann', 'Max']);
    const m3 = match();
    m3.removePlayer('p2');
    expect(run(m3, 29).result).toBeNull();
    expect(run(m3, 2).result).toMatchObject({ winner: 'raf', reason: 'left', leftTeam: 'luftwaffe' });
  });
});

describe('the server and a browser step alike', () => {
  it("a player's own aircraft from a snapshot, flown on with the same controls, matches the next snapshot exactly", () => {
    const m = match({}, flatWorld);
    const controls = (t) => quantiseInput({ ...m.players.get('p1').last, pitch: 0.2 * Math.sin(t / 30), roll: 0.3, fireMg: t % 50 < 10 });
    const sent = new Map();
    const feed = () => {
      const first = m.tick + 1;
      const inputs = [0, 1, 2, 3].map((k) => controls(first + k));
      inputs.forEach((x, k) => sent.set(first + k, x));
      m.receiveInputs('p1', { firstTick: first, viewTick: m.tick, inputs });
    };
    const mine = (out) => decodeSnapshot(out.snapshots.find((s) => s.id === 'p1').buffer);
    let snap = null;
    for (let k = 0; k < 30; k += 1) {
      feed();
      const out = run(m, 4 / TICK_HZ);
      if (k === 20) snap = mine(out);
    }
    // Replay ticks snap.tick+1 .. +4 locally from the snapshot and compare with the server's state at that tick.
    const ac = aircraftById.spitfire;
    const plane = createAircraft(ac, { altitude: 1000 });
    const guns = createArmament(ac);
    restoreState(plane, snap.you, guns);
    for (let t = snap.tick + 1; t <= snap.tick + 4; t += 1) {
      const input = sent.get(t);
      const recoil = stepGuns(guns, plane, input, 1 / TICK_HZ, plane.time, () => {});
      plane.recoil = recoil.force.lengthSq() > 0 ? recoil : null;
      stepAircraft(plane, input, 1 / TICK_HZ);
    }
    const m2 = match({}, flatWorld);
    const again = new Map(sent);
    for (let k = 0; k < 22; k += 1) {
      const first = m2.tick + 1;
      m2.receiveInputs('p1', { firstTick: first, viewTick: m2.tick, inputs: [0, 1, 2, 3].map((j) => again.get(first + j)) });
      run(m2, 4 / TICK_HZ);
    }
    expect(m2.tick).toBe(snap.tick + 4);
    const server = captureState(m2.players.get('p1').plane, m2.players.get('p1').armament);
    expect([...captureState(plane, guns).numbers]).toEqual([...server.numbers]);
  });
});
