'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Market,
  QUOTE_RANGE_LABELS,
  QuoteChartRange,
  findFeaturedStock,
  resolveCurrency,
} from '@sar/shared';
import { useStockQuote } from '../hooks/useStockQuote';
import { usePortfolioHolding } from '../hooks/usePortfolioHolding';
import { MyHoldingPanel } from '../components/MyHoldingPanel';
import { StockRangeSelector } from '../components/StockRangeSelector';
import { StockPriceChart } from '../components/StockPriceChart';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  symbol: string;
  market: Market;
}

export function StockDetailContent({ symbol, market }: Props) {
  const stock = findFeaturedStock(symbol, market);
  const [range, setRange] = useState<QuoteChartRange>('1d');
  const { data, isLoading, isError, isFetching } = useStockQuote(symbol, market, range);
  const { data: holding, isLoading: holdingLoading } = usePortfolioHolding(symbol, market);

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
          ← 대시보드
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {symbol} · {market === Market.KR ? '한국' : '미국'}
        </p>
      </div>

      <MyHoldingPanel
        symbol={symbol}
        market={market}
        holding={holding}
        isLoading={holdingLoading}
      />

      <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white">기간별 시세</h2>
        <p className="mt-1 text-xs text-slate-500">기간 버튼을 누르면 해당 구간 시세를 조회합니다</p>

        <div className="mt-4">
          <StockRangeSelector selected={range} onSelect={setRange} disabled={loading} />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
              <p className="text-sm text-slate-400">차트 불러오는 중...</p>
            </div>
          ) : isError || !data ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30">
              <p className="text-sm text-rose-400">차트를 불러오지 못했습니다.</p>
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
            <p className="text-xs text-slate-500">현재가 ({QUOTE_RANGE_LABELS[range]} 기준)</p>
            {loading ? (
              <p className="mt-2 text-sm text-slate-400">조회 중...</p>
            ) : isError || !data ? (
              <p className="mt-2 text-sm text-rose-400">시세를 불러오지 못했습니다.</p>
            ) : (
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(data.currentPrice, currency)}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">등락률</p>
            {loading ? (
              <p className="mt-2 text-sm text-slate-400">—</p>
            ) : isError || !data ? (
              <p className="mt-2 text-sm text-slate-500">—</p>
            ) : (
              <p className={`mt-2 text-2xl font-semibold ${pnlClass(data.changePercent)}`}>
                {formatPercent(data.changePercent)}
              </p>
            )}
          </div>
        </div>

        {data?.fetchedAt && !loading && (
          <p className="mt-4 text-xs text-slate-600">
            조회 시각: {new Date(data.fetchedAt).toLocaleString('ko-KR')}
          </p>
        )}
      </section>
    </div>
  );
}
