// Cockpit frame bars drawn as one welded structure (D104): the bars of the Bf 109's and the RAF fighters' front frames
// (src/ui/bf109Frame.js, src/ui/rafFrame.js). Each bar is a band with a dark outline, a lit edge and a shaded edge, and a
// row of rivets. Drawn in passes, so the joints blend as welded rather than bolted:
// - every bar's outline first, so no outline shows across a joint;
// - then each bar's band, its edges and rivets, in order. A bar that ends on another is listed after it: its band covers
//   the other's edge where they meet, and its own edges and rivets are trimmed back to the other bar's side.

/**
 * Draws the bars. `bars`: [{ pts (canvas px), w (canvas px), trim: [start, end] (canvas px to cut the edges back at each
 * end, half the width of the bar it ends on; 0 for a free end) }], in drawing order. `style`: { band, lit, shade,
 * rivet, outline } colours. `join`: 'miter' (square corners) or 'round'.
 */
export function drawFrames(g, bars, style, { join = 'round' } = {}) {
  g.lineJoin = join;
  g.miterLimit = 10;
  g.lineCap = 'butt';
  g.strokeStyle = style.outline;
  for (const b of bars) {
    g.lineWidth = b.w + 2;
    stroke(g, b.pts);
  }
  for (const b of bars) {
    g.strokeStyle = style.band;
    g.lineWidth = b.w;
    stroke(g, b.pts);
    const pts = trimmed(b.pts, b.trim?.[0] ?? 0, b.trim?.[1] ?? 0);
    if (pts.length < 2) continue;
    const n = litSide(b.pts);
    for (const [k, colour, width] of [[0.42, style.lit, 0.18], [-0.44, style.shade, 0.14]]) {
      g.strokeStyle = colour;
      g.lineWidth = Math.max(1, b.w * width);
      stroke(g, offset(pts, k * b.w * n));
    }
    rivets(g, pts, b.w, style.rivet);
  }
}

function stroke(g, pts) {
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
  g.stroke();
}

/** +1 or -1: the side of the path (its left normal, or the right) whose average faces up or left: the lit side. */
function litSide(pts) {
  let [sx, sy] = [0, 0];
  for (let i = 1; i < pts.length; i += 1) {
    sx += pts[i][1] - pts[i - 1][1];
    sy -= pts[i][0] - pts[i - 1][0];
  }
  return sx + sy > 0 ? -1 : 1;
}

/** The path moved sideways by `d` along its left normal at each point (averaged over the point's two segments). */
function offset(pts, d) {
  return pts.map(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    return [x + ((by - ay) / len) * d, y - ((bx - ax) / len) * d];
  });
}

/** The path with `a` cut from its start and `b` from its end, measured along it. */
export function trimmed(pts, a, b) {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((s, l) => s + l, 0);
  if (a + b >= total) return [];
  const at = (dist) => {
    let d = dist;
    for (let i = 0; i < lens.length; i += 1) {
      if (d <= lens[i] || i === lens.length - 1) {
        const t = lens[i] ? Math.min(1, d / lens[i]) : 0;
        return [i, [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]];
      }
      d -= lens[i];
    }
    return [lens.length - 1, pts[pts.length - 1]];
  };
  const [i0, p0] = at(a);
  const [i1, p1] = at(total - b);
  return [p0, ...pts.slice(i0 + 1, i1 + 1), p1];
}

/** Rivets down the middle of a path, evenly spaced along its whole length. */
function rivets(g, pts, w, colour) {
  g.fillStyle = colour;
  const step = Math.max(w * 2.2, 8);
  let carry = step / 2;
  for (let i = 1; i < pts.length; i += 1) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    let t = carry;
    for (; t < len; t += step) {
      g.beginPath();
      g.arc(ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len, Math.max(1, w * 0.09), 0, Math.PI * 2);
      g.fill();
    }
    carry = t - len;
  }
}
