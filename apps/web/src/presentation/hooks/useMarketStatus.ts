import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';

export function useMarketStatus() {
  const { getMarketStatusUseCase } = useServices();

  return useQuery({
    queryKey: ['market-status'],
    queryFn: () => getMarketStatusUseCase.execute(),
    staleTime: 60_000,
  });
}
