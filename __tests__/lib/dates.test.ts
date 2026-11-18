import {
  addDays,
  diffDays,
  isValidDateString,
  parseLocalDate,
  todayLocal,
  toDateString,
  toPickerDate,
  weekdayIndex,
} from '@/lib/dates';

describe('parseLocalDate / isValidDateString', () => {
  it('parses a valid date', () => {
    expect(parseLocalDate('2026-11-17')).toEqual({ y: 2026, m: 11, d: 17 });
  });

  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '2026-04-31', '2027-02-29', '2026-11-00'])(
    'rejects impossible date %s',
    (s) => {
      expect(parseLocalDate(s)).toBeNull();
      expect(isValidDateString(s)).toBe(false);
    },
  );

  it.each([
    '',
    '2026-1-1',
    '26-01-01',
    '2026/01/01',
    '2026-01-01T00:00',
    ' 2026-01-01',
    'abcd-ef-gh',
    '0050-01-01',
  ])('rejects bad format %j', (s) => {
    expect(isValidDateString(s)).toBe(false);
  });

  it('accepts leap days only in leap years', () => {
    expect(isValidDateString('2028-02-29')).toBe(true);
    expect(isValidDateString('2000-02-29')).toBe(true);
    expect(isValidDateString('2100-02-29')).toBe(false);
    expect(isValidDateString('2026-02-29')).toBe(false);
  });
});

describe('toDateString', () => {
  it('zero-pads', () => {
    expect(toDateString({ y: 2026, m: 3, d: 5 })).toBe('2026-03-05');
  });
});

describe('todayLocal', () => {
  it('uses the local calendar date of the injected clock', () => {
    expect(todayLocal(new Date(2026, 10, 17, 23, 59, 59))).toBe('2026-11-17');
    expect(todayLocal(new Date(2026, 10, 18, 0, 0, 1))).toBe('2026-11-18');
  });
});

describe('toPickerDate', () => {
  it('round-trips through todayLocal for every day of a DST-heavy stretch', () => {
    let d = '2026-03-01';
    for (let i = 0; i < 400; i++) {
      expect(todayLocal(toPickerDate(d))).toBe(d);
      d = addDays(d, 1);
    }
  });

  it('throws on an invalid date', () => {
    expect(() => toPickerDate('2026-02-30')).toThrow();
  });
});

describe('addDays', () => {
  it('crosses month, year and leap boundaries', () => {
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-11-17', 0)).toBe('2026-11-17');
  });

  it('is exact over daylight-saving transitions (US and EU)', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('throws on an invalid date instead of returning NaN', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow();
  });
});

describe('diffDays', () => {
  it('counts whole days (a - b)', () => {
    expect(diffDays('2026-11-22', '2026-11-16')).toBe(6);
    expect(diffDays('2026-11-16', '2026-11-22')).toBe(-6);
    expect(diffDays('2027-01-01', '2026-12-31')).toBe(1);
    expect(diffDays('2028-03-01', '2028-02-28')).toBe(2);
  });

  it('is exact across daylight-saving transitions', () => {
    expect(diffDays('2026-03-09', '2026-03-07')).toBe(2);
    expect(diffDays('2026-11-02', '2026-10-31')).toBe(2);
  });
});

describe('weekdayIndex', () => {
  it('is 0 for Monday and 6 for Sunday', () => {
    expect(weekdayIndex('2026-11-16')).toBe(0);
    expect(weekdayIndex('2026-11-17')).toBe(1);
    expect(weekdayIndex('2026-11-22')).toBe(6);
    expect(weekdayIndex('2028-02-29')).toBe(1); // Tuesday
  });
});
