import { addDays, parseLocalDate, weekdayIndex } from './dates';
import { MONTHS_SHORT } from './labels';
import type { DateString } from './types';

// Weeks run Monday-Sunday and are identified by their Monday, never by number.

export interface WeekRange {
  start: DateString;
  end: DateString;
  days: DateString[];
}

export function weekStart(date: DateString): DateString {
  return addDays(date, -weekdayIndex(date));
}

export function weekEnd(date: DateString): DateString {
  return addDays(weekStart(date), 6);
}

export function weekRange(date: DateString): WeekRange {
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return { start, end: days[6], days };
}

export function previousWeekStart(date: DateString): DateString {
  return addDays(weekStart(date), -7);
}

export function nextWeekStart(date: DateString): DateString {
  return addDays(weekStart(date), 7);
}

/** The n week starts ending with the week containing `date`, oldest first. */
export function lastNWeekStarts(date: DateString, n: number): DateString[] {
  const current = weekStart(date);
  return Array.from({ length: n }, (_, i) => addDays(current, -7 * (n - 1 - i)));
}

function monthDay(date: DateString): string {
  const ymd = parseLocalDate(date);
  if (!ymd) throw new Error(`Invalid date string: "${date}"`);
  return `${MONTHS_SHORT[ymd.m - 1]} ${ymd.d}`;
}

/** 'Nov 16 – Nov 22'; years are added only when the week crosses a year boundary. */
export function formatWeekLabel(start: DateString): string {
  const first = weekStart(start);
  const last = addDays(first, 6);
  const y1 = parseLocalDate(first)?.y;
  const y2 = parseLocalDate(last)?.y;
  if (y1 !== y2) return `${monthDay(first)}, ${y1} – ${monthDay(last)}, ${y2}`;
  return `${monthDay(first)} – ${monthDay(last)}`;
}
