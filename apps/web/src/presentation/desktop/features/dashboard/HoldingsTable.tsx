import Link from 'next/link';
import { DashboardHolding } from '@/client/domain/models';
import { Surface } from '../../../design-system';
import { stockDetailHref } from '../../../shared/stock-routes';
import { formatNumber, formatPercent, pnlClass } from '../../../shared/formatters';

interface Props {
  holdings: DashboardHolding[];
  preferKrw?: boolean;
}

export function DesktopHoldingsTable({ holdings, preferKrw = false }: Props) {
  if (holdings.length === 0) {
    return (
      <Surface variant="subtle" className="border-dashed py-12 text-center text-muted-foreground">
        보유 종목이 없습니다. 거래를 등록해 보세요.
      </Surface>
    );
  }

  const hasMixed = holdings.some((h) => h.currency === 'USD');
  const useKrw = preferKrw || hasMixed;

  return (
    <Surface as="div" className="overflow-hidden p-0">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-5 py-4">종목</th>
            <th className="px-5 py-4">시장</th>
            <th className="px-5 py-4">수량</th>
            <th className="px-5 py-4">평단</th>
            <th className="px-5 py-4">현재가</th>
            <th className="px-5 py-4">등락</th>
            <th className="px-5 py-4">{useKrw ? '평가금액 (원화)' : '평가금액'}</th>
            <th className="px-5 py-4">{useKrw ? '미실현손익 (원화)' : '미실현손익'}</th>
            <th className="px-5 py-4">{useKrw ? '실현손익 (원화)' : '실현손익'}</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.stockId} className="border-t border-border bg-card/30">
              <td className="px-5 py-4">
                <Link href={stockDetailHref(h.symbol, h.market)} className="group block">
                  <div className="font-medium text-foreground group-hover:text-primary">{h.symbol}</div>
                  <div className="text-xs text-muted-foreground">{h.name}</div>
                </Link>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{h.market}</td>
              <td className="px-5 py-4 text-muted-foreground">{h.quantity}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatNumber(h.averageCost, h.currency)}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatNumber(h.currentPrice, h.currency)}
              </td>
              <td className={`px-5 py-4 ${pnlClass(h.changePercent)}`}>
                {formatPercent(h.changePercent)}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {formatNumber(useKrw ? h.marketValueKrw : h.marketValue, useKrw ? 'KRW' : h.currency)}
              </td>
              <td className={`px-5 py-4 ${pnlClass(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl)}`}>
                {formatNumber(useKrw ? h.unrealizedPnlKrw : h.unrealizedPnl, useKrw ? 'KRW' : h.currency)}
              </td>
              <td className={`px-5 py-4 ${pnlClass(useKrw ? h.realizedPnlKrw : h.realizedPnl)}`}>
                {formatNumber(useKrw ? h.realizedPnlKrw : h.realizedPnl, useKrw ? 'KRW' : h.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  );
}
