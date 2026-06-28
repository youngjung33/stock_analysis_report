import Link from 'next/link';
import { DashboardHolding } from '@/client/domain/models';
import { stockDetailHref } from '../../../shared/stock-routes';
import { formatNumber, formatPercent, pnlClass } from '../../../shared/formatters';

interface Props {
  holdings: DashboardHolding[];
  preferKrw?: boolean;
}

export function DesktopHoldingsTable({ holdings, preferKrw = false }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
        보유 종목이 없습니다. 거래를 등록해 보세요.
      </div>
    );
  }

  const hasMixed = holdings.some((h) => h.currency === 'USD');
  const useKrw = preferKrw || hasMixed;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">종목</th>
            <th className="px-4 py-3">시장</th>
            <th className="px-4 py-3">수량</th>
            <th className="px-4 py-3">평단</th>
            <th className="px-4 py-3">현재가</th>
            <th className="px-4 py-3">등락</th>
            <th className="px-4 py-3">{useKrw ? '평가금액 (원화)' : '평가금액'}</th>
            <th className="px-4 py-3">{useKrw ? '미실현손익 (원화)' : '미실현손익'}</th>
            <th className="px-4 py-3">{useKrw ? '실현손익 (원화)' : '실현손익'}</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.stockId} className="border-t border-slate-800 bg-slate-950/40">
              <td className="px-4 py-3">
                <Link href={stockDetailHref(h.symbol, h.market)} className="group block">
                  <div className="font-medium text-white group-hover:text-indigo-300">{h.symbol}</div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400">{h.name}</div>
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-300">{h.market}</td>
              <td className="px-4 py-3 text-slate-300">{h.quantity}</td>
              <td className="px-4 py-3 text-slate-300">
                {formatNumber(h.averageCost, h.currency)}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {formatNumber(h.currentPrice, h.currency)}
              </td>
              <td className={`px-4 py-3 ${pnlClass(h.changePercent)}`}>
                {formatPercent(h.changePercent)}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {formatNumber(useKrw ? h.marketValueKrw : h.marketValue, useKrw ? 'KRW' : h.currency)}
              </td>
              <td className={`px-4 py-3 ${pnlClass(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl)}`}>
                {formatNumber(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl, useKrw ? 'KRW' : h.currency)}
              </td>
              <td className={`px-4 py-3 ${pnlClass(useKrw ? h.realizedPnlKrw : h.realizedPnl)}`}>
                {formatNumber(useKrw ? h.realizedPnlKrw : h.realizedPnl, useKrw ? 'KRW' : h.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
