// Entry point for the Phase 1 test flight: scene, aircraft, keyboard and joystick, readouts.
import { createScene } from './render/scene.js';
import { TestView } from './render/testView.js';
import { Simulation } from './core/simulation.js';
import { Keyboard } from './input/keyboard.js';
import { Joystick } from './input/joystick.js';
import { Hud } from './ui/hud.js';
import { JoystickPanel } from './ui/joystickPanel.js';
import { aircraftList } from './aircraft/index.js';

const { renderer, scene, camera, sea } = createScene(document.getElementById('app'));
const view = new TestView(scene, camera, sea);
const sim = new Simulation(aircraftList[1]); // start in the Spitfire
view.setAircraft(sim.ac);

const keyboard = new Keyboard();
const joystick = new Joystick();
const hud = new Hud();
const joyPanel = new JoystickPanel(joystick);

function select(ac) {
  sim.reset(ac);
  view.setAircraft(ac);
}

/** Keys that act on the game rather than the aircraft. */
function gameKeys() {
  if (keyboard.took('Digit1')) select(aircraftList[0]);
  if (keyboard.took('Digit2')) select(aircraftList[1]);
  if (keyboard.took('Digit3')) select(aircraftList[2]);
  if (keyboard.took('KeyR')) select(sim.ac);
  if (keyboard.took('KeyP')) sim.paused = !sim.paused;
  if (keyboard.took('KeyV')) view.toggleMode();
  if (keyboard.took('F3')) hud.toggleDebug();
  if (keyboard.took('KeyH')) hud.toggleHelp();
  if (keyboard.took('KeyJ')) joyPanel.toggle();
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'F3') e.preventDefault();
  if (hud.helpVisible && !['KeyH', 'KeyJ'].includes(e.code)) hud.toggleHelp(false);
});

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;
  gameKeys();
  keyboard.update(sim.input, sim.ac, dt);
  const stick = joystick.update(sim.input);
  sim.advance(dt);
  view.update(sim, sim.loop.alpha, dt);
  hud.update(sim, { joystick: stick });
  joyPanel.update();
  renderer.render(scene, camera);
});
