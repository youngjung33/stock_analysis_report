'use client';

import { Market } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { PortfolioHolding } from '@/client/domain/models';
import { translateMarketLabel } from '@/i18n/translate-shared';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  symbol: string;
  market: Market;
  holding: PortfolioHolding | null | undefined;
  isLoading: boolean;
}

export function MyHoldingPanel({ symbol, market, holding, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <section className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4">
        <p className="text-sm text-slate-400">{t('stock.detail.myHoldingLoading')}</p>
      </section>
    );
  }

  if (!holding) return null;

  const useKrw = holding.currency === 'USD';

  return (
    <section className="rounded-xl border border-indigo-800/60 bg-indigo-950/30 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-indigo-200">{t('stock.detail.myHolding')}</h2>
      <p className="mt-1 text-xs text-slate-500">
        {symbol} · {translateMarketLabel(market, t)}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">{t('common.quantity')}</dt>
          <dd className="mt-1 font-medium text-white">{holding.quantity}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t('common.averageCost')}</dt>
          <dd className="mt-1 font-medium text-white">
            {formatNumber(holding.averageCost, holding.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">
            {useKrw ? t('common.marketValueKrw') : t('common.marketValue')}
          </dt>
          <dd className="mt-1 font-medium text-white">
            {formatNumber(useKrw ? holding.marketValueKrw : holding.marketValue, useKrw ? 'KRW' : holding.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">
            {useKrw ? t('common.unrealizedPnlShortKrw') : t('common.unrealizedPnlShort')}
          </dt>
          <dd className={`mt-1 font-medium ${pnlClass(useKrw ? holding.unrealizedPnlKrw : holding.unrealizedPnl)}`}>
            {formatNumber(useKrw ? holding.unrealizedPnlKrw : holding.unrealizedPnl, useKrw ? 'KRW' : holding.currency)}
            {holding.unrealizedPnlPercent !== null && (
              <span className="ml-1 text-sm">({formatPercent(holding.unrealizedPnlPercent)})</span>
            )}
          </dd>
        </div>
      </dl>
      {useKrw && holding.usdKrwRate && (
        <p className="mt-3 text-xs text-slate-600">
          {t('common.fxRateBasis', {
            rate: holding.usdKrwRate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
          })}
        </p>
      )}
    </section>
  );
}
