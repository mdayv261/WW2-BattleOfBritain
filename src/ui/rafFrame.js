// The Hurricane's and Spitfire's front cockpit frames (D99, D100), drawn square-on with the panel while the pilot looks
// ahead. Shape guides only, nothing copied: the product owner's museum photograph of a Hurricane cockpit from the front
// (#28), and a Spitfire's cockpit from another game (#26).
//   Spitfire (light grey metal, #26): the coaming's lip along the panel's arched top; the armoured windscreen's two posts
//   either side of the GM 2 joined by a wide rounded arch; two straight canopy bows running down past the panel's lower
//   corners; short struts from the arch's shoulders to them.
//   Hurricane (#28, D100): the grey-green outer windscreen frame, upright legs on the coaming's ends and an elliptical
//   crown; the lighter armoured windscreen inside it, posts on the coaming and a rounded top; the broad coaming lip
//   curving across over the panel, highest over the sight; and the fuselage sides, the cockpit's sills sloping from the
//   coaming's ends out to the edges of the view with the side walls below them and the dark interior under the coaming
//   (`drawRafInterior`, on the panel's canvas before the panel).
// Sizes are in the RAF panel's picture pixels (through its placer, src/ui/rafPanel.js), measured on the pictures against
// their dials and sights. The 3D windscreen, nose and wings are hidden meanwhile (src/render/testView.js) and show again
// when the pilot looks round.

import { SPITFIRE_PANEL } from './rafPanel.js';

const AXIS = 946; // the GM 2's axis on the panel picture: its centre line
const METAL_DARK = '#61666a';
const EDGE = '#2a2d30';
const FAR = 4000; // picture pixels: far enough to run off any screen

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
    // The armoured windscreen: posts either side of the axis on the coaming, its rounded top, its width.
    windscreen: { half: 416, top: -1033, width: 100 },
    // The outer windscreen frame: legs from `foot` (half-width at the coaming's ends) to `half` where the elliptical
    // crown springs at `spring`, its top `top`.
    outer: { foot: 815, half: 774, spring: -628, top: -1340, width: 96 },
    // The coaming: an elliptical band through its ends (half-width `half` at height `ends`) and its highest point `top`
    // (the band's middle line), `width` thick.
    coaming: { half: 815, ends: 227, top: -10, width: 112 },
    // The sills: from the coaming's ends outward `run` and down `drop` for each step; the band's width. The side walls'
    // inner edge runs from the coaming's end down to `wall` across at the panel's foot.
    sills: { run: 909, drop: 450, width: 135, wall: -53 },
    colour: '#a3a690',
    windscreenColour: '#b8ad9c',
    coamingColour: '#c9c8b8',
    sillColour: '#b4b9a6',
    wallColour: '#7f8774',
    interiorColour: '#2d2f2c',
  },
};

// The panel's outline back in picture pixels (kept in dial radii from the top centre), worked out when first used.
let outline = null;
const outlinePx = () => (outline ??= SPITFIRE_PANEL.outline.map(([u, v]) => [AXIS + u * 82, 31 + v * 82]));
// The arched part of the outline, from its lower left over the top to its lower right (not along its foot).
const archPx = () => outlinePx().slice(0, outlinePx().findIndex(([, y], i) => i > 10 && y >= 1000) + 1);

