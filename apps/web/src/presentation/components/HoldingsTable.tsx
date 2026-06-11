import { DashboardHolding } from '../../domain/models';
import { formatNumber, formatPercent, pnlClass } from './formatters';

interface Props {
  holdings: DashboardHolding[];
}

export function HoldingsTable({ holdings }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
        보유 종목이 없습니다. 거래를 등록해 주세요.
      </div>
    );
  }

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
            <th className="px-4 py-3">평가금액</th>
            <th className="px-4 py-3">미실현손익</th>
            <th className="px-4 py-3">실현손익</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.stockId} className="border-t border-slate-800 bg-slate-950/40">
              <td className="px-4 py-3">
                <div className="font-medium text-white">{h.symbol}</div>
                <div className="text-xs text-slate-500">{h.name}</div>
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
                {formatNumber(h.marketValue, h.currency)}
              </td>
              <td className={`px-4 py-3 ${pnlClass(h.unrealizedPnl)}`}>
                {formatNumber(h.unrealizedPnl, h.currency)}
              </td>
              <td className={`px-4 py-3 ${pnlClass(h.realizedPnl)}`}>
                {formatNumber(h.realizedPnl, h.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
