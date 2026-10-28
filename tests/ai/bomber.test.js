// Bomber formations (D83), run headless: a Kette flies its route through the waypoints, keeping its places; it closes
// up with enemy fighters near and opens out once they have gone; a badly damaged bomber leaves for home, a straggler;
// when the leader is lost the next bomber takes the lead, the route and the escort.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createPilot } from '../../src/ai/pilots.js';
import { createBomberGroup } from '../../src/ai/bomber.js';
import { FORMATIONS } from '../../src/ai/formation.js';
import { slotPoint, formationSpeed } from '../../src/ai/basic.js';
import { homeDirection } from '../../src/ai/tactics.js';

const DT = 1 / 120;
const he111 = aircraftById.he111h;

/** A Kette flying north from `centre` on a route of [{ x, z }] offsets from it (m), the player parked far away. */
function kette(route) {
  const sim = new Simulation(aircraftById.spitfire, 'air');
  const centre = sim.plane.body.position.clone().add(new Vector3(0, 500, 0));
  sim.plane.body.position.x += 100000;
  const speed = formationSpeed(he111, centre.y);
  const group = createBomberGroup('kette', route.map((p) => ({ x: centre.x + p.x, z: centre.z + p.z })));
  FORMATIONS.kette.forEach((slot, i) => {
    const at = centre.clone().add(new Vector3(slot.side ?? 0, 0, slot.back ?? 0));
    const craft = new Craft(he111, {
      start: { altitude: at.y, speed, heading: 0, throttle: levelThrottle(he111, at.y, speed, 1), rpm: 1, x: at.x, z: at.z },
      pilot: createPilot({ role: 'bomber', seed: i + 1, group }), side: 'Luftwaffe', seed: i + 1, label: `He 111 #${i + 1}`,
    });
    sim.others.push(craft);
    group.bombers.push(craft);
  });
  return { sim, centre, group, bombers: [...group.bombers], speed };
}

const run = (sim, seconds, each = () => {}) => {
  for (let t = 0; t < seconds; t += DT) {
    sim.step(DT);
    each(t);
  }
};

/** How far a wingman is from his place beside `lead` (slot scaled by `share`; `mirror`: on the other side). */
const offSlot = (lead, craft, index, share = 1, mirror = false) => {
  const s = FORMATIONS.kette[index];
  return slotPoint(lead, { side: (mirror ? -1 : 1) * s.side * share, back: s.back * share }).distanceTo(craft.plane.body.position);
};

const flat = (v) => v.clone().setY(0).normalize();

describe('bomber formations', () => {
  it('a Kette follows its route through the waypoints, keeping its places', () => {
    const { sim, centre, group, bombers } = kette([{ x: 0, z: -4000 }, { x: 4000, z: -5000 }]);
    let worst = 0;
    let firstAt = null;
    run(sim, 130, (t) => {
      if (group.leg === 1 && firstAt === null) firstAt = t;
      if (t > 15 && group.leg === 0) for (const i of [1, 2]) worst = Math.max(worst, offSlot(bombers[0], bombers[i], i));
    });
    expect(firstAt).toBeGreaterThan(25);
    expect(firstAt).toBeLessThan(45);
    expect(group.leg).toBe(2); // both waypoints passed
    // Flown on past the last waypoint, holding his heading.
    const end = bombers[0].plane.body.position;
    expect(new Vector3(end.x - (centre.x + 4000), 0, end.z - (centre.z - 5000)).dot(new Vector3(4000, 0, -1000))).toBeGreaterThan(0);
    expect(worst).toBeLessThan(40);
    expect(Math.abs(end.y - centre.y)).toBeLessThan(60);
  });

  it('it closes up with enemy fighters near, and opens out again once they have gone', () => {
    const { sim, bombers, speed } = kette([{ x: 0, z: -40000 }]);
    run(sim, 10);
    const ac = aircraftById.hurricane;
    const at = bombers[0].plane.body.position.clone().add(new Vector3(1000, 300, 0));
    const fighter = new Craft(ac, {
      start: { altitude: at.y, speed, heading: 0, throttle: levelThrottle(ac, at.y, speed, 1), rpm: 1, x: at.x, z: at.z },
      pilot: createPilot({ role: 'bomber', seed: 9 }), side: 'RAF', seed: 9,
    });
    sim.others.push(fighter);
    run(sim, 25);
    expect(bombers[0].pilot.closed).toBe(true);
    for (const i of [1, 2]) expect(offSlot(bombers[0], bombers[i], i, 0.6)).toBeLessThan(20);
    sim.others = sim.others.filter((c) => c !== fighter);
    run(sim, 25);
    expect(bombers[0].pilot.closed).toBe(false);
    for (const i of [1, 2]) expect(offSlot(bombers[0], bombers[i], i)).toBeLessThan(25);
  });

  it('a bomber with an engine out leaves the formation for home, losing height', () => {
    const { sim, bombers } = kette([{ x: 0, z: -40000 }]);
    run(sim, 5);
    const hurt = bombers[2];
    hurt.plane.engines[1].heat.seized = true;
    const y0 = hurt.plane.body.position.y;
    run(sim, 70); // a 135° turn at a gentle 20° bank takes most of a minute
    expect(hurt.pilot.straggler).toBe(true);
    expect(flat(hurt.plane.body.velocity).dot(flat(homeDirection('Luftwaffe')))).toBeGreaterThan(0.9);
    expect(hurt.plane.body.position.y).toBeLessThan(y0 - 50);
    // The others fly on together.
    expect(offSlot(bombers[0], bombers[1], 1)).toBeLessThan(30);
  });

  it('when the leader is lost the next bomber takes the lead, the route and the escort', () => {
    const { sim, group, bombers } = kette([{ x: 0, z: -3000 }, { x: -6000, z: -3000 }]);
    const escort = createPilot({ role: 'escort', leader: bombers[0], seed: 4 });
    group.escorts.push(escort);
    run(sim, 5);
    bombers[0].plane.damage.failed = { cause: 'The tail broke away', parts: ['tail'] };
    run(sim, 60);
    const [, lead, last] = bombers;
    expect(escort.leader).toBe(lead);
    expect(lead.pilot.state).toMatch(/^leading/);
    expect(group.leg).toBeGreaterThanOrEqual(1); // the new leader reached the first waypoint and turned for the next
    expect(flat(lead.plane.body.velocity).x).toBeLessThan(-0.8); // west, for the second
    // The last bomber moves up into the first wingman's place, on his own side of the new leader (no crossing over),
    // and has caught up with him again after the turn.
    run(sim, 30);
    expect(offSlot(lead, last, 1, 1, true)).toBeLessThan(40);
  });
});
