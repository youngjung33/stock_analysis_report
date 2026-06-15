import { DashboardHolding } from '../../../../domain/models';
import { formatNumber, formatPercent, pnlClass } from '../../../shared/formatters';

interface Props {
  holdings: DashboardHolding[];
}

export function MobileHoldingsCardList({ holdings }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        ?? ??? ????.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {holdings.map((h) => (
        <li
          key={h.stockId}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{h.symbol}</p>
              <p className="text-xs text-slate-500">{h.name}</p>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {h.market}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className="text-slate-200">{h.quantity}</dd>
            </div>
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className="text-slate-200">{formatNumber(h.averageCost, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">???</dt>
              <dd className="text-slate-200">{formatNumber(h.currentPrice, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">??</dt>
              <dd className={pnlClass(h.changePercent)}>{formatPercent(h.changePercent)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">????</dt>
              <dd className="text-slate-200">{formatNumber(h.marketValue, h.currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">???</dt>
              <dd className={pnlClass(h.unrealizedPnl)}>
                {formatNumber(h.unrealizedPnl, h.currency)}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
