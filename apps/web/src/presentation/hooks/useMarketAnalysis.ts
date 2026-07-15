import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketAnalysis() {
  const { getMarketAnalysisUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketAnalysis,
    queryFn: () => getMarketAnalysisUseCase.execute(),
    staleTime: QUERY_STALE.marketReport,
  });
}
