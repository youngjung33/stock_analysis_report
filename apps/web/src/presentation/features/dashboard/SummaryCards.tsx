import { DashboardSummary } from '@/client/domain/models';
import { Surface } from '../../design-system';
import { formatNumber, formatTodayChange, pnlClass } from '../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

/** responsive 단일 요약 카드 — mobile 2열 / desktop 6열 */
export function SummaryCards({ summary }: Props) {
  const showKrw = summary.hasUsdHoldings;
  const cashTotalKrw = summary.cashTotalKrw ?? 0;
  const totalAssets = summary.totalAssetsKrw;
  const cards = [
    {
      id: 'total-assets',
      label: '총 자산 (원화)',
      value: totalAssets !== null ? formatNumber(totalAssets, 'KRW') : '—',
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'cash-total',
      label: '예수금 (원화)',
      value: formatNumber(cashTotalKrw, 'KRW'),
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'cost-basis',
      label: showKrw ? '총 매입금액 (원화)' : '총 매입금액',
      value: formatNumber(showKrw ? summary.totalCostBasisKrw : summary.totalCostBasis, 'KRW'),
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'market-value',
      label: showKrw ? '총 평가금액 (원화)' : '총 평가금액',
      value: formatNumber(
        showKrw ? summary.totalMarketValueKrw : summary.totalMarketValue,
        showKrw ? 'KRW' : undefined,
      ),
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'today-pnl',
      label: '당일 손익',
      value: formatTodayChange(
        showKrw ? summary.todayPnlKrw : summary.todayPnl,
        showKrw ? summary.todayPnlPercentKrw : summary.todayPnlPercent,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.todayPnlKrw : summary.todayPnl),
      wideOnMobile: false,
    },
    {
      id: 'unrealized-pnl',
      label: '평가 손익',
      value: formatNumber(
        showKrw ? summary.totalUnrealizedPnlKrw : summary.totalUnrealizedPnl,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.totalUnrealizedPnlKrw : summary.totalUnrealizedPnl),
      wideOnMobile: false,
    },
    {
      id: 'realized-pnl',
      label: '실현 손익',
      value: formatNumber(
        showKrw ? summary.totalRealizedPnlKrw : summary.totalRealizedPnl,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.totalRealizedPnlKrw : summary.totalRealizedPnl),
      wideOnMobile: false,
    },
    {
      id: 'holdings-count',
      label: '보유 종목',
      value: `${summary.holdingsCount}개`,
      className: 'text-foreground md:text-white',
      wideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-2">
      {showKrw && summary.usdKrwRate && (
        <p className="text-xs text-slate-500">
          USD/KRW {summary.usdKrwRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} 기준
          <span className="hidden md:inline"> 원화 환산</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Surface
            key={card.id}
            variant="card"
            as="div"
            className={card.wideOnMobile ? 'col-span-2 md:col-span-1' : undefined}
          >
            <p className="text-xs text-muted-foreground md:text-sm">{card.label}</p>
            <p
              className={`mt-2 text-base font-semibold tracking-tight md:mt-3 md:text-xl ${card.className}`}
            >
              {card.value}
            </p>
          </Surface>
        ))}
      </div>
    </div>
  );
}
