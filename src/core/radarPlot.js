// The RAF radar's plots (Phase 7 checkpoint 4, D230): what the radar display (src/ui/radar.js) shows, worked out with
// no drawing so it can be tested. RAF aircraft only (D17). A blip gives the bearing of a group of enemy aircraft from
// the player and nothing else: no height, no numbers (D224). The plot is taken every PLOT_INTERVAL seconds, as plots
// passed on from the ground (the product owner's choice); in between, each blip keeps its last bearing.
// Game design (D230): PLOT_INTERVAL, and GROUP_RADIUS, the spacing within which aircraft make one blip. Radar cover,
// the Observer Corps' tracking inland and plotting errors are not modelled: every enemy on the map is plotted.

export const PLOT_INTERVAL = 20; // s between plots (product owner, 9 Nov 2026)
export const GROUP_RADIUS = 3000; // m: an aircraft this close to one in a group joins it, so a formation is one blip

/** The compass bearing (degrees, 0-360, clockwise from north) of the world vector (dx, dz): north is -z. */
export const bearingOf = (dx, dz) => ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;

/** Where a bearing sits on the heading-up ring: degrees clockwise from the top (the nose), 0-360. */
export const relative = (bearing, heading) => (((bearing - heading) % 360) + 360) % 360;

/** The enemy as groups: [{ x, z }], the middle of each group's aircraft (heights ignored). */
export function radarGroups(sim) {
  const side = sim.ac.side;
  const enemy = sim.others.filter((c) => c.side && c.side !== side).map((c) => c.plane.body.position);
  const groups = [];
  for (const p of enemy) {
    const near = groups.filter((g) => g.some((q) => Math.hypot(p.x - q.x, p.z - q.z) <= GROUP_RADIUS));
    // An aircraft near several groups joins them into one.
    const merged = near.flat().concat([p]);
    for (const g of near) groups.splice(groups.indexOf(g), 1);
    groups.push(merged);
  }
  return groups.map((g) => ({ x: g.reduce((a, p) => a + p.x, 0) / g.length, z: g.reduce((a, p) => a + p.z, 0) / g.length }));
}

export class RadarPlot {
  constructor() {
    this.reset();
  }

  /** A new flight: no plots, and the next update plots at once. */
  reset() {
    this.plots = [];
    this.at = -Infinity; // sim time of the last plot
  }

  /** Takes a fresh plot when PLOT_INTERVAL has passed: true if it did. RAF aircraft only; others get none. */
  update(sim) {
    if (sim.ac.side !== 'RAF') {
      this.plots = [];
      return false;
    }
    // The clock going back means a new flight (the test flight's aircraft keys restart it): plot at once.
    if (sim.clock >= this.at && sim.clock - this.at < PLOT_INTERVAL) return false;
    this.at = sim.clock;
    const here = sim.plane.body.position;
    this.plots = radarGroups(sim).map((g) => ({ bearing: bearingOf(g.x - here.x, g.z - here.z) }));
    return true;
  }
}
