// The Hurricane's and Spitfire's front cockpit frames (D99-D102), drawn square-on with the panel while the pilot looks
// ahead. Shape guides only, nothing copied: the product owner's museum photograph of a Hurricane cockpit from the front
// (#28), and a Spitfire's cockpit from another game (#26, #29).
// Both, as the Hurricane's approved view (D100, D101): the thin outer windscreen frame, its legs standing on the coaming
// and leaning in; the armoured windscreen inside it, posts on the coaming and a rounded top; the coaming wrapping close
// round the panel's arched top; and the fuselage sides, the cockpit's sills angling in from the coaming's ends at the
// Bf 109's slope, with the side walls below them and the dark interior beside the panel (`drawRafInterior`, on the
// panel's canvas before the panel). The guns' line stands at RAF_AIM of the screen so the GM 2's glass clears the coaming.
//   Hurricane (grey-green, #28): the outer frame's legs lean in about 15° to a short elliptical crown; level frames
//   halfway up the side panes.
//   Spitfire (light grey metal, #29, D102): the outer frame's legs lean in about 20° to a flat top bar carrying the
//   rear-view mirror; struts rise from the armoured windscreen's shoulders out to the legs.
// Sizes are in the RAF panel's picture pixels (through its placer, src/ui/rafPanel.js), measured on the pictures against
// their dials and sights. The 3D windscreen, nose and wings are hidden meanwhile (src/render/testView.js) and show again
// when the pilot looks round.

import { SPITFIRE_PANEL } from './rafPanel.js';
import { C } from './panelParts.js';
import { drawFrames } from './frameBars.js';

const AXIS = 946; // the GM 2's axis on the panel picture: its centre line
// The windscreen frames, struts, fuselage side frames and coaming in the Bf 109 frames' style (D103), dark green (product
// owner, D102): the band with a dark outline, a lit edge on the outside, a shaded edge, and rivets.
const DARK = { band: '#3f5236', lit: '#66795a', shade: '#27331f', rivet: '#2f3d28', outline: '#151c11' };
const FAR = 4000; // picture pixels: far enough to run off any screen

