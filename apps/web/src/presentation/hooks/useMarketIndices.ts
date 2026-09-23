import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketIndices() {
  const { getMarketIndicesUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketIndices,
    queryFn: () => getMarketIndicesUseCase.execute(),
    staleTime: QUERY_STALE.quotes,
  });
}
