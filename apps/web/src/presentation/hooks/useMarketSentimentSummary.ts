import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketSentimentSummary() {
  const { getMarketSentimentSummaryUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketSentimentSummary,
    queryFn: () => getMarketSentimentSummaryUseCase.execute(),
    staleTime: QUERY_STALE.marketReport,
  });
}
