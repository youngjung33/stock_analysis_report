import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketStatus() {
  const { getMarketStatusUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketStatus,
    queryFn: () => getMarketStatusUseCase.execute(),
    staleTime: QUERY_STALE.marketStatus,
  });
}
