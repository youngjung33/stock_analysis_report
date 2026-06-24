import { useQuery } from '@tanstack/react-query';
import { MarketAnalysisReport } from '@sar/shared';
import { apiClient } from '@/client/data/api/client';

export function useMarketAnalysis() {
  return useQuery({
    queryKey: ['market-analysis'],
    queryFn: async () => {
      const { data } = await apiClient.get<MarketAnalysisReport>('/market/analysis');
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
