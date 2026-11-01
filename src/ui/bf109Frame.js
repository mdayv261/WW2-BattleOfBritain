// The Bf 109's front cockpit frame (D90), drawn square-on with the panel while the pilot looks ahead, as the product
// owner's picture of the front view shows it (#24, a shape guide only; their museum photograph from the seat, #16,
// shows the same framing): the coaming's curved lip arching over the top of the panel above the clock; the two front
// windscreen posts rising from its ends, nearly upright and leaning a little outward; and the cockpit's side frames
// running diagonally down from the posts' feet past the panel's wings to the foot of the view, the cockpit's dark
// interior below them round the panel. Sizes are in picture pixels of the restored panel (#17, through the panel's
// placer, src/ui/bf109Panel.js), measured on #24 against its dials. The 3D windscreen, nose and wings are hidden
// meanwhile (src/render/testView.js) and show again when the pilot looks round.

export const FRAME = {
  // The coaming's lip: the middle of the band follows an ellipse; its inner edge runs over the upper plate's top above
  // the clock and down to the posts' feet.
  arch: { cx: 583, cy: 343.2, a: 295, b: 133.2, thick: 30 },
  // The posts' feet at the arch's ends, their width, and how far they lean outward for each pixel up.
  posts: { feet: [[333, 290], [833, 290]], width: 42, lean: 0.114 },
  // The side frames: from the posts' feet, outward this many pixels for each pixel down; their width.
  sides: { slope: 1.156, width: 46 },
};
const FAR = 4000; // picture pixels: far enough to run off any screen
const INTERIOR = '#2b2e31';

/**
 * The arch's end angles (rad, canvas ellipse angles: 0 to the right, increasing clockwise), where its inner edge meets
 * the posts' feet.
 */
export function archAngles() {
  const { cx, a, thick } = FRAME.arch;
  const t = Math.acos((FRAME.posts.feet[1][0] - cx) / (a - thick / 2));
  return [Math.PI + t, 2 * Math.PI - t];
}

/** A point on the arch at angle t (picture pixels): on its middle line, or `inset` pixels inside it (its inner edge). */
export const archPoint = (t, inset = 0) => [
  FRAME.arch.cx + (FRAME.arch.a - inset) * Math.cos(t), FRAME.arch.cy + (FRAME.arch.b - inset) * Math.sin(t),
];

/** The side frame's line from a post's foot (`side` -1 left, +1 right) at picture height y. */
export const sideX = (side, y) => FRAME.posts.feet[side < 0 ? 0 : 1][0] + side * FRAME.sides.slope * (y - FRAME.posts.feet[0][1]);
/** A post's middle line (`side` -1 left, +1 right) at picture height y (above its foot). */
export const postX = (side, y) => FRAME.posts.feet[side < 0 ? 0 : 1][0] + side * FRAME.posts.lean * (FRAME.posts.feet[0][1] - y);

/**
 * The cockpit's interior round the panel, below the coaming's lip and between the side frames: drawn on the panel's
 * canvas before its plates. `at` is the panel's placer.
 */
export function drawInterior(g, at) {
  const [t0, t1] = archAngles();
  const y0 = FRAME.posts.feet[0][1];
  g.fillStyle = INTERIOR;
  g.beginPath();
  for (let k = 0; k <= 24; k += 1) {
    const p = at.xy(archPoint(t0 + ((t1 - t0) * k) / 24, FRAME.arch.thick / 2)); // along the lip's inner edge
    if (k) g.lineTo(...p);
    else g.moveTo(...p);
  }
  g.lineTo(...at.xy([sideX(1, y0 + FAR), y0 + FAR]));
  g.lineTo(...at.xy([sideX(-1, y0 + FAR), y0 + FAR]));
  g.closePath();
  g.fill();
}

/** The side frames, the posts and the coaming's lip, on the sight's canvas before the Revi. `at` is the panel's placer. */
export function drawFrontFrame(g, at) {
  const { feet } = FRAME.posts;
  const y0 = feet[0][1];
  for (const side of [-1, 1]) {
    // Side frame: a light outer bar with a darker inner band and a dark edge.
    const a = at.xy([sideX(side, y0), y0]);
    const b = at.xy([sideX(side, y0 + FAR), y0 + FAR]);
    bar(g, a, b, at.len(FRAME.sides.width), '#868b90', '#5a5f63');
    // Post: metal grey, lit from the left.
    const top = at.xy([postX(side, y0 - FAR), y0 - FAR]);
    bar(g, at.xy(feet[side < 0 ? 0 : 1]), top, at.len(FRAME.posts.width), '#7b8085', '#55595d');
  }
  // The coaming's lip, over the posts' feet: a dark band with a lighter top edge and a row of rivets.
  const { cx, cy, a, b, thick } = FRAME.arch;
  const [t0, t1] = archAngles();
  const [ex, ey] = at.xy([cx, cy]);
  const scale = at.len(1);
  g.strokeStyle = '#3a3e42';
  g.lineWidth = thick * scale;
  g.beginPath();
  g.ellipse(ex, ey, a * scale, b * scale, 0, t0, t1);
  g.stroke();
  g.strokeStyle = '#6f7479';
  g.lineWidth = Math.max(1, thick * scale * 0.18);
  g.beginPath();
  g.ellipse(ex, ey, (a + thick * 0.42) * scale, (b + thick * 0.42) * scale, 0, t0, t1);
  g.stroke();
  g.strokeStyle = '#141617';
  g.lineWidth = Math.max(1, thick * scale * 0.12);
  g.beginPath();
  g.ellipse(ex, ey, (a - thick * 0.46) * scale, (b - thick * 0.46) * scale, 0, t0, t1);
  g.stroke();
  g.fillStyle = '#5c6166';
  for (let k = 1; k < 18; k += 1) {
    const t = t0 + ((t1 - t0) * k) / 18;
    g.beginPath();
    g.arc(ex + a * scale * Math.cos(t), ey + b * scale * Math.sin(t), Math.max(1, thick * scale * 0.09), 0, Math.PI * 2);
    g.fill();
  }
}

/** A frame bar from point a to point b (canvas px) of width w: the `light` face with a `dark` band along its inner half. */
function bar(g, a, b, w, light, dark) {
  g.lineCap = 'butt';
  g.strokeStyle = '#1e2022';
  g.lineWidth = w + 2;
  line(g, a, b);
  g.strokeStyle = light;
  g.lineWidth = w;
  line(g, a, b);
  // The darker band on the side away from the light (the bar's right half, offset across it).
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [(-dy / len) * w * 0.25, (dx / len) * w * 0.25];
  g.strokeStyle = dark;
  g.lineWidth = w * 0.45;
  line(g, [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny]);
}

function line(g, a, b) {
  g.beginPath();
  g.moveTo(...a);
  g.lineTo(...b);
  g.stroke();
}
