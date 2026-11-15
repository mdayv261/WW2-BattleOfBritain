// A load test of a running room server (Phase 9 checkpoint 4, D246). Four scripted players (Spitfire, Hurricane,
// Bf 109, Bf 110) fly a match for a set time: each holds a 30° banked circle, firing a 2 s burst every 10 s, and the
// Bf 110's player swaps between the controls and the rear gun every minute (so the AI pilot and AI gunner both run).
// Every 30 s it prints each player's snapshots a second and ping; at the end, a table and a verdict. It fails if any
// player is cut off or gets fewer than 25 snapshots a second (the server sends 30). On Cloudflare a room that went
// over its CPU limit would be reset, cutting everyone off, so a clean run shows the room stays within it.
//   npm run mp:load                               (the local server, 60 s)
//   npm run mp:load -- https://server 600         (another server, 10 minutes)

import { PROTOCOL_VERSION } from '../src/mp/netConfig.js';
import { encodeInputs } from '../src/mp/binary.js';
import { wait, health as askHealth, createRoom, player, check } from './mpPlayers.mjs';
import { summarise, passed, MIN_SNAPSHOT_RATE } from './loadStats.mjs';

const base = (process.argv[2] ?? 'http://localhost:8787').replace(/\/+$/, '');
const seconds = Number(process.argv[3] ?? 60);
const SEND_MS = 1000 / 30; // controls 30 times a second, four ticks in each, as a browser sends them
const BANK = 30 * (Math.PI / 180);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const health = await askHealth(base);
if (!health) {
  console.error(`No server at ${base}. Start it with: npm run mp:server`);
  process.exit(1);
}
check(health.version === PROTOCOL_VERSION, `server at ${base} speaks message version ${health.version}`);

const { code } = await createRoom(base);
const crews = [['Ann', 'raf', 'spitfire', 1], ['Bob', 'raf', 'hurricane', -1], ['Max', 'luftwaffe', 'bf109e4', 1], ['Udo', 'luftwaffe', 'bf110c4', -1]];
const all = [];
for (const [name, team, aircraft, side] of crews) {
  const p = player(base, code, name, team);
  Object.assign(p, { aircraft, side });
  all.push(p);
  await p.opened;
  await wait(150);
}
const [host] = all;
for (const p of all) p.send({ type: 'setAircraft', aircraft: p.aircraft });
for (const p of all) p.send({ type: 'setReady', ready: true });
host.send({ type: 'setSettings', settings: { start: 'air', respawn: 'air', scoreLimit: 20, timeLimit: 20 } });
await wait(400);
host.send({ type: 'start' });
const asked = Date.now();
while (!all.every((p) => p.got.some((m) => m.type === 'matchStart')) && Date.now() - asked < 5000) await wait(20);
check(all.every((p) => p.got.some((m) => m.type === 'matchStart')), `room ${code}: the match started for all four (${Date.now() - asked} ms)`);
console.log(`      flying for ${seconds} s...`);

// The bank and nose angles of a snapshot's own aircraft (world +Y up; body +X nose, +Z right wing, D5).
function attitude(numbers) {
  const [x, y, z, w] = [numbers[6], numbers[7], numbers[8], numbers[9]];
  const noseUp = 2 * (x * y + w * z); // world y of the body +X axis
  const rightUp = 2 * (y * z - w * x); // world y of the body +Z axis
  return { nose: Math.asin(clamp(noseUp, -1, 1)), bank: Math.asin(clamp(-rightUp, -1, 1)) };
}

