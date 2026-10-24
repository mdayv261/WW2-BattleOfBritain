// npm run calibrate: fits the few estimated values that are tuned to one sourced figure each, and
// prints them. Nothing is written: the results are copied into src/aircraft/*.js and their rows in
// docs/AIRCRAFT_DATA.md by hand, so every change is visible and recorded.
//   aero.cd0            - to the calibration level speed (validationCases, calibration: true)
//   aero.aileronCl      - to the NACA full-aileron roll helix angle (RAF fighters)
//   aero.slipstreamWing - to the NACA power-on stall of the Spitfire (applied to all three)
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
  out.cd0 = fit(0.008, 0.06, (k) => modelValue(withAero(ac, { cd0: k }), speed.c, speed.p) - speed.p.value, false);
  results[ac.id] = out;
  console.log(`${ac.name}: ${Object.entries(out).map(([k, v]) => `${k} ${v.toFixed(4)}`).join(', ')}`);
}
