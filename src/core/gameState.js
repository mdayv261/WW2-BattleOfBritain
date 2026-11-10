// The game's states (Phase 7 checkpoint 1, D225): the main menu, the mission setup, the settings, flying (a mission or
// the test flight), paused, and a mission's results. The 3D view keeps drawing in every state; the simulation advances
// only while flying. Every flight starts afresh in the same simulation (`sim.reset`, src/core/simulation.js), so the
// game goes from the results back to the menu, and on to another flight, without reloading the page.
//   `menus`: the screens (src/ui/menus.js, or a stand-in in the tests);
//   `onFlight({ ac, time })`: called as each flight starts, for the view (its aircraft, effects, the sun's time);
//   `career`: the player's careers (src/core/career.js, D229). A mission is added to its side's career once, as its
//     results show (at its end, or by "End mission"); one left for the main menu from the pause menu is not, nor is
//     the test flight;
//   `sound`: { enabled, setEnabled(on) } (src/audio/audioEngine.js, D231), switched by the menus' Sound button;
//   `settings`: the player's settings (src/core/settings.js, D232), from the main menu or the pause menu. The assists
//     go to each flight as it starts, and at once when changed from the pause menu; `onSettings(values)` applies the
//     rest (volume, graphics, HUD) in the page; `onJoystick` opens the joystick panel; `helpHtml` is the key list.

import { createMission, startMission, stepMission, endMission, missionResults, DEFAULT_SETUP } from './mission.js';
import { dropAll } from './scenarios.js';
import { DEFAULT_SKY_TIME } from '../world/sun.js';
import { Career } from './career.js';
import { rankOf, nextRank } from './ranks.js';
import { Settings } from './settings.js';
import { assistNames } from './assists.js';

/** "1 kill", "3 kills", "½ kill", "1½ kills" (shared kills count half). */
function killsText(n) {
  const whole = Math.floor(n);
  const half = n % 1 ? '½' : '';
  const number = whole || !half ? `${whole}${half}` : half;
  return `${number} ${n === 1 || n === 0.5 ? 'kill' : 'kills'}`;
}

/** A career's line for the main menu: "Flying Officer: 3 kills, 1 shared, 4 missions (2 kills to Flight Lieutenant)". */
export function careerText(side, record) {
  const next = nextRank(side, record);
  const toGo = next ? ` (${killsText(next.toGo)} to ${next.name})` : '';
  return `${rankOf(side, record).name}: ${killsText(record.kills)}, ${record.shared} shared, ${record.missions} ${record.missions === 1 ? 'mission' : 'missions'}${toGo}`;
}

export class GameState {
  constructor({
    sim, menus, testAircraft, onFlight = () => {}, career = new Career(null), sound = null,
    settings = new Settings(null), onSettings = () => {}, onJoystick = null, helpHtml = '', controls = null,
  }) {
    this.sim = sim;
    this.menus = menus;
    this.testAircraft = testAircraft;
    this.onFlight = onFlight;
    this.career = career;
    this.sound = sound;
    this.prefs = settings;
    this.onSettings = onSettings;
    this.onJoystick = onJoystick;
    this.helpHtml = helpHtml;
    this.controls = controls; // { bindings, joystick, onChange } for the Controls screen (D238), or null
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
    this.menus.showMain({
      onMission: () => this.setupScreen(), onTest: () => this.testFlight(), onSettings: () => this.settings(),
      career: ['RAF', 'Luftwaffe'].map((side) => [side, careerText(side, this.career.of(side))]),
      onResetCareer: () => { this.career.reset(); this.menu(); },
      sound: this.soundButton(),
    });
  }

  setupScreen() {
    this.state = 'setup';
    this.menus.showSetup(this.setup, { onFly: (setup) => this.fly(setup), onBack: () => this.menu() });
  }

  /** The settings screen; Back returns to the main menu or, from a flight, to the pause menu. */
  settings(from = 'menu') {
    this.state = 'settings';
    this.menus.showSettings({
      values: this.prefs.values,
      onChange: (changes) => {
        const values = this.prefs.set(changes);
        if (this.kind) this.sim.assists = { ...values.assists }; // changed in flight: at once
        this.onSettings(values);
        return values;
      },
      onBack: () => (from === 'pause' ? this.pause(true) : this.menu()),
      onJoystick: this.onJoystick,
      onControls: this.controls ? () => this.controlsScreen(from) : null,
      sound: this.soundButton(),
      helpHtml: typeof this.helpHtml === 'function' ? this.helpHtml() : this.helpHtml,
    });
  }

  /** The Controls screen (D238), from the settings; Back returns to them. */
  controlsScreen(from) {
    this.state = 'settings';
    this.menus.showControls({ ...this.controls, onJoystick: this.onJoystick, onBack: () => this.settings(from) });
  }

  /** Starts (or restarts) a mission from a setup. */
  fly(setup = this.setup) {
    this.setup = { ...setup };
    this.sim.assists = { ...this.prefs.values.assists }; // the player's assists (D232)
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
    sim.assists = { ...this.prefs.values.assists };
    sim.escortRaid = null;
    sim.reset(this.testAircraft);
    this.mission = null;
    this.kind = 'test';
    this.state = 'flying';
    this.menus.hide();
    this.onFlight({ ac: sim.ac, time: DEFAULT_SKY_TIME });
  }

  /** The pause menu (`again`: coming back to it from the settings). */
  pause(again = false) {
    if (this.state !== 'flying' && !again) return;
    this.state = 'paused';
    this.menus.showPause({
      mission: this.kind === 'mission',
      onResume: () => this.resume(),
      onRestart: () => this.fly(this.setup),
      onEnd: () => this.end(),
      onMenu: () => this.menu(),
      sound: this.soundButton(),
      onSettings: () => this.settings('pause'),
    });
  }

  /** The menus' Sound button (D231): { on, toggle() → on }, or null with no sound. */
  soundButton() {
    const { sound } = this;
    return sound ? { on: sound.enabled, toggle: () => { sound.setEnabled(!sound.enabled); return sound.enabled; } } : null;
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

  /** Shows the mission's results, adding the mission to its side's career the first time. */
  results() {
    this.state = 'results';
    const r = missionResults(this.sim, this.mission);
    r.assists = assistNames(this.sim.assists); // shown on the results when any were on (D232)
    const side = this.sim.ac.side;
    if (!this.mission.recorded) {
      this.mission.recorded = true;
      this.mission.career = this.career.record(side, r);
    }
    const { after, promoted } = this.mission.career;
    r.career = { side, rank: after.name, promoted, text: careerText(side, this.career.of(side)) };
    this.menus.showResults(r, { onAgain: () => this.fly(this.setup), onMenu: () => this.menu() });
  }

  /** Called each frame after the simulation has advanced: a mission whose results are due shows them. */
  frame() {
    if (this.state === 'flying' && this.kind === 'mission' && stepMission(this.sim, this.mission)) this.results();
  }
}
