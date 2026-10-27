// A small seeded random number generator (mulberry32): the same seed gives the same sequence, so damage can be
// repeated exactly (the multiplayer server and the tests depend on this, D68).

/** A generator for `seed` (an integer): call it for numbers in [0, 1). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks a key of `weights` ({ name: weight }) in proportion to its weight, using `random()`. */
export function pickWeighted(weights, random) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = random() * total;
  for (const [name, w] of entries) {
    x -= w;
    if (x < 0) return name;
  }
  return entries[entries.length - 1]?.[0] ?? null;
}
