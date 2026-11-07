// The fighter's judgement of the enemy (D217): an enemy is a threat only if he can reach you; a pilot counts himself
// out-matched only within gun reach; the Bf 109 chooses its escape by the attacker's real climb, speed and carburettor
// (src/ai/performance.js); its zoom climbs smoothly; its dive gives up a chase it can't win, dives on a slow target
// even head-on, and doesn't start again within ZOOM_MIN of a zoom; in a fight a pilot uses +12 lb; and every pilot
// keeps within his diving limit and pulls out in time (D218).
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById, engineFor } from '../../src/aircraft/index.js';
import { threatens, GUN_REACH } from '../../src/ai/tactics.js';
import { escape109, zoomClimb } from '../../src/ai/fighter.js';
import { combatPerformance } from '../../src/ai/performance.js';
import { emptySky, fighter } from '../../src/dev/duels.js';
import { keepClear, keepInLimits, pullOutHeight } from '../../src/ai/basic.js';
import { equivalentAirspeed } from '../../src/physics/atmosphere.js';

const DT = 1 / 120;
const DEG = Math.PI / 180;

describe('a threat is one that can reach you', () => {
  // He flies north (-z) at 100 m/s at 2,000 m; enemies come from behind (+z).
  const body = { position: new Vector3(0, 2000, 0), velocity: new Vector3(0, 0, -100) };
  const behind = (z, y, speed) => {
    const position = new Vector3(0, y, z);
    return { position, velocity: body.position.clone().sub(position).normalize().multiplyScalar(speed) };
  };

  it('an enemy 600 m behind, closing, is a threat; one falling behind is not, until inside gun reach', () => {
    expect(threatens(body, behind(600, 2000, 110))).toBe(true);
    expect(threatens(body, behind(600, 2000, 90))).toBe(false);
    expect(threatens(body, behind(GUN_REACH - 100, 2000, 90))).toBe(true);
  });

  it('a slow enemy 500 m below is no threat; a fast one, with the energy to zoom up, is', () => {
    expect(threatens(body, behind(300, 1500, 42))).toBe(false);
    expect(threatens(body, behind(300, 1500, 150))).toBe(true);
  });
});

describe('the Bf 109\'s escape, by what the attacker can do', () => {
  const at = (id, y = 2000) => ({ ac: aircraftById[id], plane: { body: { position: new Vector3(0, y, 0) }, engine: engineFor(aircraftById[id]) } });
  const me = at('bf109e4');

  it('the model: at 2,000 m a +12 lb Spitfire and Hurricane out-climb the 109, which out-climbs the Bf 110', () => {
    const climb = (id) => combatPerformance(aircraftById[id], 2000).climb;
    expect(climb('spitfire')).toBeGreaterThan(climb('bf109e4'));
    expect(climb('hurricane')).toBeGreaterThan(climb('bf109e4'));
    expect(climb('bf109e4')).toBeGreaterThan(climb('bf110c4') + 1);
  });

  it('climbs away only from one that climbs worse (S22\'s escape, D217)', () => {
    expect(escape109(me, at('bf110c4'), 600, 2000, 0.9)).toBe('climb away');
    for (const id of ['spitfire', 'hurricane']) expect(escape109(me, at(id), 600, 2000, 0.9)).not.toBe('climb away');
  });

  it('pushes over only from a carburettor engine (the Merlin); from another 109, a split-S or a break', () => {
    expect(escape109(me, at('spitfire'), 300, 1200, 0.9)).toBe('push-over');
    expect(escape109(me, at('spitfire'), 300, 2000, 0.1)).toBe('split-S');
    expect(escape109(me, at('bf109e4'), 300, 2000, 0.9)).toBe('split-S');
    expect(escape109(me, at('bf109e4'), 300, 1200, 0.9)).toBe('break');
  });

  it('low down, extends only from one that is slower here, else breaks', () => {
    const speed = (id) => combatPerformance(aircraftById[id], 2000).speed;
    expect(escape109(me, at('hurricane'), 300, 500, 0.9)).toBe(speed('bf109e4') > speed('hurricane') ? 'extend' : 'break');
    expect(escape109(me, at('spitfire'), 300, 500, 0.9)).toBe(speed('bf109e4') > speed('spitfire') ? 'extend' : 'break');
  });
});

