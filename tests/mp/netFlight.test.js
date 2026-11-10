// The browser's side of a match (Phase 9, D245), against the real server simulation over the test network: your own
// aircraft predicted true to the server, the others drawn where they were, the Bf 110's rear gun with the server's AI
// pilot flying, going down and respawning, and the others' rounds drawn.
import { describe, it, expect } from 'vitest';
import { createHarness } from './netHarness.js';
import { swapSeat } from '../../src/core/crewSeat.js';
import { TICK_HZ } from '../../src/mp/netConfig.js';

const weave = (t, sim) => {
  sim.input.pitch = 0.2 * Math.sin(t);
  sim.input.roll = 0.3 * Math.sin(t / 2);
  sim.input.fireMg = t % 3 < 1;
};
const ann = { id: 'p1', slot: 1, name: 'Ann', team: 'raf', aircraft: 'spitfire', pilot: weave };
const max = { id: 'p2', slot: 2, name: 'Max', team: 'luftwaffe', aircraft: 'bf110c4' };
const BAD = { ping: 150, jitter: 20, loss: 2 };

/** How far the others are drawn from where the server had them at the tick being drawn (m, the largest). */
function drawnError(h, c) {
  let worst = 0;
  for (const craft of c.sim.others) {
    const id = h.clients.find((x) => x.slot === craft.remote.slot).id;
    const at = h.truth.get(id).get(Math.round(c.net.render.tickAt()));
    if (at) worst = Math.max(worst, craft.plane.body.position.distanceTo(at));
  }
  return worst;
}

describe('your own aircraft', () => {
  it('with no delay, flies exactly as the server does: no corrections', () => {
    const h = createHarness({ players: [ann, max] });
    h.run(8);
    for (const c of h.clients) {
      expect(c.ready, c.name).toBe(true);
      expect(h.ownError(c), c.name).toBeLessThan(1e-6);
      expect(c.net.prediction.corrections, c.name).toBe(0);
    }
  });

  it('at 150 ms ping with 20 ms jitter and 2% loss, stays within centimetres of the server', () => {
    const h = createHarness({ players: [ann, max], net: BAD });
    h.run(10);
    for (const c of h.clients) expect(h.ownError(c), c.name).toBeLessThan(0.1);
    expect(h.clients[0].net.prediction.largest).toBeLessThan(0.1);
  });
});

describe('the other aircraft', () => {
  it('are drawn where the server had them at the tick being drawn, and fly on smoothly', () => {
    for (const net of [{ ping: 0, jitter: 0, loss: 0 }, BAD]) {
      const h = createHarness({ players: [ann, max], net });
      let worst = 0;
      for (let k = 0; k < 40; k += 1) {
        h.run(0.2);
        if (k > 10) for (const c of h.clients) worst = Math.max(worst, drawnError(h, c));
      }
      expect(worst, JSON.stringify(net)).toBeLessThan(2);
      expect(h.clients[1].sim.others.map((o) => o.label)).toEqual(['Ann']);
      expect(h.clients[1].sim.others[0].side).toBe('RAF');
    }
  });

  it("draw the rounds another player fired, from that aircraft's guns", () => {
    const h = createHarness({ players: [ann, max] });
    h.run(1.5);
    const maxSim = h.clients[1].sim;
    const annCraft = maxSim.others[0];
    expect(maxSim.projectiles.live.filter((r) => r.owner === annCraft).length).toBeGreaterThan(20);
  });
});

describe("the Bf 110's rear gun", () => {
  it('with the player on the gun the server AI flies, and the prediction follows it closely', () => {
    const h = createHarness({ players: [ann, max], net: BAD });
    h.run(1);
    const c = h.clients[1];
    swapSeat(c.sim);
    c.sim.gunControl.trigger = true;
    const from = h.server.tick + TICK_HZ;
    h.run(6);
    const p = h.server.players.get('p2');
    expect(p.relief).not.toBeNull();
    expect(p.down).toBe(false);
    expect(h.ownError(c, from)).toBeLessThan(2);
    expect(p.tally.shots).toBeGreaterThan(0); // the player's trigger fired the server's gun
    expect(c.sim.projectiles.live.some((r) => r.owner === c.sim)).toBe(true); // and its tracers show here at once
  });
});

describe('going down and coming back', () => {
  it('shows the loss, then puts the aircraft where the server respawned it, exactly', () => {
    const h = createHarness({ players: [ann, max], net: BAD });
    h.run(2);
    const c = h.clients[0];
    h.server.combat.goDown(h.server.players.get('p1'), h.server.tick, 'crashed');
    h.run(1);
    expect(c.net.down).toBe(true);
    expect(c.sim.crashed).toBe(true);
    expect(h.clients[1].sim.others).toHaveLength(0); // gone from the other's sky
    h.run(10);
    expect(c.net.spawn).toBe(2);
    expect(c.sim.crashed).toBe(false);
    expect(c.net.down).toBe(false);
    expect(h.ownError(c, h.server.tick - TICK_HZ)).toBeLessThan(0.1);
    expect(h.clients[1].sim.others).toHaveLength(1);
  });
});

describe('bailing out', () => {
  it('holding the key: the crew go at their exit times, the pilot under his parachute; then the aircraft is down', () => {
    const h = createHarness({ players: [{ ...ann, pilot: (t, sim) => { sim.input.bailOut = t > 2; } }, max], net: BAD });
    h.run(2);
    const c = h.clients[0];
    const p = h.server.players.get('p1');
    h.run(1.6);
    expect(c.sim.bailout).toBeTruthy(); // begun after 1 s held
    expect(p.down).toBe(false); // the pilot has not jumped yet (his exit time is 4 s)
    h.run(4);
    expect(c.sim.playerJumper).toBeTruthy();
    expect(c.sim.jumpers.some((j) => j.player)).toBe(true);
    expect(p.down).toBe(true);
    h.run(1);
    expect(c.net.down).toBe(true);
    expect(c.net.respawnText()).toMatch(/^back in the air in (8|9) s$/); // not single player's "press R to restart"
    expect(h.clients[1].sim.jumpers.length).toBeGreaterThan(0); // the other player sees the parachute too
  });
});

