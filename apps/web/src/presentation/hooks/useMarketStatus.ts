import { useQuery } from '@tanstack/react-query';
import { MarketProviderStatus } from '@/client/domain/models';
import { apiClient } from '@/client/data/api/client';

export function useMarketStatus() {
  return useQuery({
    queryKey: ['market-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<MarketProviderStatus[]>('/market/status');
      return data;
    },
    staleTime: 60_000,
  });
}
