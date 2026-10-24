// Phase 0 placeholder scene (DECISIONS.md D11): a hazy summer sky over the Channel, with a strip of
// chalk cliff for scale. It proves the toolchain end to end; the real world arrives in Phase 4.
// Distances are in metres, with +Y up (DECISIONS.md D5).
import * as THREE from 'three';

const SKY_ZENITH = new THREE.Color(0x4f7fb8);
const SKY_HORIZON = new THREE.Color(0xd9e3ea);
const SEA = 0x3d5f6e;
const CLIFF = 0xe8e4d6;
const DOWNLAND = 0x7d9a5a;
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
  return sky;
}

/** The sea, plus a line of white cliffs topped with downland 3 km ahead of the camera. */
function makeCoast() {
  const coast = new THREE.Group();

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(160000, 160000),
    new THREE.MeshLambertMaterial({ color: SEA }),
  );
  sea.rotation.x = -Math.PI / 2;
  coast.add(sea);

  const cliffHeight = 100;
  const cliff = new THREE.Mesh(
    new THREE.BoxGeometry(12000, cliffHeight, 400),
    new THREE.MeshLambertMaterial({ color: CLIFF }),
  );
  cliff.position.set(0, cliffHeight / 2, -3000);
  coast.add(cliff);

  const land = new THREE.Mesh(
    new THREE.BoxGeometry(12000, 2, 8000),
    new THREE.MeshLambertMaterial({ color: DOWNLAND }),
  );
  land.position.set(0, cliffHeight + 1, -3000 - 200 - 4000);
  coast.add(land);

  return coast;
}

/** Builds the renderer, camera and scene, and keeps them sized to the window. */
export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(SKY_HORIZON, HAZE_DENSITY);
  scene.add(makeSky());
  scene.add(makeCoast());

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(-0.4, 0.7, -0.6);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(SKY_HORIZON, SEA, 1.0));

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 200000);
  camera.position.set(0, 300, 0);
  camera.lookAt(0, 250, -3000);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera };
}
