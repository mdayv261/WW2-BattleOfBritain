// The mission setup's choices (Phase 7 checkpoint 1, D225): daylight start times for 15 August 1940 (the sun at least
// 5° up), heights in each side's units, and a setup kept consistent (aircraft and enemy of the right sides, the number
// within the twelve-aircraft limit).
import { describe, it, expect } from 'vitest';
import { daylightHours, heightChoices, normaliseSetup, timeLabel, MIN_SUN, MAX_ENEMIES, FLYABLE, ENEMIES } from '../../src/ui/missionSetup.js';
import { sunPosition } from '../../src/world/sun.js';
import { MAX_AI } from '../../src/core/scenarios.js';
import { DEFAULT_SETUP } from '../../src/core/mission.js';

const AUG15 = { year: 1940, month: 8, day: 15 };

describe('mission setup', () => {
  it('offers only daylight times: the sun at least 5° up at each, and below it half an hour either side', () => {
    const hours = daylightHours(AUG15);
    expect(hours.length).toBeGreaterThan(20);
    for (const h of hours) expect(sunPosition({ ...AUG15, hoursUtc: h }).elevation).toBeGreaterThanOrEqual(MIN_SUN);
    expect(sunPosition({ ...AUG15, hoursUtc: hours[0] - 0.5 }).elevation).toBeLessThan(MIN_SUN);
    expect(sunPosition({ ...AUG15, hoursUtc: hours.at(-1) + 0.5 }).elevation).toBeLessThan(MIN_SUN);
    expect(timeLabel(13.5)).toBe('13:30 UTC');
  });

  it('shows heights in feet for the RAF and metres for the Luftwaffe', () => {
    expect(heightChoices('RAF').every((c) => / ft$/.test(c.label))).toBe(true);
    expect(heightChoices('Luftwaffe').every((c) => / m$/.test(c.label))).toBe(true);
    expect(heightChoices('RAF')[0]).toEqual({ value: 1000, label: '3,300 ft' });
  });

  it('keeps a setup consistent when the side changes, and the number within the limit', () => {
    const s = normaliseSetup({ ...DEFAULT_SETUP, side: 'Luftwaffe', count: 40, altitude: 4321, hoursUtc: 1 });
    expect(FLYABLE.Luftwaffe).toContain(s.aircraft);
    expect(ENEMIES.Luftwaffe).toContain(s.enemy);
    expect(s.count).toBe(MAX_ENEMIES);
    expect(MAX_ENEMIES).toBeLessThanOrEqual(MAX_AI);
    expect(s.altitude).toBe(4500);
    expect(daylightHours(AUG15)).toContain(s.hoursUtc);
  });

  it('the default setup is already consistent', () => {
    expect(normaliseSetup(DEFAULT_SETUP)).toEqual(DEFAULT_SETUP);
  });
});
