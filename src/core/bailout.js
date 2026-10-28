// Bailing out (Phase 6, D80). A crew abandon an aircraft that is lost (broken up, on fire, or its elevator gone) and,
// for the AI, one that is badly damaged (every engine dead or dying, a control surface gone, a wing panel or the tail
// half destroyed). The crew decide after their reaction time; each living man then leaves at his own exit time
// (the aircraft's `crew` data), from the aircraft or, if it has broken up, from its falling wreck. Anyone still aboard
// when it reaches the ground is lost. A killed pilot does not jump. The thresholds are game-design values.
//
// A bail-out is { label, side, player, men: [{ seat, at (sim clock) }], body: () => the body they leave from or null,
// jumped, lost }; sim.bailouts holds those under way and sim.jumpers the men in the air (src/core/parachute.js).

import { createJumper, seatPosition, stepJumpers } from './parachute.js';
import { SKILLS } from '../ai/skill.js';
import { crewHealth } from '../weapons/damage.js';

const HALF = 0.5; // the damage at which a wing panel or the tail counts as badly damaged
const LOW = 0.05; // the coolant or oil left at which an engine is as good as dead
export const BREAK_UP_EXIT = 0.5; // the share of the usual exit time a man has to get out of a broken-up aircraft
export const HOLD_TO_BAIL = 1; // s the bail-out key or button is held before the player goes

/** True when the aircraft is lost: broken up, on fire, or without its elevator. */
export function doomed(plane) {
  const d = plane.damage;
  return (!!d.failed && !d.failed.pilotKilled) || !!d.fire || d.controls.elevator === 0;
}

/** True when the aircraft is badly damaged (the AI's reason to go): engines dead or dying, controls or structure gone. */
export function badlyDamaged(plane) {
  const d = plane.damage;
  const dead = (e) => e.heat.seized || e.heat.coolantLeft <= LOW || e.heat.oilLeft <= LOW;
  if (plane.engines.every(dead)) return true;
  if (Object.values(d.controls).some((c) => c === 0)) return true;
  return d.tail >= HALF || d.wing.some((side) => side.some((panel) => panel >= HALF));
}

/**
 * Starts a crew bailing out of an aircraft of type `ac`: those still alive leave one after another, after `delay` s,
 * each at his exit time times `scale`. `body()` gives what they jump from (null once it is gone); `plane`, when given,
 * says which crewmen have been killed.
 */
export function startBailout(sim, { ac, side, label, body, delay = 0, scale = 1, player = false, pilotAlive = true, plane = null }) {
  // A killed crewman (D83) doesn't jump.
  const men = ac.crew
    .filter((m, i) => (m.role === 'pilot' ? pilotAlive : !plane || crewHealth(plane, i) > 0))
    .map((m) => ({ seat: m, at: sim.clock + delay + m.exit * scale }));
  const b = { label, side, player, men, body, jumped: 0, lost: 0 };
  sim.bailouts.push(b);
  return b;
}

/** The AI crew's decision delay: their skill's reaction time. */
export const decisionDelay = (craft) => SKILLS[craft.skill]?.reaction ?? 0.35;

/**
 * Advances the bail-outs under way: each man due leaves (a jumper at his seat, with the aircraft's velocity), unless
 * what he leaves from has gone, when he is lost. Finished bail-outs are reported and dropped. Then the jumpers fall.
 */
export function stepBailouts(sim, dt) {
  for (const b of sim.bailouts) {
    const body = b.body();
    for (const m of b.men) {
      if (m.done) continue;
      if (!body) {
        m.done = true;
        b.lost += 1;
      } else if (sim.clock >= m.at) {
        m.done = true;
        b.jumped += 1;
        const jumper = createJumper({ position: seatPosition(body, m.seat), velocity: body.velocity, quaternion: body.quaternion, side: b.side, label: b.label, player: b.player && m.seat.role === 'pilot' });
        sim.jumpers.push(jumper);
        if (jumper.player) sim.playerJumped(jumper);
      }
    }
  }
  for (const b of sim.bailouts) {
    if (b.reported || !b.men.every((m) => m.done)) continue;
    b.reported = true;
    if (b.player) continue;
    if (b.jumped) {
      const who = b.men.length === 1 ? 'pilot' : `${b.jumped} crew`;
      sim.notice = { text: `${b.label}: ${who} bailed out`, until: sim.plane.time + 4 };
    }
  }
  sim.bailouts = sim.bailouts.filter((b) => !b.reported);
  sim.jumpers = stepJumpers(sim.jumpers, dt, sim.world.terrain);
}

/** What the player's crew jump from: the aircraft, or its wreck, until it reaches the ground. */
const playerBody = (sim) => () => (sim.plane.ground.crash || sim.wreck?.landed ? null : sim.plane.body);

/**
 * The player's bail-out (D80): automatic once the aircraft is lost, or after the bail-out key or button has been held
 * for HOLD_TO_BAIL s. The crew go at their exit times (half of them from a broken-up aircraft); the flight goes on
 * until the pilot has jumped.
 */
export function playerBailout(sim, dt) {
  sim.bailHold = sim.input.bailOut ? (sim.bailHold ?? 0) + dt : 0;
  if (sim.bailout || sim.plane.damage.pilot <= 0) return;
  const broken = !!sim.plane.damage.failed && !sim.plane.damage.failed.pilotKilled;
  if (!doomed(sim.plane) && sim.bailHold < HOLD_TO_BAIL) return;
  sim.bailout = startBailout(sim, {
    ac: sim.ac, side: sim.ac.side, label: 'You', body: playerBody(sim), player: true, scale: broken ? BREAK_UP_EXIT : 1, plane: sim.plane,
  });
  sim.notice = { text: 'Bailing out!', until: sim.plane.time + 3 };
}

/** The player's pilot has jumped: the flight ends, the aircraft flies on without him, the view follows him down. */
export function playerJumped(sim, jumper) {
  sim.playerJumper = jumper;
  if (!sim.crashed) {
    sim.crashed = true;
    sim.uncontrolled = { ...sim.input, fireMg: false, fireCannon: false };
  }
  sim.crashCause = 'You bailed out';
}

/** Once the player's parachutist is down, the message says how he came down. */
export function playerLanding(sim) {
  const j = sim.playerJumper;
  if (!j?.landedAt || sim.landingReported) return;
  sim.landingReported = true;
  sim.crashCause = { landed: 'Landed by parachute', sea: 'Came down in the Channel', killed: 'Killed: the parachute had not opened' }[j.state];
}
