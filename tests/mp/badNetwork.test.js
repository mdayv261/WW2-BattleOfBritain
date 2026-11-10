// A match over a bad network (Phase 9, D243): controls sent ahead in binary messages of four ticks, 30 a second, through
// a link that delays them by 0-100 ms at random, loses one in ten and reorders them. The server must fly on (a missing
// tick repeats the last controls), drop controls that come too late, keep every snapshot readable, and end up close
// to the same flight as over a perfect network.
import { describe, it, expect } from 'vitest';
import { flatWorld } from '../../src/world/world.js';
import { MatchSim } from '../../src/mp/matchSim.js';
import { DEFAULT_SETTINGS, TICK_MS, TICK_HZ, INPUTS_PER_MESSAGE } from '../../src/mp/netConfig.js';
import { encodeInputs, decodeInputs, decodeSnapshot } from '../../src/mp/binary.js';

/** A small seeded random number generator (mulberry32), so the bad network is the same every run. */
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** `seconds` of a Spitfire against a Bf 109, each pilot's controls a slow weave, over a link of `delay` and `loss`. */
function play(seconds, { delayMs = () => 0, loss = () => false }) {
  const m = new MatchSim({ settings: { ...DEFAULT_SETTINGS }, world: flatWorld, combat: { rng: () => 0.5 } });
  m.addPlayer({ id: 'p1', slot: 1, name: 'Ann', team: 'raf', aircraft: 'spitfire' }, { start: true });
  m.addPlayer({ id: 'p2', slot: 2, name: 'Max', team: 'luftwaffe', aircraft: 'bf109e4' }, { start: true });
  const base = { p1: { ...m.players.get('p1').last }, p2: { ...m.players.get('p2').last } };
  const controls = (id, t) => ({ ...base[id], pitch: 0.15 * Math.sin(t / 90), roll: 0.25 * Math.sin(t / 150 + (id === 'p2' ? 1 : 0)) });
  const LEAD = 14; // ticks the browsers run ahead of the server (about 117 ms): most controls arrive in time
  const link = []; // messages on their way: { at (ms), id, bytes }
  const stats = { snapshots: 0, unreadable: 0, lastTick: 0, backwards: 0 };
  for (let ms = 0; ms <= seconds * 1000; ms += 16) {
    // Each browser sends the controls for its next ticks, four to a message.
    const clientTick = Math.floor(ms / TICK_MS) + LEAD;
    for (const id of ['p1', 'p2']) {
      const p = m.players.get(id);
      p.sentTo ??= 0;
      while (p.sentTo + INPUTS_PER_MESSAGE <= clientTick) {
        const first = p.sentTo + 1;
        const inputs = Array.from({ length: INPUTS_PER_MESSAGE }, (_, k) => controls(id, first + k));
        p.sentTo += INPUTS_PER_MESSAGE;
        if (!loss()) link.push({ at: ms + delayMs(), id, bytes: encodeInputs(first, Math.max(0, first - 2 * LEAD), inputs) });
      }
    }
    // The server hears what has arrived, in whatever order, then flies the ticks due.
    link.sort((a, b) => a.at - b.at);
    while (link.length && link[0].at <= ms) {
      const msg = link.shift();
      m.receiveInputs(msg.id, decodeInputs(msg.bytes));
    }
    for (const s of m.advanceTo(ms).snapshots) {
      const d = decodeSnapshot(s.buffer);
      stats.snapshots += 1;
      if (!d) stats.unreadable += 1;
      else if (s.id === 'p1') {
        if (d.tick <= stats.lastTick) stats.backwards += 1;
        stats.lastTick = d.tick;
      }
    }
  }
  return { m, stats };
}

describe('a match over a bad network', () => {
  it('flies on through late, lost and reordered controls, close to the perfect network\'s flight', () => {
    const good = play(20, {});
    const rnd = seeded(1940);
    const bad = play(20, { delayMs: () => rnd() * 100, loss: () => rnd() < 0.1 });
    expect(bad.m.tick).toBe(good.m.tick);
    expect(bad.stats.unreadable).toBe(0);
    expect(bad.stats.backwards).toBe(0);
    expect(bad.stats.snapshots).toBe(good.stats.snapshots);
    for (const id of ['p1', 'p2']) {
      const [a, b] = [good.m.players.get(id), bad.m.players.get(id)];
      expect(b.down, id).toBe(false);
      const apart = a.plane.body.position.distanceTo(b.plane.body.position);
      expect(apart, id).toBeLessThan(25); // m, after 20 s and about 4 km of flight
      expect(b.lead, id).toBeGreaterThan(0);
    }
  });

  it('a pilot whose controls stop coming has the stick and rudder centred after a second, throttle kept', () => {
    const { m } = play(3, { loss: () => false });
    const p = m.players.get('p1');
    const throttle = p.last.throttle;
    for (let k = 0; k < 2 * TICK_HZ; k += 1) m.step();
    expect([p.last.pitch, p.last.roll, p.last.yaw]).toEqual([0, 0, 0]);
    expect(p.last.throttle).toBe(throttle);
  });
});
