# Flight Validation

The flight model compared with sourced performance figures. Generated from `npm run validate`
(updated 25 Oct 2026, Phase 1 checkpoint 3); the same comparison runs in `npm test`
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
  - the aileron power, to NACA's roll with 30 lb at 230 mph IAS (time-stepped, rudder fixed);
  - the share of the wing in the slipstream, to the Spitfire's power-on stall;
  - the Spitfire's propeller blade width, to N3171's time to 20,000 ft (product owner's decision, D24);
  - the RAF fighters' elevator force factor, to NACA's stick force per g (5.0 and 8.1 lb/g; not a table row).
- **Handling checks** in the time-stepped simulation are in `tests/physics/handling.test.js` (`npm run handling` prints
  them): stalls, spins, rolls, sideslip in a roll, control heaviness, slats and torque swing.
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
| S1 | Level speed | 17,749 ft | Data sheet, mean weight, normal boost **(calibration point)** | 316.0 mph | 316.2 mph | +0.0% |
| S2 | Level speed | 0 ft | RAE chart, all-out level speed | 261.0 mph | 250.4 mph | -4.1% |
| S2 | Level speed | 5,000 ft | RAE chart, all-out level speed | 276.0 mph | 267.6 mph | -3.0% |
| S2 | Level speed | 10,000 ft | RAE chart, all-out level speed | 291.0 mph | 285.7 mph | -1.8% |
| S2 | Level speed | 15,000 ft | RAE chart, all-out level speed | 307.0 mph | 304.7 mph | -0.8% |
| S2 | Level speed | 20,000 ft | RAE chart, all-out level speed | 314.0 mph | 314.4 mph | +0.1% |
| S2 | Level speed | 25,000 ft | RAE chart, all-out level speed | 307.0 mph | 306.0 mph | -0.3% |
| S2 | Level speed | 30,000 ft | RAE chart, all-out level speed | 292.0 mph | 278.2 mph | -4.7% |
| S1 | Time to height | 20,000 ft | Data sheet, maximum weight climb | 9.7 min | 9.1 min | -6.5% |
| S1 | Service ceiling | — | Data sheet, maximum weight climb | 32500 ft | 31037 ft | -4.5% |
| S1 | Service ceiling | — | Data sheet, mean weight ceiling | 33500 ft | 31635 ft | -5.6% |
| S12 | Stall (IAS) | 4,921 ft | NACA Hurricane II stalls (7014 lb), gliding | 86.5 mph | 86.0 mph | -0.5% |
| S12 | Stall (IAS) | 4,921 ft | NACA Hurricane II stalls (7014 lb), gliding, flaps and undercarriage down | 70.3 mph | 69.4 mph | -1.3% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, 30 lb stick force, rudder fixed **(calibration point)** | 0.057 | 0.057 | +0.1% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, full aileron, rudder fixed | 0.082 | 0.075 | -8.5% |

### Spitfire Mk I

| Source | Check | Height | Conditions | Source value | Model | Error |
|---|---|---|---|---|---|---|
| S4 | Level speed | 18,901 ft | N3171, 3000 rpm, +6 1/4 lb **(calibration point)** | 354.0 mph | 354.1 mph | +0.0% |
| S4 | Level speed | 10,000 ft | N3171, 3000 rpm, +6 1/4 lb | 320.5 mph | 321.7 mph | +0.4% |
| S4 | Level speed | 15,000 ft | N3171, 3000 rpm, +6 1/4 lb | 339.0 mph | 340.6 mph | +0.5% |
| S4 | Level speed | 20,000 ft | N3171, 3000 rpm, +6 1/4 lb | 353.5 mph | 353.1 mph | -0.1% |
| S4 | Level speed | 26,001 ft | N3171, 3000 rpm, +6 1/4 lb | 341.5 mph | 342.4 mph | +0.3% |
| S4 | Level speed | 30,000 ft | N3171, 3000 rpm, +6 1/4 lb | 319.0 mph | 318.9 mph | -0.0% |
| S3 | Level speed | 0 ft | RAE chart, +6 1/4 lb | 283.0 mph | 280.7 mph | -0.8% |
| S3 | Level speed | 5,000 ft | RAE chart, +6 1/4 lb | 302.0 mph | 299.1 mph | -1.0% |
| S3 | Level speed | 0 ft | RAE chart, +12 lb (pencilled) | 316.0 mph | 312.0 mph | -1.3% |
| S4 | Time to height | 10,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 3.5 min | 3.5 min | -0.9% |
| S4 | Time to height | 15,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 5.3 min | 5.3 min | +0.7% |
| S4 | Time to height | 20,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb **(calibration point)** | 7.7 min | 7.7 min | +0.0% |
| S4 | Time to height | 25,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 10.9 min | 11.0 min | +0.8% |
| S4 | Time to height | 30,000 ft | N3171 climb, 2600 rpm, +6 1/4 lb | 16.4 min | 17.1 min | +4.1% |
| S4 | Service ceiling | — | N3171 climb, 2600 rpm, +6 1/4 lb | 34700 ft | 32107 ft | -7.5% |
| S31 | Stall (IAS) | 4,921 ft | NACA Spitfire VA stalls (6184 lb), power off | 90.0 mph | 91.2 mph | +1.4% |
| S31 | Stall (IAS) | 4,921 ft | NACA Spitfire VA stalls (6184 lb), power off, flaps and undercarriage down | 80.0 mph | 80.4 mph | +0.5% |
| S31 | Stall (IAS) | 4,921 ft | NACA Spitfire VA stall, cruising power (+3 3/4 lb, 2650 rpm) **(calibration point)** | 77.0 mph | 77.0 mph | -0.0% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, 30 lb stick force, rudder fixed **(calibration point)** | 0.050 | 0.050 | -0.1% |
| S13 | Roll pb/2V | 10,000 ft | NACA aileron tests, full aileron, rudder fixed | 0.085 | 0.072 | -15.1% |

### Bf 109 E-4

| Source | Check | Height | Conditions | Source value | Model | Error |
|---|---|---|---|---|---|---|
| S16 | Level speed | 0 m | Data sheet level speeds (1.30 ata, 2400 rpm) **(calibration point)** | 460 km/h | 460 km/h | +0.0% |
| S16 | Level speed | 1000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 480 km/h | 477 km/h | -0.6% |
| S16 | Level speed | 2000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 500 km/h | 502 km/h | +0.3% |
| S16 | Level speed | 3000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 520 km/h | 516 km/h | -0.8% |
| S16 | Level speed | 4000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 540 km/h | 527 km/h | -2.3% |
| S16 | Level speed | 5000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 555 km/h | 542 km/h | -2.3% |
| S16 | Level speed | 6000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 555 km/h | 538 km/h | -3.0% |
| S16 | Level speed | 7000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 550 km/h | 531 km/h | -3.4% |
| S17 | Time to height | 1000 m | Specification climb (2540 kg; 30-minute rating assumed) | 1.0 min | 1.1 min | +9.5% |
| S17 | Time to height | 2000 m | Specification climb (2540 kg; 30-minute rating assumed) | 1.9 min | 2.2 min | +13.4% |
| S17 | Time to height | 3000 m | Specification climb (2540 kg; 30-minute rating assumed) | 3.0 min | 3.3 min | +8.5% |
| S17 | Time to height | 4000 m | Specification climb (2540 kg; 30-minute rating assumed) | 3.8 min | 4.4 min | +16.3% |
| S17 | Time to height | 5000 m | Specification climb (2540 kg; 30-minute rating assumed) | 4.9 min | 5.6 min | +15.1% |
| S17 | Time to height | 6000 m | Specification climb (2540 kg; 30-minute rating assumed) | 6.3 min | 7.1 min | +12.0% |
| S17 | Service ceiling | — | Specification climb (2540 kg; 30-minute rating assumed) | 11000 m | 11382 m | +3.5% |
| S22 | Time to height | 4000 m | Rechlin comparison flights, time to 4 km | 4.4 min | 4.6 min | +4.0% |
| S20 | Stall (IAS) | 1500 m | A&AEE stall, flaps and undercarriage up (weight not stated) | 150 km/h | 148 km/h | -1.2% |

## Summary

- **Within tolerance:** 45 of 52 rows, including all the calibration points.
- **Level speeds:** all within 5%; the Spitfire's N3171 speeds within 0.5%.
- **Spitfire climb:** within 4% at every height.
- **Stalls:** within 1.5%, power off and on, flaps up and down.
- **Roll:** the 30 lb rolls are the calibration points. The full-aileron checks are −9% (Hurricane) and −15% (Spitfire).

## Known deviations (reported to the product owner, not tuned away)

1. **Spitfire ceiling 7% low** (about 32,300 ft against 34,700 ft), even with the blade-width correction. A&AEE ceilings
   were extrapolated from climb rates, and small differences near the ceiling move it a long way.
2. **Bf 109 climb against the manufacturer's specification (S17): 8-16% slow.**
   - The specification does not state its engine rating (the 30-minute rating is assumed).
   - The Luftwaffe's own Rechlin comparison flights (S22) agree within 4%.
3. **Hurricane mean-weight ceiling 5.6% low.** The maximum-weight ceiling is within 5%.
4. **Spitfire full-aileron roll 15% below NACA** (pb/2V 0.072 against 0.085), once the 30 lb roll at 230 mph is matched.
   The two NACA figures cannot both be met with a single aileron power and the estimated roll damping.
5. **Bf 109 level speed above 4 km: 2-3.5% slow.**
   - Within tolerance. Consistent with the DB 601A curves being static (no ram) and the ram estimate being an average.
6. **Hurricane level speed at sea level and at 30,000 ft: 4-5% slow.**
   - Within tolerance. The RAE chart (S2) does not state the airscrew.
7. **Bf 109 stall check (S20) is not independent:** the maximum lift was derived from the same figure, at an assumed
   weight.
8. **Bf 109 drag coefficient (0.0272)** is higher than the RAF fighters' (0.0183 and 0.0249).
   - This follows from calibrating to the Luftwaffe data sheet's 460 km/h (D14).
   - The manufacturer's 500 km/h would need about 0.021.
9. **Spins are flat.** The angle of attack settles at 60-80° with full back stick, steeper than a typical fighter spin.
   Entry and recovery behave as required (recovery within half a turn with opposite rudder and stick forward). No
   sourced spin data were found.
