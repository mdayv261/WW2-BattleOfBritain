// Entry point: the map of south-east England (D51), aircraft, keyboard, joystick and mouse, cameras, instruments and
// readouts, and the game's screens and states (Phase 7, D225: the main menu, missions and the test flight).
import { Vector3 } from 'three';
import { createScene } from './render/scene.js';
import { TestView } from './render/testView.js';
import { ProjectileView } from './render/projectiles.js';
import { EffectsView } from './render/effects.js';
import { WreckView } from './render/wrecks.js';
import { ParachuteView } from './render/parachutes.js';
import { HAT_LOOKS } from './render/cameras.js';
import { Simulation } from './core/simulation.js';
import { nextFighterScenario, bomberScenario, crowdScenario, cycleSkill, clearAI } from './core/scenarios.js';
import { Keyboard, typing } from './input/keyboard.js';
import { comboOf } from './input/bindings.js';
import { Joystick } from './input/joystick.js';
import { MouseLook } from './input/mouse.js';
import { MouseFlight } from './input/mouseFlight.js';
import { Hud } from './ui/hud.js';
import { FrameRate } from './ui/frameRate.js';
import { InstrumentPanel, panelHidden } from './ui/instruments.js';
import { ReflectorSight, showSight, boresight, chaseAim } from './ui/reflectorSight.js';
import { FlightHud } from './ui/flightHud.js';
import { mgFlashes } from './ui/bf109Frame.js';
import { JoystickPanel } from './ui/joystickPanel.js';
import { Menus } from './ui/menus.js';
import { GameState } from './core/gameState.js';
import { Career } from './core/career.js';
import { RadarPlot } from './core/radarPlot.js';
import { RadarDisplay } from './ui/radar.js';
import { headingOf } from './ui/units.js';
import { AudioEngine } from './audio/audioEngine.js';
import { Settings } from './core/settings.js';
import { applyDetail, pixelRatioFor } from './render/graphics.js';
import { keyListHtml } from './ui/keyList.js';
import { GunnerHud } from './ui/gunnerHud.js';
import { EnemyPointers } from './ui/enemyPointers.js';
import { enemyPointers } from './core/enemyPointers.js';
import { swapSeat } from './core/crewSeat.js';
import { gunnerAim, keyLook } from './render/cameras.js';
import { common } from './aircraft/common.js';
import { aircraftList } from './aircraft/index.js';
import { loadTerrain } from './world/terrain.js';
import { realWorld } from './world/world.js';
import { attachMultiplayer } from './net/multiplayer.js';

// The real map's terrain (D51), loaded before anything else.
const terrain = await loadTerrain(import.meta.env.BASE_URL);
const world = realWorld(terrain);
const { renderer, scene, camera, sea, clouds, update: updateScene, setSkyTime } = createScene(document.getElementById('app'), terrain);
const view = new TestView(scene, camera, sea);
const shots = new ProjectileView(scene); // tracers and smoke trails (D67)
const effects = new EffectsView(scene); // glycol, smoke, fire, strikes and crashes (D69)
const wrecks = new WreckView(scene); // falling wrecks and broken-off parts (D69)
const parachutes = new ParachuteView(scene); // men bailing out and their parachutes (D80)
const sim = new Simulation(aircraftList[1], 'ground', world); // start in the Spitfire, on the ground at Hawkinge
view.setAircraft(sim.ac);

const keyboard = new Keyboard();
const joystick = new Joystick();
const mouseFlight = new MouseFlight(); // mouse flying, an option (D239)
new MouseLook(renderer.domElement, view.rig, mouseFlight);
mouseFlight.listen(renderer.domElement, view.rig, () => sim.seat === 'gunner'); // on the rear gun the mouse aims
const hud = new Hud();
const frameRate = new FrameRate();
const instruments = new InstrumentPanel();
const sight = new ReflectorSight(); // the RAF's GM 2 drawn square-on in front of the panel (D87)
const flightHud = new FlightHud(); // the outside views' HUD on the right of the screen (D97)
const radarPlot = new RadarPlot(); // the RAF radar's plots and display, top left (D230)
const radar = new RadarDisplay();
const nose = new Vector3();
const gunnerHud = new GunnerHud(); // the Bf 110's rear gun: its sight and readout (D234)
const pointers = new EnemyPointers(); // red arrowheads for enemies within 5 km, along the top (D235)
let gunInput = null; // the player's keys and stick while he mans the rear gun: they work the gun, not the aircraft
const GUN_LOOK = { yaw: 35 * (Math.PI / 180), pitchDown: -5 * (Math.PI / 180), pitchUp: 65 * (Math.PI / 180) }; // rad

