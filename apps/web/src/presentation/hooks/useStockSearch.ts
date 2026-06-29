import { useCallback, useEffect, useState } from 'react';
import { Market } from '@sar/shared';
import { useServices } from './useServices';

export function useStockSearch(market: Market) {
  const { searchStocksUseCase } = useServices();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<import('@sar/shared').StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const data = await searchStocksUseCase.execute(trimmed, market);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError('종목 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, market, searchStocksUseCase]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setError('');
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, error, reset };
}
