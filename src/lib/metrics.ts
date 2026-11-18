import { weekStart } from './weeks';
import type { DateString, Entry, Summary } from './types';

// Volume weights have at most 2 decimals and sets/reps are integers, so rounding to
// 2 decimals removes float noise (0.1 + 0.2) without changing any real value.
const round2 = (n: number): number => Math.round(n * 100) / 100;

type Summarizable = Pick<Entry, 'sets' | 'reps' | 'weightKg'>;

export function summarize(entries: readonly Summarizable[]): Summary {
  let totalSets = 0;
  let totalReps = 0;
  let totalVolumeKg = 0;
  for (const e of entries) {
    totalSets += e.sets;
    totalReps += e.sets * e.reps;
    totalVolumeKg += e.sets * e.reps * (e.weightKg ?? 0);
  }
  return {
    totalSets,
    totalReps,
    totalVolumeKg: round2(totalVolumeKg),
    exerciseCount: entries.length,
  };
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (groups[k] ??= []).push(item);
  }
  return groups;
}

/** Keyed by the week's Monday. */
export function groupByWeek(entries: readonly Entry[]): Record<DateString, Entry[]> {
  return groupBy(entries, (e) => weekStart(e.date));
}

export function groupByDay(entries: readonly Entry[]): Record<DateString, Entry[]> {
  return groupBy(entries, (e) => e.date);
}
