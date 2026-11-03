// The Revi C/12C's parts (D89), in dial radii of the Bf 109's panel from the guns' line looking ahead (x to the right,
// y down), measured on the product owner's photograph of the reflected reticle (#21) against the reticle's ring. Drawn
// by src/ui/reviSight.js. Kept apart from the drawing so the panels can place the sight without importing it.

export const REVI = {
  // The clear glass: its top edge, half its width there and at the housing, the housing's top at the sides and the
  // bottom of the dip in its middle.
  glass: { top: -1.83, topHalf: 2.24, footHalf: 2.08, foot: 0.6, dip: 1.3 },
  filter: { x: [-1.8, 1.73], top: -1.08 }, // the dark glass, down to the housing
  housing: { y: [0.6, 1.7], dipHalf: 1.55 },
  body: { x: [-1.5, 1.35], y: [1.6, 5.6] },
  pad: { x: [-0.77, 1.15], y: [1.75, 5.15] },
  lever: { x: [-1.78, -1.45], y: [2.9, 4.5] },
  pivot: [-1.62, 3.2], // the lever's pivot
  post: { x: 1.85, y: [0.05, 0.6] },
  block: { x: [-1.2, 1.1], y: [5.15, 6.4] },
  knob: { x: [-0.75, 0.25], y: [6.45, 7.0] },
  cable: [[-0.25, 7.0], [-0.85, 7.25], [-0.8, 7.75], [-0.35, 7.75]], // to its clip on the panel
};

/**
 * The Revi with its body `share` of its height (the Bf 110's, 0.8: product owner, D107): what is on the body (the pad,
 * the lever and its pivot) is pressed down to fit, and what is below it (the block, knob and cable) moves up by the
 * height taken off. The glasses and housing above it are unchanged.
 */
export function shortRevi(parts, share) {
  const [top, foot] = parts.body.y;
  const cut = (foot - top) * (1 - share);
  const y = (v) => (v <= top ? v : v <= foot ? top + (v - top) * share : v - cut);
  const part = (p) => ({ ...p, y: p.y.map(y) });
  return {
    ...parts,
    body: part(parts.body),
    pad: part(parts.pad),
    lever: part(parts.lever),
    pivot: [parts.pivot[0], y(parts.pivot[1])],
    block: part(parts.block),
    knob: part(parts.knob),
    cable: parts.cable.map(([u, v]) => [u, y(v)]),
  };
}

/**
 * The Bf 110's Revi-110 (product owner, D130, D131), after their photograph of the Bf 110 C's cockpit (#32): the Revi's
 * body shortened as `shortRevi` (0.8, D107) and then cut to its brown pad's size; on it, in place of the wide glass, the
 * housing, the dark glass and the bead post, a round reflector glass as wide as the body, held at its sides by a frame
 * of the body's width: a plate on the body's top and a strap up each side to a pin at the glass's middle. The sight is
 * moved so the glass's middle is on the guns' line (the reticle in its middle) and the glass stands on the plate: the
 * body and lever raised to close the gap. No mounting block or knob below the body (product owner, D132): `foot` keeps
 * where the knob's foot stood, which sets the sight's height on the panel (src/ui/bf110Panel.js). `glass` gives the glass's extent for placing it (reviPlacement).
 */
export const PLATE_110 = 0.15; // the holder's plate on the body's top
export function revi110(parts) {
  const short = shortRevi(parts, 0.8);
  const [left, right] = short.pad.x;
  const radius = (right - left) / 2;
  const cx = (left + right) / 2; // moved to the guns' line
  const top = radius + PLATE_110; // the body's new top: the glass on the plate
  const lift = short.pad.y[0] - top;
  const move = (p) => ({ ...p, x: p.x.map((v) => v - cx), y: p.y.map((v) => v - lift) });
  const lever = { x: [left - 0.28, left + 0.05], y: short.lever.y }; // against the body's left side, as on the Bf 109's
  return {
    ...short,
    body: move(short.pad),
    pad: move(short.pad),
    lever: move(lever),
    pivot: [left - 0.115 - cx, short.pivot[1] - lift],
    block: null,
    knob: null,
    foot: short.knob.y[1] - lift,
    cable: short.cable.map(([u, v]) => [u - cx, v - lift]),
    round: { cx: 0, cy: 0, radius },
    holder: { x: [-radius, radius], strap: 0.16, plate: [radius, top] },
    glass: { cx: 0, top: -radius, topHalf: radius, dip: radius },
    filter: null,
    housing: null,
    post: null,
  };
}
