'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Market, StockSearchResult } from '@sar/shared';
import { stockDetailHref } from '../shared/stock-routes';
import { StockSearchField } from '../shared/StockSearchField';
import { useWatchlist } from '../hooks/useWatchlist';
import { Surface } from '../design-system';

interface Props {
  holdingSymbols: { symbol: string; market: Market }[];
}

export function WatchlistSection({ holdingSymbols }: Props) {
  const { t } = useTranslation();
  const [market, setMarket] = useState<Market>(Market.KR);
  const [selected, setSelected] = useState<StockSearchResult | null>(null);
  const { items, isLoading, add, remove, isHeld } = useWatchlist(holdingSymbols);

  return (
    <Surface>
      <h2 className="text-base font-semibold tracking-tight">{t('watchlist.title')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('watchlist.desc')}</p>

      <div className="mt-6 max-w-xl">
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
        <p className="mt-4 text-sm text-slate-400">{t('watchlist.loading')}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t('watchlist.empty')}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
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
                    {t('watchlist.heldBadge')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                {t('common.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
