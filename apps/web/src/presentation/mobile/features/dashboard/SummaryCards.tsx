import { DashboardSummary } from '@/client/domain/models';
import { Surface } from '../../../design-system';
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
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <Surface
            key={card.id}
            variant="card"
            as="div"
            className={card.id === 'holdings-count' ? 'col-span-2' : undefined}
          >
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`mt-2 text-base font-semibold ${card.className ?? 'text-foreground'}`}>
              {card.value}
            </p>
          </Surface>
        ))}
      </div>
    </div>
  );
}
