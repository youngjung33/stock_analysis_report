'use client';

import { useTranslation } from 'react-i18next';
import { DashboardSummary } from '@/client/domain/models';
import { Surface } from '../../design-system';
import { formatNumber, formatTodayChange, pnlClass } from '../../shared/formatters';

interface Props {
  summary: DashboardSummary;
}

/** responsive 단일 요약 카드 — mobile 2열 / desktop 6열 */
export function SummaryCards({ summary }: Props) {
  const { t } = useTranslation();
  const showKrw = summary.hasUsdHoldings;
  const cashTotalKrw = summary.cashTotalKrw ?? 0;
  const totalAssets = summary.totalAssetsKrw;
  const cards = [
    {
      id: 'total-assets',
      label: t('portfolio.summary.totalAssetsKrw'),
      value: totalAssets !== null ? formatNumber(totalAssets, 'KRW') : '—',
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'cash-total',
      label: t('portfolio.summary.cashKrw'),
      value: formatNumber(cashTotalKrw, 'KRW'),
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'cost-basis',
      label: showKrw ? t('portfolio.summary.totalCostBasisKrw') : t('portfolio.summary.totalCostBasis'),
      value: formatNumber(showKrw ? summary.totalCostBasisKrw : summary.totalCostBasis, 'KRW'),
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'market-value',
      label: showKrw ? t('portfolio.summary.totalMarketValueKrw') : t('portfolio.summary.totalMarketValue'),
      value: formatNumber(
        showKrw ? summary.totalMarketValueKrw : summary.totalMarketValue,
        showKrw ? 'KRW' : undefined,
      ),
      className: 'text-foreground md:text-white',
      wideOnMobile: false,
    },
    {
      id: 'today-pnl',
      label: t('portfolio.summary.todayPnl'),
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
      label: t('portfolio.summary.unrealizedPnl'),
      value: formatNumber(
        showKrw ? summary.totalUnrealizedPnlKrw : summary.totalUnrealizedPnl,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.totalUnrealizedPnlKrw : summary.totalUnrealizedPnl),
      wideOnMobile: false,
    },
    {
      id: 'realized-pnl',
      label: t('portfolio.summary.realizedPnl'),
      value: formatNumber(
        showKrw ? summary.totalRealizedPnlKrw : summary.totalRealizedPnl,
        showKrw ? 'KRW' : undefined,
      ),
      className: pnlClass(showKrw ? summary.totalRealizedPnlKrw : summary.totalRealizedPnl),
      wideOnMobile: false,
    },
    {
      id: 'holdings-count',
      label: t('portfolio.summary.holdingsCount'),
      value: t('portfolio.summary.holdingsCountValue', { count: summary.holdingsCount }),
      className: 'text-foreground md:text-white',
      wideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-2">
      {showKrw && summary.usdKrwRate && (
        <p className="text-xs text-slate-500">
          {t('common.fxRateBasis', {
            rate: summary.usdKrwRate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
          })}
          <span className="hidden md:inline"> {t('common.fxConversionNote')}</span>
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
