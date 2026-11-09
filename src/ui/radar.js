// The RAF radar display (Phase 7 checkpoint 4, D230): a transparent round screen at the top left with a 360° compass
// ring and the enemy's blips on it (src/core/radarPlot.js). The ring is heading-up (product owner, 9 Nov 2026): it
// turns with the aircraft, so a blip at the top is dead ahead, while its N, E, S, W and degree marks keep their true
// places. A blip gives the bearing only, on the ring; nothing inside it gives height, range or numbers (D224). F4 hides
// and shows it; it shows only in RAF aircraft.

import { relative } from '../core/radarPlot.js';

const SIZE = 180; // px
const R = 70; // px: the ring's radius
const FADE = 1.5; // s: a fresh plot's blips fade in over this
const LABELS = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

export class RadarDisplay {
  constructor(parent = document.body) {
    this.canvas = document.createElement('canvas');
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = SIZE * ratio;
    this.canvas.height = SIZE * ratio;
    this.canvas.style.cssText = `position:fixed;left:12px;top:12px;width:${SIZE}px;height:${SIZE}px;pointer-events:none;display:none;`;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(ratio, ratio);
    parent.appendChild(this.canvas);
    this.enabled = true;
    this.plotTime = 0; // s since the last plot, for the fade-in
  }

  toggle() {
    this.enabled = !this.enabled;
  }

  /**
   * Draws the radar for `plot` (a RadarPlot) at `heading` (degrees). `show` is false on the menus and in Luftwaffe
   * aircraft. `fresh` says a plot was just taken; `dt` (s) runs the fade-in.
   */
  draw(plot, heading, { show, fresh, dt }) {
    const visible = show && this.enabled;
    this.canvas.style.display = visible ? 'block' : 'none';
    if (!visible) return;
    this.plotTime = fresh ? 0 : this.plotTime + dt;
    const c = this.ctx;
    const mid = SIZE / 2;
    c.clearRect(0, 0, SIZE, SIZE);
    c.fillStyle = 'rgba(10, 22, 18, 0.45)';
    c.beginPath();
    c.arc(mid, mid, R + 18, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(190, 235, 200, 0.75)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(mid, mid, R, 0, Math.PI * 2);
    c.stroke();
    // A point on the ring at `deg` clockwise from the top, `r` px out.
    const at = (deg, r) => [mid + r * Math.sin((deg * Math.PI) / 180), mid - r * Math.cos((deg * Math.PI) / 180)];
    c.font = '10px ui-monospace, Menlo, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let b = 0; b < 360; b += 10) {
      const deg = relative(b, heading);
      const long = b % 30 === 0;
      const [x1, y1] = at(deg, R);
      const [x2, y2] = at(deg, R - (long ? 8 : 4));
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
      if (long) {
        const [tx, ty] = at(deg, R + 10);
        c.fillStyle = LABELS[b] ? 'rgba(235, 255, 235, 0.95)' : 'rgba(190, 235, 200, 0.8)';
        c.fillText(LABELS[b] ?? String(b).padStart(3, '0'), tx, ty);
      }
    }
    // The nose mark at the top, and the aircraft in the middle.
    c.fillStyle = 'rgba(235, 255, 235, 0.9)';
    c.beginPath();
    c.moveTo(mid, mid - R + 2);
    c.lineTo(mid - 4, mid - R + 10);
    c.lineTo(mid + 4, mid - R + 10);
    c.fill();
    c.strokeStyle = 'rgba(235, 255, 235, 0.9)';
    c.beginPath();
    c.moveTo(mid, mid - 7);
    c.lineTo(mid, mid + 7);
    c.moveTo(mid - 8, mid - 1);
    c.lineTo(mid + 8, mid - 1);
    c.moveTo(mid - 3, mid + 6);
    c.lineTo(mid + 3, mid + 6);
    c.stroke();
    // The blips, on the ring.
    const alpha = Math.min(1, this.plotTime / FADE);
    c.fillStyle = `rgba(255, 210, 90, ${0.25 + 0.75 * alpha})`;
    for (const { bearing } of plot.plots) {
      const [x, y] = at(relative(bearing, heading), R);
      c.beginPath();
      c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill();
    }
  }
}
