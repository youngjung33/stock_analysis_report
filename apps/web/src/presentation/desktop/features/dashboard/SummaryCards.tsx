import { DashboardSummary } from '@/client/domain/models';
import { formatNumber, formatTodayChange, pnlClass } from '../../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

export function DesktopSummaryCards({ summary }: Props) {
  const cards = [
    { id: 'cost-basis', label: '총 매입금액', value: formatNumber(summary.totalCostBasis), className: 'text-white' },
    { id: 'market-value', label: '총 평가금액', value: formatNumber(summary.totalMarketValue), className: 'text-white' },
    {
      id: 'today-pnl',
      label: '오늘 변화',
      value: formatTodayChange(summary.todayPnl, summary.todayPnlPercent),
      className: pnlClass(summary.todayPnl),
    },
    {
      id: 'unrealized-pnl',
      label: '미실현 손익',
      value: formatNumber(summary.totalUnrealizedPnl),
      className: pnlClass(summary.totalUnrealizedPnl),
    },
    {
      id: 'realized-pnl',
      label: '실현 손익',
      value: formatNumber(summary.totalRealizedPnl),
      className: pnlClass(summary.totalRealizedPnl),
    },
    { id: 'holdings-count', label: '보유 종목', value: `${summary.holdingsCount}개`, className: 'text-white' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">{card.label}</p>
          <p className={`mt-2 text-xl font-semibold ${card.className}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
