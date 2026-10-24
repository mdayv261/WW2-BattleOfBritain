// Entry point. Phase 0: draws the placeholder scene and runs the fixed-step loop with nothing in it
// yet, so the loop and the renderer are proven together before any physics exists.
import { createScene } from './render/scene.js';
import { FixedStepLoop } from './core/fixedStepLoop.js';

const { renderer, scene, camera } = createScene(document.getElementById('app'));
const loop = new FixedStepLoop({ step: () => {} });

let lastTime = performance.now();
renderer.setAnimationLoop((now) => {
  loop.advance((now - lastTime) / 1000);
  lastTime = now;
  renderer.render(scene, camera);
});
