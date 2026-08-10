import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useRecommendationHistory(limit = 30) {
  const { getRecommendationHistoryUseCase } = useServices();

  return useQuery({
    queryKey: [...MARKET_QUERY_KEYS.recommendationHistory, limit] as const,
    queryFn: () => getRecommendationHistoryUseCase.execute(limit),
    staleTime: QUERY_STALE.marketReport,
  });
}
