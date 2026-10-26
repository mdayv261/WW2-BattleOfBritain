// Fair-weather cumulus (D53): low-polygon clouds, each a cluster of flattened, flat-shaded blobs, scattered over the
// map at the same places every time (seeded). The layer's base is about 1,000-1,500 m and the tops reach about 2,500 m.
// The clouds fade out close to the camera, so flying into one is a soft white-out rather than a hard edge.

import * as THREE from 'three';
import { cloudField } from '../world/clouds.js';

const FADE_NEAR = 120; // m: fully transparent this close to the camera
const FADE_FAR = 700; // m: fully solid from here

/** All the clouds as one instanced mesh of blobs. */
export function buildClouds() {
  const blobs = cloudField();
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x3c4148, flatShading: true, transparent: true });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying float vCamDistance;\n${shader.vertexShader}`
      .replace('#include <project_vertex>', '#include <project_vertex>\nvCamDistance = length(mvPosition.xyz);');
    shader.fragmentShader = `varying float vCamDistance;\n${shader.fragmentShader}`
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\ngl_FragColor.a *= smoothstep(${FADE_NEAR.toFixed(1)}, ${FADE_FAR.toFixed(1)}, vCamDistance);`);
  };
  const mesh = new THREE.InstancedMesh(geometry, material, blobs.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  blobs.forEach((b, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.turn);
    m.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.rx, b.ry, b.rz));
    mesh.setMatrixAt(i, m);
  });
  mesh.computeBoundingSphere();
  mesh.name = 'clouds';
  return mesh;
}
