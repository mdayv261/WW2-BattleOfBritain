// A quick check of the real room server (Phase 9, D244; after Dawn Patrol's scripts/mpSmoke.mjs). `npm run mp:server`
// must be running. Four scripted players create a room, join it, pick their fighters, get ready and start; they fly
// and fire for a few seconds, the Bf 110's player goes to the rear gun; the host ends the match and leaves, and the
// host role passes on. Prints what happened and exits with an error if anything is wrong.
//   npm run mp:smoke                      (the local server on port 8787)
//   npm run mp:smoke -- https://server    (another server)

import { PROTOCOL_VERSION, AIR_SPAWN } from '../src/mp/netConfig.js';
import { decodeSnapshot, encodeInputs, quantiseInput } from '../src/mp/binary.js';

const base = (process.argv[2] ?? 'http://localhost:8787').replace(/\/+$/, '');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function player(code, name, team) {
  const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/rooms/${code}`);
  ws.binaryType = 'arraybuffer';
  const p = { name, ws, got: [], lobby: null, id: null, snapshots: [] };
  ws.addEventListener('message', (e) => {
    if (typeof e.data !== 'string') return p.snapshots.push(decodeSnapshot(e.data));
    const m = JSON.parse(e.data);
    p.got.push(m);
    if (m.type === 'welcome') p.id = m.you;
    if (m.type === 'lobby') p.lobby = m;
  });
  p.send = (m) => ws.send(JSON.stringify(m));
  p.opened = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      p.send({ type: 'hello', v: PROTOCOL_VERSION, name, token: `smoke-${name}-${Date.now()}`, team });
      resolve();
    });
    ws.addEventListener('error', () => reject(new Error(`${name} could not connect to ${base}`)));
  });
  return p;
}

function check(ok, text) {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${text}`);
  if (!ok) process.exitCode = 1;
}

const health = await fetch(`${base}/health`).then((r) => r.json()).catch(() => null);
if (!health) {
  console.error(`No server at ${base}. Start it with: npm run mp:server`);
  process.exit(1);
}
check(health.version === PROTOCOL_VERSION, `server is up and speaks message version ${health.version}`);

const { code } = await fetch(`${base}/rooms`, { method: 'POST' }).then((r) => r.json());
check(/^[A-HJ-NP-Z2-9]{6}$/.test(code), `room created: ${code}`);

const ann = player(code, 'Ann', 'raf');
await ann.opened;
await wait(200);
const max = player(code, 'Max', 'luftwaffe');
const bob = player(code, 'Bob', 'raf');
const udo = player(code, 'Udo', 'luftwaffe');
const all = [ann, max, bob, udo];
await Promise.all(all.map((p) => p.opened));
await wait(300);
check(ann.lobby?.players.length === 4, `all four are in the lobby (${ann.lobby?.players.map((p) => `${p.name} ${p.team}`).join(', ')})`);
check(ann.lobby?.hostId === ann.id, 'Ann, who created it, is the host');

ann.send({ type: 'setAircraft', aircraft: 'spitfire' });
bob.send({ type: 'setAircraft', aircraft: 'hurricane' });
max.send({ type: 'setAircraft', aircraft: 'bf109e4' });
udo.send({ type: 'setAircraft', aircraft: 'bf110c4' });
for (const p of all) p.send({ type: 'setReady', ready: true });
ann.send({ type: 'setSettings', settings: { start: 'air', respawn: 'apron', scoreLimit: 10 } });
await wait(300);
const kinds = Object.fromEntries((ann.lobby?.players ?? []).map((p) => [p.name, p.aircraft]));
check(kinds.Ann === 'spitfire' && kinds.Bob === 'hurricane' && kinds.Max === 'bf109e4' && kinds.Udo === 'bf110c4', `fighters picked (${Object.entries(kinds).map(([n, a]) => `${n} ${a}`).join(', ')})`);
check(ann.lobby?.canStart.ok === true, 'everyone is ready, so the host may start');
check(udo.lobby?.settings.respawn === 'apron' && udo.lobby?.settings.scoreLimit === 10, 'the others see the host\'s settings');
const asked = Date.now();
ann.send({ type: 'start' });
while (!all.every((p) => p.got.some((m) => m.type === 'matchStart')) && Date.now() - asked < 3000) await wait(20);
console.log(`      (the match started ${Date.now() - asked} ms after the host pressed Start)`);
check(all.every((p) => p.got.some((m) => m.type === 'matchStart')), 'everyone was told the match started');

