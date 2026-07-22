'use client';

import { Market, StockSearchResult } from '@sar/shared';
import { useTranslation } from 'react-i18next';
import { translateMarketLabel } from '@/i18n/translate-shared';
import { useStockSearch } from '../hooks/useStockSearch';

interface Props {
  market: Market;
  selected: StockSearchResult | null;
  onSelect: (stock: StockSearchResult) => void;
  onClear: () => void;
  onMarketChange: (market: Market) => void;
  compact?: boolean;
}

export function StockSearchField({
  market,
  selected,
  onSelect,
  onClear,
  onMarketChange,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const search = useStockSearch(market);
  const labelClass = compact ? 'text-xs text-slate-400' : 'text-sm text-slate-400';
  const inputClass = compact
    ? 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white'
    : 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white';

  if (selected) {
    return (
      <div className="space-y-2">
        <label className="block">
          <span className={labelClass}>{t('stock.search.selectedStock')}</span>
          <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-indigo-500/40 bg-indigo-950/30 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{selected.name}</p>
              <p className="text-xs text-slate-400">
                {selected.symbol} · {translateMarketLabel(selected.market, t)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClear();
                search.reset();
              }}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              {t('common.change')}
            </button>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className={labelClass}>{t('stock.search.market')}</span>
        <select
          className={inputClass}
          value={market}
          onChange={(e) => onMarketChange(e.target.value as Market)}
        >
          <option value={Market.KR}>{t('stock.search.marketKrOption')}</option>
          <option value={Market.US}>{t('stock.search.marketUsOption')}</option>
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>{t('stock.search.searchLabel')}</span>
        <input
          className={inputClass}
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder={
            market === Market.KR
              ? t('stock.search.placeholderKr')
              : t('stock.search.placeholderUs')
          }
          autoComplete="off"
        />
      </label>

      {search.loading && search.query.trim().length > 0 && (
        <p className="text-xs text-slate-500">{t('stock.search.searching')}</p>
      )}

      {!search.loading && search.query.trim().length > 0 && search.results.length === 0 && (
        <p className="text-xs text-slate-500">{t('stock.search.noResults')}</p>
      )}

      {search.results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950">
          {search.results.map((item) => (
            <li key={`${item.market}-${item.symbol}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  search.reset();
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-800/80"
              >
                <span className="shrink-0 font-mono text-xs text-indigo-300">{item.symbol}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-white">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">{t('stock.search.selectHint')}</p>
    </div>
  );
}
