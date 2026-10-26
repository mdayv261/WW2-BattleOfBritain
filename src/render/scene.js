// The scene (DECISIONS.md D11, D28, D51): a hazy summer sky and the sea, with either the real land of south-east
// England and the Pas-de-Calais (given its terrain) or the Phase 2 aerodrome on level farmland.
// Distances are in metres, with +Y up (DECISIONS.md D5).
import * as THREE from 'three';
import { buildAirfield, buildAerodrome } from './airfield.js';
import { buildTerrainMesh } from './terrainMesh.js';
import { buildTowns } from './towns.js';
import { AIRFIELDS } from '../world/airfields.js';
import { buildClouds } from './clouds.js';
import { sunDirection } from '../world/sun.js';

const SKY_ZENITH = new THREE.Color(0x4f7fb8);
const SKY_HORIZON = new THREE.Color(0xd9e3ea);
const SEA = 0x3d5f6e;
const HAZE_DENSITY = 0.000045;

/**
 * A large sphere seen from inside, shaded from a pale hazy horizon to a deeper blue overhead, with the sun's disc and a
 * glow round it in the direction `sun` (a unit vector, D53).
 */
function makeSky(sun) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      zenith: { value: SKY_ZENITH },
      horizon: { value: SKY_HORIZON },
      sunDir: { value: sun },
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
      uniform vec3 sunDir;
      varying vec3 vDirection;
      void main() {
        vec3 d = normalize(vDirection);
        float height = clamp(d.y, 0.0, 1.0);
        vec3 colour = mix(horizon, zenith, pow(height, 0.45));
        float toSun = max(dot(d, normalize(sunDir)), 0.0);
        colour += vec3(1.0, 0.93, 0.78) * (0.35 * pow(toSun, 12.0) + 0.5 * pow(toSun, 200.0));
        colour = mix(colour, vec3(1.0, 0.98, 0.9), smoothstep(0.9993, 0.9996, toSun)); // the disc
        gl_FragColor = vec4(colour, 1.0);
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

/** The land, towns and airfields of the real map. Returns { group, update(camera) }. */
function buildWorld(terrain) {
  const group = new THREE.Group();
  const land = buildTerrainMesh(terrain);
  const towns = buildTowns(terrain);
  group.add(land.group, towns.group);
  for (const a of AIRFIELDS) {
    const field = buildAerodrome();
    field.position.set(a.x, terrain.fieldLevel(a.name), a.z);
    group.add(field);
  }
  return {
    group,
    update: (camera) => {
      land.update(camera);
      towns.update(camera);
    },
  };
}

/**
 * Builds the renderer, camera and scene, and keeps them sized to the window. With a terrain (src/world/terrain.js) the
 * real map is drawn; `update(camera)` then picks the land's detail for the camera each frame.
 */
export function createScene(container, terrain = null) {
  // A logarithmic depth buffer keeps the cockpit frame (centimetres away) and distant land both sharp.
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(SKY_HORIZON, HAZE_DENSITY);
  const sunDir = new THREE.Vector3(...Object.values(sunDirection()));
  scene.add(makeSky(sunDir));
  const sea = makeSea();
  scene.add(sea);
  let update = () => {};
  if (terrain) {
    const world = buildWorld(terrain);
    scene.add(world.group, buildClouds());
    update = world.update;
  } else {
    scene.add(buildAirfield());
  }

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.copy(sunDir); // a directional light shines from its position toward the origin
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

  return { renderer, scene, camera, sea, update };
}
