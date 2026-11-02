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
