import {
  PAGER_CENTER,
  PAGER_COUNT,
  PAGER_PAGES,
  clampPage,
  dateForPage,
  pageForDate,
  pageFromOffset,
  weekStartForPage,
} from '@/lib/weekPager';

const ANCHOR = '2026-11-16'; // a Monday

describe('weekStartForPage', () => {
  it('puts the anchor week in the middle and steps by whole weeks', () => {
    expect(weekStartForPage(ANCHOR, PAGER_CENTER)).toBe('2026-11-16');
    expect(weekStartForPage(ANCHOR, PAGER_CENTER + 1)).toBe('2026-11-23');
    expect(weekStartForPage(ANCHOR, PAGER_CENTER - 1)).toBe('2026-11-09');
    expect(weekStartForPage(ANCHOR, PAGER_CENTER + 7)).toBe('2027-01-04'); // across New Year
  });

  it('only ever produces Mondays', () => {
    for (const page of [0, 1, 99, PAGER_CENTER, 777, PAGER_COUNT - 1]) {
      const start = weekStartForPage(ANCHOR, page);
      expect(dateForPage(ANCHOR, page, 0)).toBe(start);
      expect(dateForPage(ANCHOR, page, 6)).not.toBe(start);
    }
  });

  it('covers about ten years each way without invalid dates', () => {
    const first = weekStartForPage(ANCHOR, 0);
    expect(first > '2016-11-01' && first < '2017-01-01').toBe(true); // ten years back
    const last = weekStartForPage(ANCHOR, PAGER_COUNT - 1);
    expect(last > '2036-10-01' && last < '2037-01-01').toBe(true); // ten years ahead
    expect(() => weekStartForPage(ANCHOR, PAGER_COUNT - 1)).not.toThrow();
  });
});

describe('pageForDate', () => {
  it('is the inverse of weekStartForPage for every day of a week', () => {
    for (const page of [PAGER_CENTER - 30, PAGER_CENTER, PAGER_CENTER + 52]) {
      for (let weekday = 0; weekday < 7; weekday++) {
        expect(pageForDate(ANCHOR, dateForPage(ANCHOR, page, weekday))).toBe(page);
      }
    }
  });

  it('puts Sunday and the following Monday on different pages', () => {
    expect(pageForDate(ANCHOR, '2026-11-22')).toBe(PAGER_CENTER); // Sunday
    expect(pageForDate(ANCHOR, '2026-11-23')).toBe(PAGER_CENTER + 1); // Monday
  });

  it('handles month, year and leap-year boundaries', () => {
    expect(pageForDate('2026-03-30', '2026-04-05')).toBe(PAGER_CENTER);
    expect(pageForDate('2026-12-28', '2027-01-03')).toBe(PAGER_CENTER);
    expect(pageForDate('2028-02-28', '2028-02-29')).toBe(PAGER_CENTER);
  });

  it('clamps dates outside the range instead of returning an invalid page', () => {
    expect(pageForDate(ANCHOR, '1990-01-01')).toBe(0);
    expect(pageForDate(ANCHOR, '2100-01-01')).toBe(PAGER_COUNT - 1);
  });
});

describe('pageFromOffset', () => {
  it('rounds to the nearest page, flipping at the halfway point', () => {
    expect(pageFromOffset(0, 390)).toBe(0);
    expect(pageFromOffset(194, 390)).toBe(0);
    expect(pageFromOffset(196, 390)).toBe(1);
    expect(pageFromOffset(390 * 520, 390)).toBe(PAGER_CENTER);
  });

  it('clamps rubber-banding overscroll at both ends', () => {
    expect(pageFromOffset(-80, 390)).toBe(0);
    expect(pageFromOffset(390 * PAGER_COUNT + 500, 390)).toBe(PAGER_COUNT - 1);
  });

  it('never divides by zero before layout', () => {
    expect(pageFromOffset(100, 0)).toBe(PAGER_CENTER);
    expect(pageFromOffset(Number.NaN, 390)).toBe(PAGER_CENTER);
    expect(pageFromOffset(Number.POSITIVE_INFINITY, 390)).toBe(PAGER_CENTER);
  });
});

describe('clampPage / PAGER_PAGES', () => {
  it('keeps pages inside the data', () => {
    expect(clampPage(-5)).toBe(0);
    expect(clampPage(PAGER_COUNT + 5)).toBe(PAGER_COUNT - 1);
    expect(PAGER_PAGES).toHaveLength(PAGER_COUNT);
    expect(PAGER_PAGES[PAGER_CENTER]).toBe(PAGER_CENTER);
  });
});
