import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';

export function useMarketAnalysis() {
  const { getMarketAnalysisUseCase } = useServices();

  return useQuery({
    queryKey: ['market-analysis'],
    queryFn: () => getMarketAnalysisUseCase.execute(),
    staleTime: 5 * 60_000,
  });
}
