// The propeller arc and the outside views (D97): each airscrew's tip arc and disc show only while it spins, stronger
// from the cockpit; in the chase, fixed and orbit views the panel hides, the reticle stands where the guns converge, and
// a HUD on the right gives the readings in the side's units.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildAircraftModel, BLADES_UNTIL, DISC, TIPS } from '../../src/render/models/aircraftModel.js';
import { DESIGNS } from '../../src/render/models/designs.js';
import { chaseAim, reticleStyle } from '../../src/ui/reflectorSight.js';
import { hudLines, gearText } from '../../src/ui/flightHud.js';
import { panelHidden } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';
import { UNIT } from '../../src/core/constants.js';

describe('propeller arc (D97)', () => {
  const spin = (rpm, inside) => {
    const model = buildAircraftModel(aircraftById.bf109e4, DESIGNS.bf109e4);
    const plane = new Simulation(aircraftById.bf109e4, 'air').plane;
    plane.engines[0].omega = rpm * UNIT.RPM;
    model.update(plane, 0.01, { inside });
    return model.screws[0];
  };

  it('shows the tip arc and the disc only while the airscrew spins, the arc stronger from the cockpit', () => {
    const still = spin(BLADES_UNTIL - 100, true);
    expect(still.tips.material.opacity).toBe(0);
    expect(still.disc.material.opacity).toBe(0);
    expect(still.blades.visible).toBe(true);
    const inside = spin(2400, true);
    expect(inside.tips.material.opacity).toBeCloseTo(TIPS.inside, 9);
    expect(inside.disc.material.opacity).toBeCloseTo(DISC.inside, 9);
    expect(inside.blades.visible).toBe(false);
    expect(DISC.inside).toBeGreaterThan(0.06); // stronger than before D97
    const outside = spin(2400, false);
    expect(outside.tips.material.opacity).toBeCloseTo(TIPS.outside, 9);
  });
});

describe('outside views (D97)', () => {
  it('hide the panel; the cockpit shows it unless looking away or bailed out', () => {
    const sim = { playerJumper: null };
    expect(panelHidden({ inCockpit: false, lookingAway: false }, sim)).toBe(true);
    expect(panelHidden({ inCockpit: true, lookingAway: false }, sim)).toBe(false);
    expect(panelHidden({ inCockpit: true, lookingAway: true }, sim)).toBe(true);
    expect(panelHidden({ inCockpit: true, lookingAway: false }, { playerJumper: {} })).toBe(true);
  });

  it('put the reticle where the guns converge, seen from the chase camera, its ring the sight\'s mils', () => {
    const ac = aircraftById.spitfire;
    const camera = new THREE.PerspectiveCamera(60, 1600 / 900, 0.1, 5000);
    camera.position.set(-24, 6, 0); // behind and above the aircraft, as the chase view
    camera.lookAt(0, 0, 0);
    const level = new THREE.Quaternion();
    const aim = chaseAim(camera, new THREE.Vector3(0, 0, 0), level, ac, 1600, 900);
    const p = new THREE.Vector3(ac.harmonisation, 0, 0).project(camera);
    expect(aim.x).toBeCloseTo(((p.x + 1) / 2) * 1600, 6);
    expect(aim.y).toBeCloseTo(((1 - p.y) / 2) * 900, 6);
    expect(aim.y).toBeLessThan(450); // ahead of and above the aircraft at the middle of the view
    expect(aim.ring).toBeCloseTo((450 / Math.tan((30 * Math.PI) / 180)) * Math.tan(ac.sight.ringMils / 2000), 6);
    const back = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    expect(chaseAim(camera, new THREE.Vector3(0, 0, 0), back, ac, 1600, 900)).toBeNull(); // behind the camera
    expect(reticleStyle(ac)).toBe('GM2');
    expect(reticleStyle(aircraftById.bf109e4)).toBe('Revi');
  });

  it('show a HUD in the side\'s units with the undercarriage, flaps, trim and rounds', () => {
    const raf = hudLines(new Simulation(aircraftById.spitfire, 'air')).join('\n');
    expect(raf).toMatch(/IAS +\d+ mph/);
    expect(raf).toMatch(/ALT +[\d,]+ ft/);
    expect(raf).toMatch(/BOOST/);
    expect(raf).toMatch(/LEVER \d+%/);
    expect(raf).toMatch(/GEAR +UP/);
    expect(raf).toMatch(/MG +\d+/);
    const lw = hudLines(new Simulation(aircraftById.bf109e4, 'ground')).join('\n');
    expect(lw).toMatch(/IAS +\d+ km\/h/);
    expect(lw).toMatch(/ALT +[\d.]+ m/);
    expect(lw).toMatch(/ATA/);
    expect(lw).toMatch(/PITCH/);
    expect(lw).toMatch(/GEAR +DN/);
    expect(lw).toMatch(/CANN +120/);
    expect(gearText(0.5)).toBe('moving');
  });
});