/** Tab (or the joystick's seat button): the Bf 110's pilot's seat or its rear gun (D234). */
function changeSeat() {
  const text = swapSeat(sim);
  view.rig.resetLook();
  if (text) sim.notice = { text, until: sim.plane.time + 3 };
}

/** With the player on the rear gun: his stick or arrows swing the aim (at the gun's traverse rate), his trigger fires. */
function workGun(dt) {
  const rate = common.gunners.traverseRate;
  const look = view.rig.mouseLook;
  view.rig.turn(-gunInput.roll * rate * dt, gunInput.pitch * rate * dt);
  look.yaw = Math.max(-GUN_LOOK.yaw, Math.min(GUN_LOOK.yaw, look.yaw)); // the arc, and a little beyond
  look.pitch = Math.max(GUN_LOOK.pitchDown, Math.min(GUN_LOOK.pitchUp, look.pitch));
  sim.gunControl.aim = gunnerAim(view.rig.look, sim.gunControl.aim ?? new Vector3());
  sim.gunControl.trigger = !!(gunInput.fireMg || gunInput.fireCannon);
  if (gunInput.bailOut) sim.input.bailOut = gunInput.bailOut; // bailing out works from either seat
}
const audio = new AudioEngine(); // the sound (D231): starts on the first click or key press, as browsers require
const settings = new Settings(); // the player's settings (D232)

