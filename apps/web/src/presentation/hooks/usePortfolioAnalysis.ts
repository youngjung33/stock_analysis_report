'use client';

import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { useAuth } from './useAuth';

export function usePortfolioAnalysis() {
  const { getPortfolioAnalysisUseCase } = useServices();
  const { isGuest } = useAuth();

  return useQuery({
    queryKey: ['portfolio', 'analysis'],
    queryFn: () => getPortfolioAnalysisUseCase.execute(),
    enabled: !isGuest,
    staleTime: 60_000,
  });
}
