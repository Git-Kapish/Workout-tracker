import { addDays, parseLocalDate, toDateString } from './dates';
import type { DateString } from './types';
import { weekEnd, weekStart } from './weeks';

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface CalendarCell {
  date: DateString;
  /** False for the leading/trailing days of the neighbouring months that fill the grid. */
  inMonth: boolean;
}

function parts(date: DateString) {
  const ymd = parseLocalDate(date);
  if (!ymd) throw new Error(`Invalid date string: "${date}"`);
  return ymd;
}

/** The first day of the month containing `date`. */
export function monthStart(date: DateString): DateString {
  const { y, m } = parts(date);
  return toDateString({ y, m, d: 1 });
}

/** The first day of the month `n` months after (or before, if negative) the one holding `date`. */
export function addMonths(date: DateString, n: number): DateString {
  const { y, m } = parts(date);
  const index = y * 12 + (m - 1) + n;
  return toDateString({ y: Math.floor(index / 12), m: (index % 12) + 1, d: 1 });
}

/** 'November 2026'. */
export function formatMonthTitle(date: DateString): string {
  const { y, m } = parts(date);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** Whole weeks (Monday first) covering the month: 4 to 6 rows of 7 days. */
export function monthGrid(date: DateString): CalendarCell[][] {
  const first = monthStart(date);
  const last = addDays(addMonths(first, 1), -1);
  const rows: CalendarCell[][] = [];
  for (
    let start = weekStart(first);
    start <= weekEnd(last) && start <= last;
    start = addDays(start, 7)
  ) {
    rows.push(
      Array.from({ length: 7 }, (_, i) => {
        const day = addDays(start, i);
        return { date: day, inMonth: day >= first && day <= last };
      }),
    );
  }
  return rows;
}

/** First and last day shown by monthGrid, for loading the entries that fall inside it. */
export function gridRange(date: DateString): { start: DateString; end: DateString } {
  const first = monthStart(date);
  const last = addDays(addMonths(first, 1), -1);
  return { start: weekStart(first), end: weekEnd(last) };
}
