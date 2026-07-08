'use client';

import Link from 'next/link';
import {
  FEATURED_KR_STOCKS,
  FEATURED_US_STOCKS,
  FeaturedStock,
  resolveCurrency,
} from '@sar/shared';
import { FeaturedStockQuote } from '@/client/domain/models';
import { useFeaturedQuotes } from '../hooks/useFeaturedQuotes';
import { useErrorToast } from '../hooks/useErrorToast';
import { formatNumber, formatPercent, pnlClass } from '../shared/formatters';
import { stockDetailHref } from '../shared/stock-routes';

interface Props {
  compact?: boolean;
}

function toPlaceholder(stock: FeaturedStock): FeaturedStockQuote {
  return {
    symbol: stock.symbol,
    name: stock.name,
    market: stock.market,
    currency: resolveCurrency(stock.market),
    currentPrice: null,
    changePercent: null,
    unavailableReason: null,
  };
}

const PLACEHOLDER_KR = FEATURED_KR_STOCKS.map(toPlaceholder);
const PLACEHOLDER_US = FEATURED_US_STOCKS.map(toPlaceholder);

function QuoteRow({
  item,
  compact,
  loading,
}: {
  item: FeaturedStockQuote;
  compact?: boolean;
  loading?: boolean;
}) {
  const href = stockDetailHref(item.symbol, item.market);
  const hasPrice = item.currentPrice !== null;

  return (
    <tr className="border-t border-slate-800/80 transition hover:bg-slate-900/50">
      <td className="px-4 py-2.5">
        <Link href={href} className="group block">
          <div className={`font-medium text-white group-hover:text-indigo-300 ${compact ? 'text-xs' : ''}`}>
            {item.symbol}
          </div>
          <div className="text-xs text-slate-500 group-hover:text-slate-400">{item.name}</div>
        </Link>
      </td>
      <td className="px-4 py-2.5">
        <Link href={href} className="block text-slate-200 hover:text-indigo-300">
          {loading ? (
            <span className="text-xs text-slate-500">조회 중...</span>
          ) : hasPrice ? (
            formatNumber(item.currentPrice, item.currency)
          ) : (
            <span
              className="text-xs text-slate-500"
              title={item.unavailableReason ?? undefined}
            >
              조회 불가
            </span>
          )}
        </Link>
      </td>
      <td className={`px-4 py-2.5 ${!loading && hasPrice ? pnlClass(item.changePercent) : 'text-slate-600'}`}>
        <Link href={href} className="block">
          {loading ? (
            <span className="text-xs text-slate-500">—</span>
          ) : hasPrice ? (
            <span title="오늘 기준 등락">{formatPercent(item.changePercent)}</span>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
        </Link>
      </td>
    </tr>
  );
}

function QuoteTable({
  title,
  items,
  compact,
  loading,
}: {
  title: string;
  items: FeaturedStockQuote[];
  compact?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-950/40">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">종목을 클릭하면 상세·기간별 시세를 볼 수 있습니다</p>
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
              <QuoteRow
                key={`${item.market}-${item.symbol}`}
                item={item}
                compact={compact}
                loading={loading}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FeaturedQuotesSection({ compact }: Props) {
  const { data, isLoading, isError } = useFeaturedQuotes();

  useErrorToast(isError, '주요 종목 시세를 불러오지 못했습니다.');

  const krItems = data?.kr ?? (isLoading ? PLACEHOLDER_KR : []);
  const usItems = data?.us ?? (isLoading ? PLACEHOLDER_US : []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">주요 종목 시세</h2>
        <p className="mt-1 text-xs text-slate-500">
          대표 한국·미국 종목 · 진입 시 오늘 시세를 일괄 조회합니다
          {data?.fetchedAt && (
            <span className="ml-1 text-slate-600">
              · {new Date(data.fetchedAt).toLocaleString('ko-KR')}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuoteTable title="🇰🇷 한국 주식" items={krItems} compact={compact} loading={isLoading} />
        <QuoteTable title="🇺🇸 미국 주식" items={usItems} compact={compact} loading={isLoading} />
      </div>
    </section>
  );
}
