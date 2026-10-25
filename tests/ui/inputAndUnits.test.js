import { describe, it, expect } from 'vitest';
import { Keyboard } from '../../src/input/keyboard.js';
import { speedText, altitudeText, manifoldText, climbText, headingOf } from '../../src/ui/units.js';
import { spitfire } from '../../src/aircraft/spitfire.js';
import { bf109e4 } from '../../src/aircraft/bf109e4.js';
import { UNIT, ISA } from '../../src/core/constants.js';

describe('keyboard ramping', () => {
  it('reaches full deflection in 0.4 s and re-centres when released', () => {
    let v = 0;
    for (let i = 0; i < 48; i += 1) v = Keyboard.ramp(v, 1, 1 / 120);
    expect(v).toBeCloseTo(1, 6);
    for (let i = 0; i < 60; i += 1) v = Keyboard.ramp(v, 0, 1 / 120);
    expect(v).toBe(0);
  });
});

describe('display units by side', () => {
  it('shows RAF figures in mph, feet and lb boost', () => {
    expect(speedText(spitfire, 100 * UNIT.MPH)).toBe('100 mph');
    expect(altitudeText(spitfire, 10000 * UNIT.FT)).toBe('10,000 ft');
    expect(manifoldText(spitfire, ISA.P0 + 12 * UNIT.PSI)).toBe('+12.0 lb');
    expect(climbText(spitfire, 2000 * UNIT.FT / 60)).toBe('2000 ft/min');
  });

  it('shows Luftwaffe figures in km/h, metres and ata', () => {
    expect(speedText(bf109e4, 460 * UNIT.KMH)).toBe('460 km/h');
    expect(manifoldText(bf109e4, 1.3 * UNIT.ATA)).toBe('1.30 ata');
  });

  it('reads compass headings clockwise from north', () => {
    expect(headingOf({ x: 0, z: -1 })).toBeCloseTo(0, 6);
    expect(headingOf({ x: 1, z: 0 })).toBeCloseTo(90, 6);
    expect(headingOf({ x: -1, z: 0 })).toBeCloseTo(270, 6);
  });
});
