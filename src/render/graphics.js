// The graphics levels (Phase 7 checkpoint 6, D232): High is the game's look as built; Medium and Low draw less, for
// slower machines. Sharpness (the pixel ratio) changes at once; the terrain's detail ranges, the houses' distance and
// the share of the clouds change as the next flight starts (the product owner's choice, 10 Nov 2026). The levels'
// figures are game design.

export const GRAPHICS = {
  high: { pixelRatio: 2, rangeScale: 1, housesWithin: 9000, clouds: 1 },
  medium: { pixelRatio: 1.5, rangeScale: 0.75, housesWithin: 6000, clouds: 0.7 },
  low: { pixelRatio: 1, rangeScale: 0.5, housesWithin: 4000, clouds: 0.4 },
};

/** What the terrain and towns read each frame (src/render/terrainMesh.js, towns.js): set by `applyDetail`. */
export const detail = { rangeScale: 1, housesWithin: GRAPHICS.high.housesWithin };

/** The pixel ratio for a level on this screen: the level's, no more than the screen's own. */
export const pixelRatioFor = (level, devicePixelRatio = 1) => Math.min(devicePixelRatio, GRAPHICS[level].pixelRatio);

/** Sets the scene's detail for a level (at a flight's start): the terrain and towns' ranges, and the clouds shown. */
export function applyDetail(level, clouds = null) {
  const g = GRAPHICS[level];
  detail.rangeScale = g.rangeScale;
  detail.housesWithin = g.housesWithin;
  if (clouds) clouds.count = Math.round(clouds.userData.total * g.clouds);
}
