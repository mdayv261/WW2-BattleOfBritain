// The Cloudflare test deployment (Phase 9 checkpoint 4, D246): the server's real settings in server/wrangler.toml let
// the game's own pages in (the live site, this computer and the test copy on workers.dev) and nobody else; the test
// copy finds the server at its own address; and the load test's numbers.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { originAllowed } from '../../server/frontDoor.js';
import { serverBase, roomSocketUrl } from '../../src/net/serverUrl.js';
import { summarise, passed, median, MIN_SNAPSHOT_RATE } from '../../scripts/loadStats.mjs';

const TEST_COPY = 'https://bob1940-mp.dawn-patrol-mp-server.workers.dev';
const toml = readFileSync(new URL('../../server/wrangler.toml', import.meta.url), 'utf8');
const ORIGINS = toml.match(/^ALLOWED_ORIGINS = "([^"]*)"/m)[1];

describe('the deployed server\'s settings', () => {
  it('lets in the live site, this computer and the test copy, and nobody else', () => {
    expect(originAllowed('https://mdayv261.github.io', ORIGINS)).toBe(true);
    expect(originAllowed('http://localhost:5173', ORIGINS)).toBe(true);
    expect(originAllowed('http://localhost:8787', ORIGINS)).toBe(true);
    expect(originAllowed(TEST_COPY, ORIGINS)).toBe(true);
    expect(originAllowed('http://bob1940-mp.dawn-patrol-mp-server.workers.dev', ORIGINS)).toBe(false); // http
    expect(originAllowed('https://dawn-patrol-mp.dawn-patrol-mp-server.workers.dev', ORIGINS)).toBe(false); // the WW1 game
    expect(originAllowed('https://evil.example', ORIGINS)).toBe(false);
  });

  it('serves the test copy from server/public, and keeps no request logs', () => {
    expect(toml).toMatch(/^\[assets\]\ndirectory = "\.\/public"$/m);
    expect(toml).toMatch(/^\[observability\]\nenabled = false$/m);
    expect(toml).toMatch(/^name = "bob1940-mp"$/m);
  });

  it('the test copy finds the server at its own address', () => {
    const location = { protocol: 'https:', host: 'bob1940-mp.dawn-patrol-mp-server.workers.dev', hostname: 'bob1940-mp.dawn-patrol-mp-server.workers.dev' };
    const base = serverBase({ env: { VITE_MP_SERVER: 'same-origin' }, location });
    expect(base).toBe(TEST_COPY);
    expect(roomSocketUrl(base, 'K7QPM2')).toBe('wss://bob1940-mp.dawn-patrol-mp-server.workers.dev/rooms/K7QPM2');
  });
});

describe('the load test\'s numbers', () => {
  it('median of odd, even and empty lists', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(null);
  });

  it('counts snapshots a second, the worst gap and late gaps inside the window only', () => {
    const arrivals = [];
    for (let i = 0; i <= 300; i++) arrivals.push((i * 1000) / 30); // 301 snapshots over 10 s
    arrivals.push(10250); // a 250 ms gap after the last regular one
    const s = summarise({ arrivals, pings: [40, 60, 50] }, 0, 10000);
    expect(s.rate).toBeCloseTo(30.1, 1);
    expect(s.worstGapMs).toBeCloseTo(1000 / 30, 6);
    expect(s.lateGaps).toBe(0);
    expect(s.pingMedian).toBe(50);
    expect(s.pingWorst).toBe(60);
    const all = summarise({ arrivals, pings: [] }, 0, 10300);
    expect(all.worstGapMs).toBeGreaterThan(240);
    expect(all.lateGaps).toBe(1);
    expect(all.pingMedian).toBe(null);
  });

  it('passes a connected player at 25 a second or more; fails one cut off or starved', () => {
    expect(passed({ rate: MIN_SNAPSHOT_RATE }, null)).toBe(true);
    expect(passed({ rate: 29.9 }, { code: 1006 })).toBe(false);
    expect(passed({ rate: 20 }, null)).toBe(false);
  });
});
