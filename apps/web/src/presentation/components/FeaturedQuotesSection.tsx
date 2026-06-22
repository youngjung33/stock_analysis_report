import { FeaturedStockQuote, FeaturedQuotesResult } from '@/client/domain/models';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';

interface Props {
  data: FeaturedQuotesResult | undefined;
  isLoading: boolean;
  compact?: boolean;
}

function QuoteTable({ title, items, compact }: { title: string; items: FeaturedStockQuote[]; compact?: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-950/40">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs text-slate-400">
            <tr>
              <th className="px-4 py-2.5">종목</th>
              <th className="px-4 py-2.5">현재가</th>
              <th className="px-4 py-2.5">등락</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.market}-${item.symbol}`} className="border-t border-slate-800/80">
                <td className="px-4 py-2.5">
                  <div className={`font-medium text-white ${compact ? 'text-xs' : ''}`}>{item.symbol}</div>
                  <div className="text-xs text-slate-500">{item.name}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-200">
                  {item.currentPrice !== null ? (
                    formatNumber(item.currentPrice, item.currency)
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </td>
                <td className={`px-4 py-2.5 ${pnlClass(item.changePercent)}`}>
                  {item.currentPrice !== null ? (
                    formatPercent(item.changePercent)
                  ) : (
                    <span
                      className="block max-w-[140px] text-xs leading-snug text-slate-500"
                      title={item.unavailableReason ?? undefined}
                    >
                      조회 불가
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FeaturedQuotesSection({ data, isLoading, compact }: Props) {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">주요 종목 시세</h2>
        <p className="text-sm text-slate-400">대표 종목 시세를 불러오는 중...</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">주요 종목 시세</h2>
          <p className="mt-1 text-xs text-slate-500">대표 한국·미국 종목 현황</p>
        </div>
        <p className="text-xs text-slate-500">
          갱신: {new Date(data.fetchedAt).toLocaleString('ko-KR')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuoteTable title="🇰🇷 한국 주식" items={data.kr} compact={compact} />
        <QuoteTable title="🇺🇸 미국 주식" items={data.us} compact={compact} />
      </div>
    </section>
  );
}
