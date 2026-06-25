import { DashboardSummary } from '@/client/domain/models';
import { formatNumber, formatTodayChange, pnlClass } from '../../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

export function MobileSummaryCards({ summary }: Props) {
  const cards = [
    { id: 'market-value', label: '평가금액', value: formatNumber(summary.totalMarketValue) },
    {
      id: 'today-pnl',
      label: '오늘 변화',
      value: formatTodayChange(summary.todayPnl, summary.todayPnlPercent),
      className: pnlClass(summary.todayPnl),
    },
    { id: 'cost-basis', label: '매입금액', value: formatNumber(summary.totalCostBasis) },
    {
      id: 'unrealized-pnl',
      label: '미실현',
      value: formatNumber(summary.totalUnrealizedPnl),
      className: pnlClass(summary.totalUnrealizedPnl),
    },
    {
      id: 'realized-pnl',
      label: '실현',
      value: formatNumber(summary.totalRealizedPnl),
      className: pnlClass(summary.totalRealizedPnl),
    },
    {
      id: 'holdings-count',
      label: '보유 종목',
      value: `${summary.holdingsCount}개`,
      className: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`rounded-xl border border-slate-800 bg-slate-900/60 p-3 ${card.id === 'holdings-count' ? 'col-span-2' : ''}`}
        >
          <p className="text-xs text-slate-400">{card.label}</p>
          <p className={`mt-1 text-base font-semibold ${card.className ?? 'text-white'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
