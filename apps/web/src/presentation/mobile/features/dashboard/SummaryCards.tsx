import { DashboardSummary } from '@/client/domain/models';
import { formatNumber, formatTodayChange, pnlClass } from '../../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

export function MobileSummaryCards({ summary }: Props) {
  const showKrw = summary.hasUsdHoldings;
  const cards = [
    {
      id: 'market-value',
      label: showKrw ? '평가금액 (원화)' : '평가금액',
      value: formatNumber(
        showKrw ? summary.totalMarketValueKrw : summary.totalMarketValue,
        showKrw ? 'KRW' : undefined,
      ),
    },
    {
      id: 'today-pnl',
      label: '오늘 변화',
      value: formatTodayChange(
        showKrw ? summary.todayPnlKrw : summary.todayPnl,
        showKrw ? summary.todayPnlPercentKrw : summary.todayPnlPercent,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.todayPnlKrw : summary.todayPnl),
    },
    {
      id: 'cost-basis',
      label: showKrw ? '매입금액 (원화)' : '매입금액',
      value: formatNumber(showKrw ? summary.totalCostBasisKrw : summary.totalCostBasis, 'KRW'),
    },
    {
      id: 'unrealized-pnl',
      label: '미실현',
      value: formatNumber(
        showKrw ? summary.totalUnrealizedPnlKrw : summary.totalUnrealizedPnl,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.totalUnrealizedPnlKrw : summary.totalUnrealizedPnl),
    },
    {
      id: 'realized-pnl',
      label: '실현',
      value: formatNumber(
        showKrw ? summary.totalRealizedPnlKrw : summary.totalRealizedPnl,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.totalRealizedPnlKrw : summary.totalRealizedPnl),
    },
    {
      id: 'holdings-count',
      label: '보유 종목',
      value: `${summary.holdingsCount}개`,
      className: 'text-white',
    },
  ];

  return (
    <div className="space-y-2">
      {showKrw && summary.usdKrwRate && (
        <p className="text-xs text-slate-500">
          USD/KRW {summary.usdKrwRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} 기준
        </p>
      )}
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
    </div>
  );
}
