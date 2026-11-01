// The Hurricane's and Spitfire's front cockpit frames (D99, D100), drawn square-on with the panel while the pilot looks
// ahead. Shape guides only, nothing copied: the product owner's museum photograph of a Hurricane cockpit from the front
// (#28), and a Spitfire's cockpit from another game (#26).
//   Spitfire (light grey metal, #26): the coaming's lip along the panel's arched top; the armoured windscreen's two posts
//   either side of the GM 2 joined by a wide rounded arch; two straight canopy bows running down past the panel's lower
//   corners; short struts from the arch's shoulders to them.
//   Hurricane (#28, D100, refined by the product owner in D101): the thin grey-green outer windscreen frame, legs
//   standing on the coaming and leaning in about 15° to a short elliptical crown; the lighter armoured windscreen inside it, posts on the coaming and a
//   rounded top; horizontal frames halfway up the side panes between them; the coaming wrapping close round the panel's
//   arched top; and the fuselage sides, the cockpit's sills angling in from the legs' feet at the Bf 109's slope, with the
//   side walls below them and the dark interior beside the panel (`drawRafInterior`, on the panel's canvas before the
//   panel). The guns' line stands at RAF_AIM of the screen so the GM 2's glass clears the coaming.
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
    // The armoured windscreen: posts either side of the axis on the coaming, its rounded top, its width (D101: lower,
    // narrower and thinner than D100's).
    windscreen: { half: 336, top: -687, width: 60 },
    // The outer windscreen frame: legs standing on the coaming `foot` either side of the axis, leaning in about 15° to
    // `half` where the elliptical crown springs at `spring`; its top `top` (the crown shortened at the product owner's
    // request, D101).
    outer: { foot: 774, half: 512, spring: -463, top: -820, width: 56 },
    // Horizontal frames halfway up the side panes, from the armoured posts across to the outer legs, at height y.
    rails: [{ y: -205 }],
    railWidth: 34,
    // The coaming: a band along the panel's arched outline, just outside it (`overlap` over its edge), between the outer
    // frame's legs.
    coaming: { width: 56, overlap: 6 },
    // The sills: from the outer legs' feet outward `slope` for each pixel down (the Bf 109's side frames', D90); the
    // band's width. The side walls' inner edge leaves the feet at `wall` across for each pixel down.
    sills: { slope: 1.156, width: 70, wall: 0.45 },
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

/** Where the guns' line stands in each RAF fighter's cockpit, as a fraction of the screen's height from its top. */
export const RAF_AIM = { hurricane: 0.45 }; // raised so the GM 2's glass clears the coaming (D101)

/** The panel outline's outward normal at picture x on its arched top (unit vector, away from the panel). */
function outlineNormal(x) {
  const pts = archPx();
  let seg = null;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if ((x0 - x) * (x1 - x) <= 0 && x0 !== x1 && (!seg || Math.min(y0, y1) < seg[1])) seg = [i, Math.min(y0, y1)];
  }
  const [x0, y0] = pts[seg[0] - 1];
  const [x1, y1] = pts[seg[0]];
  const len = Math.hypot(x1 - x0, y1 - y0);
  let [nx, ny] = [(y1 - y0) / len, -(x1 - x0) / len];
  if (ny > 0) [nx, ny] = [-nx, -ny]; // the arch's outside faces up
  return [nx, ny];
}

/** A point of the Hurricane's coaming band at picture x: its middle line (`edge` 0) or top edge (`edge` 1). */
export function coamingPoint(frame, x, edge = 0) {
  const { width, overlap } = frame.coaming;
  const [nx, ny] = outlineNormal(x);
  const d = width / 2 - overlap + edge * (width / 2);
  return [x + nx * d, panelTopY(x) + ny * d];
}

/** Where a windscreen's posts stand: on the Hurricane's coaming band's top edge, or on the Spitfire's panel top. */
export function coamingY(x, frame = RAF_FRAMES.spitfire) {
  return frame.coaming ? coamingPoint(frame, x, 1)[1] : panelTopY(x);
}

/** The Hurricane's outer legs' feet (picture pixels, `side` -1 left, +1 right): on the coaming's top edge. */
export const legFoot = (frame, side) => [AXIS + side * frame.outer.foot, coamingY(AXIS + side * frame.outer.foot, frame)];

/** The Hurricane's outer leg's x at height y (between its foot and the crown's springing). */
export function legX(frame, side, y) {
  const [fx, fy] = legFoot(frame, side);
  const t = (fy - y) / (fy - frame.outer.spring);
  return fx + (AXIS + side * frame.outer.half - fx) * t;
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

/** The Hurricane's outer windscreen frame (picture pixels): up the left leg from the coaming, over the crown, down. */
export function outerPath(frame) {
  const { half, spring, top } = frame.outer;
  const pts = [legFoot(frame, -1), [AXIS - half, spring]];
  for (let k = 1; k < 32; k += 1) {
    const a = Math.PI + (k / 32) * Math.PI;
    pts.push([AXIS + Math.cos(a) * half, spring + Math.sin(a) * (spring - top)]);
  }
  pts.push([AXIS + half, spring], legFoot(frame, 1));
  return pts;
}

/** A Spitfire bow's x at height y (`side` -1 left, +1 right). */
export const bowX = (bows, side, y) => AXIS + side * (bows.half + bows.slope * (y - bows.at));

/** A Hurricane sill's x at height y (`side` -1 left, +1 right), from the outer leg's foot outward and down. */
export function sillX(frame, side, y) {
  const [fx, fy] = legFoot(frame, side);
  return fx + side * frame.sills.slope * (y - fy);
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
  if (frame.outer) {
    bar(g, at, outerPath(frame), w(frame.outer.width), frame.colour);
    for (const r of frame.rails) {
      for (const side of [-1, 1]) {
        bar(g, at, [[AXIS + side * frame.windscreen.half, r.y], [legX(frame, side, r.y), r.y]], w(frame.railWidth), frame.colour);
      }
    }
  }
  bar(g, at, windscreenPath(frame), w(frame.windscreen.width), frame.windscreenColour);
  if (frame.coaming) {
    // The Hurricane's coaming, close round the panel's arched top between the outer legs, in front of their feet.
    bar(g, at, coamingLine(frame), w(frame.coaming.width), frame.coamingColour);
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
  const { sills } = frame;
  const fill = (pts, colour) => {
    g.fillStyle = colour;
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(...at.xy(p)) : g.moveTo(...at.xy(p))));
    g.closePath();
    g.fill();
  };
  const wallAt = (side, y) => legFoot(frame, side)[0] + side * sills.wall * (y - legFoot(frame, side)[1]);
  fill([...coamingLine(frame), [wallAt(1, FAR), FAR], [wallAt(-1, FAR), FAR]], frame.interiorColour);
  for (const side of [-1, 1]) {
    const foot = legFoot(frame, side);
    fill([foot, [sillX(frame, side, FAR), FAR], [wallAt(side, FAR), FAR]], frame.wallColour);
    bar(g, at, [foot, [sillX(frame, side, FAR), FAR]], at.len(sills.width), frame.sillColour);
  }
}

/** The Hurricane coaming's middle line (picture pixels) along the panel's arch between the outer legs. */
export function coamingLine(frame) {
  const half = frame.outer.foot;
  // The arch runs left to right once over the top, so its points between the legs' feet, with theirs, trace it.
  const xs = [AXIS - half, ...archPx().map(([x]) => x).filter((x) => Math.abs(x - AXIS) < half), AXIS + half];
  return xs.map((x) => coamingPoint(frame, x));
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
