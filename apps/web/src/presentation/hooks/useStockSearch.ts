'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Market } from '@sar/shared';
import { useToast } from '../components/Toast';
import { useServices } from './useServices';

export function useStockSearch(market: Market) {
  const { searchStocksUseCase } = useServices();
  const { showError } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<import('@sar/shared').StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const lastErrorQuery = useRef('');

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchStocksUseCase.execute(trimmed, market);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) {
          setResults([]);
          if (lastErrorQuery.current !== trimmed) {
            lastErrorQuery.current = trimmed;
            showError('종목 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, market, searchStocksUseCase, showError]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    lastErrorQuery.current = '';
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, reset };
}
