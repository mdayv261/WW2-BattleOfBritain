// npm run validate: compares each flight model with its published performance figures.
//
// Phase 0 has no flight models yet, so this only reports that. Phase 1 replaces the body with the
// real comparison: top speed against altitude, climb times and ceiling for every aircraft data file
// in src/aircraft/, against the validation figures in docs/AIRCRAFT_DATA.md.
import { existsSync, readdirSync } from 'node:fs';

const aircraftDir = new URL('../src/aircraft/', import.meta.url);
const dataFiles = existsSync(aircraftDir)
  ? readdirSync(aircraftDir).filter((name) => name.endsWith('.js'))
  : [];

if (dataFiles.length === 0) {
  console.log('No flight models yet (they arrive in Phase 1). Nothing to validate.');
} else {
  console.log(`Found ${dataFiles.length} aircraft data file(s), but the validation runner is not built yet.`);
  process.exitCode = 1;
}
