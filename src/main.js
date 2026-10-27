// Entry point for the test flight: the map of south-east England (D51), aircraft, keyboard, joystick and mouse, cameras,
// instruments and readouts.
import { createScene } from './render/scene.js';
import { TestView } from './render/testView.js';
import { ProjectileView } from './render/projectiles.js';
import { EffectsView } from './render/effects.js';
import { WreckView } from './render/wrecks.js';
import { HAT_LOOKS } from './render/cameras.js';
import { Simulation } from './core/simulation.js';
import { nextFighterScenario, bomberScenario, cycleSkill, clearAI } from './core/scenarios.js';
import { Keyboard } from './input/keyboard.js';
import { Joystick } from './input/joystick.js';
import { MouseLook } from './input/mouse.js';
import { Hud } from './ui/hud.js';
import { FrameRate } from './ui/frameRate.js';
import { InstrumentPanel } from './ui/instruments.js';
import { JoystickPanel } from './ui/joystickPanel.js';
import { aircraftList } from './aircraft/index.js';
import { loadTerrain } from './world/terrain.js';
import { realWorld } from './world/world.js';

// The real map's terrain (D51), loaded before anything else.
const terrain = await loadTerrain(import.meta.env.BASE_URL);
const world = realWorld(terrain);
const { renderer, scene, camera, sea, update: updateScene } = createScene(document.getElementById('app'), terrain);
const view = new TestView(scene, camera, sea);
const shots = new ProjectileView(scene); // tracers and smoke trails (D67)
const effects = new EffectsView(scene); // glycol, smoke, fire, strikes and crashes (D69)
const wrecks = new WreckView(scene); // falling wrecks and broken-off parts (D69)
const sim = new Simulation(aircraftList[1], 'ground', world); // start in the Spitfire, on the ground at Hawkinge
view.setAircraft(sim.ac);

const keyboard = new Keyboard();
const joystick = new Joystick();
new MouseLook(renderer.domElement, view.rig);
const hud = new Hud();
const frameRate = new FrameRate();
const instruments = new InstrumentPanel();
const joyPanel = new JoystickPanel(joystick);

function select(ac) {
  sim.reset(ac);
  view.setAircraft(ac);
  effects.clear();
}

/** Keys that act on the game rather than the aircraft. */
function gameKeys() {
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
  if (keyboard.took('KeyP')) sim.paused = !sim.paused;
  if (keyboard.took('KeyY')) sim.nextTarget(); // target aircraft (D68)
  if (keyboard.took('Digit9')) sim.testHit(); // a 20 mm hit on your own aircraft (D68)
  // AI scenarios (D76, D79): 6 fighters in turn, 7 a bomber formation, 8 the AI's skill, 0 clear.
  const say = (text) => { sim.notice = { text, until: sim.plane.time + 4 }; };
  if (keyboard.took('Digit6')) say(nextFighterScenario(sim));
  if (keyboard.took('Digit7')) say(bomberScenario(sim));
  if (keyboard.took('Digit8')) say(cycleSkill(sim));
  if (keyboard.took('Digit0')) say(clearAI(sim));
  if (keyboard.took('KeyC')) view.rig.toggleCockpit();
  if (keyboard.took('KeyV')) view.rig.nextOutside();
  if (keyboard.took('KeyI')) instruments.toggle();
  if (keyboard.took('F2')) hud.toggleStrip();
  if (keyboard.took('F3')) hud.toggleDebug();
  if (keyboard.took('KeyH')) hud.toggleHelp();
  if (keyboard.took('KeyJ')) joyPanel.toggle();
  if (keyboard.took('KeyK')) sim.engineKey('select');
  if (keyboard.took('KeyL')) sim.engineKey('startStop');
  if (keyboard.took('KeyM')) sim.engineKey('feather');
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'F2' || e.code === 'F3') e.preventDefault();
  if (hud.helpVisible && !['KeyH', 'KeyJ'].includes(e.code)) hud.toggleHelp(false);
});

let last = performance.now();
renderer.setAnimationLoop((now) => {
  frameRate.tick((now - last) / 1000);
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;
  gameKeys();
  keyboard.update(sim.input, sim.ac, dt);
  const stick = joystick.update(sim.input, sim.ac, dt);
  sim.applyLevers();
  if (stick?.view) view.rig.toggleCockpit();
  view.rig.hatLook = stick && stick.hat !== null ? HAT_LOOKS[stick.hat] : null;
  sim.advance(dt);
  view.update(sim, sim.loop.alpha, dt);
  shots.update(sim.projectiles);
  wrecks.update(sim, sim.loop.alpha);
  effects.update(sim, dt, camera, renderer.domElement.height);
  updateScene(camera);
  hud.update(sim, { joystick: !!stick, view: view.rig.mode, frame: frameRate.text(renderer.info) });
  instruments.update(sim, { hidden: view.rig.lookingAway });
  joyPanel.update();
  renderer.render(scene, camera);
  frameRate.work(performance.now() - now);
});
