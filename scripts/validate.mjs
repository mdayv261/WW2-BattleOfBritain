// npm run validate: compares each flight model with its published performance figures.
import { aircraftList } from '../src/aircraft/index.js';
import { validateAircraft } from '../src/physics/validation.js';
import { UNIT } from '../src/core/constants.js';

const show = (kind, v, side) => {
  if (kind === 'speed' || kind === 'stall') return side === 'RAF' ? `${(v / UNIT.MPH).toFixed(1)} mph` : `${(v / UNIT.KMH).toFixed(0)} km/h`;
  if (kind === 'climbTime') return Number.isFinite(v) ? `${(v / 60).toFixed(1)} min` : 'never';
  if (kind === 'ceiling') return side === 'RAF' ? `${(v / UNIT.FT).toFixed(0)} ft` : `${v.toFixed(0)} m`;
  return v.toFixed(3);
};
const where = (p, side) => (p.altitude === undefined ? '' : side === 'RAF' ? `${(p.altitude / UNIT.FT).toFixed(0)} ft` : `${p.altitude} m`);

for (const ac of aircraftList) {
  console.log(`\n${ac.name}`);
  for (const r of validateAircraft(ac.id, ac)) {
    const tag = r.calibration ? ' (calibration)' : '';
    const extra = r.flaps ? ' flaps+gear down' : r.stickForce ? ' 30 lb stick' : '';
    console.log(`  ${r.source.padEnd(4)} ${r.kind.padEnd(9)} ${where(r, ac.side).padStart(9)}${extra}  source ${show(r.kind, r.value, ac.side).padStart(10)}  model ${show(r.kind, r.model, ac.side).padStart(10)}  ${(r.error * 100).toFixed(1).padStart(6)}%${tag}`);
  }
}
