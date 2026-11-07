// One-against-one AI fights, run headless on the full flight model (Phase 6, D81, D216): for the tactics tests and for
// `npm run duels`, which shows whether the skill levels (src/ai/skill.js) tell. Both pilots are AI; the player's own
// aircraft is parked far away, out of every pilot's sight.

import { Vector3 } from 'three';
import { aircraftById } from '../aircraft/index.js';
import { Simulation, levelThrottle } from '../core/simulation.js';
import { Craft } from '../core/craft.js';
import { createPilot } from '../ai/pilots.js';

const DT = 1 / 120;

/** A simulation with the player parked 100 km away; `centre` is where the player started. */
export function emptySky() {
  const sim = new Simulation(aircraftById.spitfire, 'air');
  const centre = sim.plane.body.position.clone();
  sim.plane.body.position.x += 100000;
  return { sim, centre };
}

/** An AI fighter of `id` and `skill` on `side` at `at` (Vector3), heading `heading`, flying `speed`. */
export function fighter(sim, id, skill, side, at, heading, { seed = 1, speed = 110, role = 'fighter' } = {}) {
  const ac = aircraftById[id];
  const craft = new Craft(ac, {
    start: { altitude: at.y, speed, heading, throttle: levelThrottle(ac, at.y, speed, 1), rpm: 1, x: at.x, z: at.z },
    pilot: createPilot({ role, skill, seed }), side, skill, seed: seed + 7, label: `${id}-${skill}`,
  });
  sim.others.push(craft);
  return craft;
}

/** Out of the fight: destroyed, abandoned, its pilot dead, or gone home (out of ammunition, hurt or out-matched). */
export const lost = (sim, c) => !sim.others.includes(c) || c.abandoned || c.plane.damage.pilot <= 0 || c.pilot.home;

/**
 * A fight from 2.5 km apart, head-on, at `altitude` (m; 500 m above the air start unless given, D218): A (RAF) against
 * B (Luftwaffe); B starts `up` m higher (A starts -`up` m higher when it is negative; D217).
 * Returns the winner ('A', 'B' or 'draw' after `seconds`), the time it took, the hits each took, how much of the fight B
 * spent above A, and B's longest spell turning faster than 12°/s.
 */
export function duel(idA, skillA, idB, skillB, seed, { up = 0, seconds = 180, altitude } = {}) {
  const { sim, centre } = emptySky();
  const alt = altitude ?? centre.y + 500;
  const A = fighter(sim, idA, skillA, 'RAF', new Vector3(centre.x, alt + Math.max(0, -up), centre.z + 1250), 0, { seed: seed * 31 + 1 });
  const B = fighter(sim, idB, skillB, 'Luftwaffe', new Vector3(centre.x, alt + Math.max(0, up), centre.z - 1250), Math.PI, { seed: seed * 31 + 2 });
  let above = 0;
  let n = 0;
  let run = 0;
  let longest = 0;
  let heading = null;
  let t = 0;
  for (; t < seconds; t += DT) {
    sim.step(DT);
    n += 1;
    if (B.plane.body.position.y > A.plane.body.position.y) above += 1;
    const v = B.plane.body.velocity;
    const h = Math.atan2(v.x, -v.z);
    const rate = heading === null ? 0 : Math.abs(Math.atan2(Math.sin(h - heading), Math.cos(h - heading))) / DT;
    heading = h;
    run = rate > 0.21 ? run + DT : 0; // turning faster than 12°/s
    longest = Math.max(longest, run);
    if (lost(sim, A) || lost(sim, B)) break;
  }
  const winner = lost(sim, A) && !lost(sim, B) ? 'B' : lost(sim, B) && !lost(sim, A) ? 'A' : 'draw';
  return { winner, time: t, hitsOnA: A.plane.damage.hits, hitsOnB: B.plane.damage.hits, above: above / n, longestTurn: longest };
}

/** The height edge in the skill duels (D217): each side starts this much higher in turn. */
export const EDGE = 1000;

/** The skill duels' height (D218): about 20,000 ft, within the Battle's fighting heights (S38 para. 126). */
export const HIGH = 6000;

/**
 * `count` seeded duels of `skillA` against `skillB` at `altitude` (m, or the default), each side starting EDGE m higher
 * in turn (B on odd seeds, A on even): { a, b, draws } wins, the hits each took, and the mean time.
 */
export function duelSeries(idA, skillA, idB, skillB, count, { first = 1, altitude } = {}) {
  const out = { a: 0, b: 0, draws: 0, time: 0, hitsOnA: 0, hitsOnB: 0 };
  for (let seed = first; seed < first + count; seed += 1) {
    const r = duel(idA, skillA, idB, skillB, seed, { up: seed % 2 ? EDGE : -EDGE, altitude });
    out.hitsOnA += r.hitsOnA;
    out.hitsOnB += r.hitsOnB;
    if (r.winner === 'A') out.a += 1;
    else if (r.winner === 'B') out.b += 1;
    else out.draws += 1;
    out.time += r.time / count;
  }
  return out;
}
