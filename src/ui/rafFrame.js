// The Hurricane's and Spitfire's front cockpit frames (D99), drawn square-on with the panel while the pilot looks ahead,
// as the product owner's pictures from the seats show them (#25 and #27, paintings of a Hurricane's cockpit, #27 the
// main guide; #26, a Spitfire's from another game: shape guides only, nothing copied). Both: the coaming's lip along the panel's arched top, and the
// armoured windscreen's frame, two posts rising from the coaming either side of the GM 2 joined over it by a rounded
// arch. The Spitfire (light grey metal): a wide arch, two straight canopy bows running down past the panel's lower
// corners, and short struts from the arch's shoulders to them. The Hurricane (grey-green, as both paintings): a taller
// arch, a wide canopy hoop rounding over the top with its legs running down outside the panel, and level struts from the
// windscreen's shoulders across to it. Sizes are in the RAF panel's picture
// pixels (through its placer, src/ui/rafPanel.js), measured on the pictures against their dials and sights. The 3D
// windscreen, nose and wings are hidden meanwhile (src/render/testView.js) and show again when the pilot looks round.

import { SPITFIRE_PANEL } from './rafPanel.js';

const AXIS = 946; // the GM 2's axis on the panel picture: its centre line
const METAL_DARK = '#61666a';
const EDGE = '#2a2d30';

export const RAF_FRAMES = {
  spitfire: {
    // The windscreen's posts either side of the axis, its arch's top, and the frame's width.
    windscreen: { half: 343, top: -637, width: 70 },
    // Two straight bows: across from the axis at the height `at`, outward `slope` for each pixel down; their width.
    bows: { half: 620, at: -833, slope: 0.62, width: 110 },
    // Struts from the arch's shoulders to the bows: [x on the arch side, y] to the bow at y.
    struts: [{ from: [330, -400], toY: -539 }],
    width: 46, // the struts'
    colour: '#a2a7aa',
    windscreenColour: '#8f9498',
  },
  hurricane: {
    windscreen: { half: 400, top: -960, width: 66 },
    // A hoop: its legs from `foot` half-width at the panel's foot to `half` where its round top springs, the top `top`.
    hoop: { foot: 1100, half: 860, top: -1100, width: 84 },
    // Level struts from the windscreen's posts across to the hoop, at height y, on both sides.
    rails: [{ y: -650 }],
    width: 40, // the struts'
    colour: '#7f8b6e',
    windscreenColour: '#6f7b5f',
  },
};

/** The y of the panel's arched top at picture x (its outline, the coaming's edge). */
export function coamingY(x) {
  const pts = OUTLINE_PX;
  let best = null;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if ((x0 - x) * (x1 - x) <= 0 && x0 !== x1) {
      const y = y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      if (best === null || y < best) best = y;
    }
  }
  return best;
}

// The panel's outline back in picture pixels (it is kept in dial radii from the top centre).
const OUTLINE_PX = SPITFIRE_PANEL.outline.map(([u, v]) => [AXIS + u * 82, 31 + v * 82]);
// The arched part of the outline, from its lower left over the top to its lower right (not along its foot).
const ARCH_PX = OUTLINE_PX.slice(0, OUTLINE_PX.findIndex(([, y], i) => i > 10 && y >= 1000) + 1);

/** The windscreen's centre line as a path (picture pixels): up the left post, over the arch, down the right post. */
export function windscreenPath(frame) {
  const { half, top } = frame.windscreen;
  const spring = top + half; // the arch's centre: its round top springs from here
  const pts = [[AXIS - half, coamingY(AXIS - half)], [AXIS - half, spring]];
  for (let k = 1; k < 24; k += 1) {
    const a = Math.PI + (k / 24) * Math.PI;
    pts.push([AXIS + Math.cos(a) * half, spring + Math.sin(a) * half]);
  }
  pts.push([AXIS + half, spring], [AXIS + half, coamingY(AXIS + half)]);
  return pts;
}

/** A Spitfire bow's x at height y (`side` -1 left, +1 right). */
export const bowX = (bows, side, y) => AXIS + side * (bows.half + bows.slope * (y - bows.at));

/** The Hurricane hoop's centre line (picture pixels): from the left leg's foot up, over the top, down to the right foot. */
export function hoopPath(hoop) {
  const spring = hoop.top + hoop.half;
  const pts = [[AXIS - hoop.foot, 1012], [AXIS - hoop.half, spring]];
  for (let k = 1; k < 32; k += 1) {
    const a = Math.PI + (k / 32) * Math.PI;
    pts.push([AXIS + Math.cos(a) * hoop.half, spring + Math.sin(a) * hoop.half]);
  }
  pts.push([AXIS + hoop.half, spring], [AXIS + hoop.foot, 1012]);
  return pts;
}

/** Where the hoop is at height y on a side (picture x), on its leg or its round top. */
export function hoopX(hoop, side, y) {
  const spring = hoop.top + hoop.half;
  if (y >= spring) return AXIS + side * (hoop.half + ((y - spring) / (1012 - spring)) * (hoop.foot - hoop.half));
  return AXIS + side * Math.sqrt(Math.max(0, hoop.half ** 2 - (spring - y) ** 2));
}

/** Draws the frame (`frame`: RAF_FRAMES entry) on the sight's canvas before the GM 2; `at` is the RAF panel's placer. */
export function drawRafFrame(g, at, frame) {
  const w = (px) => at.len(px);
  if (frame.bows) {
    const { bows } = frame;
    const apexY = bows.at - bows.half / bows.slope; // where the two bows meet, above the view
    for (const side of [-1, 1]) {
      bar(g, at, [[bowX(bows, side, apexY), apexY], [bowX(bows, side, 4000), 4000]], w(bows.width), frame.colour);
      for (const s of frame.struts) {
        bar(g, at, [[AXIS + side * s.from[0], s.from[1]], [bowX(bows, side, s.toY), s.toY]], w(frame.width), frame.colour);
      }
    }
  }
  if (frame.hoop) {
    bar(g, at, hoopPath(frame.hoop), w(frame.hoop.width), frame.colour);
    for (const r of frame.rails) {
      for (const side of [-1, 1]) {
        bar(g, at, [[AXIS + side * frame.windscreen.half, r.y], [hoopX(frame.hoop, side, r.y), r.y]], w(frame.width), frame.colour);
      }
    }
  }
  bar(g, at, windscreenPath(frame), w(frame.windscreen.width), frame.windscreenColour);
  // The coaming's lip along the panel's arched top, with a row of rivets.
  bar(g, at, ARCH_PX, w(44), '#4d5256', { join: 'round' });
  g.fillStyle = '#7b8084';
  for (let i = 2; i < ARCH_PX.length - 2; i += 2) {
    const [x, y] = at.xy(ARCH_PX[i]);
    g.beginPath();
    g.arc(x, y, Math.max(1, w(5)), 0, Math.PI * 2);
    g.fill();
  }
}

/** A frame bar along a path (picture pixels) of width `width` (canvas px): a dark edge, the face, a lit stripe. */
function bar(g, at, pts, width, colour, { join = 'round' } = {}) {
  const path = () => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  };
  g.lineJoin = join;
  g.lineCap = 'butt';
  g.strokeStyle = EDGE;
  g.lineWidth = width + 3;
  path();
  g.stroke();
  g.strokeStyle = colour;
  g.lineWidth = width;
  path();
  g.stroke();
  g.strokeStyle = METAL_DARK;
  g.lineWidth = width * 0.3;
  path();
  g.globalAlpha = 0.35;
  g.stroke();
  g.globalAlpha = 1;
}
