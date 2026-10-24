# Flight Validation

The flight model compared with sourced performance figures. Generated from `npm run validate`
(24 Oct 2026, Phase 1 checkpoint 1); the same comparison runs in `npm test`
(`tests/physics/validation.test.js`). Sources are the S-numbers in `docs/AIRCRAFT_DATA.md`.

## Method

- **Steady flight.** For each speed and height the solver finds the angle of attack at which lift plus the vertical
  part of thrust equals weight. The propeller holds the governed engine speed with the blade angle that absorbs the
  engine's power; at the fine-pitch stop the engine speed falls instead. Spare thrust × speed ÷ weight is the climb
  rate. Climb times add up 100 m steps at the best climb speed. The service ceiling is where the best climb falls to
  100 ft/min.
- **Calibration.** Only one figure per quantity is fitted (`npm run calibrate`); every other row is an independent
  check:
  - the zero-lift drag, to one level speed per aircraft;
  - the aileron power, to the NACA full-aileron roll;
  - the share of the wing in the slipstream, to the Spitfire's power-on stall.
- **Tolerances** (the proposed Phase 1 acceptance test):
  - speed ±5%;
  - climb time ±10%;
  - ceiling ±5%;
  - stall ±5 mph;
  - roll ±15%;
  - calibration points ±1%.
- **Stall speeds** are compared as equivalent airspeed with the sources' indicated airspeed. The NACA tests used
  calibrated installations.

## Results

### Hurricane Mk I

| Source | Check | Height | Conditions | Source value | Model | Error |
|---|---|---|---|---|---|---|
| S1 | Level speed | 17,749 ft | Data sheet, mean weight, normal boost **(calibration point)** | 316.0 mph | 316.1 mph | +0.0% |
| S2 | Level speed | 0 ft | RAE chart, all-out level speed | 261.0 mph | 250.4 mph | -4.1% |
| S2 | Level speed | 5,000 ft | RAE chart, all-out level speed | 276.0 mph | 267.5 mph | -3.1% |
| S2 | Level speed | 10,000 ft | RAE chart, all-out level speed | 291.0 mph | 285.7 mph | -1.8% |
| S2 | Level speed | 15,000 ft | RAE chart, all-out level speed | 307.0 mph | 304.6 mph | -0.8% |
| S2 | Level speed | 20,000 ft | RAE chart, all-out level speed | 314.0 mph | 314.3 mph | +0.1% |
| S2 | Level speed | 25,000 ft | RAE chart, all-out level speed | 307.0 mph | 306.0 mph | -0.3% |
| S2 | Level speed | 30,000 ft | RAE chart, all-out level speed | 292.0 mph | 278.4 mph | -4.7% |
| S1 | Time to height | 20,000 ft | Data sheet, maximum weight climb | 9.7 min | 9.0 min | -7.0% |
| S1 | Service ceiling | — | Data sheet, maximum weight climb | 32500 ft | 31273 ft | -3.8% |
| S1 | Service ceiling | — | Data sheet, mean weight ceiling | 33500 ft | 31855 ft | -4.9% |
| S12 | Stall (IAS) | 4,921 ft | NACA Hurricane II stalls (7014 lb), gliding | 86.5 mph | 86.0 mph | -0.6% |
| S12 | Stall (IAS) | 4,921 ft | NACA Hurricane II stalls (7014 lb), gliding, flaps and undercarriage down | 70.3 mph | 69.2 mph | -1.5% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, full aileron **(calibration point)** | 0.082 | 0.082 | -0.0% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, 30 lb stick force | 0.057 | 0.057 | -0.2% |

### Spitfire Mk I

| Source | Check | Height | Conditions | Source value | Model | Error |
|---|---|---|---|---|---|---|
| S4 | Level speed | 18,901 ft | N3171, 3000 rpm, +6 1/4 lb **(calibration point)** | 354.0 mph | 354.3 mph | +0.1% |
| S4 | Level speed | 10,000 ft | N3171, 3000 rpm, +6 1/4 lb | 320.5 mph | 320.4 mph | -0.0% |
| S4 | Level speed | 15,000 ft | N3171, 3000 rpm, +6 1/4 lb | 339.0 mph | 340.3 mph | +0.4% |
| S4 | Level speed | 20,000 ft | N3171, 3000 rpm, +6 1/4 lb | 353.5 mph | 353.3 mph | -0.1% |
| S4 | Level speed | 26,001 ft | N3171, 3000 rpm, +6 1/4 lb | 341.5 mph | 342.2 mph | +0.2% |
| S4 | Level speed | 30,000 ft | N3171, 3000 rpm, +6 1/4 lb | 319.0 mph | 317.3 mph | -0.5% |
| S3 | Level speed | 0 ft | RAE chart, +6 1/4 lb | 283.0 mph | 280.4 mph | -0.9% |
| S3 | Level speed | 5,000 ft | RAE chart, +6 1/4 lb | 302.0 mph | 299.5 mph | -0.8% |
| S3 | Level speed | 0 ft | RAE chart, +12 lb (pencilled) | 316.0 mph | 313.4 mph | -0.8% |
| S4 | Time to height | 10,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 3.5 min | 3.7 min | +5.2% |
| S4 | Time to height | 15,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 5.3 min | 5.7 min | +7.2% |
| S4 | Time to height | 20,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 7.7 min | 8.2 min | +6.4% |
| S4 | Time to height | 25,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 10.9 min | 11.6 min | +6.6% |
| S4 | Time to height | 30,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 16.4 min | 18.1 min | +10.4% |
| S4 | Service ceiling | — | N3171 climb, 2600 rpm, +6 1/4 lb | 34700 ft | 32257 ft | -7.0% |
| S31 | Stall (IAS) | 4,921 ft | NACA Spitfire VA stalls (6184 lb), power off | 90.0 mph | 91.2 mph | +1.3% |
| S31 | Stall (IAS) | 4,921 ft | NACA Spitfire VA stalls (6184 lb), power off, flaps and undercarriage down | 80.0 mph | 80.3 mph | +0.4% |
| S31 | Stall (IAS) | 4,921 ft | NACA Spitfire VA stall, cruising power (+3 3/4 lb, 2650 rpm) **(calibration point)** | 77.0 mph | 77.0 mph | +0.0% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, full aileron **(calibration point)** | 0.085 | 0.085 | -0.1% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, 30 lb stick force | 0.050 | 0.050 | -0.1% |

