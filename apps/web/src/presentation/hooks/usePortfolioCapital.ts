import { useQuery } from '@tanstack/react-query';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useCashSummary() {
  const { getCashSummaryUseCase } = useServices();
  return useQuery({
    queryKey: MARKET_QUERY_KEYS.cashSummary,
    queryFn: () => getCashSummaryUseCase.execute(),
    staleTime: QUERY_STALE.portfolioCapital,
  });
}

export function usePortfolioPreferences() {
  const { getPortfolioPreferencesUseCase } = useServices();
  return useQuery({
    queryKey: MARKET_QUERY_KEYS.portfolioPreferences,
    queryFn: () => getPortfolioPreferencesUseCase.execute(),
    staleTime: QUERY_STALE.portfolioCapital,
  });
}

export function usePortfolioSimulation() {
  const { getPortfolioSimulationUseCase } = useServices();
  return useQuery({
    queryKey: MARKET_QUERY_KEYS.portfolioSimulation,
    queryFn: () => getPortfolioSimulationUseCase.execute(),
    staleTime: QUERY_STALE.portfolioCapital,
  });
}
