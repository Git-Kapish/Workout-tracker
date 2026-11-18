/** Local calendar date, 'YYYY-MM-DD'. Validated at the boundary (see dates.ts). */
export type DateString = string;

export interface Entry {
  id: number;
  exerciseName: string;
  /** Integer > 0. */
  sets: number;
  /** Integer > 0, per set. */
  reps: number;
  weightKg: number | null;
  date: DateString;
}

export type NewEntry = Omit<Entry, 'id'>;

export interface Summary {
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  exerciseCount: number;
}

export interface WeekSummary extends Summary {
  weekStart: DateString;
}

export type Trend = 'up' | 'down' | 'same' | 'no-baseline';

export interface MetricComparison {
  current: number;
  previous: number;
  /** null when previous is 0 (UI shows "No baseline"). */
  percent: number | null;
  trend: Trend;
}

export interface Comparison {
  exercises: MetricComparison;
  sets: MetricComparison;
  reps: MetricComparison;
  volume: MetricComparison;
}
