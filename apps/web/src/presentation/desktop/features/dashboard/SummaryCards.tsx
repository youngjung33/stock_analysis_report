import { DashboardSummary } from '../../../../domain/models';
import { formatNumber, pnlClass } from '../../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

export function DesktopSummaryCards({ summary }: Props) {
  const cards = [
    { label: '? ????', value: formatNumber(summary.totalCostBasis), className: 'text-white' },
    { label: '? ????', value: formatNumber(summary.totalMarketValue), className: 'text-white' },
    {
      label: '??? ??',
      value: formatNumber(summary.totalUnrealizedPnl),
      className: pnlClass(summary.totalUnrealizedPnl),
    },
    {
      label: '?? ??',
      value: formatNumber(summary.totalRealizedPnl),
      className: pnlClass(summary.totalRealizedPnl),
    },
    { label: '?? ??', value: `${summary.holdingsCount}?`, className: 'text-white' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className={`mt-2 text-xl font-semibold ${card.className}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
