import { CSV_HEADER, csvFileName, entriesToCsv, parseCsv } from '@/lib/csv';
import type { Entry } from '@/lib/types';

let id = 0;
const e = (
  exerciseName: string,
  date = '2026-11-17',
  sets = 3,
  reps = 10,
  weightKg: number | null = 40,
): Entry => ({ id: ++id, exerciseName, date, sets, reps, weightKg });

const BOM = '﻿';

describe('entriesToCsv', () => {
  it('writes a BOM, the header and one CRLF-terminated row per entry', () => {
    const csv = entriesToCsv([
      e('Bench Press', '2026-11-16', 3, 10, 42.5),
      e('Squat', '2026-11-17', 4, 8, 65),
    ]);
    expect(csv).toBe(
      `${BOM}date,exercise,sets,reps,weight_kg\r\n2026-11-16,Bench Press,3,10,42.5\r\n2026-11-17,Squat,4,8,65\r\n`,
    );
  });

  it('exports just the header for an empty database', () => {
    expect(entriesToCsv([])).toBe(`${BOM}${CSV_HEADER.join(',')}\r\n`);
  });

  it('leaves the weight empty for bodyweight exercises', () => {
    expect(entriesToCsv([e('Pull-ups', '2026-11-17', 3, 6, null)])).toContain(
      '\r\n2026-11-17,Pull-ups,3,6,\r\n',
    );
  });

  it('keeps the order it is given (the repository returns date, then id)', () => {
    const csv = entriesToCsv([e('B', '2026-11-01'), e('A', '2026-11-02')]);
    expect(csv.indexOf('2026-11-01')).toBeLessThan(csv.indexOf('2026-11-02'));
  });

  it('quotes commas, quotes and line breaks, doubling inner quotes (RFC 4180)', () => {
    const csv = entriesToCsv([
      e('Press, overhead'),
      e('The "big" one'),
      e('Two\nlines'),
      e('Carriage\rreturn'),
    ]);
    expect(csv).toContain('"Press, overhead"');
    expect(csv).toContain('"The ""big"" one"');
    expect(csv).toContain('"Two\nlines"');
    expect(csv).toContain('"Carriage\rreturn"');
  });

  it('does not quote plain names, and keeps accents and emoji as they are', () => {
    const csv = entriesToCsv([e('Épaulé 🏋️ 日本語')]);
    expect(csv).toContain(',Épaulé 🏋️ 日本語,');
    expect(csv).not.toContain('"Épaulé');
  });

  it('writes decimal weights without noise', () => {
    expect(entriesToCsv([e('X', '2026-11-17', 1, 1, 22.25)])).toContain(',22.25\r\n');
  });
});

describe('parseCsv', () => {
  it('parses plain rows with CRLF or LF, with or without a final newline', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('handles quotes, doubled quotes, commas and line breaks inside fields', () => {
    expect(parseCsv('"a,b","say ""hi""","x\ny"\r\n')).toEqual([['a,b', 'say "hi"', 'x\ny']]);
  });

  it('keeps empty fields and strips a leading BOM', () => {
    expect(parseCsv(`${BOM}a,,c\r\n,,\r\n`)).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
    expect(parseCsv('""')).toEqual([['']]);
  });

  it('returns no rows for empty input and throws on an unterminated quote', () => {
    expect(parseCsv('')).toEqual([]);
    expect(() => parseCsv('a,"oops')).toThrow();
  });
});

describe('export round trip', () => {
  const NASTY = [
    'Bench Press',
    'Press, overhead',
    'The "big" one',
    '"Quoted"',
    'Two\nlines',
    'a\r\nb',
    ',leading comma',
    'trailing comma,',
    '""',
    '100% Effort',
    "O'Brien's",
    'Épaulé 🏋️ 日本語',
    '=1+1',
    '   ', // whitespace only (the repository never stores this, but the CSV layer must survive it)
  ];

  it('parses back to exactly the data that was exported, for every awkward name', () => {
    const entries = NASTY.map((name, i) =>
      e(name, '2026-11-17', i + 1, i + 2, i % 3 === 0 ? null : i + 0.25),
    );
    const rows = parseCsv(entriesToCsv(entries));
    expect(rows[0]).toEqual([...CSV_HEADER]);
    expect(rows).toHaveLength(entries.length + 1);
    entries.forEach((entry, i) => {
      expect(rows[i + 1]).toEqual([
        entry.date,
        entry.exerciseName,
        String(entry.sets),
        String(entry.reps),
        entry.weightKg === null ? '' : String(entry.weightKg),
      ]);
    });
  });

  it('every row has exactly five fields, whatever is in the names', () => {
    const rows = parseCsv(entriesToCsv(NASTY.map((name) => e(name))));
    expect(rows.every((r) => r.length === 5)).toBe(true);
  });

  it('survives a large export', () => {
    const many = Array.from({ length: 5000 }, (_, i) =>
      e(`Exercise ${i % 50}, set "${i}"`, '2026-11-17', 3, 10, 20),
    );
    const rows = parseCsv(entriesToCsv(many));
    expect(rows).toHaveLength(5001);
    expect(rows[5000]?.[1]).toBe('Exercise 49, set "4999"');
  });
});

describe('csvFileName', () => {
  it('is dated and ends in .csv (iOS appends the extension if it is missing)', () => {
    expect(csvFileName('2026-11-17')).toBe('tally-export-2026-11-17.csv');
  });
});
