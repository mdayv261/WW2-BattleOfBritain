# Flight Validation

The flight model compared with sourced performance figures. Generated from `npm run validate`
(updated 25 Oct 2026, Phase 3: the Bf 110 added, D36); the same comparison runs in `npm test`
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
  - the RAF fighters' elevator force factor, to NACA's stick force per g (5.0 and 8.1 lb/g; not a table row);
  - the Bf 109's slat opening (lift coefficient 0.865), aileron heaviness (one-fifth aileron at 400 mph) and aileron
    power (45° of bank at 400 mph as quickly as the Spitfire), all from the RAE report S32 (D30; not table rows);
  - the Bf 110's flaps-down maximum lift, to its data sheet's landing speed (S23).
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
| S32 | Time to 45° bank, 400 mph IAS | 10,000 ft | RAE: 45 degrees of bank at 400 mph IAS with one-fifth aileron (height not stated) | 4.0 s | 1.2 s | -69.0% |
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
| S32 | Stall (IAS) | 1,500 m | RAE stalls, trailing-static airspeed, gliding (5,580 lb) | 154 km/h | 150 km/h | -2.5% |
| S32 | Stall (IAS) | 1,500 m | RAE stalls, trailing-static airspeed, gliding (5,580 lb), flaps and undercarriage down | 130 km/h | 128 km/h | -1.8% |
| S32 | Time to 45° bank, 400 mph IAS | 3,048 m | RAE: 45 degrees of bank at 400 mph IAS with one-fifth aileron (height not stated) | 4.0 s | 1.2 s | -69.0% |
| S16 | Level speed | 0 m | Data sheet level speeds (1.30 ata, 2400 rpm) **(calibration point)** | 460 km/h | 460 km/h | -0.0% |
| S16 | Level speed | 1,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 480 km/h | 477 km/h | -0.6% |
| S16 | Level speed | 2,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 500 km/h | 501 km/h | +0.3% |
| S16 | Level speed | 3,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 520 km/h | 516 km/h | -0.8% |
| S16 | Level speed | 4,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 540 km/h | 527 km/h | -2.4% |
| S16 | Level speed | 5,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 555 km/h | 542 km/h | -2.3% |
| S16 | Level speed | 6,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 555 km/h | 538 km/h | -3.1% |
| S16 | Level speed | 7,000 m | Data sheet level speeds (1.30 ata, 2400 rpm) | 550 km/h | 531 km/h | -3.5% |
| S17 | Time to height | 1,000 m | Specification climb (2540 kg; 30-minute rating assumed) | 1.0 min | 1.1 min | +9.8% |
| S17 | Time to height | 2,000 m | Specification climb (2540 kg; 30-minute rating assumed) | 1.9 min | 2.2 min | +13.7% |
| S17 | Time to height | 3,000 m | Specification climb (2540 kg; 30-minute rating assumed) | 3.0 min | 3.3 min | +8.8% |
| S17 | Time to height | 4,000 m | Specification climb (2540 kg; 30-minute rating assumed) | 3.8 min | 4.4 min | +16.6% |
| S17 | Time to height | 5,000 m | Specification climb (2540 kg; 30-minute rating assumed) | 4.9 min | 5.7 min | +15.5% |
| S17 | Time to height | 6,000 m | Specification climb (2540 kg; 30-minute rating assumed) | 6.3 min | 7.1 min | +12.4% |
| S17 | Service ceiling | — | Specification climb (2540 kg; 30-minute rating assumed) | 11000 m | 11339 m | +3.1% |
| S22 | Time to height | 4,000 m | Rechlin comparison flights, time to 4 km | 4.4 min | 4.6 min | +4.2% |
| S20 | Stall (IAS) | 1,500 m | A&AEE stall, flaps and undercarriage up (weight not stated) | 150 km/h | 152 km/h | +1.4% |

### Bf 110 C-4 (Phase 3; C-2 data, D14)

