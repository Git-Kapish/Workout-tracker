import { formatNumber, formatPercent, formatVolume, formatWeight } from '@/lib/format';

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