### Bf 109 E-4

| Source | Check | Height | Conditions | Source value | Model | Error |
|---|---|---|---|---|---|---|
| S16 | Level speed | 0 m | Data sheet level speeds (1.30 ata, 2400 rpm) **(calibration point)** | 460 km/h | 460 km/h | -0.0% |
| S16 | Level speed | 1000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 480 km/h | 477 km/h | -0.6% |
| S16 | Level speed | 2000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 500 km/h | 501 km/h | +0.3% |
| S16 | Level speed | 3000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 520 km/h | 516 km/h | -0.8% |
| S16 | Level speed | 4000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 540 km/h | 527 km/h | -2.4% |
| S16 | Level speed | 5000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 555 km/h | 542 km/h | -2.3% |
| S16 | Level speed | 6000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 555 km/h | 538 km/h | -3.0% |
| S16 | Level speed | 7000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 550 km/h | 531 km/h | -3.5% |
| S17 | Time to height | 1000 m | Specification climb (2540 kg; 30-minute rating assumed) | 1.0 min | 1.1 min | +9.1% |
| S17 | Time to height | 2000 m | Specification climb (2540 kg; 30-minute rating assumed) | 1.9 min | 2.1 min | +12.9% |
| S17 | Time to height | 3000 m | Specification climb (2540 kg; 30-minute rating assumed) | 3.0 min | 3.2 min | +8.1% |
| S17 | Time to height | 4000 m | Specification climb (2540 kg; 30-minute rating assumed) | 3.8 min | 4.4 min | +15.8% |
| S17 | Time to height | 5000 m | Specification climb (2540 kg; 30-minute rating assumed) | 4.9 min | 5.6 min | +14.7% |
| S17 | Time to height | 6000 m | Specification climb (2540 kg; 30-minute rating assumed) | 6.3 min | 7.0 min | +11.5% |
| S17 | Service ceiling | — | Specification climb (2540 kg; 30-minute rating assumed) | 11000 m | 11482 m | +4.4% |
| S22 | Time to height | 4000 m | Rechlin comparison flights, time to 4 km | 4.4 min | 4.6 min | +3.5% |
| S20 | Stall (IAS) | 1500 m | A&AEE stall, flaps and undercarriage up (weight not stated) | 150 km/h | 148 km/h | -1.4% |

## Summary

- **Within tolerance:** 46 of 52 rows, including all the calibration points.
- **Level speeds:** all within 5%. The Spitfire's five independent N3171 speeds are within 0.5%, and its +12 lb
  sea-level speed within 0.8%.
- **Stalls:** all within 1.5%, power off and on, flaps up and down.
- **Roll:** the 30 lb points are within 0.2% for both RAF fighters (the aileron force model is fitted only to the
  full-deflection value).

## Known deviations (reported to the product owner, not tuned away)

1. **Spitfire climb above 25,000 ft (+10%) and ceiling (−7%).**
   - Lower down the climb is 5-7% slow.
   - The likeliest cause: the propeller data come from NACA's 10 ft Clark Y propeller (S30), whose blades are narrower
     than the Rotol's. At altitude the governor needs a high blade angle to absorb the power, where this propeller's
     efficiency is low.
   - A blade-width (solidity) correction could be fitted to the climb, but it would be a tuning factor. It is left for
     the product owner to decide.
2. **Bf 109 climb against the manufacturer's specification (S17): 8-16% slow.**
   - The specification does not state its engine rating (the 30-minute rating is assumed).
   - The Luftwaffe's own Rechlin comparison flights (S22) agree within 4%.
3. **Bf 109 level speed above 4 km: 2-3.5% slow.**
   - Within tolerance. Consistent with the DB 601A curves being static (no ram) and the ram estimate being an average.
4. **Hurricane level speed at sea level and at 30,000 ft: 4-5% slow.**
   - Within tolerance. The RAE chart (S2) does not state the airscrew.
5. **Bf 109 stall check (S20) is not independent:** the maximum lift was derived from the same figure, at an assumed
   weight.
6. **Bf 109 drag coefficient (0.0273)** is higher than the RAF fighters' (0.0187 and 0.0250).
   - This follows from calibrating to the Luftwaffe data sheet's 460 km/h (D14).
   - The manufacturer's 500 km/h would need about 0.021.
