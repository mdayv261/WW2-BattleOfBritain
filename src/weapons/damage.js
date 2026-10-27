// Damage from hits (Phase 5, D68). A round striking a hit zone damages one component in it, picked by weight with the
// aircraft's seeded random generator (the product owner's choice, D59); a 20 mm HE shell also damages a second.
// Every effect goes through the existing models:
//   engine -> wear (src/physics/cooling.js, D62): power loss, then seizure
//   coolant, oil -> leaks: the heat model overheats the engine, or oil starvation wears it out
//   fuel tank -> incendiaries may start a fire (less likely in self-sealing tanks); a fire burns until the aircraft
//     breaks up
//   pilot -> wounds, then death; rear armour stops rifle-calibre ball and incendiaries from behind, AP gets through fast
//   control cables, aileron, elevator, rudder -> loss of control effect (src/physics/structure.js)
//   wing panels -> lift lost and drag added on that panel (src/physics/aero.js): the aircraft rolls; full damage breaks
//     the wing
//   tail structure -> breaks up; flaps and undercarriage -> jammed
// Which zones hold the aircraft's tanks, radiators and oil coolers is aircraft data (`systems`); weights and amounts are
// estimates in common.damage.

import { Vector3 } from 'three';
import { common } from '../aircraft/common.js';
import { roundTypes } from '../aircraft/ammunition.js';
import { pickWeighted } from './random.js';

/** The weighted components of a zone on an aircraft, its systems included: { component: weight }. */
export function componentsOf(ac, zone) {
  const d = common.damage;
  const weights = { ...d.weights[zone.kind] };
  const sys = ac.systems ?? {};
  if (sys.fuel?.[zone.name]) weights.fuel = d.systemWeights.fuel;
  if (sys.coolant?.[zone.name] !== undefined) weights.coolant = (weights.coolant ?? 0) + d.systemWeights.coolant;
  if (sys.oil?.[zone.name] !== undefined) weights.oil = (weights.oil ?? 0) + d.systemWeights.oil;
  return weights;
}

/** The engine a hit on `component` in `zone` belongs to (its index). */
function engineOf(ac, zone, component) {
  const sys = ac.systems ?? {};
  if (component === 'coolant' && sys.coolant?.[zone.name] !== undefined) return sys.coolant[zone.name];
  if (component === 'oil' && sys.oil?.[zone.name] !== undefined) return sys.oil[zone.name];
  return zone.engine ?? 0;
}

const _dir = new Vector3();

/**
 * Applies a hit to an aircraft. `hit` = { zone, kind (round kind), velocity (the round's velocity relative to the
 * aircraft, world axes) }; `random()` is the aircraft's seeded generator. Returns a short description of what was hit.
 */
export function applyHit(plane, hit, random) {
  const round = roundTypes[hit.kind] ?? { strength: 1 };
  const strength = round.strength ?? 1;
  const dmg = plane.damage;
  dmg.hits += 1;
  // Direction of travel in body axes: a round moving forward along the aircraft came from behind.
  _dir.copy(hit.velocity).applyQuaternion(plane.body.quaternion.clone().invert()).normalize();
  const speed = hit.velocity.length();
  const what = [hurt(plane, hit.zone, pickWeighted(componentsOf(plane.ac, hit.zone), random), round, strength, _dir, speed, random)];
  if (round.he) what.push(hurt(plane, hit.zone, pickWeighted(componentsOf(plane.ac, hit.zone), random), round, strength / 2, _dir, speed, random));
  const text = what.filter((w) => w !== 'nothing').join(', ') || 'no vital part';
  dmg.log.unshift({ time: plane.time, zone: hit.zone.name, text });
  dmg.log.length = Math.min(dmg.log.length, 6);
  return text;
}

