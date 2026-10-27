// What an AI pilot or gunner knows of his rounds' flight (Phase 6, D79): the time they take to reach a range and how far
// they drop there, from the same ballistics as the rounds themselves (src/weapons/ballistics.js), worked out once per
// kind of round and read off by interpolation.

import { ballistics } from '../aircraft/ammunition.js';
import { flightTable } from '../weapons/ballistics.js';

const STEP = 50; // m between table entries
const REACH = 1200; // m: the table's end
const tables = {};

/** The table of [range, time, drop] for a ballistics key, worked out on first use. */
function tableOf(key) {
  if (!tables[key]) {
    const ranges = [];
    for (let r = STEP; r <= REACH; r += STEP) ranges.push(r);
    tables[key] = [[0, 0, 0], ...flightTable(ballistics[key], ranges).map((row, i) => [ranges[i], row.time, row.drop])];
  }
  return tables[key];
}

/** Time of flight (s) and drop (m it has fallen below the line it was fired along) of a round of `key` at `range` (m). */
export function roundFlight(key, range) {
  const t = tableOf(key);
  const r = Math.max(0, Math.min(range, REACH));
  const i = Math.min(t.length - 2, Math.floor(r / STEP));
  const f = (r - t[i][0]) / STEP;
  return { time: t[i][1] + f * (t[i + 1][1] - t[i][1]), drop: t[i][2] + f * (t[i + 1][2] - t[i][2]) };
}
