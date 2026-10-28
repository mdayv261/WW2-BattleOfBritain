// Fighter tactics (Phase 6 checkpoint 3, D81), in seeded fights run headless: skill tells; the Bf 109 fights by the
// Luftwaffe's doctrine (S22: height, no turning fights, climb away or push over to escape); a pilot breaks when fired
// on from behind; the Bf 110 meets an attacker seen early head-on (S25); out of ammunition, a fighter goes home; RAF
// fighters attack bombers from ahead or below (S29, S38); a Schwarm keeps its places.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation, levelThrottle } from '../../src/core/simulation.js';
import { Craft } from '../../src/core/craft.js';
import { createPilot } from '../../src/ai/pilots.js';
import { homeDirection } from '../../src/ai/tactics.js';
import { nextFighterScenario } from '../../src/core/scenarios.js';
import { slotPoint } from '../../src/ai/basic.js';
import { FORMATIONS } from '../../src/ai/formation.js';

const DT = 1 / 120;

/** A simulation with the player parked far away (out of every pilot's sight). */
function emptySky() {
  const sim = new Simulation(aircraftById.spitfire, 'air');
  const centre = sim.plane.body.position.clone();
  sim.plane.body.position.x += 100000;
  return { sim, centre };
}

/** An AI fighter of `id` and `skill` on `side` at `at` (Vector3), heading `heading`, flying `speed`. */
function fighter(sim, id, skill, side, at, heading, { seed = 1, speed = 110, role = 'fighter' } = {}) {
  const ac = aircraftById[id];
  const craft = new Craft(ac, {
    start: { altitude: at.y, speed, heading, throttle: levelThrottle(ac, at.y, speed, 1), rpm: 1, x: at.x, z: at.z },
    pilot: createPilot({ role, skill, seed }), side, skill, seed: seed + 7, label: `${id}-${skill}`,
  });
  sim.others.push(craft);
  return craft;
}

const lost = (sim, c) => !sim.others.includes(c) || c.abandoned || c.plane.damage.pilot <= 0 || c.pilot.home;

