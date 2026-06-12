import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';

export function useDashboard() {
  const { getDashboardUseCase, refreshQuotesUseCase } = useServices();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardUseCase.execute(),
  });

  const refresh = async () => {
    const result = await refreshQuotesUseCase.execute();
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    return result;
  };

  return { ...query, refresh };
}
