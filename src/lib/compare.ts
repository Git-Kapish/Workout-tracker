import type { Comparison, MetricComparison, Summary, Trend } from './types';

/** Whole percent, half away from zero; null when there is no baseline. Never NaN/Infinity. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  // Multiply before dividing: integer inputs then give exact halves (e.g. 12.5).
  const raw = ((current - previous) * 100) / previous;
  const rounded = Math.sign(raw) * Math.round(Math.abs(raw));
  return rounded === 0 ? 0 : rounded; // normalise -0
}

export function trend(current: number, previous: number): Trend {
  if (previous === 0) return 'no-baseline';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'same';
}

function compareMetric(current: number, previous: number): MetricComparison {
  return {
    current,
    previous,
    percent: percentChange(current, previous),
    trend: trend(current, previous),
  };
}

export function compareWeeks(current: Summary, previous: Summary): Comparison {
  return {
    exercises: compareMetric(current.exerciseCount, previous.exerciseCount),
    sets: compareMetric(current.totalSets, previous.totalSets),
    reps: compareMetric(current.totalReps, previous.totalReps),
    volume: compareMetric(current.totalVolumeKg, previous.totalVolumeKg),
  };
}