/** A 1 v 1 fight from 2.5 km apart, head-on; B starts `up` m higher. Returns the winner and how B flew. */
function duel(idA, skillA, idB, skillB, seed, up = 0) {
  const { sim, centre } = emptySky();
  const alt = centre.y + 500;
  const A = fighter(sim, idA, skillA, 'RAF', new Vector3(centre.x, alt, centre.z + 1250), 0, { seed: seed * 31 + 1 });
  const B = fighter(sim, idB, skillB, 'Luftwaffe', new Vector3(centre.x, alt + up, centre.z - 1250), Math.PI, { seed: seed * 31 + 2 });
  let above = 0;
  let n = 0;
  let run = 0;
  let longest = 0;
  let heading = null;
  for (let t = 0; t < 180; t += DT) {
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
  return { winner, above: above / n, longestTurn: longest };
}

describe('fighter tactics', () => {
  it('an Ace beats a Novice in most of six seeded Spitfire fights', () => {
    const wins = [1, 2, 3, 4, 5, 6].map((seed) => duel('spitfire', 'ace', 'spitfire', 'novice', seed).winner);
    expect(wins.filter((w) => w === 'A').length).toBeGreaterThanOrEqual(4);
  });

  it('a Bf 109 against a Hurricane keeps above it and never settles into a turning fight (S22)', () => {
    for (const seed of [1, 2, 3]) {
      const r = duel('hurricane', 'regular', 'bf109e4', 'regular', seed, 500);
      expect(r.above).toBeGreaterThan(0.6);
      expect(r.longestTurn).toBeLessThan(12);
    }
  });

  it('a pilot fired on from behind breaks; an Ace notices sooner than a Novice', () => {
    const firstEvade = (skill, seed) => {
      const { sim, centre } = emptySky();
      const prey = fighter(sim, 'spitfire', skill, 'RAF', centre.clone(), 0, { seed });
      const hunter = fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', centre.clone().add(new Vector3(0, 0, 300)), 0, { seed: seed + 50 });
      hunter.pilot.decide = () => ({ direction: prey.plane.body.position.clone().sub(hunter.plane.body.position).normalize(), gMax: 4, throttle: 1, fireMg: true });
      for (let t = 0; t < 10; t += DT) {
        sim.step(DT);
        if (prey.pilot.state === 'evade') return t;
      }
      return 10;
    };
    const ace = [1, 2, 3].map((s) => firstEvade('ace', s));
    const novice = [1, 2, 3].map((s) => firstEvade('novice', s));
    for (const t of ace) expect(t).toBeLessThan(1);
    expect(novice.reduce((a, b) => a + b, 0)).toBeGreaterThan(ace.reduce((a, b) => a + b, 0));
  });

  it('a Bf 109 with an enemy close behind pushes over (negative g) or rolls into a split-S', () => {
    const { sim, centre } = emptySky();
    centre.y += 1500;
    const prey = fighter(sim, 'bf109e4', 'ace', 'Luftwaffe', centre.clone(), 0, { seed: 4 });
    fighter(sim, 'spitfire', 'regular', 'RAF', centre.clone().add(new Vector3(0, 0, 250)), 0, { seed: 5 });
    let minG = 1;
    for (let t = 0; t < 5; t += DT) {
      sim.step(DT);
      minG = Math.min(minG, prey.plane.last?.loadFactor ?? 1);
    }
    expect(['push-over', 'split-S']).toContain(prey.pilot.tactic);
    if (prey.pilot.tactic === 'push-over') expect(minG).toBeLessThan(0);
  });

  it('a Bf 110 attacked from about 1,000 m turns to meet him head-on (S25)', () => {
    const { sim, centre } = emptySky();
    const prey = fighter(sim, 'bf110c4', 'ace', 'Luftwaffe', centre.clone(), 0, { seed: 6 });
    const hunter = fighter(sim, 'hurricane', 'regular', 'RAF', centre.clone().add(new Vector3(0, 0, 1050)), 0, { seed: 7, speed: 140 });
    hunter.pilot.decide = () => ({ direction: prey.plane.body.position.clone().sub(hunter.plane.body.position).normalize(), gMax: 4, throttle: 1 });
    let tactic = null;
    for (let t = 0; t < 4 && !tactic; t += DT) {
      sim.step(DT);
      if (prey.pilot.state === 'evade') tactic = prey.pilot.tactic;
    }
    expect(tactic).toBe('head-on');
    // Seen late, close behind, it climbs steeply to make him overshoot instead.
    const late = emptySky();
    const p2 = fighter(late.sim, 'bf110c4', 'ace', 'Luftwaffe', late.centre.clone(), 0, { seed: 6 });
    const h2 = fighter(late.sim, 'hurricane', 'regular', 'RAF', late.centre.clone().add(new Vector3(0, 0, 600)), 0, { seed: 7, speed: 140 });
    h2.pilot.decide = () => ({ direction: p2.plane.body.position.clone().sub(h2.plane.body.position).normalize(), gMax: 4, throttle: 1 });
    for (let t = 0; t < 2 && p2.pilot.state !== 'evade'; t += DT) late.sim.step(DT);
    expect(p2.pilot.tactic).toBe('zoom climb');
  });

  it('out of ammunition, a fighter disengages for home', () => {
    const { sim, centre } = emptySky();
    const c = fighter(sim, 'spitfire', 'regular', 'RAF', centre.clone(), 0, { seed: 8 });
    fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', centre.clone().add(new Vector3(0, 300, -2500)), Math.PI, { seed: 9 });
    for (const g of c.armament) g.rounds = 0;
    for (let t = 0; t < 20; t += DT) sim.step(DT);
    expect(c.pilot.state === 'disengage' || c.pilot.state === 'evade').toBe(true);
    const flat = c.plane.body.velocity.clone().setY(0).normalize();
    expect(flat.dot(homeDirection('RAF').setY(0).normalize())).toBeGreaterThan(0.5);
  });

  it('an RAF fighter attacks an He 111 from ahead or from below, not from level astern (S29, S38)', () => {
    const { sim, centre } = emptySky();
    const ac = aircraftById.he111h;
    const alt = centre.y + 800;
    const bomber = new Craft(ac, {
      start: { altitude: alt, speed: 80, heading: Math.PI / 2, throttle: levelThrottle(ac, alt, 80, 1), rpm: 1, x: centre.x, z: centre.z },
      pilot: createPilot({ role: 'bomber', seed: 3 }), side: 'Luftwaffe', seed: 4,
    });
    sim.others.push(bomber);
    // On its beam, 1.5 km out and 300 m below, flying the same way.
    const raf = fighter(sim, 'hurricane', 'ace', 'RAF', centre.clone().add(new Vector3(0, 500, 1500)), Math.PI / 2, { seed: 11 });
    let attacking = 0;
    let good = 0;
    for (let t = 0; t < 120; t += DT) {
      sim.step(DT);
      if (!sim.others.includes(bomber)) break;
      if (raf.pilot.state === 'attack') {
        attacking += 1;
        const rel = raf.plane.body.position.clone().sub(bomber.plane.body.position);
        const fwd = bomber.plane.body.velocity.clone().setY(0).normalize();
        if (rel.dot(fwd) > 0 || rel.y < -100) good += 1; // ahead of it, or well below
      }
    }
    expect(attacking).toBeGreaterThan(0);
    expect(good / attacking).toBeGreaterThan(0.8);
  });

  it('a Schwarm on patrol keeps its places within 50 m', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    for (let i = 0; i < 3; i += 1) nextFighterScenario(sim); // the Schwarm
    sim.plane.body.position.x += 100000; // the player out of sight: they patrol
    const [lead, ...wings] = sim.others;
    let worst = 0;
    for (let t = 0; t < 60; t += DT) {
      sim.step(DT);
      if (t > 10) for (const w of wings) worst = Math.max(worst, slotPoint(lead, w.pilot.slot).distanceTo(w.plane.body.position));
    }
    expect(FORMATIONS.schwarm).toHaveLength(4);
    expect(worst).toBeLessThan(50);
  });
});
