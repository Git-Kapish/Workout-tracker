import { addMonths, formatMonthTitle, gridRange, monthGrid, monthStart } from '@/lib/calendar';

describe('monthStart / addMonths', () => {
  it('goes to the first of the month', () => {
    expect(monthStart('2026-11-18')).toBe('2026-11-01');
    expect(monthStart('2026-02-28')).toBe('2026-02-01');
  });

  it('moves by months across year boundaries, in both directions', () => {
    expect(addMonths('2026-11-18', 1)).toBe('2026-12-01');
    expect(addMonths('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01');
    expect(addMonths('2026-03-31', -13)).toBe('2025-02-01');
    expect(addMonths('2026-11-18', 0)).toBe('2026-11-01');
  });

  it('never skips a month when the day does not exist in the next one', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01');
  });
});

describe('formatMonthTitle', () => {
  it('shows the full month name and year', () => {
    expect(formatMonthTitle('2026-11-18')).toBe('November 2026');
    expect(formatMonthTitle('2027-01-01')).toBe('January 2027');
  });
});

describe('monthGrid (Monday first)', () => {
  it('lays out November 2026: starts Sunday Nov 1, so the first row begins Monday Oct 26', () => {
    const rows = monthGrid('2026-11-18');
    expect(rows).toHaveLength(6); // Nov 30 is a Monday, so it opens a sixth row
    expect(rows[0]?.[0]).toEqual({ date: '2026-10-26', inMonth: false });
    expect(rows[0]?.[6]).toEqual({ date: '2026-11-01', inMonth: true });
    expect(rows[4]?.[6]).toEqual({ date: '2026-11-29', inMonth: true });
    expect(rows[5]?.[0]).toEqual({ date: '2026-11-30', inMonth: true });
    expect(rows[5]?.[1]).toEqual({ date: '2026-12-01', inMonth: false });
  });

  it('needs a sixth row when the month spans six weeks (May 2027 starts on a Saturday)', () => {
    const rows = monthGrid('2027-05-10');
    expect(rows).toHaveLength(6);
    expect(rows[0]?.[5]).toEqual({ date: '2027-05-01', inMonth: true });
    expect(rows[5]?.[0]).toEqual({ date: '2027-05-31', inMonth: true });
    expect(rows[5]?.[1]).toEqual({ date: '2027-06-01', inMonth: false });
  });

  it('fits February 2027 (starts Monday, 28 days) in exactly four rows with no filler', () => {
    const rows = monthGrid('2027-02-14');
    expect(rows).toHaveLength(4);
    expect(rows.flat().every((cell) => cell.inMonth)).toBe(true);
  });

  it('includes the leap day', () => {
    const days = monthGrid('2028-02-10')
      .flat()
      .filter((c) => c.inMonth);
    expect(days).toHaveLength(29);
    expect(days.at(-1)?.date).toBe('2028-02-29');
  });

  it('always returns full, consecutive weeks of seven', () => {
    for (const month of ['2026-01-01', '2026-06-01', '2026-12-01', '2028-02-01']) {
      const flat = monthGrid(month).flat();
      expect(flat.length % 7).toBe(0);
      flat.forEach((cell, i) => {
        if (i > 0) expect(cell.date > (flat[i - 1]?.date ?? '')).toBe(true);
      });
    }
  });
});

describe('gridRange', () => {
  it('spans the first and last cell of the grid', () => {
    expect(gridRange('2026-11-18')).toEqual({ start: '2026-10-26', end: '2026-12-06' });
    expect(gridRange('2027-05-10')).toEqual({ start: '2027-04-26', end: '2027-06-06' });
  });
});
