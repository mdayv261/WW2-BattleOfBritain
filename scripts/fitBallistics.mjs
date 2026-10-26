// Fits each round's drag coefficient against Mach number to its sourced range table (Phase 5, D67), and prints the
// tables for src/aircraft/ammunition.js. Run: npm run fit:ballistics
//
// Over a flat stretch of trajectory a round slows as dv/dx = -(rho A Cd / 2m) v, so between two ranges
//   Cd = 2 m ln(v1 / v2) / (rho A dx),
// taken at the stretch's mean speed. Gravity barely changes the speed of these flat trajectories and is left out.

const SOUND = 340.29; // m/s, ISA sea level
const FT = 0.3048;
const YD = 0.9144;

const TABLES = {
  // .303 Mk VII ball, Hythe firings: remaining velocity (f/s) every 100 yd (S37, Appendix I); 174 grains, 0.311 in.
  mk7: {
    mass: 0.011275, calibre: 0.0079, rho: 1.225, step: 100 * YD,
    v: [2440, 2230, 2030, 1840, 1660, 1500, 1360, 1240, 1140, 1060, 1000].map((f) => f * FT),
  },
  // 7.9 mm armour-piercing bullet, Rechlin firing table (S41): m/s every 100 m, sea-level air 1.2255 kg/m³; 10 g.
  mg17: {
    mass: 0.010, calibre: 0.00792, rho: 1.2255, step: 100,
    v: [810, 715, 624, 538, 460, 396, 348, 315, 290, 269, 252],
  },
  // 2 cm FF/M 117 g shells, Rechlin firing table (S41): m/s every 100 m.
  mgffm: {
    mass: 0.117, calibre: 0.020, rho: 1.2255, step: 100,
    v: [585, 533, 487, 446, 409, 376, 349, 326, 309, 296, 286],
  },
};

const round4 = (x) => Math.round(x * 1e4) / 1e4;

for (const [name, t] of Object.entries(TABLES)) {
  const area = (Math.PI * t.calibre * t.calibre) / 4;
  const pairs = [];
  for (let i = 0; i + 1 < t.v.length; i += 1) {
    const [v1, v2] = [t.v[i], t.v[i + 1]];
    const cd = (2 * t.mass * Math.log(v1 / v2)) / (t.rho * area * t.step);
    pairs.push([round4((v1 + v2) / 2 / SOUND), round4(cd)]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  console.log(`${name}: [${pairs.map((p) => `[${p[0]}, ${p[1]}]`).join(', ')}]`);
}
