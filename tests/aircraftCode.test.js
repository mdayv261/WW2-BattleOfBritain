// Links the data files to docs/AIRCRAFT_DATA.md (DECISIONS.md D7): every number in a data file must
// have a row keyed by its path, in the right section, with the same value after unit conversion.
// Series of [x, y] pairs are written in the document as "x:y, x:y, ..." (y in the row's unit).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { spitfire } from '../src/aircraft/spitfire.js';
import { hurricane } from '../src/aircraft/hurricane.js';
import { bf109e4 } from '../src/aircraft/bf109e4.js';
import { merlin3 } from '../src/aircraft/merlin3.js';
import { db601a } from '../src/aircraft/db601a.js';
import { common } from '../src/aircraft/common.js';
import { naca640 } from '../src/aircraft/naca640.js';
import { validationCases } from '../src/aircraft/validationCases.js';

const DATA_FILES = [
  { name: 'spitfire.js', data: spitfire, section: 'Supermarine Spitfire Mk I' },
  { name: 'hurricane.js', data: hurricane, section: 'Hawker Hurricane Mk I' },
  { name: 'bf109e4.js', data: bf109e4, section: 'Messerschmitt Bf 109 E-4' },
  { name: 'merlin3.js', data: merlin3, section: 'Rolls-Royce Merlin III' },
  { name: 'db601a.js', data: db601a, section: 'Daimler-Benz DB 601A' },
  { name: 'common.js', data: common, section: 'Common flight-model parameters' },
  { name: 'naca640.js', data: naca640, section: 'Propeller data: NACA Report 640' },
];

// Multiply a value written in the document's unit by this to get the SI value in the code.
const UNIT_FACTOR = { kW: 1e3, kPa: 1e3, deg: Math.PI / 180, rpm: (2 * Math.PI) / 60, ata: 98066.5 };
const TOLERANCE = 0.005;

const markdown = readFileSync(new URL('../docs/AIRCRAFT_DATA.md', import.meta.url), 'utf8');

/** Keyed rows of each "## " section: { section: { key: { value, unit, line } } }. */
function keyedRows(md) {
  const out = {};
  let section = null;
  md.split('\n').forEach((line, i) => {
    if (line.startsWith('## ')) section = line.slice(3).trim();
    const key = line.startsWith('|') ? line.match(/\(`([^`]+)`\)/) : null;
    if (!section || !key) return;
    const cells = line.split('|').map((c) => c.trim());
    (out[section] ??= {})[key[1]] = { value: cells[2], unit: cells[3], line: i + 1 };
  });
  return out;
}

const isPairs = (a) => Array.isArray(a) && a.length > 0 && a.every((p) => Array.isArray(p) && p.length === 2
  && p.every((x) => typeof x === 'number'));

/** Every number (or series of pairs) in a data object, by dotted path. */
function numericLeaves(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'number' || isPairs(v)) out[path] = v;
    else if (v && typeof v === 'object' && !Array.isArray(v)) numericLeaves(v, path, out);
  }
  return out;
}

const parseNumber = (text) => Number(text.replace(/,/g, '').match(/-?\d+(\.\d+)?/)?.[0]);
const parseSeries = (text) => text.split(/,\s+/).map((pair) => pair.split(':').map((t) => parseNumber(t)));
const close = (a, b) => Math.abs(a - b) <= TOLERANCE * Math.max(Math.abs(a), Math.abs(b), 1e-9) + 1e-12;
const sectionOf = (rows, title) => Object.entries(rows).find(([s]) => s.startsWith(title))?.[1];

const rows = keyedRows(markdown);

describe('data files match docs/AIRCRAFT_DATA.md', () => {
  for (const file of DATA_FILES) {
    describe(file.name, () => {
      const section = sectionOf(rows, file.section);
      it(`has a section "${file.section}" with keyed rows`, () => {
        expect(section, file.section).toBeDefined();
      });
      for (const [path, value] of Object.entries(numericLeaves(file.data))) {
        it(`${path}`, () => {
          const row = section?.[path];
          expect(row, `no row keyed (\`${path}\`) in "${file.section}"`).toBeDefined();
          const factor = UNIT_FACTOR[row.unit] ?? 1;
          if (isPairs(value)) {
            const doc = parseSeries(row.value);
            expect(doc.length, `${path}: number of points`).toBe(value.length);
            value.forEach(([x, y], i) => {
              expect(close(doc[i][0], x), `${path} point ${i}: x ${doc[i][0]} vs ${x}`).toBe(true);
              expect(close(doc[i][1] * factor, y), `${path} point ${i}: y ${doc[i][1]} ${row.unit} vs ${y}`).toBe(true);
            });
          } else {
            const docValue = parseNumber(row.value) * factor;
            expect(close(docValue, value), `${path}: document ${row.value} ${row.unit} vs code ${value} (line ${row.line})`).toBe(true);
          }
        });
      }
    });
  }

  it('every validation case cites a listed source', () => {
    const sources = new Set([...markdown.matchAll(/^\| (S\d+) \|/gm)].map((m) => m[1]));
    for (const [id, cases] of Object.entries(validationCases)) {
      for (const c of cases) expect(sources.has(c.source), `${id}: ${c.source}`).toBe(true);
    }
  });
});
