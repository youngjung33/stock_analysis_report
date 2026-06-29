import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';

export function useFeaturedQuotes() {
  const { getFeaturedQuotesUseCase } = useServices();

  return useQuery({
    queryKey: ['featured-quotes'],
    queryFn: () => getFeaturedQuotesUseCase.execute(),
    staleTime: 60_000,
  });
}