/** The y of the panel's arched top at picture x (its outline). */
export function panelTopY(x) {
  const pts = outlinePx();
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

/** The Hurricane coaming's middle line at picture x (an ellipse through its ends and its highest point). */
export function coamingMid(coaming, x) {
  const t = Math.max(-1, Math.min(1, (x - AXIS) / coaming.half));
  return coaming.ends - (coaming.ends - coaming.top) * Math.sqrt(1 - t * t);
}

/** Where a windscreen's posts stand: on the Hurricane's coaming band's top edge, or on the Spitfire's panel top. */
export function coamingY(x, frame = RAF_FRAMES.spitfire) {
  return frame.coaming ? coamingMid(frame.coaming, x) - frame.coaming.width / 2 : panelTopY(x);
}

/** The armoured windscreen's centre line (picture pixels): up the left post, over the round top, down the right post. */
export function windscreenPath(frame) {
  const { half, top } = frame.windscreen;
  const spring = top + half; // the round top springs from here
  const pts = [[AXIS - half, coamingY(AXIS - half, frame)], [AXIS - half, spring]];
  for (let k = 1; k < 24; k += 1) {
    const a = Math.PI + (k / 24) * Math.PI;
    pts.push([AXIS + Math.cos(a) * half, spring + Math.sin(a) * half]);
  }
  pts.push([AXIS + half, spring], [AXIS + half, coamingY(AXIS + half, frame)]);
  return pts;
}

/** The Hurricane's outer windscreen frame (picture pixels): up the left leg from the coaming's end, over the crown, down. */
export function outerPath(frame) {
  const { foot, half, spring, top } = frame.outer;
  const pts = [[AXIS - foot, frame.coaming.ends], [AXIS - half, spring]];
  for (let k = 1; k < 32; k += 1) {
    const a = Math.PI + (k / 32) * Math.PI;
    pts.push([AXIS + Math.cos(a) * half, spring + Math.sin(a) * (spring - top)]);
  }
  pts.push([AXIS + half, spring], [AXIS + foot, frame.coaming.ends]);
  return pts;
}

/** A Spitfire bow's x at height y (`side` -1 left, +1 right). */
export const bowX = (bows, side, y) => AXIS + side * (bows.half + bows.slope * (y - bows.at));

/** A Hurricane sill's point at height y (`side` -1 left, +1 right), from the coaming's end outward and down. */
export function sillX(frame, side, y) {
  const { sills, coaming } = frame;
  return AXIS + side * (coaming.half + ((y - coaming.ends) / sills.drop) * sills.run);
}

/** Draws the frame (`frame`: RAF_FRAMES entry) on the sight's canvas before the GM 2; `at` is the RAF panel's placer. */
export function drawRafFrame(g, at, frame) {
  const w = (px) => at.len(px);
  if (frame.bows) {
    const { bows } = frame;
    const apexY = bows.at - bows.half / bows.slope; // where the two bows meet, above the view
    for (const side of [-1, 1]) {
      bar(g, at, [[bowX(bows, side, apexY), apexY], [bowX(bows, side, FAR), FAR]], w(bows.width), frame.colour);
      for (const s of frame.struts) {
        bar(g, at, [[AXIS + side * s.from[0], s.from[1]], [bowX(bows, side, s.toY), s.toY]], w(frame.width), frame.colour);
      }
    }
  }
  if (frame.outer) bar(g, at, outerPath(frame), w(frame.outer.width), frame.colour);
  bar(g, at, windscreenPath(frame), w(frame.windscreen.width), frame.windscreenColour);
  if (frame.coaming) {
    // The Hurricane's broad coaming lip, in front of the frames' feet.
    const { coaming } = frame;
    const pts = [];
    for (let k = 0; k <= 40; k += 1) {
      const x = AXIS - coaming.half + (k / 40) * 2 * coaming.half;
      pts.push([x, coamingMid(coaming, x)]);
    }
    bar(g, at, pts, w(coaming.width), frame.coamingColour);
    return;
  }
  // The Spitfire's coaming lip along the panel's arched top, with a row of rivets.
  const arch = archPx();
  bar(g, at, arch, w(44), '#4d5256');
  g.fillStyle = '#7b8084';
  for (let i = 2; i < arch.length - 2; i += 2) {
    const [x, y] = at.xy(arch[i]);
    g.beginPath();
    g.arc(x, y, Math.max(1, w(5)), 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * The Hurricane's fuselage sides and cockpit interior (D100), on the panel's canvas before the panel: the dark interior
 * under the coaming, the side walls from the coaming's ends outward, and the pale sills along their tops. `at` is the
 * RAF panel's placer; frames without sills draw nothing.
 */
export function drawRafInterior(g, at, frame) {
  if (!frame?.sills) return;
  const { coaming, sills } = frame;
  const fill = (pts, colour) => {
    g.fillStyle = colour;
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
    g.closePath();
    g.fill();
  };
  const wallAt = (side, y) => AXIS + side * (coaming.half + ((y - coaming.ends) / (1012 - coaming.ends)) * (Math.abs(sills.wall - AXIS) - coaming.half));
  const under = [];
  for (let k = 0; k <= 40; k += 1) {
    const x = AXIS - coaming.half + (k / 40) * 2 * coaming.half;
    under.push([x, coamingMid(coaming, x)]);
  }
  fill([...under, [wallAt(1, FAR), FAR], [wallAt(-1, FAR), FAR]], frame.interiorColour);
  for (const side of [-1, 1]) {
    const end = [AXIS + side * coaming.half, coaming.ends];
    fill([end, [sillX(frame, side, FAR), FAR], [wallAt(side, FAR), FAR]], frame.wallColour);
    bar(g, at, [end, [sillX(frame, side, FAR), FAR]], at.len(sills.width), frame.sillColour);
  }
}

/** A frame bar along a path (picture pixels) of width `width` (canvas px): a dark edge, the face, a lit stripe. */
function bar(g, at, pts, width, colour) {
  const path = () => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
  };
  g.lineJoin = 'round';
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
