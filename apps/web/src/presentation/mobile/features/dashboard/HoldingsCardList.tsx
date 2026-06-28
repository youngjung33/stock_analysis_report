import Link from 'next/link';
import { DashboardHolding } from '@/client/domain/models';
import { stockDetailHref } from '../../../shared/stock-routes';
import { formatNumber, formatPercent, pnlClass } from '../../../shared/formatters';

interface Props {
  holdings: DashboardHolding[];
}

export function MobileHoldingsCardList({ holdings }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        보유 종목이 없습니다. 거래를 등록해 보세요.
      </div>
    );
  }

  const hasMixed = holdings.some((h) => h.currency === 'USD');
  const useKrw = hasMixed;

  return (
    <ul className="space-y-3">
      {holdings.map((h) => (
        <li
          key={h.stockId}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <Link href={stockDetailHref(h.symbol, h.market)} className="group min-w-0 flex-1">
              <p className="font-semibold text-white group-hover:text-indigo-300">{h.symbol}</p>
              <p className="text-xs text-slate-500 group-hover:text-slate-400">{h.name}</p>
            </Link>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {h.market}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">수량</dt>
              <dd className="text-slate-200">{h.quantity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">평단</dt>
              <dd className="text-slate-200">{formatNumber(h.averageCost, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">현재가</dt>
              <dd className="text-slate-200">{formatNumber(h.currentPrice, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">등락</dt>
              <dd className={pnlClass(h.changePercent)}>{formatPercent(h.changePercent)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{useKrw ? '평가금액 (원화)' : '평가금액'}</dt>
              <dd className="text-slate-200">
                {formatNumber(useKrw ? h.marketValueKrw : h.marketValue, useKrw ? 'KRW' : h.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{useKrw ? '미실현 (원화)' : '미실현'}</dt>
              <dd className={pnlClass(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl)}>
                {formatNumber(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl, useKrw ? 'KRW' : h.currency)}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
