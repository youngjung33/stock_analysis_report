import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useFeaturedQuotes() {
  const { getFeaturedQuotesUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.featuredQuotes,
    queryFn: () => getFeaturedQuotesUseCase.execute(),
    staleTime: QUERY_STALE.quotes,
  });
}
