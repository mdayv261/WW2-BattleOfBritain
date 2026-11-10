// A whole match without a browser, in simulated time (Phase 9, D245; after Dawn Patrol's tests/mp/netHarness.js): the
// server's MatchSim and each browser's NetFlight flying the page's own Simulation, joined through the test network
// (delay, jitter, loss, both ways: src/net/netSim.js). Each browser draws 60 frames a second and flies its 120 Hz steps
// as the page does. Records what the server had and what each browser showed, by tick, for the tests to compare.

import { MatchSim } from '../../src/mp/matchSim.js';
import { NetFlight } from '../../src/net/netFlight.js';
import { createNetSim } from '../../src/net/netSim.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { flatWorld } from '../../src/world/world.js';
import { decodeInputs } from '../../src/mp/binary.js';
import { DEFAULT_SETTINGS, TICK_HZ } from '../../src/mp/netConfig.js';

const FRAME_MS = 1000 / 60;

/** A small seeded random number generator, so every run is the same. */
export function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/**
 * players: [{ id, slot, name, team, aircraft, pilot(seconds, sim) (sets sim.input; optional) }]; net: { ping, jitter,
 * loss }; settings: the match's. Returns { server, clients, run(seconds) }.
 */
export function createHarness({ players, net = { ping: 0, jitter: 0, loss: 0 }, settings = DEFAULT_SETTINGS, seed = 5, world = flatWorld }) {
  let now = 0;
  const rng = seeded(seed);
  const server = new MatchSim({ settings: { ...settings }, world, now: 0, combat: { rng: seeded(seed + 1) } });
  server.addPlayers(players, { start: true });
  const truth = new Map(players.map((p) => [p.id, new Map()])); // id -> tick -> position (the server's)
  const clients = players.map((p) => {
    const sim = new Simulation(aircraftById[p.aircraft], 'air', world);
    const c = { ...p, sim, up: createNetSim(net, rng), down: createNetSim(net, rng), toServer: [], toClient: [], shown: new Map(), ready: false };
    c.net = new NetFlight({
      send: (buffer) => c.toServer.push({ at: c.up.schedule(now), buffer }),
      lookup: (slot) => {
        const q = players.find((x) => x.slot === slot);
        return q ? { name: q.name, team: q.team, aircraft: q.aircraft } : null;
      },
      ping: () => net.ping,
      jitter: () => net.jitter,
      now: () => now,
      onReady: () => { c.ready = true; },
    });
    c.net.attach(sim);
    // What this browser flew for each tick (its predicted own aircraft).
    const step = c.net.step.bind(c.net);
    c.net.step = () => {
      step();
      if (c.net.ready && !c.net.down) c.shown.set(c.net.clock.tick, sim.plane.body.position.clone());
    };
    return c;
  });

  function frame() {
    now += FRAME_MS;
    for (const c of clients) {
      for (const m of c.toServer.filter((x) => x.at <= now)) server.receiveInputs(c.id, decodeInputs(m.buffer));
      c.toServer = c.toServer.filter((x) => x.at > now);
    }
    const out = server.advanceTo(now);
    for (const p of server.players.values()) truth.get(p.id).set(server.tick, p.plane.body.position.clone());
    for (const s of out.snapshots) {
      const c = clients.find((x) => x.id === s.id);
      c.toClient.push({ at: c.down.schedule(now), buffer: s.buffer });
    }
    for (const c of clients) {
      if (out.fx.length) c.toClient.push({ at: c.down.schedule(now), fx: out.fx });
      for (const m of c.toClient.filter((x) => x.at <= now)) {
        if (m.fx) c.net.onFx(m.fx);
        else c.net.receive(m.buffer);
      }
      c.toClient = c.toClient.filter((x) => x.at > now);
      c.pilot?.(now / 1000, c.sim);
      c.sim.advance(FRAME_MS / 1000);
      c.net.frame(FRAME_MS / 1000);
    }
  }

  return {
    server, clients, truth,
    get now() { return now; },
    run(seconds) {
      const end = now + seconds * 1000;
      while (now < end) frame();
    },
    /** The largest distance (m) between what client c flew and the server's aircraft, over ticks both recorded. */
    ownError(c, fromTick = 0) {
      let worst = 0;
      for (const [tick, at] of truth.get(c.id)) {
        const mine = c.shown.get(tick);
        if (tick >= fromTick && mine) worst = Math.max(worst, mine.distanceTo(at));
      }
      return worst;
    },
  };
}

export { TICK_HZ };