/** Applies the settings that act in the page: the volume and the sharpness at once (the rest at each flight's start). */
function applySettings(values) {
  audio.setVolume(values.volume / 100);
  audio.setEngineVolume(values.engineVolume / 100);
  mouseFlight.configure(values.mouseFlight, values.mouseSensitivity);
  renderer.setPixelRatio(pixelRatioFor(values.graphics, window.devicePixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
}
applySettings(settings.values);
applyDetail(settings.values.graphics, clouds);
for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, () => audio.start(), { once: true, capture: true });
const joyPanel = new JoystickPanel(joystick);

function select(ac) {
  sim.reset(ac);
  view.setAircraft(ac);
  effects.clear();
}

/** A flight starts (a mission, the test flight or a match): its aircraft drawn, the sky's time, the graphics' detail. */
function flightStarts({ ac, time }) {
  view.setAircraft(ac);
  effects.clear();
  setSkyTime(time);
  radarPlot.reset();
  applyDetail(settings.values.graphics, clouds); // the graphics level's land, towns and clouds (D232)
}

// The game's states (D225): it opens on the main menu; each flight starts afresh in the same simulation.
const game = new GameState({
  sim, menus: new Menus(), testAircraft: aircraftList[1], career: new Career(), sound: audio,
  settings, onSettings: applySettings, onJoystick: () => joyPanel.toggle(), helpHtml: () => keyListHtml(keyboard.bindings),
  controls: { bindings: keyboard.bindings, joystick, onChange: () => hud.setHelp(keyListHtml(keyboard.bindings)) },
  onFlight: flightStarts,
});
// Multiplayer (Phase 9, D245): its screens, and a match flown in the same simulation.
game.mp = attachMultiplayer({
  game, sim, menus: game.menus, onFlight: flightStarts,
  onRespawn: () => {
    view.setAircraft(sim.ac);
    effects.clear();
    if (view.rig.cockpitAllowed) view.rig.mode = 'cockpit'; // back in the cockpit, as the loss had moved the view outside
    view.rig.resetLook();
  },
});
game.menu();
hud.setHelp(keyListHtml(keyboard.bindings));
hud.toggleHelp(false); // the key list stays shut behind the main menu (its note says H lists the keys)

/** Keys that act on the game rather than the aircraft. */
function gameKeys() {
  if (keyboard.took('Escape')) game.escape();
  if (game.kind === 'test') testKeys();
  if (keyboard.tookAction('strip')) hud.toggleStrip();
  if (keyboard.tookAction('debug')) hud.toggleDebug();
  if (keyboard.tookAction('radar')) radar.toggle();
  if (keyboard.tookAction('seat')) changeSeat();
  if (keyboard.tookAction('mouseCentre')) mouseFlight.centre();
  if (keyboard.tookAction('help')) hud.toggleHelp();
  if (keyboard.tookAction('joystickPanel')) joyPanel.toggle();
  if (keyboard.tookAction('engineSelect')) sim.engineKey('select');
  if (keyboard.tookAction('engineStart')) sim.engineKey('startStop');
  if (keyboard.tookAction('feather')) sim.engineKey('feather');
  if (keyboard.tookAction('physicsPause')) sim.paused = !sim.paused;
  if (keyboard.tookAction('target')) sim.nextTarget(); // target aircraft (D68)
  if (keyboard.tookAction('cockpit')) view.rig.toggleCockpit();
  if (keyboard.tookAction('outside')) view.rig.nextOutside();
  if (keyboard.tookAction('instruments')) instruments.toggle();
}

/** The test flight's own keys (aircraft, starts, test hits and the AI scenarios), off in a mission (D225). */
function testKeys() {
  if (keyboard.took('Digit1')) select(aircraftList[0]);
  if (keyboard.took('Digit2')) select(aircraftList[1]);
  if (keyboard.took('Digit3')) select(aircraftList[2]);
  if (keyboard.took('Digit4')) select(aircraftList[3]);
  if (keyboard.took('Digit5')) select(aircraftList[4]);
  if (keyboard.took('KeyR')) select(sim.ac);
  if (keyboard.took('KeyN')) {
    sim.nextStart();
    view.setAircraft(sim.ac);
    effects.clear();
  }
  if (keyboard.took('Digit9')) sim.testHit(); // a 20 mm hit on your own aircraft (D68)
  // AI scenarios (D76, D79): 6 fighters in turn, 7 a bomber formation, 8 the AI's skill, 0 clear.
  const say = (text) => { sim.notice = { text, until: sim.plane.time + 4 }; };
  if (keyboard.took('Digit6')) say(nextFighterScenario(sim));
  if (keyboard.took('Digit7')) say(bomberScenario(sim));
  if (keyboard.took('Shift+Digit7')) say(crowdScenario(sim)); // twelve aircraft, for the frame rate (D221)
  if (keyboard.took('Digit8')) say(cycleSkill(sim));
  if (keyboard.took('Digit0')) say(clearAI(sim));
}
window.addEventListener('keydown', (e) => {
  if (typing(e)) return; // typing a name or room code (D245): the key is the text box's
  // A bound key does only its action, not the browser's (F-keys, Tab).
  if (keyboard.bindings.user(comboOf(e)) || ['F2', 'F3', 'F4', 'Tab'].includes(e.code)) e.preventDefault();
  const keepsHelp = [...keyboard.bindings.of('help'), ...keyboard.bindings.of('joystickPanel')].includes(comboOf(e));
  if (hud.helpVisible && !keepsHelp) hud.toggleHelp(false);
});

let last = performance.now();
renderer.setAnimationLoop((now) => {
  frameRate.tick((now - last) / 1000);
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;
  gameKeys();
  let stick = null;
  let plotted = false;
  if (game.advancing) {
    // Flying: the controls, the physics, and the mission's watch for its end (D225).
    if (sim.seat === 'gunner') {
      gunInput ??= { ...sim.input, engines: sim.input.engines?.map((e) => ({ ...e })), pitch: 0, roll: 0, yaw: 0 };
      keyboard.update(gunInput, sim.ac, dt);
      stick = joystick.update(gunInput, sim.ac, dt);
      workGun(dt);
      if (stick?.seat) changeSeat();
    } else {
      gunInput = null;
      keyboard.update(sim.input, sim.ac, dt);
      stick = joystick.update(sim.input, sim.ac, dt);
      mouseFlight.apply(sim.input); // with mouse flying on, the mouse holds the stick and works the throttle (D239)
      sim.applyLevers();
      if (stick?.view) view.rig.toggleCockpit();
      if (stick?.seat) changeSeat();
    }
    sim.advance(dt);
    plotted = radarPlot.update(sim);
    game.frame();
  } else {
    mouseFlight.release(); // the mouse is the player's own on the menus
    keyboard.pressed.clear(); // keys pressed on a menu don't act once the flight starts
    joystick.poll(); // keep reading the joystick on the menus, so Chrome connects it from a press there (D226)
    game.menus.setStatus?.(joystick.status());
  }
  game.mp.frame(dt); // a match's other aircraft, where they are drawn now (D245)
  view.rig.hatLook = stick && stick.hat !== null ? HAT_LOOKS[stick.hat] : null;
  // The look keys (D239), not on the rear gun (where the view is the gun's aim).
  view.rig.keyLook = sim.seat === 'gunner' ? null : keyLook({
    left: keyboard.held('lookLeft'), right: keyboard.held('lookRight'), back: keyboard.held('lookBack'), up: keyboard.held('lookUp'),
  });
  // The view follows the seat: along the rear gun while the player mans it, else the pilot's.
  if (sim.seat === 'gunner') view.rig.mode = 'gunner';
  else if (view.rig.atGun) view.rig.mode = 'cockpit';
  view.update(sim, sim.loop.alpha, dt);
  shots.update(sim.projectiles);
  wrecks.update(sim, sim.loop.alpha);
  parachutes.update(sim);
  effects.update(sim, dt, camera, renderer.domElement.height);
  updateScene(camera);
  game.mp.tags(camera); // the other players' names (D245)
  hud.update(sim, { joystick: !!stick, view: view.rig.mode, frame: frameRate.text(renderer.info) });
  const outside = !view.rig.inside;
  instruments.update(sim, { hidden: panelHidden(view.rig, sim) }); // no panel looking away, bailed out or outside (D97)
  const sight2D = showSight(sim, view.rig);
  view.showSight2D(sight2D);
  const aim = sight2D ? boresight(camera, view.model.quaternion, window.innerWidth, window.innerHeight, sim.ac.sight.ringMils) : null;
  if (outside && sim.ac.sight && !sim.playerJumper) {
    // The outside views (D97): the reticle where the guns converge, and the HUD on the right.
    const chase = chaseAim(camera, view.model.position, view.model.quaternion, sim.ac, window.innerWidth, window.innerHeight);
    sight.update(true, chase, sim.ac, undefined, { reticleOnly: true });
  } else {
    sight.update(sight2D, aim, sim.ac, mgFlashes(sim)); // the Bf 109's MG 17 flashes on its coaming (D94)
  }
  flightHud.update(sim, (outside || (settings.values.hudInCockpit && !view.rig.atGun)) && !sim.playerJumper); // in the cockpit too if chosen (D232)
  gunnerHud.update(sim, view.rig.atGun && game.kind !== null && !sim.playerJumper, camera.fov);
  mouseFlight.draw(game.advancing && !sim.playerJumper);
  const pointing = settings.values.enemyPointers && game.kind !== null && !sim.playerJumper && !sim.crashed;
  pointers.update(pointing ? enemyPointers(sim) : [], pointing);
  const heading = headingOf(nose.set(1, 0, 0).applyQuaternion(sim.plane.body.quaternion));
  audio.update(sim, game.advancing);
  radar.draw(radarPlot, heading, { show: game.kind !== null && sim.ac.side === 'RAF' && !sim.playerJumper, fresh: plotted, dt });
  joyPanel.update();
  renderer.render(scene, camera);
  frameRate.work(performance.now() - now);
});
