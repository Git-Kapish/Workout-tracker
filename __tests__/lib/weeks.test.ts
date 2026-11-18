import { addDays } from '@/lib/dates';
import {
  formatWeekLabel,
  lastNWeekStarts,
  nextWeekStart,
  previousWeekStart,
  weekEnd,
  weekRange,
  weekStart,
} from '@/lib/weeks';

describe('weekStart / weekEnd', () => {
  // Mon Nov 16 - Sun Nov 22, 2026
  it.each([
    ['Monday', '2026-11-16'],
    ['Tuesday', '2026-11-17'],
    ['Wednesday', '2026-11-18'],
    ['Thursday', '2026-11-19'],
    ['Friday', '2026-11-20'],
    ['Saturday', '2026-11-21'],
    ['Sunday', '2026-11-22'],
  ])('%s %s belongs to the week of Mon Nov 16', (_name, date) => {
    expect(weekStart(date)).toBe('2026-11-16');
    expect(weekEnd(date)).toBe('2026-11-22');
  });

  it('puts a Sunday in the week that began the previous Monday', () => {
    expect(weekStart('2026-11-22')).toBe('2026-11-16');
    expect(weekStart('2026-11-23')).toBe('2026-11-23'); // next Monday starts a new week
  });

  it('handles a week crossing a month boundary (Mon Mar 30 - Sun Apr 5, 2026)', () => {
    expect(weekStart('2026-04-02')).toBe('2026-03-30');
    expect(weekEnd('2026-03-31')).toBe('2026-04-05');
  });

  it('handles a week crossing a year boundary (Mon Dec 28 - Sun Jan 3)', () => {
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
    expect(weekEnd('2026-12-30')).toBe('2027-01-03');
  });

  it('handles a leap-day week (Mon Feb 28 - Sun Mar 5, 2028)', () => {
    expect(weekStart('2028-02-29')).toBe('2028-02-28');
    expect(weekRange('2028-02-29').days).toContain('2028-02-29');
  });
});

describe('weekRange', () => {
  it('returns 7 consecutive days Monday to Sunday', () => {
    const r = weekRange('2026-11-19');
    expect(r.start).toBe('2026-11-16');
    expect(r.end).toBe('2026-11-22');
    expect(r.days).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
  });

  it.each(['2026-03-08', '2026-11-01', '2026-03-29', '2026-10-25'])(
    'daylight-saving week containing %s still has 7 distinct days',
    (date) => {
      const { days, start } = weekRange(date);
      expect(new Set(days).size).toBe(7);
      days.forEach((d, i) => expect(d).toBe(addDays(start, i)));
    },
  );
});

describe('previous / next week', () => {
  it('previousWeekStart is 7 days before this week start, from any weekday', () => {
    expect(previousWeekStart('2026-11-17')).toBe('2026-11-09');
    expect(previousWeekStart('2026-11-22')).toBe('2026-11-09');
  });

  it('crosses year boundaries', () => {
    expect(previousWeekStart('2027-01-04')).toBe('2026-12-28');
    expect(previousWeekStart('2027-01-01')).toBe('2026-12-21');
    expect(nextWeekStart('2026-12-28')).toBe('2027-01-04');
  });
});

describe('lastNWeekStarts', () => {
  it('returns n Mondays ending with the current week, oldest first', () => {
    expect(lastNWeekStarts('2026-11-17', 3)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16']);
  });

  it('returns 8 consecutive weeks for the chart', () => {
    const weeks = lastNWeekStarts('2026-11-22', 8);
    expect(weeks).toHaveLength(8);
    expect(weeks[0]).toBe('2026-09-28');
    expect(weeks[7]).toBe('2026-11-16');
  });
});

describe('formatWeekLabel', () => {
  it('formats a normal week without a year', () => {
    expect(formatWeekLabel('2026-11-16')).toBe('Nov 16 – Nov 22');
  });

  it('formats a week crossing a month boundary without a year', () => {
    expect(formatWeekLabel('2026-03-30')).toBe('Mar 30 – Apr 5');
  });

  it('adds the year when the week crosses a year boundary', () => {
    expect(formatWeekLabel('2026-12-28')).toBe('Dec 28, 2026 – Jan 3, 2027');
  });
});
