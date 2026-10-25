// Test scene (DECISIONS.md D11, D28): a hazy summer sky, the Phase 2 aerodrome on farmland, and the sea to
// the south. The real world arrives in Phase 4.
// Distances are in metres, with +Y up (DECISIONS.md D5).
import * as THREE from 'three';
import { buildAirfield } from './airfield.js';

const SKY_ZENITH = new THREE.Color(0x4f7fb8);
const SKY_HORIZON = new THREE.Color(0xd9e3ea);
const SEA = 0x3d5f6e;
const HAZE_DENSITY = 0.000045;

/** A large sphere seen from inside, shaded from a pale hazy horizon to a deeper blue overhead. */
function makeSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      zenith: { value: SKY_ZENITH },
      horizon: { value: SKY_HORIZON },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith;
      uniform vec3 horizon;
      varying vec3 vDirection;
      void main() {
        float height = clamp(vDirection.y, 0.0, 1.0);
        gl_FragColor = vec4(mix(horizon, zenith, pow(height, 0.45)), 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90000, 32, 16), material);
  sky.renderOrder = -1;
  sky.name = 'sky';
  return sky;
}

const SEA_TILE = 400; // m: one repeat of the sea texture

/**
 * A mottled sea texture drawn in code. The Phase 1 sea is a flat plane: the pattern lets the eye
 * judge speed and height. The real Channel and coast arrive in Phase 4.
 */
function seaTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = '#3d5f6e';
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 900; i += 1) {
    const shade = 50 + Math.floor(rand() * 40);
    g.fillStyle = `rgba(${shade}, ${shade + 40}, ${shade + 55}, 0.35)`;
    g.fillRect(rand() * size, rand() * size, 4 + rand() * 18, 2 + rand() * 6);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The sea, returned separately so the view can keep it under the camera. Drawn a little below the land
 * (both are at sea level in the physics) so the two never flicker where they overlap. */
function makeSea() {
  const extent = 160000;
  const tex = seaTexture();
  tex.repeat.set(extent / SEA_TILE, extent / SEA_TILE);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(extent, extent), new THREE.MeshLambertMaterial({ map: tex }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.5;
  sea.userData.tile = SEA_TILE;
  return sea;
}

/** Builds the renderer, camera and scene, and keeps them sized to the window. */
export function createScene(container) {
  // A logarithmic depth buffer keeps the cockpit frame (centimetres away) and distant land both sharp.
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(SKY_HORIZON, HAZE_DENSITY);
  scene.add(makeSky());
  const sea = makeSea();
  scene.add(sea);
  scene.add(buildAirfield());

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(-0.4, 0.7, -0.6);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(SKY_HORIZON, SEA, 1.0));

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 200000);
  camera.position.set(0, 300, 0);
  camera.lookAt(0, 250, -3000);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, sea };
}