export const RAF_FRAMES = {
  spitfire: {
    // The armoured windscreen: as the Hurricane's, then narrower between its posts and lower (product owner, D102).
    windscreen: { half: 286, top: -637, width: 60 },
    // The outer windscreen frame: legs standing on the coaming's ends (`foot` either side of the axis), leaning in about
    // 20° to a flat top bar at `spring`, `half` either side of the axis, the corners rounded over `corner`.
    outer: { foot: 774, half: 303, spring: -780, top: -780, flat: true, corner: 110, width: 56 },
    // Struts rising from the armoured windscreen's round top (at `angle` degrees from straight up) to the outer legs at y.
    struts: [{ angle: 50, toY: -640 }],
    railWidth: 34,
    // The rear-view mirror on the top bar's centre: its width and height and the stem's length.
    mirror: { w: 130, h: 34, stem: 40 },
    coaming: { half: 774, width: 56, overlap: 6 },
    sills: { slope: 1.156, width: 70, wall: 0.45 },
    wallColour: C.panelTop, // as the instrument panel (product owner, D102)
    interiorColour: '#2a2c2e',
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
    // The coaming: a band along the panel's arched outline, just outside it (`overlap` over its edge), ending `half`
    // either side of the axis, where the outer frame's legs stand.
    coaming: { half: 774, width: 56, overlap: 6 },
    // The sills: from the outer legs' feet outward `slope` for each pixel down (the Bf 109's side frames', D90); the
    // band's width. The side walls' inner edge leaves the feet at `wall` across for each pixel down.
    sills: { slope: 1.156, width: 70, wall: 0.45 },
    wallColour: C.panelTop, // as the instrument panel (product owner, D102)
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
export const RAF_AIM = { hurricane: 0.45, spitfire: 0.45 }; // raised so the GM 2's glass clears the coaming (D101, D102)

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

/** A point of the coaming band at picture x: its middle line (`edge` 0) or top edge (`edge` 1). */
export function coamingPoint(frame, x, edge = 0) {
  const { width, overlap } = frame.coaming;
  const [nx, ny] = outlineNormal(x);
  const d = width / 2 - overlap + edge * (width / 2);
  return [x + nx * d, panelTopY(x) + ny * d];
}

/** Where a windscreen's posts stand: on the coaming band's top edge. */
export function coamingY(x, frame) {
  return coamingPoint(frame, x, 1)[1];
}

/** The outer legs' feet (picture pixels, `side` -1 left, +1 right): on the coaming's top edge at its ends. */
export const legFoot = (frame, side) => [AXIS + side * frame.coaming.half, coamingY(AXIS + side * frame.coaming.half, frame)];

/** The outer leg's x at height y (between its foot and the crown's springing). */
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

/** The outer windscreen frame (picture pixels): up the left leg from the coaming, over the crown or along the top bar, down. */
export function outerPath(frame) {
  const { half, spring, top, flat, corner } = frame.outer;
  if (flat) {
    // The Spitfire's top bar, its corners rounded (product owner, D102): each leg bends into the bar along a curve
    // `corner` long either side of where they would meet.
    const pts = [legFoot(frame, -1)];
    for (const side of [-1, 1]) {
      const foot = legFoot(frame, side);
      const meet = [AXIS + side * half, spring];
      const len = Math.hypot(meet[0] - foot[0], meet[1] - foot[1]);
      const onLeg = [meet[0] + ((foot[0] - meet[0]) / len) * corner, meet[1] + ((foot[1] - meet[1]) / len) * corner];
      const onBar = [meet[0] - side * corner, spring];
      const [from, to] = side < 0 ? [onLeg, onBar] : [onBar, onLeg];
      for (let k = 0; k <= 8; k += 1) {
        const t = k / 8;
        const u = 1 - t;
        pts.push([u * u * from[0] + 2 * u * t * meet[0] + t * t * to[0], u * u * from[1] + 2 * u * t * meet[1] + t * t * to[1]]);
      }
    }
    pts.push(legFoot(frame, 1));
    return pts;
  }
  const pts = [legFoot(frame, -1), [AXIS - half, spring]];
  for (let k = 1; k < 32; k += 1) {
    const a = Math.PI + (k / 32) * Math.PI;
    pts.push([AXIS + Math.cos(a) * half, spring + Math.sin(a) * (spring - top)]);
  }
  pts.push([AXIS + half, spring], legFoot(frame, 1));
  return pts;
}

/** A point on the armoured windscreen's round top at `angle` degrees from straight up (`side` -1 left, +1 right). */
export function archPoint(frame, side, angle) {
  const { half, top } = frame.windscreen;
  const a = (angle * Math.PI) / 180;
  return [AXIS + side * half * Math.sin(a), top + half - half * Math.cos(a)];
}

/** A sill's x at height y (`side` -1 left, +1 right), from the outer leg's foot outward and down. */
export function sillX(frame, side, y) {
  const [fx, fy] = legFoot(frame, side);
  return fx + side * frame.sills.slope * (y - fy);
}

/** Draws the frame (`frame`: RAF_FRAMES entry) on the sight's canvas before the GM 2; `at` is the RAF panel's placer. */
export function drawRafFrame(g, at, frame) {
  const w = (px) => at.len(px);
  const { outer } = frame;
  drawFrames(g, rafFrameBars(at, frame), DARK, { join: 'round' });
  if (frame.mirror) {
    // The rear-view mirror's small dark glass in a rim, on its stem.
    const { mirror } = frame;
    const base = outer.spring - outer.width / 2;
    const [x0, y0] = at.xy([AXIS - mirror.w / 2, base - mirror.stem - mirror.h]);
    g.fillStyle = DARK.band;
    g.fillRect(x0 - w(6), y0 - w(6), w(mirror.w) + w(12), w(mirror.h) + w(12));
    g.fillStyle = '#3c4246';
    g.fillRect(x0, y0, w(mirror.w), w(mirror.h));
  }
}

/** A path (picture pixels) with its ends carried on by `a` at the start and `b` at the end, along its end segments. */
function extended(pts, a, b) {
  const out = pts.map((p) => [...p]);
  const push = (i, j, d) => {
    const [x, y] = out[i];
    const len = Math.hypot(x - out[j][0], y - out[j][1]) || 1;
    out[i] = [x + ((x - out[j][0]) / len) * d, y + ((y - out[j][1]) / len) * d];
  };
  if (a) push(0, 1, a);
  if (b) push(out.length - 1, out.length - 2, b);
  return out;
}

/**
 * The frame's bars in canvas px, in welded drawing order (D104): the coaming first; the outer frame and the armoured
 * windscreen standing on it (their feet carried down into it, their edges stopping at its top); the rails or struts and
 * the mirror's stem joining them. `at` is the RAF panel's placer.
 */
export function rafFrameBars(at, frame) {
  const w = (px) => at.len(px);
  const P = (pts) => pts.map((p) => at.xy(p));
  const { outer, windscreen, coaming } = frame;
  const sink = coaming.width / 2; // how far the feet run down into the coaming band
  const out = [{ pts: P(coamingLine(frame)), w: w(coaming.width), trim: [0, 0] }];
  out.push({ pts: P(extended(outerPath(frame), sink, sink)), w: w(outer.width), trim: [w(sink), w(sink)] });
  out.push({ pts: P(extended(windscreenPath(frame), sink, sink)), w: w(windscreen.width), trim: [w(sink), w(sink)] });
  for (const side of [-1, 1]) {
    // The Hurricane's level frames halfway up the side panes; the Spitfire's struts rising to the outer legs.
    const ends = [...(frame.rails ?? []).map((r) => [[AXIS + side * windscreen.half, r.y], [legX(frame, side, r.y), r.y]]),
      ...(frame.struts ?? []).map((st) => [archPoint(frame, side, st.angle), [legX(frame, side, st.toY), st.toY]])];
    for (const pts of ends) {
      out.push({ pts: P(pts), w: w(frame.railWidth), trim: [w(windscreen.width / 2), w(outer.width / 2)] });
    }
  }
  if (frame.mirror) {
    // The rear-view mirror's stem, from the top bar's middle up.
    const top = outer.spring - outer.width / 2 - frame.mirror.stem;
    out.push({ pts: P([[AXIS, outer.spring], [AXIS, top]]), w: w(18), trim: [w(outer.width / 2), 0] });
  }
  return out;
}

/**
 * The fuselage sides and cockpit interior (D100, D102), on the panel's canvas before the panel: the dark interior
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
    drawFrames(g, [{ pts: [at.xy(foot), at.xy([sillX(frame, side, FAR), FAR])], w: at.len(sills.width), trim: [0, 0] }], DARK);
  }
}

/** The coaming's middle line (picture pixels) along the panel's arch between the outer legs. */
export function coamingLine(frame) {
  const { half } = frame.coaming;
  // The arch runs left to right once over the top, so its points between the legs' feet, with theirs, trace it.
  const xs = [AXIS - half, ...archPx().map(([x]) => x).filter((x) => Math.abs(x - AXIS) < half), AXIS + half];
  return xs.map((x) => coamingPoint(frame, x));
}