// One tick's controls: hold the bank (to the player's side) and the nose level; burst fire; the Bf 110's seat.
function controls(p, elapsed) {
  const own = p.snapshots.at(-1)?.you;
  const { nose, bank } = own ? attitude(own.numbers) : { nose: 0, bank: 0 };
  const firing = (elapsed + p.side * 2.5) % 10 < 2;
  const gunner = p.aircraft === 'bf110c4' && Math.floor(elapsed / 60) % 2 === 1;
  const c = {
    roll: clamp(1.5 * (p.side * BANK - bank), -0.6, 0.6),
    pitch: clamp(0.1 - 1.5 * nose - 0.02 * (own?.numbers[4] ?? 0), -0.5, 0.8), // nose level, no climb or sink
    throttle: 0.9, rpm: 0.9, fireMg: firing, fireCannon: firing,
    seat: gunner ? 'gunner' : 'pilot', gunAz: Math.PI, gunEl: 0.2, gunTrigger: gunner && firing,
  };
  if (p.aircraft === 'bf110c4') c.engines = [{ throttle: 0.9, rpm: 0.9 }, { throttle: 0.9, rpm: 0.9 }];
  return c;
}

const t0 = performance.now();
const end = t0 + seconds * 1000;
const steady = t0 + Math.min(5000, seconds * 200); // the first few seconds settle in, and aren't counted
const EVERY = Number(process.env.EVERY ?? 30) * 1000; // ms between progress lines
let report = t0 + EVERY;
let lastPing = 0;
while (performance.now() < end && !all.some((p) => p.closed)) {
  const now = performance.now();
  for (const p of all) {
    const tick = p.snapshots.at(-1)?.tick ?? 0;
    const c = controls(p, (now - t0) / 1000);
    p.ws.send(encodeInputs(tick + 10, tick, [c, c, c, c]));
  }
  if (now - lastPing > 2000) {
    for (const p of all) p.ping();
    lastPing = now;
  }
  if (now > report) {
    const line = all.map((p) => {
      const s = summarise({ arrivals: p.arrivals, pings: p.pings.slice(-15) }, now - EVERY, now);
      const own = p.snapshots.at(-1)?.you?.numbers;
      const where = own ? ` ${Math.round(own[1] / 0.3048)} ft bank ${Math.round((attitude(own).bank * 180) / Math.PI)}°` : '';
      return `${p.name} ${s.rate.toFixed(1)}/s ${Math.round(s.pingMedian ?? 0)} ms${where}`;
    });
    console.log(`      ${Math.round((now - t0) / 1000)} s: ${line.join(', ')}`);
    report += EVERY;
  }
  await wait(SEND_MS);
}
const stop = Math.min(performance.now(), ...all.map((p) => p.closed?.at ?? Infinity));

const rows = all.map((p) => {
  const s = summarise(p, steady, stop);
  return {
    pilot: `${p.name} (${p.aircraft})`,
    'snapshots/s': s.rate.toFixed(1),
    'worst gap ms': Math.round(s.worstGapMs ?? 0),
    'gaps > 100 ms': s.lateGaps,
    'ping ms (median)': Math.round(s.pingMedian ?? 0),
    'ping ms (worst)': Math.round(s.pingWorst ?? 0),
    'height ft (end)': Math.round((p.snapshots.at(-1)?.you?.numbers[1] ?? 0) / 0.3048),
    ok: passed(s, p.closed),
  };
});
console.table(rows);
for (const p of all) {
  if (p.closed) check(false, `${p.name} was cut off after ${((p.closed.at - t0) / 1000).toFixed(0)} s (code ${p.closed.code} ${p.closed.reason})`);
}
const ended = host.got.find((m) => m.type === 'matchEnd');
if (ended) console.log(`      (the match ended by itself: ${ended.result.reason})`);
check(rows.every((r) => r.ok), `every player stayed connected with ${MIN_SNAPSHOT_RATE}+ snapshots a second for ${((stop - t0) / 1000).toFixed(0)} s`);

// Tidy up: the host ends the match and everyone leaves, so the room stops its clock.
host.send({ type: 'toLobby' });
await wait(300);
for (const p of all) {
  if (!p.closed) p.send({ type: 'leave' });
}
await wait(300);
for (const p of all) p.ws.close();
console.log(process.exitCode ? 'Something is wrong (see FAIL above).' : 'All good.');