// Flying: each player gets about 30 snapshots a second with their own aircraft and the 3 others.
for (const p of all) p.snapshots.length = 0;
const climb = quantiseInput({ pitch: 0.3, throttle: 1, rpm: 1, fireMg: true }); // Ann pulls up, firing
const gunner = quantiseInput({ throttle: 0.8, rpm: 0.9, seat: 'gunner', gunAz: Math.PI, gunEl: 0.3, engines: [{ throttle: 0.8, rpm: 0.9 }, { throttle: 0.8, rpm: 0.9 }] });
const t0 = Date.now();
while (Date.now() - t0 < 3000) {
  const tick = ann.snapshots.at(-1)?.tick ?? 0;
  ann.ws.send(encodeInputs(tick + 10, tick, [climb, climb, climb, climb]));
  const ut = udo.snapshots.at(-1)?.tick ?? 0;
  udo.ws.send(encodeInputs(ut + 10, ut, [gunner, gunner, gunner, gunner])); // Udo goes to the rear gun
  await wait(33);
}
const y = (s) => s.you.numbers[1];
const xz = (a, b) => Math.hypot(b.you.numbers[0] - a.you.numbers[0], b.you.numbers[2] - a.you.numbers[2]);
for (const p of all) {
  const rate = p.snapshots.length / 3;
  const last = p.snapshots.at(-1);
  check(rate > 25 && rate < 35, `${p.name} gets ${rate.toFixed(1)} snapshots a second`);
  check(last?.you && last.others.length === 3, `${p.name}'s snapshot has their own aircraft and the 3 others`);
}
const first = ann.snapshots[0];
check(Math.abs(y(first) - AIR_SPAWN.altitude) < 100, `air start at 8,000 ft (${(y(first) / 0.3048).toFixed(0)} ft)`);
check(y(ann.snapshots.at(-1)) > y(first) + 5, `Ann's controls reach the server: she climbed ${(y(ann.snapshots.at(-1)) - y(first)).toFixed(0)} m`);
const seen = max.snapshots.reduce((n, s) => n + (s.others.find((o) => o.slot === first.you.slot)?.shots.mg ?? 0), 0);
check(seen > 50, `Max is told of Ann's ${seen} rounds (for the tracers)`);
const m0 = max.snapshots[0];
check(xz(m0, max.snapshots.at(-1)) > 200, `Max's aircraft flies on by itself (${xz(m0, max.snapshots.at(-1)).toFixed(0)} m in 3 s)`);
const u = udo.snapshots.at(-1);
check(Math.abs(y(u) - y(udo.snapshots[0])) < 150, `with Udo on the rear gun the AI pilot flies the Bf 110 (height change ${(y(u) - y(udo.snapshots[0])).toFixed(0)} m)`);

// The host ends the match: everyone gets the results; then back to the lobby.
ann.send({ type: 'toLobby' });
await wait(400);
const ends = all.map((p) => p.got.find((m) => m.type === 'matchEnd'));
check(ends.every(Boolean), `everyone got the results (${ends[0]?.result.reason}, ${ends[0]?.result.winner}, ${ends[0]?.result.players.length} pilots)`);
check(bob.lobby?.phase === 'results', 'the room shows the results');
ann.send({ type: 'toLobby' });
await wait(400);
check(bob.lobby?.phase === 'lobby' && bob.lobby.players.every((p) => !p.ready), 'the host takes everyone back to the lobby, not ready');

ann.send({ type: 'leave' });
await wait(300);
const next = ann.lobby.players[1]; // whoever joined second (the other three join at almost the same moment)
const heir = all.find((p) => p.id === next.id);
check(bob.lobby?.hostId === next.id, `when Ann leaves, ${heir?.name} (the next to join) becomes host`);
check(bob.lobby?.players.length === 3, 'three players are left');

for (const p of [max, bob, udo]) p.ws.close();
await wait(100);
console.log(process.exitCode ? 'Something is wrong (see FAIL above).' : 'All good.');
