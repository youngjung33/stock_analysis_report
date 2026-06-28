'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/client/data/api/client';
import { PortfolioAnalysisResult } from '@/client/domain/models';
import { useAuth } from './useAuth';

export function usePortfolioAnalysis() {
  const { isGuest } = useAuth();

  return useQuery({
    queryKey: ['portfolio', 'analysis'],
    queryFn: async () => {
      const { data } = await apiClient.get<PortfolioAnalysisResult>('/portfolio/analysis');
      return data;
    },
    enabled: !isGuest,
    staleTime: 60_000,
  });
}
