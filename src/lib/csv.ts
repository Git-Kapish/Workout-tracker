import type { DateString, Entry } from './types';

// RFC 4180 CSV for the backup export (PRD §8). Pure: file access lives in src/platform.

export const CSV_HEADER = ['date', 'exercise', 'sets', 'reps', 'weight_kg'] as const;

const BOM = '﻿';
const EOL = '\r\n';

/**
 * Quotes a field when it holds a comma, quote or line break (or edge whitespace that a
 * parser might trim); quotes inside are doubled.
 */
function field(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value) || value !== value.trim();
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * The full file text: UTF-8 with a byte-order mark (so Excel reads accents and emoji
 * correctly), a header row, then one row per entry in the order given (callers pass date,
 * then id). A blank weight is an empty field.
 */
export function entriesToCsv(entries: readonly Entry[]): string {
  const rows = entries.map((e) =>
    [
      e.date,
      e.exerciseName,
      String(e.sets),
      String(e.reps),
      e.weightKg === null ? '' : String(e.weightKg),
    ]
      .map(field)
      .join(','),
  );
  return BOM + [CSV_HEADER.join(','), ...rows].join(EOL) + EOL;
}

export function csvFileName(today: DateString): string {
  return `tally-export-${today}.csv`;
}

/**
 * Parses CSV text into rows of fields: quoted fields, doubled quotes, embedded commas and
 * line breaks, CRLF or LF, an optional BOM and a missing final newline. Throws on an
 * unterminated quote rather than guessing. (Used to prove the export round-trips; it is also
 * the foundation for the optional CSV import.)
 */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;
  let touched = false; // something has been read on the current row

  const endField = () => {
    row.push(value);
    value = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    touched = false;
  };

  for (let i = 0; i < source.length; i++) {
    const char = source.charAt(i);
    if (inQuotes) {
      if (char === '"') {
        if (source.charAt(i + 1) === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      touched = true;
    } else if (char === ',') {
      endField();
      touched = true;
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && source.charAt(i + 1) === '\n') i++;
      endRow();
    } else {
      value += char;
      touched = true;
    }
  }
  if (inQuotes) throw new Error('CSV ends inside a quoted field.');
  if (touched) endRow();
  return rows;
}
