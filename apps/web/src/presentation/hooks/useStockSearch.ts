'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Market } from '@sar/shared';
import { useToast } from '../components/Toast';
import { useServices } from './useServices';

export function useStockSearch(market: Market) {
  const { t } = useTranslation();
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
            showError(t('stock.search.searchFailed'));
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
  }, [query, market, searchStocksUseCase, showError, t]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    lastErrorQuery.current = '';
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, reset };
}
