// The reflector sights' reticles (D33), drawn on a canvas: shared by the 3D reticle's texture (src/render/gunsight.js)
// and the RAF sight drawn square-on in front of the panel (src/ui/reflectorSight.js, D87).
//   GM2 (Barr & Stroud GM 2, RAF): a ring, range bars either side of a central gap, a short post below, a centre dot.
//   Revi (Revi C/12C, Luftwaffe), after the product owner's photograph of the reflected reticle (D89): a fine ring
//   crossed by a horizontal line broken either side of the centre, both halves running a little past the ring; a
//   vertical line broken above the centre and running from the centre down, well past the ring; no centre dot.

export const GLOW = '#ffb45a';

/** Draws a reticle of `style` centred at (cx, cy) with ring radius `ring` (px); `width` the GM 2's line width. */
export function drawReticle(g, cx, cy, ring, style, width = Math.max(1.5, ring * 0.04)) {
  const revi = style === 'Revi';
  const w = revi ? Math.max(1, width * 0.6) : width; // the Revi's lines are finer, as photographed
  g.save();
  g.strokeStyle = GLOW;
  g.fillStyle = GLOW;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.shadowColor = GLOW;
  g.shadowBlur = w * 1.6;
  g.beginPath();
  g.arc(cx, cy, ring, 0, Math.PI * 2);
  g.stroke();
  const line = (x0, y0, x1, y1) => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  };
  if (revi) {
    // Lengths and the gaps measured on the photograph against the ring's radius.
    const gap = ring * 0.19;
    line(cx - ring * 1.22, cy, cx - gap, cy);
    line(cx + gap, cy, cx + ring * 1.22, cy);
    line(cx, cy - ring * 1.2, cx, cy - gap);
    line(cx, cy, cx, cy + ring * 1.4);
  } else {
    const gap = ring * 0.25;
    line(cx - ring, cy, cx - gap, cy);
    line(cx + gap, cy, cx + ring, cy);
    line(cx, cy + ring, cx, cy + ring * 0.45);
    g.beginPath();
    g.arc(cx, cy, width * 1.2, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