/** Damages one component with a hit of `strength`; returns its name (or what stopped the round). */
export function hurt(plane, zone, component, round, strength, dir, speed, random) {
  const d = common.damage;
  const dmg = plane.damage;
  switch (component) {
    case 'engine': {
      const e = plane.engines[engineOf(plane.ac, zone, component)];
      if (e) e.heat.wear += d.engineWear * strength;
      if (e && round.incendiary && random() < d.engineFireChance * round.incendiary) startFire(dmg, 'engine fire', zone);
      return 'engine';
    }
    case 'coolant': {
      const e = plane.engines[engineOf(plane.ac, zone, component)];
      if (e) e.heat.coolantLeak += d.leakRate * strength;
      return 'coolant';
    }
    case 'oil': {
      const e = plane.engines[engineOf(plane.ac, zone, component)];
      if (e) e.heat.oilLeak += d.leakRate * strength;
      return 'oil';
    }
    case 'fuel': {
      const tank = plane.ac.systems.fuel[zone.name];
      if (round.incendiary && random() < d.fireChance[tank] * round.incendiary) startFire(dmg, 'fuel fire', zone);
      return `fuel tank (${tank})`;
    }
    case 'pilot': {
      const armour = plane.ac.systems?.armour ?? 0;
      const fromBehind = dir.x > Math.cos(d.armourArc);
      if (armour > 0 && fromBehind && !(round.ap && speed > d.apPenetrationSpeed)) return 'armour';
      dmg.pilot -= d.pilotWound * Math.sqrt(strength);
      if (dmg.pilot <= 0) dmg.failed ??= { cause: 'The pilot was killed', pilotKilled: true, parts: [] };
      return dmg.pilot <= 0 ? 'pilot killed' : 'pilot wounded';
    }
    case 'cables': {
      const which = ['aileron', 'elevator', 'rudder'][Math.floor(random() * 3)];
      if (random() < Math.min(1, d.cableCut * strength)) dmg.controls[which] = 0;
      return `${which} cable`;
    }
    case 'aileron':
    case 'elevator':
    case 'rudder':
      dmg.controls[component] = Math.max(0, dmg.controls[component] - d.surfaceLoss * strength);
      return component;
    case 'wing': {
      const panel = zone.kind === 'wingOuter' ? 1 : 0;
      const side = zone.side < 0 ? 0 : 1;
      dmg.wing[side][panel] = Math.min(1, dmg.wing[side][panel] + d.wingDamage * strength);
      if (dmg.wing[side][panel] >= 1) fail(dmg, { cause: `The ${side ? 'right' : 'left'} wing broke`, parts: [side ? 'wingRight' : 'wingLeft'] });
      return `${side ? 'right' : 'left'} wing`;
    }
    case 'tailStructure':
      dmg.tail = Math.min(1, dmg.tail + d.tailDamage * strength);
      if (dmg.tail >= 1) fail(dmg, { cause: 'The tail broke away', parts: ['tail'] });
      return 'tail';
    case 'flap':
      dmg.flapsJammed = true;
      return 'flaps';
    case 'gear':
      dmg.gearJammed = true;
      return 'undercarriage';
    default:
      return 'nothing';
  }
}

/**
 * Records the aircraft's loss, unless it is already lost; an aircraft whose pilot was killed (still flying, uncontrolled)
 * can still break up.
 */
function fail(dmg, failure) {
  if (!dmg.failed || dmg.failed.pilotKilled) dmg.failed = failure;
}

/** Starts a fire (if none is burning) in a zone; the zone is kept for the flames and smoke (D69). */
function startFire(dmg, kind, zone) {
  dmg.fire ??= { kind, time: 0, zone: zone.name };
}

/** Advances the damage that grows by itself: a fire burns until the aircraft breaks up. */
export function stepDamage(plane, dt) {
  const dmg = plane.damage;
  if (dmg.fire) {
    dmg.fire.time += dt;
    if (dmg.fire.time > common.damage.fireTime) {
      fail(dmg, { cause: `Destroyed by an ${dmg.fire.kind === 'engine fire' ? 'engine' : 'fuel'} fire`, parts: burntAway(dmg.fire.zone) });
    }
  }
}

/**
 * The part a fire burns away when the aircraft breaks up (D69): a wing (or a twin's nacelle) takes its wing half off,
 * the fuselage its tail; a fire in a single's engine leaves the airframe whole.
 */
export function burntAway(zone = '') {
  if (/Left$/.test(zone)) return ['wingLeft'];
  if (/Right$/.test(zone)) return ['wingRight'];
  return zone === 'engine' ? [] : ['tail'];
}

/** A one-line summary of an aircraft's damage for the readouts ("" when undamaged). */
export function damageSummary(plane) {
  const dmg = plane.damage;
  const parts = [];
  plane.engines.forEach((e, i) => {
    const name = plane.engines.length > 1 ? ['L engine', 'R engine'][i] : 'engine';
    if (e.heat.wear > 0.05) parts.push(`${name} ${(e.heat.wear * 100).toFixed(0)}% worn`);
    if (e.heat.coolantLeak > 0) parts.push(`${name} coolant leaking (${(e.heat.coolantLeft * 100).toFixed(0)}% left)`);
    if (e.heat.oilLeak > 0) parts.push(`${name} oil leaking (${(e.heat.oilLeft * 100).toFixed(0)}% left)`);
    if (e.heat.seized) parts.push(`${name} seized`);
  });
  dmg.wing.forEach((side, s) => side.forEach((v, p) => {
    if (v > 0) parts.push(`${s ? 'R' : 'L'} wing ${p ? 'outer' : 'inner'} ${(v * 100).toFixed(0)}%`);
  }));
  for (const [c, v] of Object.entries(dmg.controls)) if (v < 1) parts.push(`${c} ${(v * 100).toFixed(0)}%`);
  if (dmg.tail > 0) parts.push(`tail ${(dmg.tail * 100).toFixed(0)}%`);
  if (dmg.pilot < 1) parts.push(dmg.pilot <= 0 ? 'pilot killed' : 'pilot wounded');
  if (dmg.fire) parts.push(`ON FIRE (${dmg.fire.kind})`);
  if (dmg.gearJammed) parts.push('undercarriage jammed');
  if (dmg.flapsJammed) parts.push('flaps jammed');
  return parts.join(', ');
}
