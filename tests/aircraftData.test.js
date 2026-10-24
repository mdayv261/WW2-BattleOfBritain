// Enforces the source policy (DECISIONS.md D8) on docs/AIRCRAFT_DATA.md: every data row has a value, a unit,
// the original figure, known source IDs and a confidence rating, and every estimate gives its reason.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const DATA_FILE = new URL('../docs/AIRCRAFT_DATA.md', import.meta.url);
const DATA_HEADER = ['Parameter', 'Value', 'Unit', 'Original figure', 'Source', 'Confidence', 'Notes'];
const SOURCES_HEADER = ['ID', 'Source', 'URL', 'Type'];
const CONFIDENCE_LEVELS = ['high', 'medium', 'estimate'];
const ESTIMATE_SOURCE = 'ASSUMPTION';

/** Splits one Markdown table line into trimmed cells, dropping the outer pipes. */
function cells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

/** Returns every table as { header, rows, section }, where section is the nearest heading above it. */
function parseTables(markdown) {
  const tables = [];
  const lines = markdown.split('\n');
  let section = '';
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith('#')) section = lines[i].replace(/^#+\s*/, '');
    const isTableStart = lines[i].trim().startsWith('|') && /^\s*\|[\s|:-]+\|\s*$/.test(lines[i + 1] ?? '');
    if (!isTableStart) continue;
    const table = { header: cells(lines[i]), rows: [], section, line: i + 1 };
    i += 2;
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      table.rows.push({ cells: cells(lines[i]), line: i + 1 });
      i += 1;
    }
    tables.push(table);
  }
  return tables;
}

const sameHeader = (a, b) => a.length === b.length && a.every((cell, i) => cell === b[i]);

const markdown = readFileSync(DATA_FILE, 'utf8');
const tables = parseTables(markdown);
const sourcesTable = tables.find((t) => sameHeader(t.header, SOURCES_HEADER));
const dataTables = tables.filter((t) => sameHeader(t.header, DATA_HEADER));
const sourceIds = new Set((sourcesTable?.rows ?? []).map((row) => row.cells[0]));
const dataRows = dataTables.flatMap((t) => t.rows.map((row) => ({ ...row, section: t.section })));
const where = (row) => `${row.section}, line ${row.line} ("${row.cells[0]}")`;

describe('docs/AIRCRAFT_DATA.md', () => {
  it('has a source list with an ID, description and URL for every source', () => {
    expect(sourcesTable, 'Sources table not found').toBeDefined();
    expect(sourceIds.size).toBeGreaterThan(0);
    for (const row of sourcesTable.rows) {
      expect(row.cells[0], `line ${row.line}`).toMatch(/^S\d+$/);
      expect(row.cells[1], `line ${row.line}: description`).not.toBe('');
      expect(row.cells[2], `line ${row.line}: URL`).toMatch(/^https?:\/\//);
    }
  });

  it('has no duplicate source IDs', () => {
    expect(sourceIds.size).toBe(sourcesTable.rows.length);
  });

  it('has a data table for each of the five aircraft', () => {
    for (const name of ['Hurricane', 'Spitfire', 'Bf 109', 'Bf 110', 'He 111']) {
      expect(dataTables.some((t) => t.section.includes(name)), name).toBe(true);
    }
  });

  it('gives every data row all seven columns', () => {
    for (const row of dataRows) expect(row.cells.length, where(row)).toBe(DATA_HEADER.length);
  });

  it('gives every data row a value, a unit and the original figure', () => {
    for (const row of dataRows) {
      const [, value, unit, original] = row.cells;
      expect(value, `${where(row)}: value`).not.toBe('');
      expect(unit, `${where(row)}: unit`).not.toBe('');
      expect(original, `${where(row)}: original figure`).not.toBe('');
    }
  });

  it('cites only sources from the source list, or ASSUMPTION', () => {
    for (const row of dataRows) {
      const cited = row.cells[4].split(',').map((id) => id.trim());
      expect(cited.length, where(row)).toBeGreaterThan(0);
      for (const id of cited) {
        expect(id === ESTIMATE_SOURCE || sourceIds.has(id), `${where(row)}: unknown source "${id}"`).toBe(true);
      }
    }
  });

  it('rates every row high, medium or estimate', () => {
    for (const row of dataRows) expect(CONFIDENCE_LEVELS, where(row)).toContain(row.cells[5]);
  });

  it('marks every ASSUMPTION as an estimate and gives every estimate a reason', () => {
    for (const row of dataRows) {
      const [, , , , source, confidence, notes] = row.cells;
      if (source.includes(ESTIMATE_SOURCE)) expect(confidence, where(row)).toBe('estimate');
      if (confidence === 'estimate') expect(notes.length, `${where(row)}: estimate needs a reason`).toBeGreaterThan(10);
    }
  });

  it('only rates a row high when it cites two sources or a museum record', () => {
    const museumIds = new Set(
      sourcesTable.rows.filter((row) => /museum/i.test(row.cells[3])).map((row) => row.cells[0]),
    );
    for (const row of dataRows.filter((r) => r.cells[5] === 'high')) {
      const cited = row.cells[4].split(',').map((id) => id.trim());
      const ok = cited.length >= 2 || cited.some((id) => museumIds.has(id));
      expect(ok, `${where(row)}: "high" needs two sources or a museum record`).toBe(true);
    }
  });

  it('cites every listed source at least once', () => {
    const cited = new Set(dataRows.flatMap((row) => row.cells[4].split(',').map((id) => id.trim())));
    for (const id of sourceIds) expect(cited.has(id), `${id} is listed but never cited`).toBe(true);
  });

  it('keeps an "Open research gaps" section', () => {
    expect(markdown).toMatch(/^## Open research gaps/m);
  });
});
