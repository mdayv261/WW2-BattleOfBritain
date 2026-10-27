// Men under parachutes (Phase 6, D80), drawn from sim.jumpers (src/core/parachute.js): a small low-poly figure in his
// side's flying clothes, tumbling in free fall; then the white canopy and its rigging lines swelling open over the
// opening time, swaying gently as he comes down; the canopy collapsing once he is down. Colours and sizes are display
// choices (the canopy is the 24 ft Irvin's 7.3 m across, S42).

import * as THREE from 'three';

const SUIT = { RAF: 0x6b5a3e, Luftwaffe: 0x6e6f58 }; // RAF brown overall, Luftwaffe grey-green (display choice)
const SKIN = 0xd9b48f;
const CANOPY = 0xf0eee6;
const RADIUS = 3.66; // m: the 24 ft canopy
const LINES = 6.2; // m from the harness up to the canopy's rim
const GORES = 12; // rigging lines drawn

/** One man and his parachute, as a group with the man at its origin. */
function buildJumper(side) {
  const group = new THREE.Group();
  const suit = new THREE.MeshLambertMaterial({ color: SUIT[side] ?? SUIT.RAF, flatShading: true });
  const man = new THREE.Group();
  const box = (w, h, d, x, y, z, mat = suit) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    man.add(m);
  };
  box(0.38, 0.6, 0.24, 0, 0, 0); // body
  box(0.13, 0.75, 0.14, 0, -0.68, -0.1); // legs
  box(0.13, 0.75, 0.14, 0, -0.68, 0.1);
  box(0.1, 0.55, 0.1, 0, 0.5, -0.24); // arms up to the risers
  box(0.1, 0.55, 0.1, 0, 0.5, 0.24);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshLambertMaterial({ color: SKIN, flatShading: true }));
  head.position.y = 0.43;
  man.add(head);
  group.add(man);

  // The canopy: a shallow dome, and its rigging lines from the rim down to the harness.
  const canopy = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, GORES, 5, 0, Math.PI * 2, 0, Math.PI / 2.4),
    new THREE.MeshLambertMaterial({ color: CANOPY, side: THREE.DoubleSide, flatShading: true }),
  );
  dome.position.y = LINES - RADIUS * Math.cos(Math.PI / 2.4);
  canopy.add(dome);
  const rim = [];
  for (let i = 0; i < GORES; i += 1) {
    const a = (i / GORES) * Math.PI * 2;
    rim.push(0, 0.35, 0, Math.cos(a) * RADIUS * Math.sin(Math.PI / 2.4), LINES, Math.sin(a) * RADIUS * Math.sin(Math.PI / 2.4));
  }
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(rim, 3)),
    new THREE.LineBasicMaterial({ color: 0xcfcab8 }),
  );
  canopy.add(lines);
  group.add(canopy);
  return { group, man, canopy };
}

export class ParachuteView {
  constructor(scene) {
    this.scene = scene;
    this.drawn = new Map(); // jumper -> its figure
  }

  /** Draws every jumper in `sim.jumpers`, dropping those that have gone. */
  update(sim) {
    const live = new Set(sim.jumpers);
    for (const [j, d] of this.drawn) {
      if (!live.has(j)) {
        this.scene.remove(d.group);
        this.drawn.delete(j);
      }
    }
    for (const j of sim.jumpers) {
      let d = this.drawn.get(j);
      if (!d) {
        d = buildJumper(j.side);
        this.scene.add(d.group);
        this.drawn.set(j, d);
      }
      d.group.position.copy(j.position);
      if (j.open <= 0) {
        // Free fall: tumbling, no canopy yet.
        d.canopy.visible = false;
        d.man.rotation.set(j.time * 2.1, 0, j.time * 1.3);
      } else {
        // The canopy swells open, then sways him gently; once down, it collapses.
        const down = j.landedAt ? Math.min(1, (j.time - j.landedAt) / 2) : 0;
        const swell = 0.15 + 0.85 * j.open;
        d.canopy.visible = down < 1;
        d.canopy.scale.set(swell, swell * (1 - 0.8 * down), swell);
        d.man.rotation.set(0, 0, 0);
        d.group.rotation.set(0.07 * Math.sin(j.time * 1.1) * (1 - down), 0, 0.07 * Math.sin(j.time * 0.8 + 1) * (1 - down));
      }
    }
  }
}