| Source | Check | Height | Conditions | Source value | Model | Error |
|---|---|---|---|---|---|---|
| S23 | Level speed | 0 m | Data sheet level speeds, C-2 (1.30 ata, 2400 rpm) **(calibration point)** | 440 km/h | 440 km/h | -0.0% |
| S23 | Level speed | 2,000 m | Data sheet level speeds, C-2 (1.30 ata, 2400 rpm) | 477 km/h | 476 km/h | -0.3% |
| S23 | Level speed | 4,000 m | Data sheet level speeds, C-2 (1.30 ata, 2400 rpm) | 514 km/h | 501 km/h | -2.5% |
| S23 | Level speed | 4,500 m | Data sheet level speeds, C-2 (1.30 ata, 2400 rpm) | 523 km/h | 507 km/h | -3.0% |
| S23 | Level speed | 6,000 m | Data sheet level speeds, C-2 (1.30 ata, 2400 rpm) | 513 km/h | 508 km/h | -0.9% |
| S23 | Time to height | 1,000 m | Data sheet climb, C-2 (30-minute rating assumed) | 1.3 min | 1.6 min | +20.3% |
| S23 | Time to height | 2,000 m | Data sheet climb, C-2 (30-minute rating assumed) | 2.7 min | 3.1 min | +13.7% |
| S23 | Time to height | 4,000 m | Data sheet climb, C-2 (30-minute rating assumed) | 6.0 min | 6.3 min | +5.2% |
| S23 | Time to height | 6,000 m | Data sheet climb, C-2 (30-minute rating assumed) | 10.5 min | 10.1 min | -3.9% |
| S23 | Time to height | 8,000 m | Data sheet climb, C-2 (30-minute rating assumed) | 18.5 min | 15.8 min | -14.5% |
| S23 | Service ceiling | — | Data sheet climb, C-2 (30-minute rating assumed) | 9500 m | 10548 m | +11.0% |
| S23 | Stall (IAS) | 0 m | Landing speed taken as the stall, flaps and undercarriage down **(calibration point)** | 132 km/h | 132 km/h | -0.0% |

**Single-engine flight** (time-stepped, `tests/physics/twinEngine.test.js`; 1,000 m, the live engine at full
throttle and 2,400 rpm, the scripted pilot holding speed, heading and wings level with rudder and rudder trim):

| Condition | Model | Source |
|---|---|---|
| Climb at 250 km/h, dead airscrew feathered | about 3.1 m/s (600 ft/min), either engine | S25: climbs and holds height on either engine |
| Climb at 250 km/h, dead airscrew windmilling | about 1.7 m/s (330 ft/min) | S25: holds height even unfeathered; much better feathered |
| Rudder trim to fly hands-off at 250 km/h, feathered | 0.63 of full (left engine dead), 0.74 (right engine dead) | S24: rudder trimmer fitted. The right engine is the critical one (both airscrews turn the same way). |
| Minimum control speed, windmilling, wings level | below the stall (about 150 km/h IAS) | No source. |
| Approach speed 160 km/h, feathered, 25° flap | held straight; about 0.35 rudder with full trim, 0.6 aileron | S24: use only 25° flap on one engine |
| Approach speed 160 km/h, feathered, full flap, full power | held straight; about the same control as with 25° flap | S24: full flap with more than 1,600 rpm gives an uncontrollable swing and bank (item 16) |

## Take-offs and landings (Phase 2)

A scripted test pilot (`src/dev/groundTests.js`) flies each case on level grass with no wind, as the sources were
corrected to zero wind:
- **take-off:** the throttle is opened over two seconds to full (no +12 lb). The stick is held forward until the tail
  is up. At 0.9 times the power-off stalling speed the pilot eases the nose up toward the three-point attitude, so the
  aircraft flies itself off. It then climbs at the power-off stalling speed (well above the power-on one). The Bf 109
  uses 20° of flap (S32), the RAF fighters none.
