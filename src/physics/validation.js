// Runs the sourced validation cases through the steady-state performance solver.
import { validationCases } from '../aircraft/validationCases.js';
import { aircraftById } from '../aircraft/index.js';
import { topSpeed, timeToClimb, ceiling, stallSpeed, steadyRoll } from './performance.js';
import { equivalentAirspeed } from './atmosphere.js';

/** A copy of an aircraft at another mass, with inertia scaled in proportion. */
export function withMass(ac, mass) {
  if (!mass || mass === ac.mass.flying) return ac;
  const k = mass / ac.mass.flying;
  return { ...ac, mass: { flying: mass, ixx: ac.mass.ixx * k, iyy: ac.mass.iyy * k, izz: ac.mass.izz * k } };
}

/** Model value for one validation point. */
export function modelValue(ac, testCase, point) {
  const a = withMass(ac, testCase.mass);
  const opts = { flaps: point.flaps ?? 0, gear: point.gear ?? 0 };
  switch (point.kind) {
    case 'speed':
      return topSpeed(a, testCase.setting, point.altitude, opts);
    case 'climbTime':
      return timeToClimb(a, testCase.setting, point.altitude, opts);
    case 'ceiling':
      return ceiling(a, testCase.setting, opts);
    case 'stall':
      return equivalentAirspeed(stallSpeed(a, testCase.setting, point.altitude, opts), point.altitude);
    case 'roll':
      return steadyRoll(a, {
        eas: point.eas, altitude: point.altitude, aileron: 1, stickForce: point.stickForce, full: point.fullDeflection,
      }).pb2v;
    default:
      throw new Error(`unknown validation kind ${point.kind}`);
  }
}

/** All results for one aircraft id: [{ source, label, kind, altitude, value, model, error }]. */
export function validateAircraft(id, ac = aircraftById[id]) {
  const rows = [];
  for (const testCase of validationCases[id]) {
    for (const point of testCase.points) {
      const model = modelValue(ac, testCase, point);
      rows.push({
        source: testCase.source, label: testCase.label, ...point, model, error: (model - point.value) / point.value,
      });
    }
  }
  return rows;
}
