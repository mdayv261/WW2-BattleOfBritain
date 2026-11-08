// The game's states (Phase 7 checkpoint 1, D225): menu → setup → flying → paused → results → menu, the test flight,
// and the simulation advancing only while flying; a mission whose enemy is gone shows its results by itself.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { GameState } from '../../src/core/gameState.js';
import { END_PAUSE } from '../../src/core/mission.js';

/** Stand-in screens: they remember what was shown, and the actions offered. */
function fakeMenus() {
  return {
    shown: null, actions: null, results: null, hidden: false,
    showMain(a) { this.shown = 'main'; this.actions = a; this.hidden = false; },
    showSetup(setup, a) { this.shown = 'setup'; this.setup = setup; this.actions = a; this.hidden = false; },
    showSettings(a) { this.shown = 'settings'; this.actions = a; this.hidden = false; },
    showPause(a) { this.shown = 'pause'; this.actions = a; this.hidden = false; },
    showResults(r, a) { this.shown = 'results'; this.results = r; this.actions = a; this.hidden = false; },
    hide() { this.hidden = true; },
  };
}

function game() {
  const sim = new Simulation(aircraftById.spitfire, 'ground');
  const menus = fakeMenus();
  const flights = [];
  const g = new GameState({ sim, menus, testAircraft: aircraftById.spitfire, onFlight: (f) => flights.push(f) });
  g.menu();
  return { g, sim, menus, flights };
}

describe('the game\'s states', () => {
  it('goes menu → setup → flying → paused → results → menu, advancing only while flying', () => {
    const { g, sim, menus, flights } = game();
    expect([g.state, menus.shown, g.advancing]).toEqual(['menu', 'main', false]);
    menus.actions.onMission();
    expect([g.state, menus.shown, g.advancing]).toEqual(['setup', 'setup', false]);
    menus.actions.onFly({ ...menus.setup, enemy: 'bf110c4', count: 3, hoursUtc: 9 });
    expect([g.state, g.kind, g.advancing, menus.hidden]).toEqual(['flying', 'mission', true, true]);
    expect(sim.others).toHaveLength(3);
    expect(flights.at(-1).time.hoursUtc).toBe(9);
    g.escape();
    expect([g.state, menus.shown, g.advancing]).toEqual(['paused', 'pause', false]);
    g.escape();
    expect(g.state).toBe('flying');
    g.pause();
    menus.actions.onEnd();
    expect([g.state, menus.shown]).toEqual(['results', 'results']);
    expect(menus.results.enemies).toBe(3);
    menus.actions.onMenu();
    expect([g.state, menus.shown, g.kind]).toEqual(['menu', 'main', null]);
  });

  it('flies again from the results with the same setup, as a fresh mission', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 2 });
    const first = g.mission.enemies;
    g.end();
    menus.actions.onAgain();
    expect(g.state).toBe('flying');
    expect(sim.others).toHaveLength(2);
    expect(g.mission.enemies.some((c) => first.includes(c))).toBe(false);
  });

  it('a mission whose enemy has gone shows its results by itself, END_PAUSE later', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 1 });
    g.mission.enemies[0].pilot.home = true;
    g.frame();
    expect(g.state).toBe('flying');
    sim.clock += END_PAUSE;
    g.frame();
    expect([g.state, menus.shown]).toEqual(['results', 'results']);
  });

  it('the test flight starts on the ground with no AI, and its pause menu has no mission actions', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 4 });
    menus.actions = null;
    g.pause();
    menus.actions.onMenu();
    menus.actions.onTest();
    expect([g.state, g.kind]).toEqual(['flying', 'test']);
    expect(sim.mode).toBe('ground');
    expect(sim.others).toHaveLength(0);
    expect(sim.startOverride).toBeNull();
    g.pause();
    expect(menus.actions.mission).toBe(false);
  });

  it('settings is reached from the menu and returns to it', () => {
    const { g, menus } = game();
    menus.actions.onSettings();
    expect(g.state).toBe('settings');
    menus.actions.onBack();
    expect(g.state).toBe('menu');
  });
});
