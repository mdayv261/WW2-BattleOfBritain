// npm run calibrate: fits the few estimated values that are tuned to one sourced figure each, and
// prints them. Nothing is written: the results are copied into src/aircraft/*.js and their rows in
// docs/AIRCRAFT_DATA.md by hand, so every change is visible and recorded.
//   aero.cd0            - to the calibration level speed (validationCases, calibration: true)
//   aero.aileronCl      - to NACA's roll with 30 lb at 230 mph IAS, 10,000 ft, rudder fixed (RAF fighters)
//   aero.slipstreamWing - to the NACA power-on stall of the Spitfire (applied to the three fighters; the twins
//                         scale it by their discs' share of the wing, see AIRCRAFT_DATA.md)
//   aero.clMaxFlaps     - Bf 110: to the data sheet's landing speed (S23), with aero.clMax 0.5 below it
//   propeller.solidity  - Spitfire only: blade width relative to the NACA propeller, to N3171's climb
//   controls.pitchHinge - RAF fighters: to NACA's stick-force gradient at 230 mph IAS, 10,000 ft (S11, S12)
//   Bf 109, from the RAE report (S32):
//     slats.openAlpha   - the slats start to open at a wing lift coefficient of 0.865, flaps up (Table 4)
//     controls.rollHinge - one-fifth aileron is all the pilot can reach at 400 mph IAS (Table 5)
//     aero.aileronCl    - with it, 45 degrees of bank takes as long as in the Spitfire (Table 5: both about 4 s;
//                         the model's Spitfire takes 1.2 s, so the comparison, not the time, is matched, D30)
import { aircraftList } from '../src/aircraft/index.js';
import { validationCases } from '../src/aircraft/validationCases.js';
import { modelValue } from '../src/physics/validation.js';
import { stickForcePerG } from '../src/physics/performance.js';
import { aeroCoefficients } from '../src/physics/aero.js';
import { common } from '../src/aircraft/common.js';
import { bankTime } from '../src/dev/flightTests.js';
import { UNIT } from '../src/core/constants.js';

// NACA stick-force gradients in turns (lb per g): Spitfire VA (S11), Hurricane II (S12).
const FORCE_PER_G = { spitfire: 5.0, hurricane: 8.1 };

const withAero = (ac, changes) => ({ ...ac, aero: { ...ac.aero, ...changes } });

function fit(lo, hi, f, increasing) {
  for (let i = 0; i < 40; i += 1) {
    const mid = 0.5 * (lo + hi);
    if ((f(mid) < 0) === increasing) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

function calibrationPoint(id, kind) {
  for (const c of validationCases[id]) {
    for (const p of c.points) if (p.calibration && p.kind === kind) return { c, p };
  }
  return null;
}

const results = {};
const spit = aircraftList.find((a) => a.id === 'spitfire');
const stall = calibrationPoint('spitfire', 'stall');
const slip = fit(0, 1.5, (k) => stall.p.value - modelValue(withAero(spit, { slipstreamWing: k }), stall.c, stall.p), true);
console.log(`slipstreamWing (all aircraft): ${slip.toFixed(3)}`);

for (const ac0 of aircraftList) {
  const ac = ac0.engines ? ac0 : withAero(ac0, { slipstreamWing: slip });
  const out = {};
  let ac1 = ac;
  if (ac.id === 'bf109e4') {
    // Slat onset: the outer panel's angle when the whole wing (slats shut, flaps up) gives CL 0.865.
    const surfaces = { elevator: 0, aileron: 0, rudder: 0, trim: 0, flaps: 0, gear: 0, radiator: 0, slatLeft: 0, slatRight: 0 };
    const flow = (alpha) => ({ alpha, beta: 0, p: 0, q: 0, r: 0, airspeed: 60, qBar: 2205, slipQ: 0 });
    const alpha = fit(-0.1, 0.4, (a) => aeroCoefficients(ac, flow(a), surfaces).cl - 0.865, true);
    out.openAlpha = aeroCoefficients(ac, flow(alpha), surfaces).slatAlphaLeft / UNIT.DEG;
    // Aileron heaviness: the pilot's strength reaches one-fifth of the travel at 400 mph IAS.
    const q400 = 0.5 * 1.225 * (400 * UNIT.MPH) ** 2;
    out.rollHinge = common.pilotMaxForce.roll / (0.2 * q400);
    ac1 = { ...ac, controls: { ...ac.controls, rollHinge: out.rollHinge } };
    const spitfireTime = bankTime(spit, 400 * UNIT.MPH, 3048).time;
    out.aileronCl = fit(0.01, 0.2, (k) => bankTime(withAero(ac1, { aileronCl: k }), 400 * UNIT.MPH, 3048).time - spitfireTime, false);
  }
  const landing = ac.id !== 'spitfire' && calibrationPoint(ac.id, 'stall');
  if (landing) {
    const withLift = (k) => withAero(ac, { clMaxFlaps: k, clMax: k - 0.5 });
    out.clMaxFlaps = fit(1.2, 3, (k) => landing.p.value - modelValue(withLift(k), landing.c, landing.p), true);
  }
  const roll = calibrationPoint(ac.id, 'roll');
  if (roll) out.aileronCl = fit(0.005, 0.2, (k) => modelValue(withAero(ac, { aileronCl: k }), roll.c, roll.p) - roll.p.value, true);
  const speed = calibrationPoint(ac.id, 'speed');
  const fitCd0 = (a) => fit(0.008, 0.06, (k) => modelValue(withAero(a, { cd0: k }), speed.c, speed.p) - speed.p.value, false);
  const climb = calibrationPoint(ac.id, 'climbTime');
  let fitted = ac;
  if (climb) {
    // Blade width and drag both affect speed and climb, so fit them alternately until they settle.
    for (let round = 0; round < 3; round += 1) {
      fitted = withAero(fitted, { cd0: fitCd0(fitted) });
      const withSolidity = (k) => ({ ...fitted, propeller: { ...fitted.propeller, solidity: k } });
      const k = fit(0.8, 2.0, (s) => modelValue(withSolidity(s), climb.c, climb.p) - climb.p.value, false);
      fitted = withSolidity(k);
    }
    out.solidity = fitted.propeller.solidity;
  }
  out.cd0 = fitCd0(fitted);
  if (FORCE_PER_G[ac.id]) {
    const final = withAero(fitted, { cd0: out.cd0 });
    const now = stickForcePerG(final, { eas: 230 * UNIT.MPH, altitude: 10000 * UNIT.FT });
    out.pitchHinge = (ac.controls.pitchHinge * FORCE_PER_G[ac.id] * UNIT.LBF) / now;
  }
  results[ac.id] = out;
  console.log(`${ac.name}: ${Object.entries(out).map(([k, v]) => `${k} ${v.toFixed(4)}`).join(', ')}`);
}
