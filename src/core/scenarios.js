// Scenario keys for trying the AI in the test flight (Phase 6, D76, D79), replaced by Phase 7's mission setup. The enemy
// is the other side from the player's aircraft. Each scenario replaces the last; there are never more than MAX_AI
// aircraft.
//   6: fighters in turn: one, a pair, a section of four, (RAF player) a pair of Bf 110s; about 2.5 km ahead and 500 m
//      higher, flying towards the player.
//   7: a bomber formation: an He 111 Kette crossing ahead with a Rotte of Bf 109s as escort (RAF player); or a friendly
//      Kette ahead with three Hurricanes coming to attack it (Luftwaffe player).
//   8: the AI's skill in turn, for every AI aircraft now and next.
//   0: clear every AI aircraft.

import { Vector3 } from 'three';
import { aircraftById } from '../aircraft/index.js';
import { common } from '../aircraft/common.js';
import { attitude } from './autopilot.js';
import { Craft } from './craft.js';
import { levelThrottle } from './simulation.js';
import { coolantLimit } from '../physics/cooling.js';
import { formationSpeed } from '../ai/basic.js';
import { createPilot } from '../ai/pilots.js';
import { FORMATIONS } from '../ai/formation.js';

export { FORMATIONS };
import { SKILLS, nextSkill } from '../ai/skill.js';

export const MAX_AI = 11; // with the player, 12 aircraft (D76)

const F = common.formations;

export const FIGHTER_SCENARIOS = {
  RAF: [ // the player flies an RAF fighter: Luftwaffe enemies
    { name: 'one Bf 109', id: 'bf109e4', formation: 'single' },
    { name: 'a Rotte of Bf 109s', id: 'bf109e4', formation: 'rotte' },
    { name: 'a Schwarm of Bf 109s', id: 'bf109e4', formation: 'schwarm' },
    { name: 'two Bf 110s', id: 'bf110c4', formation: 'rotte' },
  ],
  Luftwaffe: [ // the player flies a Luftwaffe aircraft: RAF enemies
    { name: 'one Spitfire', id: 'spitfire', formation: 'single' },
    { name: 'a vic of Hurricanes', id: 'hurricane', formation: 'vic' },
    { name: 'four Spitfires in line astern', id: 'spitfire', formation: 'lineAstern' },
  ],
};

const _f = new Vector3();
const _r = new Vector3();

/** The player's heading frame: forward and right unit vectors on the level, and the heading. */
function frame(sim) {
  const { heading } = attitude(sim.plane);
  return { heading, fwd: new Vector3(Math.sin(heading), 0, -Math.cos(heading)), right: new Vector3(Math.cos(heading), 0, Math.sin(heading)) };
}

/** A point from `origin` in a frame of `heading`: forward `ahead` m, right `side` m, up `up` m. */
function place(origin, heading, { ahead = 0, side = 0, up = 0 }) {
  _f.set(Math.sin(heading), 0, -Math.cos(heading));
  _r.set(Math.cos(heading), 0, Math.sin(heading));
  return origin.clone().addScaledVector(_f, ahead).addScaledVector(_r, side).add(new Vector3(0, up, 0));
}

/**
 * Puts a group of aircraft of type `id` in the air in `formation` around `origin` (the leader's place), all on `heading`,
 * flown by AI pilots of `role`. `leader`: the craft its places are kept from (an escort's bombers), else its own first.
 */
function spawnGroup(sim, { id, formation, origin, heading, role, side, speed, leader = null, offset = {} }) {
  const ac = aircraftById[id];
  const out = [];
  FORMATIONS[formation].forEach((slot, i) => {
    if (sim.others.length >= MAX_AI) return;
    const s = { side: (slot.side ?? 0) + (offset.side ?? 0), back: (slot.back ?? 0) + (offset.back ?? 0), up: (slot.up ?? 0) + (offset.up ?? 0) };
    const at = place(origin, heading, { ahead: -s.back, side: s.side, up: s.up });
    const ground = sim.world.terrain.surfaceAt(at.x, at.z).height;
    const altitude = Math.max(at.y, ground + 300);
    const throttle = levelThrottle(ac, altitude, speed, 1);
    sim.aiSeed = (sim.aiSeed ?? 100) + 1;
    const keeper = leader ?? out[0] ?? null;
    const pilot = createPilot({ role, skill: sim.skill, leader: i === 0 && !leader ? null : keeper, slot: s, seed: sim.aiSeed });
    const craft = new Craft(ac, {
      start: { altitude, speed, heading, throttle, rpm: 1, x: at.x, z: at.z, terrain: sim.world.terrain },
      pilot, side, skill: sim.skill, seed: sim.aiSeed, label: `${ac.name} #${sim.others.length + 1}`,
    });
    arriveCool(craft);
    sim.others.push(craft);
    out.push(craft);
  });
  return out;
}

