// The rear gunner's screen (Phase 7 checkpoint 7, D234): the MG 15's ring-and-bead sight (S25 para. 20) in the middle
// of the view, which looks along the gun (src/render/cameras.js 'gunner'), and a line on the gun and the aircraft: rounds
// in the drum and drums left (or "changing drum"), height and speed in the Luftwaffe's units, and how to go back to the
// pilot's seat. The ring's size is a display estimate.

import { altitudeText, speedText } from './units.js';

const RING = 2.5 * (Math.PI / 180); // rad: the ring's radius as seen through the sight (estimate)
const COLOUR = 'rgba(20, 20, 20, 0.85)';

export class GunnerHud {
  constructor(parent = document.body) {
    this.sight = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.sight.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;display:none;';
    this.ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.ring.setAttribute('fill', 'none');
    this.ring.setAttribute('stroke', COLOUR);
    this.ring.setAttribute('stroke-width', '3');
    this.bead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.bead.setAttribute('fill', COLOUR);
    this.bead.setAttribute('r', '4');
    this.cross = [0, 1, 2, 3].map(() => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('stroke', COLOUR);
      l.setAttribute('stroke-width', '2');
      this.sight.appendChild(l);
      return l;
    });
    this.sight.append(this.ring, this.bead);
    parent.appendChild(this.sight);
    this.line = document.createElement('div');
    this.line.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:none;pointer-events:none;'
      + 'background:rgba(20,28,36,0.72);color:#e8edf2;font:14px/1.5 ui-monospace,Menlo,monospace;padding:8px 14px;'
      + 'border-radius:6px;white-space:pre;text-align:center;';
    parent.appendChild(this.line);
  }

  /** Shows the sight and the line while the player is on the gun (`show`), for a camera of `fov` degrees. */
  update(sim, show, fov) {
    this.sight.style.display = show ? 'block' : 'none';
    this.line.style.display = show ? 'block' : 'none';
    if (!show) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const r = ((h / 2) / Math.tan((fov * Math.PI) / 360)) * Math.tan(RING);
    for (const c of [this.ring, this.bead]) {
      c.setAttribute('cx', String(w / 2));
      c.setAttribute('cy', String(h / 2));
    }
    this.ring.setAttribute('r', String(r));
    // The ring's spokes, from the ring to a little short of the bead.
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy], i) => {
      const l = this.cross[i];
      l.setAttribute('x1', String(w / 2 + dx * r));
      l.setAttribute('y1', String(h / 2 + dy * r));
      l.setAttribute('x2', String(w / 2 + dx * r * 0.35));
      l.setAttribute('y2', String(h / 2 + dy * r * 0.35));
    });
    this.line.textContent = gunnerText(sim);
  }
}

/** The gunner's line: "MG 15  42 in the drum, 9 drums left\nHeight 4.000 m   390 km/h\nTab: the pilot's seat". */
export function gunnerText(sim) {
  const gun = sim.player.gunnery?.mounts.find((m) => !m.spec.fixed);
  if (!gun) return '';
  const changing = gun.changingUntil !== null && sim.plane.time < gun.changingUntil;
  const ammo = changing ? 'changing drum' : gun.rounds > 0 ? `${gun.rounds} in the drum` : 'drum empty';
  const left = `${gun.drums} ${gun.drums === 1 ? 'drum' : 'drums'} left`;
  const { ac, plane } = sim;
  const flying = `Height ${altitudeText(ac, plane.last?.altitude ?? plane.body.position.y)}   ${speedText(ac, plane.last?.eas ?? 0)}`;
  return `MG 15   ${ammo}, ${left}\n${flying}\nTab: back to the pilot's seat`;
}