describe('the Bf 109\'s zoom and dive', () => {
  it('the zoom\'s climb angle runs smoothly with speed, 12° at 290 km/h, between level and 24°', () => {
    expect(zoomClimb(80.5)).toBeCloseTo(12 * DEG, 6);
    let last = zoomClimb(40);
    for (let v = 41; v < 160; v += 1) {
      const c = zoomClimb(v);
      expect(c).toBeGreaterThanOrEqual(last);
      expect(c - last).toBeLessThan(1.2 * DEG);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(24 * DEG + 1e-9);
      last = c;
    }
  });

  /** A 109 Regular and a Spitfire set where `place` puts them; the 109's view of the Spitfire. */
  function setUp(place) {
    const { sim, centre } = emptySky();
    const me = fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', centre.clone(), 0);
    const foe = fighter(sim, 'spitfire', 'regular', 'RAF', centre.clone(), 0);
    place(me.plane.body, foe.plane.body, centre);
    me.pilot.state = 'engage'; // already fighting him by boom-and-zoom
    me.pilot.tactic = 'boom-and-zoom';
    const target = () => ({ craft: foe, position: foe.plane.body.position.clone(), velocity: foe.plane.body.velocity.clone(),
      range: foe.plane.body.position.distanceTo(me.plane.body.position) });
    return { sim, me, target };
  }

  it('a dive with no height to spare that can\'t close goes back to the zoom', () => {
    const { sim, me, target } = setUp((mine, his, c) => {
      mine.position.copy(c).add(new Vector3(0, -300, 1500)); // below and behind
      mine.velocity.set(0, 0, -100);
      his.position.copy(c);
      his.velocity.set(0, 0, -100); // as fast: no closing
    });
    me.pilot.phase = 'dive';
    me.pilot.boomAndZoom(me, target(), sim);
    expect(me.pilot.phase).toBe('zoom');
  });

  it('dives on a slow target climbing head-on at it, but not on a fast one coming head-on', () => {
    for (const [speed, phase] of [[55, 'dive'], [110, 'zoom']]) {
      const { sim, me, target } = setUp((mine, his, c) => {
        mine.position.copy(c).add(new Vector3(0, 900, -1500)); // well above, ahead
        mine.velocity.set(0, 0, 100); // flying south, towards him
        his.position.copy(c);
        his.velocity.copy(mine.position.clone().sub(his.position).normalize().multiplyScalar(speed)); // nose on, climbing
      });
      me.pilot.phase = null;
      me.pilot.boomAndZoom(me, target(), sim);
      expect(me.pilot.phase).toBe(phase);
    }
  });

  it('after a zoom begins, waits ZOOM_MIN (3 s) before the next dive', () => {
    const { sim, me, target } = setUp((mine, his, c) => {
      mine.position.copy(c).add(new Vector3(0, 1500, 1500)); // far above, behind him: a dive is on
      mine.velocity.set(0, 0, -100);
      his.position.copy(c);
      his.velocity.set(0, 0, -100);
    });
    me.pilot.phase = 'zoom';
    me.pilot.zoomSince = sim.clock - 1;
    me.pilot.boomAndZoom(me, target(), sim);
    expect(me.pilot.phase).toBe('zoom');
    me.pilot.zoomSince = sim.clock - 4;
    me.pilot.boomAndZoom(me, target(), sim);
    expect(me.pilot.phase).toBe('dive');
  });
});

