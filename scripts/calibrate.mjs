// npm run calibrate: fits the few estimated values that are tuned to one sourced figure each, and
// prints them. Nothing is written: the results are copied into src/aircraft/*.js and their rows in
// docs/AIRCRAFT_DATA.md by hand, so every change is visible and recorded.
//   aero.cd0            - to the calibration level speed (validationCases, calibration: true)
//   aero.aileronCl      - to the NACA full-aileron roll helix angle (RAF fighters)
//   aero.slipstreamWing - to the NACA power-on stall of the Spitfire (applied to all three)
//   propeller.solidity  - Spitfire only: blade width relative to the NACA propeller, to N3171's climb
import { aircraftList } from '../src/aircraft/index.js';
import { validationCases } from '../src/aircraft/validationCases.js';
import { modelValue } from '../src/physics/validation.js';

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
  const ac = withAero(ac0, { slipstreamWing: slip });
  const out = {};
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
  results[ac.id] = out;
  console.log(`${ac.name}: ${Object.entries(out).map(([k, v]) => `${k} ${v.toFixed(4)}`).join(', ')}`);
}
