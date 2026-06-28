'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Market, StockSearchResult } from '@sar/shared';
import { stockDetailHref } from '../shared/stock-routes';
import { StockSearchField } from '../shared/StockSearchField';
import { useWatchlist } from '../hooks/useWatchlist';

interface Props {
  holdingSymbols: { symbol: string; market: Market }[];
}

export function WatchlistSection({ holdingSymbols }: Props) {
  const [market, setMarket] = useState<Market>(Market.KR);
  const [selected, setSelected] = useState<StockSearchResult | null>(null);
  const { items, isLoading, add, remove, isHeld } = useWatchlist(holdingSymbols);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-white">관심종목</h2>
      <p className="mt-1 text-xs text-slate-500">보유와 별도로 추적할 종목을 등록하세요.</p>

      <div className="mt-4 max-w-xl">
        <StockSearchField
          market={market}
          selected={selected}
          onSelect={async (stock) => {
            setSelected(stock);
            await add({ symbol: stock.symbol, name: stock.name, market: stock.market });
            setSelected(null);
          }}
          onClear={() => setSelected(null)}
          onMarketChange={setMarket}
        />
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-400">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">등록된 관심종목이 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2"
            >
              <div className="min-w-0">
                <Link
                  href={stockDetailHref(item.symbol, item.market)}
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {item.symbol}
                </Link>
                <span className="ml-2 text-xs text-slate-500">{item.name}</span>
                {isHeld(item.symbol, item.market) && (
                  <span className="ml-2 rounded bg-emerald-950 px-1.5 py-0.5 text-xs text-emerald-400">
                    보유
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
