'use client';

import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { useAuth } from './useAuth';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function usePortfolioAnalysis() {
  const { getPortfolioAnalysisUseCase } = useServices();
  const { isGuest } = useAuth();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.portfolioAnalysis,
    queryFn: () => getPortfolioAnalysisUseCase.execute(),
    enabled: !isGuest,
    staleTime: QUERY_STALE.portfolioAnalysis,
  });
}
