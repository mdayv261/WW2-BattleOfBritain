// The enemy pointers' strip (D235): small red arrowheads along the top of the screen, one per enemy within 5 km
// (src/core/enemyPointers.js). The strip's middle is dead ahead and its ends dead astern (left end behind-left); a mark
// pointing up is above the player, down below him; the nearest is drawn larger. Faint ticks mark dead ahead and 90°
// either side. Clear of the radar at the top left.

const NS = 'http://www.w3.org/2000/svg';
const LEFT = 210; // px: the strip starts right of the radar (180 px at the top left)
const RIGHT = 24; // px from the right edge
const TOP = 2; // px: above the message line (24 px down)
const HEIGHT = 20; // px
const SIZE = { usual: 7, nearest: 10 }; // px: an arrowhead's half width

const node = (tag, attrs = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

export class EnemyPointers {
  constructor(parent = document.body) {
    this.svg = node('svg');
    this.svg.style.cssText = `position:fixed;left:${LEFT}px;right:${RIGHT}px;top:${TOP}px;height:${HEIGHT}px;pointer-events:none;display:none;overflow:visible;`;
    this.ticks = [0.5, 0, -0.5].map((x) => this.svg.appendChild(node('line', {
      stroke: 'rgba(255,255,255,0.55)', 'stroke-width': x === 0 ? 2 : 1,
    })));
    this.marks = node('g');
    this.svg.appendChild(this.marks);
    parent.appendChild(this.svg);
  }

  /** Draws `pointers` (from enemyPointers), or hides the strip (`show` false). */
  update(pointers, show) {
    this.svg.style.display = show ? 'block' : 'none';
    if (!show) return;
    const width = Math.max(100, window.innerWidth - LEFT - RIGHT);
    const at = (x) => (x + 1) * (width / 2);
    this.ticks.forEach((t, i) => {
      const x = at([0.5, 0, -0.5][i]);
      const long = i === 1;
      t.setAttribute('x1', x);
      t.setAttribute('x2', x);
      t.setAttribute('y1', long ? 0 : HEIGHT * 0.3);
      t.setAttribute('y2', long ? HEIGHT : HEIGHT * 0.7);
    });
    this.marks.replaceChildren(...pointers.map((p) => {
      const s = p.nearest ? SIZE.nearest : SIZE.usual;
      const x = at(p.x);
      const mid = HEIGHT / 2;
      // Up for above (the point at the top), down for below.
      const tip = p.above ? mid - s : mid + s;
      const base = p.above ? mid + s * 0.6 : mid - s * 0.6;
      return node('polygon', {
        points: `${x},${tip} ${x - s},${base} ${x + s},${base}`,
        fill: '#e3261c', stroke: 'rgba(30,0,0,0.85)', 'stroke-width': 1.2,
      });
    }));
  }
}
