'use client';

import { Market } from '@sar/shared';
import { PortfolioHolding } from '@/client/domain/models';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  symbol: string;
  market: Market;
  holding: PortfolioHolding | null | undefined;
  isLoading: boolean;
}

export function MyHoldingPanel({ symbol, market, holding, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4">
        <p className="text-sm text-slate-400">내 보유 정보 불러오는 중...</p>
      </section>
    );
  }

  if (!holding) return null;

  const useKrw = holding.currency === 'USD';

  return (
    <section className="rounded-xl border border-indigo-800/60 bg-indigo-950/30 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-indigo-200">내 보유</h2>
      <p className="mt-1 text-xs text-slate-500">
        {symbol} · {market === Market.KR ? '한국' : '미국'}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">수량</dt>
          <dd className="mt-1 font-medium text-white">{holding.quantity}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">평단</dt>
          <dd className="mt-1 font-medium text-white">
            {formatNumber(holding.averageCost, holding.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{useKrw ? '평가금액 (원화)' : '평가금액'}</dt>
          <dd className="mt-1 font-medium text-white">
            {formatNumber(useKrw ? holding.marketValueKrw : holding.marketValue, useKrw ? 'KRW' : holding.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{useKrw ? '미실현 손익 (원화)' : '미실현 손익'}</dt>
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
          USD/KRW {holding.usdKrwRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} 기준
        </p>
      )}
    </section>
  );
}