- **landing:** a power-off glide at 1.2 times the flaps-down stalling speed, then a flare and hold-off to a
  three-point touchdown. The stick is then held back with as much brake as keeps the tail down.

The approach speed matches the sources once the airspeed indicator's error is allowed for. The Spitfire's Pilot's
Notes (S33) add 10 mph near 100 mph, so their 85-90 mph approach is about 1.2 times the NACA stalling speed.
Tolerance: ±15% (proposed for Phase 2), since the pilot's technique changes these distances.

| Aircraft | Source | Check | Source value | Model | Error |
|---|---|---|---|---|---|
| Spitfire Mk I | S4 | Take-off run (N3171, 2744 kg) | 225 yd | 254 yd | +12.7% |
| Spitfire Mk I | S4 | Take-off to clear 50 ft | 370 yd | 451 yd | +22.0% |
| Spitfire Mk I | S4 | Landing run with brakes | 310 yd | 458 yd | +48% |
| Hurricane Mk I | S1 | Take-off to clear 50 ft (maximum weight) | 470 yd | 468 yd | -0.5% |
| Hurricane Mk I | S1 | Landing from 50 ft (light weight) | 540 yd | 518 yd | -4.1% |
| Bf 109 E-4 | S15 | Take-off ground run (20° flap) | 260 m | 196 m | -24.8% |
| Bf 109 E-4 | S15 | Take-off to clear 20 m | 470 m | 378 m | -19.5% |
| Bf 109 E-4 | S15 | Landing from 20 m | 530 m | 563 m | +6.3% |
| Spitfire Mk I | S33 | Engine speed at full throttle on the ground | 2650-2700 rpm | 2700 rpm | within |

**Ground behaviour already checked** (`tests/physics/ground.test.js`):
- **Parked attitude:** each aircraft sits at its sourced ground angle within 0.5°.
- **Bf 109 tailwheel load:** the 109 carries far more weight on its tailwheel than the RAF fighters (S32).
- **Brakes on, full throttle:**
  - the Spitfire tips onto its nose, which is why S33 wants "TWO men on the tail" for a run-up;
  - the 109's tail stays down (S20, S32).
- **Take-off swing:** the take-off script's rudder holds the RAF fighters against a swing to the left (about 4°)
  and the 109 against one to the right (about 5°), as S12 and S20 describe.

**Take-off and landing behaviour** (`tests/physics/takeoffLanding.test.js`, checkpoint 3):
- **Swing:** the RAF fighters swing left on take-off (S12), the Bf 109 right (S20); all are held with rudder within 5°.
- **Landings:** all three land three-point and roll out straight, within 2.5° of heading, with no ground loop (S11, S12,
  S20).
- **Tail-first landings:** possible for all three, since each ground angle is below the flaps-down stalling attitude
  (S12, for the Hurricane).
- **Spitfire elevator at a three-point touchdown:** about 6.5° up against NACA's average of 8.4°, which varied over 10°
  from landing to landing (S11).
- **Bf 109 brakes:** full brakes with the stick back at 15 m/s do not lift the tail (S20, S32).


## Summary

- **Within tolerance:** 55 of 68 performance rows, including all the calibration points. The Bf 110 adds 12 rows, of
  which its climbs to 1, 2 and 8 km and its ceiling are outside (item 14).
