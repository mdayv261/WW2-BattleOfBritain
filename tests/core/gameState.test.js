// The game's states (Phase 7 checkpoint 1, D225): menu → setup → flying → paused → results → menu, the test flight,
// and the simulation advancing only while flying; a mission whose enemy is gone shows its results by itself.
import { describe, it, expect } from 'vitest';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { GameState, careerText } from '../../src/core/gameState.js';
import { END_PAUSE } from '../../src/core/mission.js';
import { Career } from '../../src/core/career.js';
import { noteShooter } from '../../src/core/combat.js';
import { Settings } from '../../src/core/settings.js';

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
  const g = new GameState({ sim, menus, testAircraft: aircraftById.spitfire, onFlight: (f) => flights.push(f), career: new Career(null) });
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

describe('the career in the game (D229)', () => {
  /** The player's kill on an enemy: his hit just now, then it crashes. */
  const kill = (sim, c) => {
    noteShooter(sim, c, sim);
    c.gone = true;
    sim.others = sim.others.filter((o) => o !== c);
  };

  it('a career\'s line gives the rank, the record and the kills to the next rank, in halves where shared', () => {
    expect(careerText('RAF', { kills: 4, shared: 1, missions: 6 })).toBe('Flying Officer: 4 kills, 1 shared, 6 missions (½ kill to Flight Lieutenant)');
    expect(careerText('Luftwaffe', { kills: 3, shared: 1, missions: 1 })).toBe('Oberleutnant: 3 kills, 1 shared, 1 mission (1½ kills to Hauptmann)');
    expect(careerText('Luftwaffe', { kills: 20, shared: 0, missions: 9 })).toBe('Oberstleutnant: 20 kills, 0 shared, 9 missions');
  });

  it('a mission is added to its side\'s career once, as its results show', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 2 });
    kill(sim, g.mission.enemies[0]);
    g.end();
    expect(g.career.of('RAF')).toEqual({ kills: 1, shared: 0, missions: 1 });
    expect(menus.results.career).toMatchObject({ side: 'RAF', rank: 'Pilot Officer', promoted: false });
    g.results(); // shown again: not counted again
    expect(g.career.of('RAF').missions).toBe(1);
    expect(g.career.of('Luftwaffe').missions).toBe(0);
  });

  it('shows a promotion on the results and the rank on the main menu', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 2 });
    for (const c of [...g.mission.enemies]) kill(sim, c);
    g.frame();
    sim.clock += END_PAUSE;
    g.frame();
    expect(menus.results.career).toMatchObject({ rank: 'Flying Officer', promoted: true });
    menus.actions.onMenu();
    expect(menus.actions.career[0]).toEqual(['RAF', 'Flying Officer: 2 kills, 0 shared, 1 mission (3 kills to Flight Lieutenant)']);
    menus.actions.onResetCareer();
    expect(g.career.of('RAF').kills).toBe(0);
  });

  it('a mission left for the main menu from the pause menu, and the test flight, add nothing', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 2 });
    kill(sim, g.mission.enemies[0]);
    g.pause();
    menus.actions.onMenu();
    menus.actions.onTest();
    g.pause();
    menus.actions.onMenu();
    expect(g.career.of('RAF')).toEqual({ kills: 0, shared: 0, missions: 0 });
  });

  it('a mission in which the player is lost still counts his kills', () => {
    const { g, sim } = game();
    g.fly({ ...g.setup, aircraft: 'bf109e4', side: 'Luftwaffe', enemy: 'hurricane', count: 2 });
    kill(sim, g.mission.enemies[0]);
    sim.crashed = true;
    g.frame();
    sim.clock += END_PAUSE;
    g.frame();
    expect([g.state, g.mission.outcome]).toEqual(['results', 'lost']);
    expect(g.career.of('Luftwaffe')).toEqual({ kills: 1, shared: 0, missions: 1 });
  });
});

describe('the Sound button (D231)', () => {
  it('is offered on the main menu and the pause menu, and switches the sound', () => {
    const sim = new Simulation(aircraftById.spitfire, 'ground');
    const menus = fakeMenus();
    const sound = { enabled: true, setEnabled(on) { this.enabled = on; } };
    const g = new GameState({ sim, menus, testAircraft: aircraftById.spitfire, career: new Career(null), sound });
    g.menu();
    expect(menus.actions.sound.on).toBe(true);
    expect(menus.actions.sound.toggle()).toBe(false);
    expect(sound.enabled).toBe(false);
    g.fly({ ...g.setup, count: 1 });
    g.pause();
    expect(menus.actions.sound.on).toBe(false);
    menus.actions.sound.toggle();
    expect(sound.enabled).toBe(true);
    expect(game().menus.actions.sound).toBeNull(); // no sound given: no button
  });
});

describe('the settings in the game (D232)', () => {
  it('are reached from the pause menu and return to it; assists changed there apply at once', () => {
    const { g, sim, menus } = game();
    g.fly({ ...g.setup, count: 1 });
    g.pause();
    menus.actions.onSettings();
    expect([g.state, menus.shown]).toEqual(['settings', 'settings']);
    const values = menus.actions.onChange({ assists: { autoRudder: true } });
    expect(values.assists.autoRudder).toBe(true);
    expect(sim.assists.autoRudder).toBe(true);
    menus.actions.onBack();
    expect([g.state, menus.shown]).toEqual(['paused', 'pause']);
    menus.actions.onResume();
    expect(g.state).toBe('flying');
  });

  it('give each new flight the chosen assists, list them on the results, and Back from the main menu\'s settings goes there', () => {
    const sim = new Simulation(aircraftById.spitfire, 'ground');
    const menus = fakeMenus();
    const settings = new Settings(null);
    settings.set({ assists: { stallWarning: true } });
    const applied = [];
    const g = new GameState({ sim, menus, testAircraft: aircraftById.spitfire, career: new Career(null), settings, onSettings: (v) => applied.push(v) });
    g.menu();
    menus.actions.onSettings();
    menus.actions.onChange({ volume: 20 });
    expect(applied.at(-1).volume).toBe(20);
    menus.actions.onBack();
    expect(g.state).toBe('menu');
    g.fly({ ...g.setup, count: 1 });
    expect(sim.assists.stallWarning).toBe(true);
    g.end();
    expect(menus.results.assists).toBe('stall warning');
    g.testFlight();
    expect(sim.assists.stallWarning).toBe(true);
  });
});
