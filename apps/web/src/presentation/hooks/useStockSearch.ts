import { useCallback, useEffect, useState } from 'react';
import { Market, StockSearchResult } from '@sar/shared';
import { apiClient } from '@/client/data/api/client';

export function useStockSearch(market: Market) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
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
        const { data } = await apiClient.get<StockSearchResult[]>('/market/search', {
          params: { q: trimmed, market },
        });
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
  }, [query, market]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setError('');
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, error, reset };
}
