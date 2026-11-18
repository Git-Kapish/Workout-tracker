import { diffDays, parseLocalDate, weekdayIndex } from './dates';
import { MONTHS_SHORT, WEEKDAYS_LONG, WEEKDAYS_SHORT } from './labels';
import type { DateString, Entry } from './types';

// Display formatting. Hand-rolled (not toLocaleString) so output is identical on every
// device locale: '3,355', never '3.355'.

/** Up to `maxDecimals`, trailing zeros trimmed, thousands separators. */
export function formatNumber(n: number, maxDecimals = 2): string {
  if (!Number.isFinite(n)) return '0';
  const fixed = Math.abs(n).toFixed(maxDecimals);
  const [int, frac = ''] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const trimmed = frac.replace(/0+$/, '');
  const body = trimmed ? `${grouped}.${trimmed}` : grouped;
  const isZero = Number(fixed) === 0;
  return n < 0 && !isZero ? `-${body}` : body;
}

export function formatWeight(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

export function formatVolume(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

/** '+12%', '-5%', '0%'; null (no baseline) -> 'No baseline'. */
export function formatPercent(percent: number | null): string {
  if (percent === null) return 'No baseline';
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}

function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n, 0)} ${n === 1 ? one : many}`;
}

export function formatReps(n: number): string {
  return plural(n, 'rep', 'reps');
}

/** '2 exercises', '1 exercise', 'No exercises'. */
export function formatExerciseCount(n: number): string {
  return n === 0 ? 'No exercises' : plural(n, 'exercise', 'exercises');
}

/** '4 × 8' */
export function formatSetsReps(sets: number, reps: number): string {
  return `${sets} × ${reps}`;
}

/** '4 × 8 · 65 kg' or '3 × 6 · bodyweight' */
export function formatEntryDetail(entry: Pick<Entry, 'sets' | 'reps' | 'weightKg'>): string {
  const load = entry.weightKg === null ? 'bodyweight' : formatWeight(entry.weightKg);
  return `${formatSetsReps(entry.sets, entry.reps)} · ${load}`;
}

/** Right-hand side of an entry row: '32 reps' over '2,080 kg' (or 'no weight'). */
export function formatEntryTotals(entry: Pick<Entry, 'sets' | 'reps' | 'weightKg'>): {
  reps: string;
  volume: string;
} {
  return {
    reps: formatReps(entry.sets * entry.reps),
    volume:
      entry.weightKg === null
        ? 'no weight'
        : formatVolume(Math.round(entry.sets * entry.reps * entry.weightKg * 100) / 100),
  };
}

function parts(date: DateString) {
  const ymd = parseLocalDate(date);
  if (!ymd) throw new Error(`Invalid date string: "${date}"`);
  return { ...ymd, weekday: weekdayIndex(date) };
}

/** 'Nov 17' */
export function formatMonthDay(date: DateString): string {
  const { m, d } = parts(date);
  return `${MONTHS_SHORT[m - 1]} ${d}`;
}

/** 'Tuesday' */
export function formatWeekdayLong(date: DateString): string {
  return WEEKDAYS_LONG[parts(date).weekday];
}

/** 'Tuesday, Nov 17' */
export function formatLongDate(date: DateString): string {
  return `${formatWeekdayLong(date)}, ${formatMonthDay(date)}`;
}

/**
 * Date row in the log sheet: 'Today, Tue Nov 17', 'Yesterday, Mon Nov 16',
 * 'Tomorrow, Wed Nov 18', otherwise 'Sat, Nov 14' (with the year if it is not this year).
 */
export function formatDateLabel(date: DateString, today: DateString): string {
  const { y, weekday } = parts(date);
  const short = WEEKDAYS_SHORT[weekday];
  const diff = diffDays(date, today);
  if (diff === 0) return `Today, ${short} ${formatMonthDay(date)}`;
  if (diff === -1) return `Yesterday, ${short} ${formatMonthDay(date)}`;
  if (diff === 1) return `Tomorrow, ${short} ${formatMonthDay(date)}`;
  const year = y === parts(today).y ? '' : `, ${y}`;
  return `${short}, ${formatMonthDay(date)}${year}`;
}

/** Screen-title greeting for a local hour 0-23. */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'good morning.';
  if (hour >= 12 && hour < 17) return 'good afternoon.';
  return 'good evening.';
}
