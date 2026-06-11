import { DashboardSummary } from '../../domain/models';
import { formatNumber, formatPercent, pnlClass } from './formatters';

interface Props {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: Props) {
  const cards = [
    { label: '총 투자원금', value: formatNumber(summary.totalCostBasis), className: 'text-white' },
    {
      label: '총 평가금액',
      value: formatNumber(summary.totalMarketValue),
      className: 'text-white',
    },
    {
      label: '미실현 손익',
      value: formatNumber(summary.totalUnrealizedPnl),
      className: pnlClass(summary.totalUnrealizedPnl),
    },
    {
      label: '실현 손익',
      value: formatNumber(summary.totalRealizedPnl),
      className: pnlClass(summary.totalRealizedPnl),
    },
    { label: '보유 종목', value: `${summary.holdingsCount}개`, className: 'text-white' },
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

export { formatPercent };