- **Level speeds:** all within 5%; the Spitfire's N3171 speeds within 0.5%.
- **Spitfire climb:** within 4% at every height.
- **Stalls:** within 3%, power off and on, flaps up and down (the Bf 109 now against the RAE's calibrated figures).
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
7. **Bf 109 stall checks (S32) are not independent:** the maximum lift comes from the same RAE measurements (D30).
   S20's 150 km/h, read on the pilot's indicator, also agrees within 2 mph.
8. **Bf 109 drag coefficient (0.0272)** is higher than the RAF fighters' (0.0183 and 0.0249).
   - This follows from calibrating to the Luftwaffe data sheet's 460 km/h (D14).
   - The manufacturer's 500 km/h would need about 0.021.
9. **Spins are flat.** The angle of attack settles at 60-80° with full back stick, steeper than a typical fighter spin.
   Entry and recovery behave as required (recovery within half a turn with opposite rudder and stick forward). No
   sourced spin data were found.
10. **Spitfire take-off and landing distances long** (Phase 2): to 50 ft +22%, landing run +48% against N3171 (S4).
    - The model lifts off and lands close to its stalling speeds. These come from NACA's calibrated tests (S31, about
      90 mph clean and 80 mph flaps down), higher than S4's uncorrected 78 and 68 mph.
    - After touchdown the wing still carries most of the weight, so braking only bites as the speed falls.
11. **Bf 109 take-off too short** (Phase 2): ground run -25%, to 20 m -20% against the handbook (S15). With the RAE's
    lower maximum lift (D30) these were -29% and -23%.
    - The scripted pilot lifts off at about 135 km/h, using the 20° flap and the slipstream.
    - S32 says pilots held the 109 on the ground for a while after the tail came up. That technique is not copied: one
      technique is used for all three types.
    - The handbook's take-off power (1.40 ata) is not modelled; the 5-minute rating is used.
12. **Time to 45° of bank at 400 mph about three times quicker than the RAE measured** (S32: about 4 s for both the
    Spitfire and the Bf 109; model 1.2 s for both).
    - The Spitfire's aileron power comes from NACA's tests (S13), so its model time is an independent result.
    - The RAE figure probably includes the time to move the stick and the loss of aileron power as the wing twists at
      high speed. Neither is modelled.
    - The 109 is fitted to match the model's Spitfire at that speed, as the RAE found the two equal (D30).
13. **The Bf 109 keeps its take-off swing to the right once airborne** (Phase 2). S20 says the slight swing to the right
    on take-off changes to a swing to the left as soon as the aircraft is in the air; the model's 109 still needs left
    rudder after lift-off.
    - The propeller's direction of rotation is uncertain. The DB 601 data sheet gives it by the German standard DIN 9001
      (S19), whose viewing direction has not been checked, and the model's anticlockwise-from-the-cockpit choice was
      made to match the ground swing.
    - It is an open research gap.
14. **Bf 110 climb shape against the data sheet (S23):** 14-20% slow to 1-2 km, 15% quick to 8 km, ceiling 11% high (10,550 m against 9,500 m).
    - The data sheet does not state its engine rating (the 30-minute rating is assumed, as for the Bf 109's S17).
      At the 5-minute rating the low climbs are within 5% but the high ones are 16-25% quick.
    - The source's climb rate falls away with height faster than the model's. A lower span efficiency (0.7) would bring
      the high climbs and ceiling nearer, but there is no source for it, so 0.8 is kept.
15. **Bf 110 ground run-up:** 2,410 rpm at full throttle with the airscrews in fine pitch, against S24's "2,200 r.p.m.
    approximately at 1.3 atmospheres". The Bf 109 (same engine and airscrew) gives the same. Wider blades (11%) would give
    2,200 rpm but the boost would then fall to 1.2 ata, so nothing is fitted. The fine-pitch angle (22.5°, S32) may be
    measured at a different blade station from the one assumed.
16. **Bf 110 full flap on one engine:** S24 warns that full flap with more than 1,600 rpm on the good engine gives an
    uncontrollable swing and bank. The model's 110 needs a lot of aileron (about 0.6) and rudder at full power, but
    no more with full flap than with 25°, and stays controllable. The flaps' effect on the asymmetric slipstream is
    not modelled beyond the extra lift on the live side. To be judged in the product owner's flight test.
17. **Bf 110 dimensions and positions are estimates:** no scaled drawing was found, so the engine, wheel, eye and
    centre-of-gravity positions come from the overall dimensions (S23). Most handling values are the Bf 109's.
