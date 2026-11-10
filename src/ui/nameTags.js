// The other players' names over their aircraft in a match (Phase 9, D245): everyone within 2 km, team-mates in white and
// enemies in red (the product owner, 10 Nov 2026), with the distance. Drawn on the page over the 3D view, just above
// each aircraft as the camera sees it.

import { Vector3 } from 'three';
import { NAME_TAG_RANGE } from '../mp/netConfig.js';

const STYLE = 'position:fixed;z-index:11;transform:translate(-50%,-100%);font:bold 12px/1.2 Arial,sans-serif;'
  + 'text-shadow:0 0 3px #000,0 0 2px #000;white-space:nowrap;pointer-events:none;display:none';
const COLOURS = { mate: '#ffffff', enemy: '#ff4a3a' };
const LIFT = 4; // m above the aircraft's centre
const _p = new Vector3();

/** Where a world point is on the screen: { x, y } in pixels, or null behind the camera or off the screen. */
export function screenPoint(camera, point, width, height) {
  _p.copy(point).project(camera);
  if (_p.z > 1 || _p.z < -1 || Math.abs(_p.x) > 1.1 || Math.abs(_p.y) > 1.1) return null;
  return { x: ((_p.x + 1) / 2) * width, y: ((1 - _p.y) / 2) * height };
}

/** "Max 1.2 km", "Ann 450 m". */
export const tagText = (name, distance) => `${name} ${distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance / 10) * 10} m`}`;

export class NameTags {
  constructor(parent = document.body) {
    this.parent = parent;
    this.tags = [];
  }

  /**
   * camera; from: your aircraft's position; list: [{ craft, name, team }] (the others); team: yours; show: false hides
   * them all.
   */
  update(camera, from, list, team, show, width = window.innerWidth, height = window.innerHeight) {
    let n = 0;
    if (show) {
      for (const { craft, name, team: theirs } of list) {
        const at = craft.plane.body.position;
        const distance = at.distanceTo(from);
        if (distance > NAME_TAG_RANGE) continue;
        const spot = screenPoint(camera, _p.copy(at).setY(at.y + LIFT), width, height);
        if (!spot) continue;
        const tag = this.tag(n);
        n += 1;
        const text = tagText(name, distance);
        if (tag.textContent !== text) tag.textContent = text;
        tag.style.color = theirs === team ? COLOURS.mate : COLOURS.enemy;
        tag.style.left = `${spot.x}px`;
        tag.style.top = `${spot.y}px`;
        tag.style.display = 'block';
      }
    }
    for (let k = n; k < this.tags.length; k += 1) this.tags[k].style.display = 'none';
  }

  tag(k) {
    if (!this.tags[k]) {
      const t = document.createElement('div');
      t.style.cssText = STYLE;
      this.parent.appendChild(t);
      this.tags[k] = t;
    }
    return this.tags[k];
  }
}
