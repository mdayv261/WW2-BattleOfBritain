// The reflector sights' reticles (D33), drawn on a canvas: shared by the 3D reticle's texture (src/render/gunsight.js)
// and the RAF sight drawn square-on in front of the panel (src/ui/reflectorSight.js, D87).
//   GM2 (Barr & Stroud GM 2, RAF): a ring, range bars either side of a central gap, a short post below, a centre dot.
//   Revi (Revi C/12C, Luftwaffe): a ring crossed by horizontal and vertical lines, a centre dot.

export const GLOW = '#ffb45a';

/** Draws a reticle of `style` centred at (cx, cy) with ring radius `ring` (px); `width` the line width. */
export function drawReticle(g, cx, cy, ring, style, width = Math.max(1.5, ring * 0.04)) {
  g.save();
  g.strokeStyle = GLOW;
  g.fillStyle = GLOW;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.shadowColor = GLOW;
  g.shadowBlur = width * 1.6;
  g.beginPath();
  g.arc(cx, cy, ring, 0, Math.PI * 2);
  g.stroke();
  const line = (x0, y0, x1, y1) => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  };
  const gap = ring * 0.25;
  if (style === 'Revi') {
    line(cx - ring * 1.25, cy, cx - gap * 0.5, cy);
    line(cx + gap * 0.5, cy, cx + ring * 1.25, cy);
    line(cx, cy - ring * 1.25, cx, cy - gap * 0.5);
    line(cx, cy + gap * 0.5, cx, cy + ring * 1.25);
  } else {
    line(cx - ring, cy, cx - gap, cy);
    line(cx + gap, cy, cx + ring, cy);
    line(cx, cy + ring, cx, cy + ring * 0.45);
  }
  g.beginPath();
  g.arc(cx, cy, width * 1.2, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
