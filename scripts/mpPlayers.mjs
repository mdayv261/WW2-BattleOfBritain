// Scripted players for the room-server checks (Phase 9; npm run mp:smoke and mp:load). Each opens a WebSocket into a
// room, says hello, and keeps what the server sends: the lobby and other messages as JSON, the snapshots decoded.
// The time each snapshot arrived and each ping's round trip are kept for the load test's statistics.

import { PROTOCOL_VERSION } from '../src/mp/netConfig.js';
import { decodeSnapshot } from '../src/mp/binary.js';

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Waits until `ready()` is true or `limit` ms have passed; returns the ms it took (over the internet, not instant). */
export async function until(ready, limit = 5000) {
  const t = Date.now();
  while (!ready() && Date.now() - t < limit) await wait(20);
  return Date.now() - t;
}

/** The server at `base` (http or https): is it up? Returns its /health answer, or null. */
export const health = (base) => fetch(`${base}/health`).then((r) => r.json()).catch(() => null);

/** A fresh room code from the server at `base`. */
export const createRoom = (base) => fetch(`${base}/rooms`, { method: 'POST' }).then((r) => r.json());

/** One scripted player joining room `code` on `base`, asking for `team`. */
export function player(base, code, name, team) {
  const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/rooms/${code}`);
  ws.binaryType = 'arraybuffer';
  const p = { name, ws, got: [], lobby: null, id: null, snapshots: [], arrivals: [], pings: [], closed: null };
  ws.addEventListener('message', (e) => {
    if (typeof e.data !== 'string') {
      p.arrivals.push(performance.now());
      return p.snapshots.push(decodeSnapshot(e.data));
    }
    const m = JSON.parse(e.data);
    p.got.push(m);
    if (m.type === 'welcome') p.id = m.you;
    if (m.type === 'lobby') p.lobby = m;
    if (m.type === 'pong') p.pings.push(performance.now() - m.t);
  });
  ws.addEventListener('close', (e) => {
    p.closed ??= { code: e.code, reason: e.reason, at: performance.now() };
  });
  p.send = (m) => ws.send(JSON.stringify(m));
  p.ping = () => p.send({ type: 'ping', t: performance.now() });
  p.opened = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      p.send({ type: 'hello', v: PROTOCOL_VERSION, name, token: `script-${name}-${Date.now()}`, team });
      resolve();
    });
    ws.addEventListener('error', () => reject(new Error(`${name} could not connect to ${base}`)));
  });
  return p;
}

/** Prints one check's result; a failure sets the exit code. */
export function check(ok, text) {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${text}`);
  if (!ok) process.exitCode = 1;
}
