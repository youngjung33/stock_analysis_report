'use client';

import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function usePortfolioAnalysis() {
  const { getPortfolioAnalysisUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.portfolioAnalysis,
    queryFn: () => getPortfolioAnalysisUseCase.execute(),
    staleTime: QUERY_STALE.portfolioAnalysis,
  });
}
