// Sourced performance figures the flight model is checked against (docs/AIRCRAFT_DATA.md, sections
// "Validation data"; results in docs/FLIGHT_VALIDATION.md). Each case gives the conditions of the
// source: mass, engine setting and configuration. SI units throughout.
//
// kinds: 'speed' (level speed at an altitude), 'climbTime' (seconds from sea level), 'ceiling',
// 'stall' (1 g stall, indicated airspeed = equivalent), 'roll' (pb/2V in a time-stepped roll with full stick,
// rudder fixed: at 230 mph IAS the pilot's 30 lb limits the aileron; at 140 mph full deflection is reached).
// `calibration: true` marks the points fitted by `npm run calibrate` (one per fitted value); all others are
// independent checks.

import { UNIT } from '../core/constants.js';

const RPM = UNIT.RPM;
const MPH = UNIT.MPH;
const FT = UNIT.FT;
const KMH = UNIT.KMH;

export const validationCases = {
  spitfire: [
    {
      source: 'S4', label: 'N3171, 3000 rpm, +6 1/4 lb', mass: 2744,
      setting: { speed: 3000 * RPM, throttle: 1 },
      points: [
        { kind: 'speed', altitude: 5761, value: 354 * MPH, calibration: true },
        { kind: 'speed', altitude: 3048, value: 320.5 * MPH },
        { kind: 'speed', altitude: 4572, value: 339 * MPH },
        { kind: 'speed', altitude: 6096, value: 353.5 * MPH },
        { kind: 'speed', altitude: 7925, value: 341.5 * MPH },
        { kind: 'speed', altitude: 9144, value: 319 * MPH },
      ],
    },
    {
      source: 'S3', label: 'RAE chart, +6 1/4 lb', mass: 2744,
      setting: { speed: 3000 * RPM, throttle: 1 },
      points: [
        { kind: 'speed', altitude: 0, value: 283 * MPH },
        { kind: 'speed', altitude: 1524, value: 302 * MPH },
      ],
    },
    {
      source: 'S3', label: 'RAE chart, +12 lb (pencilled)', mass: 2744,
      setting: { speed: 3000 * RPM, throttle: 1, emergency: true },
      points: [{ kind: 'speed', altitude: 0, value: 316 * MPH }],
    },
    {
      source: 'S4', label: 'N3171 climb, 2600 rpm, +6 1/4 lb', mass: 2744,
      setting: { speed: 2600 * RPM, throttle: 1 },
      points: [
        { kind: 'climbTime', altitude: 3048, value: 3.5 * 60 },
        { kind: 'climbTime', altitude: 4572, value: 5.3 * 60 },
        { kind: 'climbTime', altitude: 6096, value: 7.7 * 60, calibration: true },
        { kind: 'climbTime', altitude: 7620, value: 10.9 * 60 },
        { kind: 'climbTime', altitude: 9144, value: 16.4 * 60 },
        { kind: 'ceiling', value: 34700 * FT },
      ],
    },
    {
      source: 'S31', label: 'NACA Spitfire VA stalls (6184 lb), power off', mass: 2805,
      setting: { speed: 3000 * RPM, throttle: 0 },
      points: [
        { kind: 'stall', altitude: 1500, value: 90 * MPH },
        { kind: 'stall', altitude: 1500, value: 80 * MPH, flaps: 1, gear: 1 },
      ],
    },
    {
      source: 'S31', label: 'NACA Spitfire VA stall, cruising power (+3 3/4 lb, 2650 rpm)', mass: 2805,
      setting: { speed: 2650 * RPM, map: 124957 }, // 36.9 in Hg measured
      points: [{ kind: 'stall', altitude: 1500, value: 77 * MPH, calibration: true }],
    },
    {
      source: 'S13', label: 'NACA aileron tests', mass: 2744,
      setting: null,
      points: [
        { kind: 'roll', eas: 102.82, altitude: 3048, stickForce: 30 * UNIT.LBF, value: 0.05, calibration: true },
        { kind: 'roll', eas: 62.6, altitude: 3048, fullDeflection: true, value: 0.085 },
      ],
    },
  ],
  hurricane: [
    {
      source: 'S1', label: 'Data sheet, mean weight, normal boost', mass: 2921,
      setting: { speed: 3000 * RPM, throttle: 1 },
      points: [{ kind: 'speed', altitude: 5410, value: 316 * MPH, calibration: true }],
    },
    {
      source: 'S2', label: 'RAE chart, all-out level speed', mass: 2921,
      setting: { speed: 3000 * RPM, throttle: 1 },
      points: [
        { kind: 'speed', altitude: 0, value: 261 * MPH },
        { kind: 'speed', altitude: 1524, value: 276 * MPH },
        { kind: 'speed', altitude: 3048, value: 291 * MPH },
        { kind: 'speed', altitude: 4572, value: 307 * MPH },
        { kind: 'speed', altitude: 6096, value: 314 * MPH },
        { kind: 'speed', altitude: 7620, value: 307 * MPH },
        { kind: 'speed', altitude: 9144, value: 292 * MPH },
      ],
    },
    {
      source: 'S1', label: 'Data sheet, maximum weight climb', mass: 3081,
      setting: { speed: 2600 * RPM, throttle: 1 },
      points: [
        { kind: 'climbTime', altitude: 6096, value: 9.7 * 60 },
        { kind: 'ceiling', value: 32500 * FT },
      ],
    },
    {
      source: 'S1', label: 'Data sheet, mean weight ceiling', mass: 2921,
      setting: { speed: 2600 * RPM, throttle: 1 },
      points: [{ kind: 'ceiling', value: 33500 * FT }],
    },
    {
      source: 'S12', label: 'NACA Hurricane II stalls (7014 lb), gliding', mass: 3181.5,
      setting: { speed: 3000 * RPM, throttle: 0 },
      points: [
        { kind: 'stall', altitude: 1500, value: 86.5 * MPH },
        { kind: 'stall', altitude: 1500, value: 70.3 * MPH, flaps: 1, gear: 1 },
      ],
    },
    {
      source: 'S13', label: 'NACA aileron tests', mass: 2921,
      setting: null,
      points: [
        { kind: 'roll', eas: 102.82, altitude: 3048, stickForce: 30 * UNIT.LBF, value: 0.057, calibration: true },
        { kind: 'roll', eas: 62.6, altitude: 3048, fullDeflection: true, value: 0.082 },
      ],
    },
  ],
  bf109e4: [
    {
      source: 'S16', label: 'Data sheet level speeds (1.30 ata, 2400 rpm)', mass: 2608,
      setting: { speed: 2400 * RPM, throttle: 1 },
      points: [
        { kind: 'speed', altitude: 0, value: 460 * KMH, calibration: true },
        { kind: 'speed', altitude: 1000, value: 480 * KMH },
        { kind: 'speed', altitude: 2000, value: 500 * KMH },
        { kind: 'speed', altitude: 3000, value: 520 * KMH },
        { kind: 'speed', altitude: 4000, value: 540 * KMH },
        { kind: 'speed', altitude: 5000, value: 555 * KMH },
        { kind: 'speed', altitude: 6000, value: 555 * KMH },
        { kind: 'speed', altitude: 7000, value: 550 * KMH },
      ],
    },
    {
      source: 'S17', label: 'Specification climb (2540 kg; 30-minute rating assumed)', mass: 2540,
      setting: { speed: 2300 * RPM, map: 1.23 * UNIT.ATA },
      points: [
        { kind: 'climbTime', altitude: 1000, value: 1.0 * 60 },
        { kind: 'climbTime', altitude: 2000, value: 1.9 * 60 },
        { kind: 'climbTime', altitude: 3000, value: 3.0 * 60 },
        { kind: 'climbTime', altitude: 4000, value: 3.8 * 60 },
        { kind: 'climbTime', altitude: 5000, value: 4.9 * 60 },
        { kind: 'climbTime', altitude: 6000, value: 6.3 * 60 },
        { kind: 'ceiling', value: 11000 },
      ],
    },
    {
      source: 'S22', label: 'Rechlin comparison flights, time to 4 km', mass: 2608,
      setting: { speed: 2300 * RPM, map: 1.23 * UNIT.ATA },
      points: [{ kind: 'climbTime', altitude: 4000, value: 4.4 * 60 }],
    },
    {
      source: 'S20', label: 'A&AEE stall, flaps and undercarriage up (weight not stated)', mass: 2608,
      setting: { speed: 2400 * RPM, throttle: 0 },
      points: [{ kind: 'stall', altitude: 1500, value: 150 * KMH }],
    },
  ],
};