describe('out-matched, and +12 lb in a fight', () => {
  /** An Ace Hurricane flying north with a Regular 109 `back` m behind, closing at 10 m/s, for `seconds`. */
  function chased(back, seconds) {
    const { sim, centre } = emptySky();
    const me = fighter(sim, 'hurricane', 'ace', 'RAF', centre.clone(), 0, { speed: 100 });
    const foe = fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', centre.clone().add(new Vector3(0, 0, back)), 0, { speed: 110 });
    foe.pilot.fly = () => {}; // the attacker just flies on, holding his course
    for (let t = 0; t < seconds; t += DT) sim.step(DT);
    return me;
  }

  it('an enemy closing from beyond gun reach makes him evade, but doesn\'t count towards going home', () => {
    const me = chased(750, 1);
    expect(me.pilot.state).toBe('evade');
    expect(me.pilot.outmatched).toBe(0);
  });

  it('within gun reach the out-matched count fills', () => {
    expect(chased(300, 1).pilot.outmatched).toBeGreaterThan(0);
  });

  it('pulls the boost cut-out (+12 lb) in a fight, and not on patrol', () => {
    expect(chased(750, 1).input.emergency).toBe(true);
    const { sim, centre } = emptySky();
    const alone = fighter(sim, 'spitfire', 'regular', 'RAF', centre.clone(), 0);
    for (let t = 0; t < 1; t += DT) sim.step(DT);
    expect(alone.pilot.state).toBe('patrol');
    expect(alone.input.emergency).toBe(false);
  });
});

describe('diving limits and pull-outs (D218)', () => {
  /** A Regular Bf 109 at `altitude`, diving at `dive` (rad) at `speed` (m/s, true). */
  function diving(altitude, dive, speed) {
    const { sim, centre } = emptySky();
    const craft = fighter(sim, 'bf109e4', 'regular', 'Luftwaffe', new Vector3(centre.x, altitude, centre.z), 0);
    craft.plane.body.velocity.set(0, -Math.sin(dive), -Math.cos(dive)).multiplyScalar(speed);
    return { sim, craft };
  }
  const steepDown = () => ({ direction: new Vector3(0, -Math.sin(60 * DEG), -Math.cos(60 * DEG)), push: true, gMin: -1.5, gMax: 1, throttle: 1 });

  it('near his diving limit, a steep goal is raised to 10° down, the push ended and the throttle back', () => {
    const limit = aircraftById.bf109e4.limits.diveEas;
    const { craft } = diving(3000, 30 * DEG, 0);
    const tas = (eas) => { // the true speed for an equivalent airspeed at 3,000 m, by bisection
      let lo = eas;
      let hi = 2 * eas;
      for (let i = 0; i < 40; i += 1) { const mid = (lo + hi) / 2; if (equivalentAirspeed(mid, 3000) < eas) lo = mid; else hi = mid; }
      return lo;
    };
    craft.plane.body.velocity.set(0, -0.5, -0.866).multiplyScalar(tas(0.95 * limit));
    const g = keepInLimits(craft, steepDown());
    expect(g.direction.y).toBeGreaterThanOrEqual(-Math.sin(10 * DEG) - 1e-9);
    expect(g.push).toBe(false);
    expect(g.gMax).toBeGreaterThan(4);
    expect(g.throttle).toBeLessThanOrEqual(0.3);
    expect(g.emergency).toBe(false);
    craft.plane.body.velocity.set(0, -0.5, -0.866).multiplyScalar(tas(0.5 * limit));
    const slow = steepDown();
    expect(keepInLimits(craft, slow)).toBe(slow);
  });

  it('the ground floor allows more for a fast, steep dive than a slow, shallow one', () => {
    expect(pullOutHeight(diving(3000, 60 * DEG, 250).craft)).toBeGreaterThan(5 * pullOutHeight(diving(3000, 20 * DEG, 120).craft));
    expect(pullOutHeight(diving(3000, 0, 150).craft)).toBe(0);
  });

  it('a Bf 109 told to keep diving at 60° from 4,000 m pulls out, without passing 750 km/h or hitting the ground', () => {
    const { sim, craft } = diving(4000, 0, 110);
    craft.pilot.decide = (c, s) => keepClear(c, s, steepDown());
    let fastest = 0;
    let lowest = Infinity;
    for (let t = 0; t < 40; t += DT) {
      sim.step(DT);
      const b = craft.plane.body;
      fastest = Math.max(fastest, equivalentAirspeed(b.velocity.length(), b.position.y));
      lowest = Math.min(lowest, b.position.y - sim.world.terrain.surfaceAt(b.position.x, b.position.z).height);
    }
    expect(sim.others.includes(craft)).toBe(true);
    expect(lowest).toBeGreaterThan(50);
    expect(fastest).toBeLessThan(aircraftById.bf109e4.limits.diveEas);
  });
});
