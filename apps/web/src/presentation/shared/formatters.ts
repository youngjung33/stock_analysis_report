import { formatAmount } from '@sar/shared';

function formatNumber(value: number | null | undefined, currency?: string): string {
  if (value === null || value === undefined) return '-';
  const maxFractionDigits = currency === 'KRW' ? 0 : 2;
  const formatted = formatAmount(value, { maxFractionDigits });
  if (!currency) return formatted;
  return currency === 'KRW' ? `₩${formatted}` : `$${formatted}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatTodayChange(
  pnl: number | null | undefined,
  percent: number | null | undefined,
  currency?: string,
): string {
  if (pnl === null || pnl === undefined) return '-';
  const amount = formatNumber(pnl, currency);
  if (percent === null || percent === undefined) return amount;
  return `${amount} (${formatPercent(percent)})`;
}

function pnlClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'text-slate-300';
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-rose-400';
  return 'text-slate-300';
}

export { formatNumber, formatPercent, formatTodayChange, pnlClass };
