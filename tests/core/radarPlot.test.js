// The RAF radar's plots (Phase 7 checkpoint 4, D230): one blip per group of enemy aircraft, giving its compass bearing
// from the player and nothing else; the plot taken every PLOT_INTERVAL seconds; RAF aircraft only.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { spawnGroup } from '../../src/core/scenarios.js';
import { spawnRaid } from '../../src/core/raid.js';
import { spawnWingmen } from '../../src/core/wingmen.js';
import { RadarPlot, radarGroups, relative, bearingOf, PLOT_INTERVAL, GROUP_RADIUS } from '../../src/core/radarPlot.js';

const DT = 1 / 120;

/** A simulation in the air with the player's aircraft of `id`. */
const air = (id = 'spitfire') => new Simulation(aircraftById[id], 'air');

/** A group of Bf 109s (`formation`) placed (dx, dz) m from the player, at his height. */
function enemyAt(sim, dx, dz, formation = 'single', id = 'bf109e4', side = 'Luftwaffe') {
  const origin = sim.plane.body.position.clone().add(new Vector3(dx, 0, dz));
  return spawnGroup(sim, { id, formation, origin, heading: 0, role: 'fighter', side, speed: 110 });
}

describe('the RAF radar\'s plots', () => {
  it('gives the compass bearing of an enemy from the player, and where it sits on the heading-up ring', () => {
    expect(bearingOf(1, 0)).toBeCloseTo(90);
    expect(bearingOf(0, 1)).toBeCloseTo(180);
    expect(bearingOf(0, -1)).toBeCloseTo(0);
    expect(bearingOf(-1, 0)).toBeCloseTo(270);
    expect(relative(90, 90)).toBe(0); // dead ahead
    expect(relative(10, 350)).toBe(20);
    expect(relative(350, 10)).toBe(340);
    const sim = air();
    enemyAt(sim, 20000, 0);
    const plot = new RadarPlot();
    expect(plot.update(sim)).toBe(true); // the first plot at once
    expect(plot.plots).toHaveLength(1);
    expect(plot.plots[0].bearing).toBeCloseTo(90, 3);
    expect(Object.keys(plot.plots[0])).toEqual(['bearing']); // the bearing only: no height, range or numbers
  });

  it('makes one blip of a formation, two of groups far apart, and one of a raid with its escort', () => {
    expect(GROUP_RADIUS).toBe(3000);
    const sim = air();
    enemyAt(sim, 0, -20000, 'schwarm');
    expect(radarGroups(sim)).toHaveLength(1);
    enemyAt(sim, 10000, -20000, 'rotte');
    expect(radarGroups(sim)).toHaveLength(2);
    const raid = air();
    raid.plane.body.position.x += 100000;
    spawnRaid(raid, { target: 'Hawkinge', bombers: 6, escorts: 4, altitude: 4000 });
    expect(raid.others).toHaveLength(10);
    expect(radarGroups(raid)).toHaveLength(1);
  });

  it('plots only the other side: not the player\'s wingmen, and nothing at all for a Luftwaffe pilot', () => {
    const sim = air();
    spawnWingmen(sim, 2);
    expect(radarGroups(sim)).toHaveLength(0);
    enemyAt(sim, 0, -20000);
    expect(radarGroups(sim)).toHaveLength(1);
    const luftwaffe = air('bf109e4');
    enemyAt(luftwaffe, 0, -20000, 'single', 'spitfire', 'RAF');
    const plot = new RadarPlot();
    plot.update(luftwaffe);
    expect(plot.plots).toHaveLength(0);
  });

  it('keeps each blip\'s bearing until the next plot, PLOT_INTERVAL later; a lost enemy goes at the next plot', () => {
    expect(PLOT_INTERVAL).toBe(20);
    const sim = air();
    const [enemy] = enemyAt(sim, 0, -15000);
    enemy.pilot.fly = () => {};
    const plot = new RadarPlot();
    plot.update(sim);
    const first = plot.plots[0].bearing;
    enemy.plane.body.position.x += 15000; // now to the north-east
    sim.clock += PLOT_INTERVAL - 1;
    expect(plot.update(sim)).toBe(false);
    expect(plot.plots[0].bearing).toBe(first);
    sim.clock += 1;
    expect(plot.update(sim)).toBe(true);
    expect(plot.plots[0].bearing).toBeGreaterThan(first + 30);
    sim.others = [];
    sim.clock += PLOT_INTERVAL;
    plot.update(sim);
    expect(plot.plots).toHaveLength(0);
  });

  it('plots afresh at once when a new flight starts (the clock goes back, or reset)', () => {
    const sim = air();
    enemyAt(sim, 20000, 0);
    const plot = new RadarPlot();
    for (let i = 0; i < 120 * 5; i += 1) sim.step(DT);
    plot.update(sim);
    sim.clock = 1; // the test flight's aircraft keys start the flight again
    expect(plot.update(sim)).toBe(true);
    plot.reset();
    expect(plot.plots).toHaveLength(0);
    expect(plot.update(sim)).toBe(true);
  });
});
