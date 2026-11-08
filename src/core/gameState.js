// The game's states (Phase 7 checkpoint 1, D225): the main menu, the mission setup, the settings, flying (a mission or
// the test flight), paused, and a mission's results. The 3D view keeps drawing in every state; the simulation advances
// only while flying. Every flight starts afresh in the same simulation (`sim.reset`, src/core/simulation.js), so the
// game goes from the results back to the menu, and on to another flight, without reloading the page.
//   `menus`: the screens (src/ui/menus.js, or a stand-in in the tests);
//   `onFlight({ ac, time })`: called as each flight starts, for the view (its aircraft, effects, the sun's time).

import { createMission, startMission, stepMission, endMission, missionResults, DEFAULT_SETUP } from './mission.js';
import { dropAll } from './scenarios.js';
import { DEFAULT_SKY_TIME } from '../world/sun.js';

export class GameState {
  constructor({ sim, menus, testAircraft, onFlight = () => {} }) {
    this.sim = sim;
    this.menus = menus;
    this.testAircraft = testAircraft;
    this.onFlight = onFlight;
    this.state = 'menu';
    this.kind = null; // 'mission' or 'test' while flying or paused
    this.setup = { ...DEFAULT_SETUP };
    this.mission = null;
  }

  /** Whether the simulation should advance this frame. */
  get advancing() {
    return this.state === 'flying';
  }

  menu() {
    this.state = 'menu';
    this.kind = null;
    this.mission = null;
    this.menus.showMain({ onMission: () => this.setupScreen(), onTest: () => this.testFlight(), onSettings: () => this.settings() });
  }

  setupScreen() {
    this.state = 'setup';
    this.menus.showSetup(this.setup, { onFly: (setup) => this.fly(setup), onBack: () => this.menu() });
  }

  settings() {
    this.state = 'settings';
    this.menus.showSettings({ onBack: () => this.menu() });
  }

  /** Starts (or restarts) a mission from a setup. */
  fly(setup = this.setup) {
    this.setup = { ...setup };
    this.mission = startMission(this.sim, createMission(this.setup));
    this.kind = 'mission';
    this.state = 'flying';
    this.menus.hide();
    this.onFlight({ ac: this.sim.ac, time: { ...this.setup.date, hoursUtc: this.setup.hoursUtc } });
  }

  /** The test flight: on the ground at the home airfield, with all the test keys (src/main.js). */
  testFlight() {
    const { sim } = this;
    dropAll(sim);
    sim.mode = 'ground';
    sim.startOverride = null;
    sim.paused = false;
    sim.reset(this.testAircraft);
    this.mission = null;
    this.kind = 'test';
    this.state = 'flying';
    this.menus.hide();
    this.onFlight({ ac: sim.ac, time: DEFAULT_SKY_TIME });
  }

  pause() {
    if (this.state !== 'flying') return;
    this.state = 'paused';
    this.menus.showPause({
      mission: this.kind === 'mission',
      onResume: () => this.resume(),
      onRestart: () => this.fly(this.setup),
      onEnd: () => this.end(),
      onMenu: () => this.menu(),
    });
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'flying';
    this.menus.hide();
  }

  /** Esc: pauses a flight, or resumes it. */
  escape() {
    if (this.state === 'flying') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  /** Ends the mission now and shows its results. */
  end() {
    endMission(this.sim, this.mission);
    this.results();
  }

  results() {
    this.state = 'results';
    this.menus.showResults(missionResults(this.sim, this.mission), { onAgain: () => this.fly(this.setup), onMenu: () => this.menu() });
  }

  /** Called each frame after the simulation has advanced: a mission whose results are due shows them. */
  frame() {
    if (this.state === 'flying' && this.kind === 'mission' && stepMission(this.sim, this.mission)) this.results();
  }
}
