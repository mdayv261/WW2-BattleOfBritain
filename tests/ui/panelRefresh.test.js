// Redrawing the multiplayer lobby and results without getting in the player's way (D246): the product owner found the
// lobby's drop-down lists closing at once and "I am ready" / "Start the match" not answering, because the panel was
// built afresh every second.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { refreshPlan, refreshPanel, MAX_WAIT_MS } from '../../src/ui/panelRefresh.js';

// A stand-in for the menu panel: just what refreshPanel uses.
function element(tag, className = '') {
  return { tagName: tag, className, textContent: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
}
function fakePanel() {
  const panel = {
    dataset: {},
    children: [],
    listeners: {},
    addEventListener(type, f) { (this.listeners[type] ??= []).push(f); },
    contains: (e) => panel.children.includes(e),
    get firstElementChild() { return panel.children[0] ?? null; },
    querySelector(sel) {
      const root = sel.match(/^\[data-screen-root="(.+)"\]$/);
      if (root) return panel.children.find((c) => c.attrs['data-screen-root'] === root[1]) ?? null;
      return panel.children.find((c) => c.className.split(' ').includes(sel.slice(1))) ?? null;
    },
    replaceChildren(...kids) { panel.children = kids; },
  };
  return panel;
}
// The lobby, as far as these tests need: a title, a drop-down list, and the ping line.
function lobbyBuilder(panel) {
  const builds = [];
  const build = () => {
    const list = element('SELECT');
    panel.replaceChildren(element('H2'), list, element('P', 'menu-note lobby-ping'));
    builds.push(list);
  };
  return { build, builds };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.document;
});

describe('when to redraw a panel', () => {
  it('only the live text when nothing shown has changed; waits for the player, but not for ever', () => {
    expect(refreshPlan({ showing: true, same: true, busy: false })).toBe('update');
    expect(refreshPlan({ showing: true, same: true, busy: true })).toBe('update');
    expect(refreshPlan({ showing: true, same: false, busy: false })).toBe('rebuild');
    expect(refreshPlan({ showing: true, same: false, busy: true, waitedMs: 1000 })).toBe('wait');
    expect(refreshPlan({ showing: true, same: false, busy: true, waitedMs: MAX_WAIT_MS })).toBe('rebuild');
    expect(refreshPlan({ showing: false, same: true, busy: true })).toBe('rebuild'); // another screen was there
  });
});

describe('the lobby panel', () => {
  it('is built once; each second after that only the ping changes, so an open list and the buttons stay put', () => {
    const panel = fakePanel();
    const { build, builds } = lobbyBuilder(panel);
    expect(refreshPanel(panel, 'lobby', { players: 2 }, build, { 'lobby-ping': 'Ping 20 ms' })).toBe('rebuild');
    for (let s = 0; s < 5; s++) expect(refreshPanel(panel, 'lobby', { players: 2 }, build, { 'lobby-ping': `Ping ${21 + s} ms` })).toBe('update');
    expect(builds).toHaveLength(1);
    expect(panel.querySelector('.lobby-ping').textContent).toBe('Ping 25 ms');
  });

  it('is rebuilt when the room changes, or when another screen has used the panel', () => {
    const panel = fakePanel();
    const { build, builds } = lobbyBuilder(panel);
    refreshPanel(panel, 'lobby', { players: 2 }, build);
    expect(refreshPanel(panel, 'lobby', { players: 3 }, build)).toBe('rebuild');
    panel.replaceChildren(element('H2')); // the settings screen, say
    expect(refreshPanel(panel, 'lobby', { players: 3 }, build)).toBe('rebuild');
    expect(builds).toHaveLength(3);
  });

  it('waits while a drop-down list of its own has the focus, then catches up (at most 8 s later)', () => {
    const panel = fakePanel();
    const { build, builds } = lobbyBuilder(panel);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    refreshPanel(panel, 'lobby', { players: 2 }, build);
    globalThis.document = { activeElement: builds[0] }; // the player opened the side list
    expect(refreshPanel(panel, 'lobby', { players: 3 }, build, { 'lobby-ping': 'Ping 30 ms' })).toBe('wait');
    expect(panel.querySelector('.lobby-ping').textContent).toBe('Ping 30 ms'); // the ping still moves
    clock.mockReturnValue(1_000_000 + MAX_WAIT_MS - 1);
    expect(refreshPanel(panel, 'lobby', { players: 3 }, build)).toBe('wait');
    clock.mockReturnValue(1_000_000 + MAX_WAIT_MS);
    expect(refreshPanel(panel, 'lobby', { players: 3 }, build)).toBe('rebuild');
    expect(builds).toHaveLength(2);
    globalThis.document = { activeElement: element('SELECT') }; // a list somewhere else doesn't count
    expect(refreshPanel(panel, 'lobby', { players: 4 }, build)).toBe('rebuild');
  });

  it('waits while a mouse button is held down on it, so a click is never split by a rebuild', () => {
    const panel = fakePanel();
    const { build } = lobbyBuilder(panel);
    refreshPanel(panel, 'lobby', { ready: false }, build);
    for (const f of panel.listeners.pointerdown) f();
    expect(refreshPanel(panel, 'lobby', { ready: true }, build)).toBe('wait');
    panel.pressWatch.down = false; // the button is released (pointerup, on the window)
    expect(refreshPanel(panel, 'lobby', { ready: true }, build)).toBe('rebuild');
  });
});
