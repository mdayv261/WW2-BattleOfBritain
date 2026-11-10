// The Bf 110's crew positions (Phase 7 checkpoint 7, D234): Tab swaps the player between the pilot's seat and the rear
// gun; on the gun an AI pilot flies (both engines on his throttle, automatic pitch), the player's aim and trigger work
// the MG 15, and back in the seat the controls are the player's again.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { aircraftById } from '../../src/aircraft/index.js';
import { Simulation } from '../../src/core/simulation.js';
import { swapSeat, rearGun } from '../../src/core/crewSeat.js';
import { DefensivePilot } from '../../src/ai/defensive.js';

const DT = 1 / 120;

describe('the Bf 110 crew positions', () => {
  it('swap only in the Bf 110, and every flight starts in the pilot\'s seat', () => {
    const spit = new Simulation(aircraftById.spitfire, 'air');
    expect(swapSeat(spit)).toBe('');
    expect(spit.seat).toBe('pilot');
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    expect(rearGun(sim).spec.type).toBe('mg15');
    expect(swapSeat(sim)).toMatch(/On the rear gun/);
    expect(sim.seat).toBe('gunner');
    expect(sim.relief).toBeInstanceOf(DefensivePilot);
    expect(swapSeat(sim)).toMatch(/pilot's seat/);
    expect([sim.seat, sim.relief, sim.player.gunnery.manned]).toEqual(['pilot', null, null]);
    swapSeat(sim);
    sim.reset();
    expect(sim.seat).toBe('pilot');
  });

  it('can\'t be swapped to a wounded gunner\'s gun; a gunner hit while manned sends the player back', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    const seat = rearGun(sim).spec.gunner;
    sim.plane.damage.crew = { ...(sim.plane.damage.crew ?? {}), [seat]: 0 };
    expect(swapSeat(sim)).toMatch(/out of action/);
    expect(sim.seat).toBe('pilot');
    const again = new Simulation(aircraftById.bf110c4, 'air');
    swapSeat(again);
    again.plane.damage.crew = { ...(again.plane.damage.crew ?? {}), [seat]: 0 };
    again.step(DT);
    expect(again.seat).toBe('pilot');
    expect(again.notice.text).toMatch(/back in the pilot's seat/);
  });

  it('on the gun, the AI flies the aircraft level within 150 m for a minute, on both engines, with automatic pitch', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    swapSeat(sim);
    const y0 = sim.plane.body.position.y;
    let worst = 0;
    for (let i = 0; i < 120 * 60; i += 1) {
      sim.step(DT);
      worst = Math.max(worst, Math.abs(sim.plane.body.position.y - y0));
    }
    expect(worst).toBeLessThan(150);
    expect(sim.crashed).toBe(false);
    expect(sim.input.engineAssist).toBe(true);
    for (const e of sim.input.engines) expect(e.throttle).toBeCloseTo(sim.input.throttle, 6);
  });

  it('on the gun the player\'s aim and trigger work the MG 15, not the nose guns; back in the seat the AI lets go', () => {
    const sim = new Simulation(aircraftById.bf110c4, 'air');
    swapSeat(sim);
    const gun = rearGun(sim);
    // Aim 20° to the right of dead astern and 20° up, and fire.
    const az = Math.PI - 0.35;
    sim.gunControl.aim = new Vector3(Math.cos(0.35) * Math.cos(az), Math.sin(0.35), Math.cos(0.35) * Math.sin(az));
    sim.gunControl.trigger = true;
    sim.input.fireMg = true; // as if a key had set it: the pilot doesn't use the nose guns
    for (let i = 0; i < 120 * 2; i += 1) sim.step(DT);
    expect(gun.bore.angleTo(sim.gunControl.aim)).toBeLessThan(0.01);
    expect(gun.rounds).toBeLessThan(gun.capacity);
    expect(sim.armament.every((g) => g.rounds === g.capacity)).toBe(true);
    swapSeat(sim);
    sim.input.pitch = 0.3;
    sim.step(DT);
    expect(sim.input.pitch).toBe(0.3); // nobody but the player writes the controls now
  });
});
