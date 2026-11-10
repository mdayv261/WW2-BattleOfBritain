// Overspeed (Phase 8 checkpoint 3, D240): above its red line (maxSpeed) an engine may run for its sourced allowance
// (the Merlin 20 s, S6; the DB 601A 30 s, S18; the Jumo 211 an estimate); past it, it wears; back under the red line
// the allowance returns. Past the diving limit it wears fast, as before (D62). The overspeed warning (an assist, off by
// default) sounds over the red line and near the airframe's diving limit.
import { describe, it, expect } from 'vitest';
import { aircraftById, engines } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';
import { common } from '../../src/aircraft/common.js';
import { createHeat, stepHeat } from '../../src/physics/cooling.js';
import { Simulation } from '../../src/core/simulation.js';
import { NO_ASSISTS, warnings, ASSIST } from '../../src/core/assists.js';

const DT = 1 / 120;

/** An engine of `ac` run at `rpm` for `seconds` (cool and idle, so only the speed wears it): its heat state. */
function run(ac, rpm, seconds, heat = createHeat(70, 60)) {
  const engine = engines[ac.engine];
  const e = { omega: rpm * UNIT.RPM, slipQ: 0, heat };
  for (let t = 0; t < seconds; t += DT) stepHeat(ac, engine, e, { altitude: 3000, q: 6000, radiator: 1, power: 0 }, DT);
  return heat;
}

describe('overspeed', () => {
  it('the allowances are the sources\' (Merlin 20 s, DB 601A 30 s)', () => {
    expect(engines.merlin3.heat.overRevTime).toBe(20);
    expect(engines.db601a.heat.overRevTime).toBe(30);
    expect(engines.jumo211f.heat.overRevTime).toBe(30);
  });

  it('no wear at or under the red line, nor over it within the allowance; wear beyond it', () => {
    const spit = aircraftById.spitfire;
    expect(run(spit, 3000, 120).wear).toBe(0);
    expect(run(spit, 3010, 120).wear).toBe(0); // within the governor's margin
    expect(run(spit, 3300, 19).wear).toBe(0);
    const worn = run(spit, 3300, 50).wear;
    expect(worn).toBeCloseTo(30 / common.engineWear.overTimeLife, 1);
    const bf109 = aircraftById.bf109e4;
    expect(run(bf109, 2450, 29).wear).toBe(0);
    expect(run(bf109, 2450, 40).wear).toBeGreaterThan(0.05);
  });

  it('the allowance comes back while under the red line', () => {
    const spit = aircraftById.spitfire;
    const heat = run(spit, 3300, 15);
    run(spit, 2800, 15, heat);
    expect(heat.overTime).toBe(0);
    run(spit, 3300, 15, heat);
    expect(heat.wear).toBe(0);
  });

  it('past the diving limit it wears fast, as before', () => {
    expect(run(aircraftById.spitfire, 3900, 5).wear).toBeGreaterThan(0.4);
  });

  it('the overspeed warning: off by default; over the red line, and near the diving limit', () => {
    const sim = new Simulation(aircraftById.spitfire, 'air');
    sim.step(DT);
    const on = { ...NO_ASSISTS, overspeedWarning: true };
    expect(NO_ASSISTS.overspeedWarning).toBe(false);
    expect(warnings(sim.ac, sim.plane, on)).toMatchObject({ overspeed: false, dive: false });
    sim.plane.engines[0].omega = 3200 * UNIT.RPM;
    expect(warnings(sim.ac, sim.plane, on).overspeed).toBe(true);
    expect(warnings(sim.ac, sim.plane, NO_ASSISTS).overspeed).toBe(false);
    sim.plane.engines[0].omega = 2900 * UNIT.RPM;
    sim.plane.last = { ...sim.plane.last, eas: ASSIST.diveShare * sim.ac.limits.diveEas + 1 };
    expect(warnings(sim.ac, sim.plane, on)).toMatchObject({ overspeed: false, dive: true });
  });
});
