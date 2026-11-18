import {
  formatCompactNumber,
  formatDateLabel,
  formatNumericMonthDay,
  formatOverallDetail,
  formatOverallHeadline,
  formatTrendWord,
  formatDayStats,
  formatDayTitle,
  formatEntryDetail,
  formatWeekRelative,
  formatEntryTotals,
  formatExerciseCount,
  formatLongDate,
  formatMonthDay,
  formatNumber,
  formatPercent,
  formatReps,
  formatVolume,
  formatWeight,
  greetingFor,
} from '@/lib/format';

describe('entry row formatting (DESIGN.md 02-today)', () => {
  it('formats detail for weighted and bodyweight entries', () => {
    expect(formatEntryDetail({ sets: 4, reps: 8, weightKg: 65 })).toBe('4 × 8 · 65 kg');
    expect(formatEntryDetail({ sets: 3, reps: 10, weightKg: 42.5 })).toBe('3 × 10 · 42.5 kg');
    expect(formatEntryDetail({ sets: 3, reps: 6, weightKg: null })).toBe('3 × 6 · bodyweight');
  });

  it('formats the right-hand totals', () => {
    expect(formatEntryTotals({ sets: 4, reps: 8, weightKg: 65 })).toEqual({
      reps: '32 reps',
      volume: '2,080 kg',
    });
    expect(formatEntryTotals({ sets: 3, reps: 6, weightKg: null })).toEqual({
      reps: '18 reps',
      volume: 'no weight',
    });
    expect(formatEntryTotals({ sets: 3, reps: 10, weightKg: 0 }).volume).toBe('0 kg');
  });

  it('pluralises', () => {
    expect(formatReps(1)).toBe('1 rep');
    expect(formatReps(134)).toBe('134 reps');
    expect(formatReps(1200)).toBe('1,200 reps');
    expect(formatExerciseCount(0)).toBe('No exercises');
    expect(formatExerciseCount(1)).toBe('1 exercise');
    expect(formatExerciseCount(2)).toBe('2 exercises');
  });
});

