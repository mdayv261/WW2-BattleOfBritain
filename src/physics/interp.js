// Table interpolation helpers shared by the physics modules.

/** Linear interpolation in a sorted array of [x, y] pairs; clamps outside the table. */
export function interpPairs(pairs, x) {
  if (x <= pairs[0][0]) return pairs[0][1];
  const last = pairs[pairs.length - 1];
  if (x >= last[0]) return last[1];
  let i = 1;
  while (pairs[i][0] < x) i += 1;
  const [x0, y0] = pairs[i - 1];
  const [x1, y1] = pairs[i];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/** Like interpPairs, but extends the first and last segments in a straight line instead of clamping. */
export function extrapPairs(pairs, x) {
  const n = pairs.length;
  if (x < pairs[0][0]) {
    const [[x0, y0], [x1, y1]] = pairs;
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  if (x > pairs[n - 1][0]) {
    const [x0, y0] = pairs[n - 2];
    const [x1, y1] = pairs[n - 1];
    return y1 + ((y1 - y0) * (x - x1)) / (x1 - x0);
  }
  return interpPairs(pairs, x);
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
