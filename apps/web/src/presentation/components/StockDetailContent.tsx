'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Market,
  QuoteChartRange,
  findFeaturedStock,
  resolveCurrency,
} from '@sar/shared';
import { translateMarketLabel, translateQuoteRange } from '@/i18n/translate-shared';
import { useStockQuote } from '../hooks/useStockQuote';
import { usePortfolioHolding } from '../hooks/usePortfolioHolding';
import { useErrorToast } from '../hooks/useErrorToast';
import { MyHoldingPanel } from '../components/MyHoldingPanel';
import { StockRangeSelector } from '../components/StockRangeSelector';
import { StockPriceChart } from '../components/StockPriceChart';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  symbol: string;
  market: Market;
}

export function StockDetailContent({ symbol, market }: Props) {
  const { t, i18n } = useTranslation();
  const stock = findFeaturedStock(symbol, market);
  const [range, setRange] = useState<QuoteChartRange>('1d');
  const { data, isLoading, isError, isFetching } = useStockQuote(symbol, market, range);
  const { data: holding, isLoading: holdingLoading } = usePortfolioHolding(symbol, market);

  useErrorToast(isError, t('errors.stockQuoteLoadFailed'));

  const currency = stock ? resolveCurrency(stock.market) : resolveCurrency(market);
  const title = stock?.name ?? symbol;
  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← {t('common.backToDashboard')}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {symbol} · {translateMarketLabel(market, t)}
        </p>
      </div>

      <MyHoldingPanel
        symbol={symbol}
        market={market}
        holding={holding}
        isLoading={holdingLoading}
      />

      <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white">{t('stock.detail.periodPrices')}</h2>
        <p className="mt-1 text-xs text-slate-500">{t('stock.detail.periodPricesHint')}</p>

        <div className="mt-4">
          <StockRangeSelector selected={range} onSelect={setRange} disabled={loading} />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
              <p className="text-sm text-slate-400">{t('stock.detail.loadingChart')}</p>
            </div>
          ) : isError || !data ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
              <p className="text-sm text-slate-500">{t('stock.detail.noChartData')}</p>
            </div>
          ) : (
            <StockPriceChart
              points={data.points}
              range={range}
              changePercent={data.changePercent}
              currency={currency}
            />
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">
              {t('stock.detail.currentPriceLabel', { range: translateQuoteRange(range, t) })}
            </p>
            {loading ? (
              <p className="mt-2 text-sm text-slate-400">{t('stock.detail.loadingQuote')}</p>
            ) : isError || !data ? (
              <p className="mt-2 text-sm text-slate-500">{t('common.dash')}</p>
            ) : (
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(data.currentPrice, currency)}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">{t('common.changePercentRate')}</p>
            {loading ? (
              <p className="mt-2 text-sm text-slate-400">{t('common.dash')}</p>
            ) : isError || !data ? (
              <p className="mt-2 text-sm text-slate-500">{t('common.dash')}</p>
            ) : (
              <p className={`mt-2 text-2xl font-semibold ${pnlClass(data.changePercent)}`}>
                {formatPercent(data.changePercent)}
              </p>
            )}
          </div>
        </div>

        {data?.fetchedAt && !loading && (
          <p className="mt-4 text-xs text-slate-600">
            {t('stock.detail.fetchedAt', {
              time: new Date(data.fetchedAt).toLocaleString(i18n.language),
            })}
          </p>
        )}
      </section>
    </div>
  );
}
