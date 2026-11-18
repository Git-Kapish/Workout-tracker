import type { DateString } from './types';

// The only module allowed to build a Date. All arithmetic is UTC on calendar
// parts, so timezone and DST can never shift a workout to another day.

export interface YMD {
  y: number;
  m: number;
  d: number;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
// Date.UTC maps years 0-99 to 1900-1999, so keep clear of that range.
const MIN_YEAR = 1000;

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/** Parses 'YYYY-MM-DD'; returns null for bad format or an impossible date (e.g. 2026-02-30). */
export function parseLocalDate(s: string): YMD | null {
  const match = DATE_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < MIN_YEAR) return null;
  const check = new Date(Date.UTC(y, m - 1, d));
  const real =
    check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
  return real ? { y, m, d } : null;
}

export function isValidDateString(s: string): boolean {
  return parseLocalDate(s) !== null;
}

export function toDateString({ y, m, d }: YMD): DateString {
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

function toUtcMs(s: DateString): number {
  const ymd = parseLocalDate(s);
  if (!ymd) throw new Error(`Invalid date string: "${s}"`);
  return Date.UTC(ymd.y, ymd.m - 1, ymd.d);
}

function fromUtcMs(ms: number): DateString {
  const dt = new Date(ms);
  return toDateString({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
}

/** The caller (app shell) supplies the clock; pure code never reads it. */
export function todayLocal(now: Date): DateString {
  return toDateString({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

export function addDays(date: DateString, n: number): DateString {
  return fromUtcMs(toUtcMs(date) + n * MS_PER_DAY);
}

/** Whole days from b to a (a - b). */
export function diffDays(a: DateString, b: DateString): number {
  return Math.round((toUtcMs(a) - toUtcMs(b)) / MS_PER_DAY);
}

/**
 * A Date at local noon on `date`, for native date pickers. Noon keeps it on the right
 * calendar day through any DST shift. Convert back with todayLocal().
 */
export function toPickerDate(date: DateString): Date {
  const ymd = parseLocalDate(date);
  if (!ymd) throw new Error(`Invalid date string: "${date}"`);
  return new Date(ymd.y, ymd.m - 1, ymd.d, 12);
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(date: DateString): number {
  return (new Date(toUtcMs(date)).getUTCDay() + 6) % 7;
}
