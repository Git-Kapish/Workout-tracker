import { diffDays, parseLocalDate, weekdayIndex } from './dates';
import { MONTHS_SHORT, WEEKDAYS_LONG, WEEKDAYS_SHORT } from './labels';
import type { DateString, Entry, MetricComparison, Summary, Trend } from './types';
import type { PersonalBests } from './metrics';
import { weekStart } from './weeks';

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

/** 'Nov 16', or 'Nov 16, 2025' when it is not in the same year as `today`. */
export function formatShortDate(date: DateString, today: DateString): string {
  return parts(date).y === parts(today).y
    ? formatMonthDay(date)
    : `${formatMonthDay(date)}, ${parts(date).y}`;
}

/** 'Last done Nov 16' */
export function formatLastDone(date: DateString, today: DateString): string {
  return `Last done ${formatShortDate(date, today)}`;
}

/** The "Best" figure on the exercise list: '42.5 kg' or '6 reps'. */
export function formatBest(best: { kind: 'weight' | 'reps'; value: number }): string {
  return best.kind === 'weight' ? formatWeight(best.value) : formatReps(best.value);
}

const NO_RECORD = '—';

/** Text for the three record cards; '—' where there is no record (e.g. bodyweight). */
export function formatPersonalBests(bests: PersonalBests): {
  maxWeight: string;
  bestVolume: string;
  maxReps: string;
} {
  return {
    maxWeight: bests.maxWeightKg === null ? NO_RECORD : formatWeight(bests.maxWeightKg),
    bestVolume: bests.bestVolumeKg === null ? NO_RECORD : formatVolume(bests.bestVolumeKg),
    maxReps: bests.maxRepsPerSet === null ? NO_RECORD : formatNumber(bests.maxRepsPerSet, 0),
  };
}

/** '6 EXERCISES', '1 EXERCISE', or '2 OF 6 EXERCISES' while filtering. */
export function formatExerciseListCount(shown: number, total: number): string {
  const noun = total === 1 ? 'EXERCISE' : 'EXERCISES';
  return shown === total ? `${total} ${noun}` : `${shown} OF ${total} ${noun}`;
}

/** 'Tuesday, Nov 17 · Today' (the suffix only for today). */
export function formatDayTitle(date: DateString, today: DateString): string {
  return `${formatLongDate(date)}${date === today ? ' · Today' : ''}`;
}

/** '2 exercises · 7 sets · 50 reps'; empty string for a day with nothing logged. */
export function formatDayStats(summary: Summary): string {
  if (summary.exerciseCount === 0) return '';
  return [
    formatExerciseCount(summary.exerciseCount),
    plural(summary.totalSets, 'set', 'sets'),
    formatReps(summary.totalReps),
  ].join(' · ');
}

/** Caption under the week label: 'This week', 'Last week', '3 weeks ago', 'In 2 weeks'... */
export function formatWeekRelative(week: DateString, today: DateString): string {
  const weeks = Math.round(diffDays(weekStart(week), weekStart(today)) / 7);
  if (weeks === 0) return 'This week';
  if (weeks === -1) return 'Last week';
  if (weeks === 1) return 'Next week';
  return weeks < 0 ? `${-weeks} weeks ago` : `In ${weeks} weeks`;
}

/** '11/16' (chart axis). */
export function formatNumericMonthDay(date: DateString): string {
  const { m, d } = parts(date);
  return `${m}/${d}`;
}

/** Chart value labels: '850', '1.2k', '3.4k'. Whole numbers below 1,000. */
export function formatCompactNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1000) return formatNumber(n);
  return `${(Math.round(n / 100) / 10).toFixed(1)}k`;
}

const TREND_WORDS: Record<Trend, string> = {
  up: 'Up',
  down: 'Down',
  same: 'Same',
  'no-baseline': 'No baseline',
};

/** 'Up' | 'Down' | 'Same' | 'No baseline' */
export function formatTrendWord(trend: Trend): string {
  return TREND_WORDS[trend];
}

/** 'Up 25%', 'Down 12%', 'Same', 'No baseline'. The sign is carried by the word. */
export function formatOverallHeadline(c: MetricComparison): string {
  if (c.trend === 'up' || c.trend === 'down') {
    return `${TREND_WORDS[c.trend]} ${Math.abs(c.percent ?? 0)}%`;
  }
  return TREND_WORDS[c.trend];
}

/** '134 reps vs 107 last week', or '134 reps · nothing to compare' without a baseline. */
export function formatOverallDetail(c: MetricComparison, previousLabel: string): string {
  if (c.trend === 'no-baseline') return `${formatReps(c.current)} · nothing to compare`;
  return `${formatReps(c.current)} vs ${formatNumber(c.previous, 0)} ${previousLabel}`;
}

/** Screen-title greeting for a local hour 0-23. */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'good morning.';
  if (hour >= 12 && hour < 17) return 'good afternoon.';
  return 'good evening.';
}
