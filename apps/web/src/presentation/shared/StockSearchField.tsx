'use client';

import { Market, StockSearchResult } from '@sar/shared';
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
  const search = useStockSearch(market);
  const labelClass = compact ? 'text-xs text-slate-400' : 'text-sm text-slate-400';
  const inputClass = compact
    ? 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white'
    : 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white';

  if (selected) {
    return (
      <div className="space-y-2">
        <label className="block">
          <span className={labelClass}>선택된 종목</span>
          <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-indigo-500/40 bg-indigo-950/30 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{selected.name}</p>
              <p className="text-xs text-slate-400">
                {selected.symbol} · {selected.market === Market.KR ? '한국' : '미국'}
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
              변경
            </button>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className={labelClass}>시장</span>
        <select
          className={inputClass}
          value={market}
          onChange={(e) => onMarketChange(e.target.value as Market)}
        >
          <option value={Market.KR}>한국 (KR)</option>
          <option value={Market.US}>미국 (US)</option>
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>종목 검색</span>
        <input
          className={inputClass}
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder={market === Market.KR ? '종목명 또는 코드 (예: 삼성전자, 005930)' : 'Ticker or name (e.g. AAPL)'}
          autoComplete="off"
        />
      </label>

      {search.error && <p className="text-xs text-rose-400">{search.error}</p>}

      {search.loading && search.query.trim().length > 0 && (
        <p className="text-xs text-slate-500">검색 중...</p>
      )}

      {!search.loading && search.query.trim().length > 0 && search.results.length === 0 && !search.error && (
        <p className="text-xs text-slate-500">검색 결과가 없습니다.</p>
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

      <p className="text-xs text-slate-500">검색 결과에서 종목을 선택해야 거래를 등록할 수 있습니다.</p>
    </div>
  );
}
