import { DashboardSummary } from '@/client/domain/models';
import { formatNumber, pnlClass } from '../../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

export function MobileSummaryCards({ summary }: Props) {
  const cards = [
    { label: '????', value: formatNumber(summary.totalCostBasis) },
    { label: '????', value: formatNumber(summary.totalMarketValue) },
    {
      label: '???',
      value: formatNumber(summary.totalUnrealizedPnl),
      className: pnlClass(summary.totalUnrealizedPnl),
    },
    {
      label: '??',
      value: formatNumber(summary.totalRealizedPnl),
      className: pnlClass(summary.totalRealizedPnl),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-400">{card.label}</p>
          <p className={`mt-1 text-base font-semibold ${card.className ?? 'text-white'}`}>
            {card.value}
          </p>
        </div>
      ))}
      <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="text-xs text-slate-400">?? ??</p>
        <p className="mt-1 text-base font-semibold text-white">{summary.holdingsCount}?</p>
      </div>
    </div>
  );
}
