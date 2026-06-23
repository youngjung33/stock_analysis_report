import { useQuery } from '@tanstack/react-query';
import { FeaturedQuotesResult } from '@/client/domain/models';
import { apiClient } from '@/client/data/api/client';

export function useFeaturedQuotes() {
  return useQuery({
    queryKey: ['featured-quotes'],
    queryFn: async () => {
      const { data } = await apiClient.get<FeaturedQuotesResult>('/market/featured');
      return data;
    },
    staleTime: 60_000,
  });
}