/**
 * An aircraft arriving from its own approach has had its radiator open as its crew needed: one that would start hotter
 * than the AI's radiator rule allows (src/ai/pilot.js) starts with the radiator open, 20 °C under its coolant limit.
 */
function arriveCool(craft) {
  const limit = coolantLimit(craft.plane.engine, craft.plane.body.position.y);
  for (const e of craft.plane.engines) {
    if (e.heat.coolant > limit - 15) {
      e.heat.coolant = limit - 20;
      craft.input.radiator = 1;
    }
  }
}

const otherSide = (side) => (side === 'RAF' ? 'Luftwaffe' : 'RAF');

/** Takes every AI aircraft out of the sky (its crew with it: nobody bails out of an aircraft that has been cleared). */
function dropAll(sim) {
  for (const c of sim.others) c.gone = true;
  sim.others = [];
}

/** 6: the next fighter scenario for the player's side. Returns its notice. */
export function nextFighterScenario(sim) {
  const list = FIGHTER_SCENARIOS[sim.ac.side];
  sim.fighterIndex = ((sim.fighterIndex ?? -1) + 1) % list.length;
  const sc = list[sim.fighterIndex];
  dropAll(sim);
  const { heading, fwd } = frame(sim);
  const origin = sim.plane.body.position.clone().addScaledVector(fwd, 2500).add(new Vector3(0, 500, 0));
  spawnGroup(sim, { id: sc.id, formation: sc.formation, origin, heading: heading + Math.PI, role: 'fighter', side: otherSide(sim.ac.side), speed: 110 });
  sim.scenario = sc.name;
  return `Scenario: ${sc.name} (${SKILLS[sim.skill].name})`;
}

/** 7: a bomber formation with its escorts or attackers. Returns its notice. */
export function bomberScenario(sim) {
  dropAll(sim);
  const { heading, fwd, right } = frame(sim);
  const he111 = aircraftById.he111h;
  const p = sim.plane.body.position;
  if (sim.ac.side === 'RAF') {
    // An He 111 Kette crossing from left to right 3 km ahead, a Rotte of Bf 109s behind and above it (S38, D78).
    const origin = p.clone().addScaledVector(fwd, 3000).addScaledVector(right, -1500).add(new Vector3(0, 300, 0));
    const speed = formationSpeed(he111, origin.y);
    const kette = spawnGroup(sim, { id: 'he111h', formation: 'kette', origin, heading: heading + Math.PI / 2, role: 'bomber', side: 'Luftwaffe', speed });
    // The escorts' places include their distance behind and above the bombers, so they are placed from the Kette's origin.
    spawnGroup(sim, {
      id: 'bf109e4', formation: 'rotte', origin, heading: heading + Math.PI / 2, role: 'escort', side: 'Luftwaffe',
      speed, leader: kette[0], offset: { back: F.escort.behind, up: F.escort.above },
    });
    sim.scenario = 'He 111 Kette with Bf 109 escort';
  } else {
    // A friendly Kette 1 km ahead on the player's heading; three Hurricanes coming at it from 3 km beyond, 500 m higher.
    const origin = p.clone().addScaledVector(fwd, 1000);
    spawnGroup(sim, { id: 'he111h', formation: 'kette', origin, heading, role: 'bomber', side: 'Luftwaffe', speed: formationSpeed(he111, origin.y) });
    const raf = origin.clone().addScaledVector(fwd, 3000).add(new Vector3(0, 500, 0));
    spawnGroup(sim, { id: 'hurricane', formation: 'vic', origin: raf, heading: heading + Math.PI, role: 'fighter', side: 'RAF', speed: 110 });
    sim.scenario = 'Hurricanes attacking an He 111 Kette';
  }
  return `Scenario: ${sim.scenario} (${SKILLS[sim.skill].name})`;
}

/** 8: the next skill, for every AI pilot now and from now on. */
export function cycleSkill(sim) {
  sim.skill = nextSkill(sim.skill);
  for (const c of sim.others) {
    c.skill = sim.skill;
    c.pilot?.setSkill?.(sim.skill);
  }
  return `AI skill: ${SKILLS[sim.skill].name}`;
}

/** 0: clears every AI aircraft (wrecks already falling go on falling). */
export function clearAI(sim) {
  dropAll(sim);
  sim.scenario = null;
  return 'AI aircraft cleared';
}
