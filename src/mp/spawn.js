// Where each team's aircraft appear in a match, and again 10 s after going down (Phase 9, D243; after Dawn Patrol's
// src/mp/spawn.js, with the product owner's approval). The host chooses for the start and for the respawn separately
// (the product owner, 10 Nov 2026):
//   'apron': on the side's airfield nearest the Channel (Hawkinge, Saint-Inglevert: each side's home, D51), side by
//     side, as single player's ground start;
//   'air': at 8,000 ft (AIR_SPAWN.altitude), 5 km (AIR_SPAWN.distance) from the nearest enemy player, on the own side
//     of them and heading towards them. At the match's start the two teams are placed facing each other 5 km apart over
//     the middle of the Channel, team-mates 300 m apart in a line abreast opposite the other team's; with no enemy in the
//     air, over the side's own coast heading out.
// The starts themselves are single player's (src/core/simulation.js startPlane), so they are the validated ones.

import { toWorld } from '../world/geo.js';
import { startPlane, fullPowerStart } from '../core/simulation.js';
import { AIR_SPAWN } from './netConfig.js';

const DEG = Math.PI / 180;
const MID_CHANNEL = toWorld(51.0, 1.45); // between Folkestone and Cap Gris-Nez
const OWN_SIDE = { raf: 315 * DEG, luftwaffe: 135 * DEG }; // the bearing from mid-Channel towards each side's coast
const COAST = { raf: toWorld(51.1, 1.22), luftwaffe: toWorld(50.89, 1.66) }; // Folkestone-Dover; by Wissant
const GROUND_SPACING = 30; // m between team-mates on the apron
const SIDE = { raf: 'RAF', luftwaffe: 'Luftwaffe' };

/** The bearing (clockwise from north) from (x1, z1) to (x2, z2): north is -z. */
const bearing = (x1, z1, x2, z2) => Math.atan2(x2 - x1, -(z2 - z1));
/** A point `d` m from (x, z) on bearing `b`. */
const along = (x, z, b, d) => ({ x: x + Math.sin(b) * d, z: z - Math.cos(b) * d });

/**
 * The index-th place (0-3) of `team`, `count` strong: { mode, x, z, heading, altitude }. `where`: 'apron' or 'air';
 * `enemies`: the enemy players' positions now ([{ x, z }]), for an air respawn; `start`: true at the match's start
 * (both teams placed 5 km apart over mid-Channel).
 */
export function spawnPoint(world, team, index, { where, enemies = [], start = false, count = 1 }) {
  if (where === 'apron') {
    const g = world.starts(SIDE[team]).ground;
    return { mode: 'ground', x: g.x + ((index % 4) - 1.5) * GROUND_SPACING, z: g.z, heading: g.heading };
  }
  let centre;
  let heading;
  if (start) {
    // Team-mates abreast along one line square to the two teams' course, so each faces an enemy 5 km away.
    const mid = along(MID_CHANNEL.x, MID_CHANNEL.z, OWN_SIDE[team], AIR_SPAWN.distance / 2);
    centre = along(mid.x, mid.z, OWN_SIDE.raf + Math.PI / 2, (index - (count - 1) / 2) * AIR_SPAWN.spacing);
    heading = OWN_SIDE[team] + Math.PI; // towards the other team
  } else if (enemies.length) {
    // The nearest enemy to the side's own coast decides where; the place is 5 km from them towards that coast.
    const home = COAST[team];
    const near = enemies.reduce((a, e) => (Math.hypot(e.x - home.x, e.z - home.z) < Math.hypot(a.x - home.x, a.z - home.z) ? e : a));
    const back = bearing(near.x, near.z, home.x, home.z);
    centre = along(near.x, near.z, back, AIR_SPAWN.distance);
    heading = back + Math.PI;
  } else {
    centre = COAST[team];
    heading = OWN_SIDE[team] + Math.PI;
  }
  return { mode: 'air', x: centre.x, z: centre.z, heading: ((heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), altitude: AIR_SPAWN.altitude };
}

/** A fresh aircraft of type `ac` at a spawn point: { plane, input }. */
export function spawnAircraft(ac, world, point) {
  const override = point.mode === 'air' ? { altitude: point.altitude, heading: point.heading, x: point.x, z: point.z } : { x: point.x, z: point.z, heading: point.heading };
  return startPlane(ac, point.mode, world, override);
}

/**
 * Works out, ahead of time, the full-power level speed an air start at 8,000 ft gives aircraft `ac`. Single player's
 * start solves it once per type and keeps it (100-200 ms each, measured); the room server asks while players are still
 * choosing in the lobby, so the match's first moment does not stall.
 */
export function prepareAirStart(ac) {
  fullPowerStart(ac, AIR_SPAWN.altitude);
}
