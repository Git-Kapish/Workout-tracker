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