describe('date labels', () => {
  it('formats month/day and long dates', () => {
    expect(formatMonthDay('2026-11-17')).toBe('Nov 17');
    expect(formatLongDate('2026-11-17')).toBe('Tuesday, Nov 17');
    expect(formatLongDate('2028-02-29')).toBe('Tuesday, Feb 29');
    expect(formatLongDate('2026-11-22')).toBe('Sunday, Nov 22');
  });

  it('labels dates relative to today', () => {
    const today = '2026-11-17';
    expect(formatDateLabel('2026-11-17', today)).toBe('Today, Tue Nov 17');
    expect(formatDateLabel('2026-11-16', today)).toBe('Yesterday, Mon Nov 16');
    expect(formatDateLabel('2026-11-18', today)).toBe('Tomorrow, Wed Nov 18');
    expect(formatDateLabel('2026-11-14', today)).toBe('Sat, Nov 14');
    expect(formatDateLabel('2025-12-31', today)).toBe('Wed, Dec 31, 2025');
  });

  it('titles a selected day, marking today (DESIGN.md 04-week)', () => {
    expect(formatDayTitle('2026-11-17', '2026-11-17')).toBe('Tuesday, Nov 17 · Today');
    expect(formatDayTitle('2026-11-16', '2026-11-17')).toBe('Monday, Nov 16');
  });

  it('summarises a day, and gives nothing for an empty one', () => {
    expect(
      formatDayStats({ exerciseCount: 2, totalSets: 7, totalReps: 50, totalVolumeKg: 3000 }),
    ).toBe('2 exercises · 7 sets · 50 reps');
    expect(formatDayStats({ exerciseCount: 1, totalSets: 1, totalReps: 1, totalVolumeKg: 0 })).toBe(
      '1 exercise · 1 set · 1 rep',
    );
    expect(formatDayStats({ exerciseCount: 0, totalSets: 0, totalReps: 0, totalVolumeKg: 0 })).toBe(
      '',
    );
  });

  it('describes a week relative to this one, from any day of either week', () => {
    const today = '2026-11-17'; // week of Mon Nov 16
    expect(formatWeekRelative('2026-11-16', today)).toBe('This week');
    expect(formatWeekRelative('2026-11-22', today)).toBe('This week');
    expect(formatWeekRelative('2026-11-09', today)).toBe('Last week');
    expect(formatWeekRelative('2026-11-23', today)).toBe('Next week');
    expect(formatWeekRelative('2026-10-26', today)).toBe('3 weeks ago');
    expect(formatWeekRelative('2026-12-07', today)).toBe('In 3 weeks');
    expect(formatWeekRelative('2026-12-28', '2027-01-02')).toBe('This week'); // across New Year
  });

  it('formats chart axis dates and compact values', () => {
    expect(formatNumericMonthDay('2026-09-28')).toBe('9/28');
    expect(formatNumericMonthDay('2026-11-02')).toBe('11/2');
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(850)).toBe('850');
    expect(formatCompactNumber(999)).toBe('999');
    expect(formatCompactNumber(1000)).toBe('1.0k');
    expect(formatCompactNumber(2640)).toBe('2.6k');
    expect(formatCompactNumber(3355)).toBe('3.4k');
    expect(formatCompactNumber(Number.NaN)).toBe('0');
  });

  it('describes the overall status (DESIGN.md 05-progress)', () => {
    const up = { current: 134, previous: 107, percent: 25, trend: 'up' } as const;
    const down = { current: 90, previous: 100, percent: -10, trend: 'down' } as const;
    const same = { current: 50, previous: 50, percent: 0, trend: 'same' } as const;
    const none = { current: 40, previous: 0, percent: null, trend: 'no-baseline' } as const;
    expect(formatOverallHeadline(up)).toBe('Up 25%');
    expect(formatOverallHeadline(down)).toBe('Down 10%');
    expect(formatOverallHeadline(same)).toBe('Same');
    expect(formatOverallHeadline(none)).toBe('No baseline');
    expect(formatOverallDetail(up, 'last week')).toBe('134 reps vs 107 last week');
    expect(formatOverallDetail(down, 'prior week')).toBe('90 reps vs 100 prior week');
    expect(formatOverallDetail(none, 'last week')).toBe('40 reps · nothing to compare');
    expect(formatTrendWord('up')).toBe('Up');
    expect(formatTrendWord('no-baseline')).toBe('No baseline');
  });

  it('chooses the greeting by local hour', () => {
    expect(greetingFor(5)).toBe('good morning.');
    expect(greetingFor(11)).toBe('good morning.');
    expect(greetingFor(12)).toBe('good afternoon.');
    expect(greetingFor(16)).toBe('good afternoon.');
    expect(greetingFor(17)).toBe('good evening.');
    expect(greetingFor(23)).toBe('good evening.');
    expect(greetingFor(0)).toBe('good evening.');
    expect(greetingFor(4)).toBe('good evening.');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(3355)).toBe('3,355');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('trims trailing zeros and caps decimals at 2', () => {
    expect(formatNumber(65)).toBe('65');
    expect(formatNumber(42.5)).toBe('42.5');
    expect(formatNumber(42.0)).toBe('42');
    expect(formatNumber(0.30000000000000004)).toBe('0.3');
    expect(formatNumber(2080.755)).toBe('2,080.76');
  });

  it('never prints NaN, Infinity or negative zero', () => {
    expect(formatNumber(Number.NaN)).toBe('0');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0');
    expect(formatNumber(-0)).toBe('0');
    expect(formatNumber(-0.001)).toBe('0');
    expect(formatNumber(-1234.5)).toBe('-1,234.5');
  });
});

describe('formatWeight / formatVolume', () => {
  it('shows kg with trimmed zeros', () => {
    expect(formatWeight(65)).toBe('65 kg');
    expect(formatWeight(42.5)).toBe('42.5 kg');
    expect(formatWeight(22.25)).toBe('22.25 kg');
    expect(formatVolume(3355)).toBe('3,355 kg');
    expect(formatVolume(0)).toBe('0 kg');
  });
});

describe('formatPercent', () => {
  it('signs positives, keeps negatives and zero', () => {
    expect(formatPercent(12)).toBe('+12%');
    expect(formatPercent(-5)).toBe('-5%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(-100)).toBe('-100%');
  });

  it('shows "No baseline" for null', () => {
    expect(formatPercent(null)).toBe('No baseline');
  });
});
