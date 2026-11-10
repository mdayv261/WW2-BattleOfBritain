// A room's lobby (Phase 9, D243; Dawn Patrol's rules for RAF against Luftwaffe): joining and rejoining, teams and their
// fighters, the host and the host's settings (start and respawn on the apron or in the air), and when a match can start.
import { describe, it, expect } from 'vitest';
import { RoomCore, aircraftOfTeam, checkName } from '../../src/mp/roomCore.js';
import { PROTOCOL_VERSION, DEFAULT_SETTINGS, cleanSettings, AIR_SPAWN } from '../../src/mp/netConfig.js';
import { makeCode, tidyCode, isCode } from '../../src/mp/roomCode.js';
import { parseClientMessage } from '../../src/mp/protocol.js';

const hello = (name, token, team) => ({ v: PROTOCOL_VERSION, name, token, team });

describe('a room', () => {
  it('puts joiners on the smaller team with its first fighter; the first is the host', () => {
    const r = new RoomCore('ABCDEF');
    expect(r.join(hello('Ann', 'tokentoken1'), 0)).toEqual({ id: 'p1' });
    expect(r.join(hello('Max', 'tokentoken2'), 0)).toEqual({ id: 'p2' });
    expect(r.view().players.map((p) => [p.team, p.aircraft])).toEqual([['raf', 'hurricane'], ['luftwaffe', 'bf109e4']]);
    expect(r.hostId).toBe('p1');
    expect(aircraftOfTeam('luftwaffe')).toEqual(['bf109e4', 'bf110c4']);
  });

  it("refuses the other side's aircraft, a fifth player, an old page and a bad name", () => {
    const r = new RoomCore('ABCDEF');
    r.join(hello('Ann', 'tokentoken1'), 0);
    r.outbox = [];
    r.handle('p1', { type: 'setAircraft', aircraft: 'bf109e4' }, 0);
    expect(r.outbox[0].msg.type).toBe('error');
    for (const [i, n] of ['B', 'C', 'D'].entries()) r.join(hello(n, `tokentoken${i + 2}`), 0);
    expect(r.join(hello('E', 'tokentoken9'), 0).error.code).toBe('full');
    expect(new RoomCore('X').join({ ...hello('A', 'tokentoken1'), v: 999 }, 0).error.code).toBe('version');
    expect(checkName('   ')).not.toBe('');
    expect(checkName('<b>')).not.toBe('');
  });

  it('starts only with 2-4 ready players and a pilot on each side; the host sets start and respawn', () => {
    const r = new RoomCore('ABCDEF');
    r.join(hello('Ann', 'tokentoken1'), 0);
    r.join(hello('Max', 'tokentoken2'), 0);
    expect(r.canStart().ok).toBe(false);
    r.handle('p1', { type: 'setReady', ready: true }, 0);
    r.handle('p2', { type: 'setReady', ready: true }, 0);
    r.handle('p2', { type: 'setSettings', settings: { start: 'apron' } }, 0); // not the host
    expect(r.settings.start).toBe('air');
    r.handle('p1', { type: 'setSettings', settings: { start: 'apron', respawn: 'air', scoreLimit: 3, friendlyFire: 'yes' } }, 0);
    expect([r.settings.start, r.settings.respawn, r.settings.scoreLimit, r.settings.friendlyFire]).toEqual(['apron', 'air', 3, false]);
    expect(r.canStart().ok).toBe(true);
    r.handle('p1', { type: 'start' }, 0);
    expect(r.phase).toBe('match');
    expect(DEFAULT_SETTINGS).toMatchObject({ start: 'air', respawn: 'air' });
    expect(AIR_SPAWN.altitude).toBeCloseTo(2438.4, 1); // 8,000 ft
    expect(cleanSettings({ start: '5000' }).start).toBe('air');
  });

  it("keeps a dropped player's place for a reload, and passes the host on", () => {
    const r = new RoomCore('ABCDEF');
    r.join(hello('Ann', 'tokentoken1'), 0);
    r.join(hello('Max', 'tokentoken2'), 0);
    r.disconnect('p1', 1000);
    expect(r.hostId).toBe('p2');
    expect(r.join(hello('Ann', 'tokentoken1'), 2000)).toEqual({ id: 'p1' });
    r.disconnect('p1', 3000);
    expect(r.expire(3000 + 61000)).toBe(false);
    expect(r.players.has('p1')).toBe(false);
  });

  it('room codes and messages are checked', () => {
    const code = makeCode(() => 0.5);
    expect(isCode(code)).toBe(true);
    expect(tidyCode('k7q-pm2')).toBe('K7QPM2');
    expect(isCode('K7QPM1')).toBe(false); // no 1
    expect(parseClientMessage('{"type":"setTeam","team":"raf"}').msg).toEqual({ type: 'setTeam', team: 'raf' });
    expect(parseClientMessage('{"type":"setTeam","team":"allied"}').error).toBeTruthy();
    expect(parseClientMessage('not json').error).toBeTruthy();
  });
});
