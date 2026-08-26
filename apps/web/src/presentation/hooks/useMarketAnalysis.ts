import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketAnalysis() {
  const { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase } = useServices();
  const { isGuest } = useAuth();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketAnalysis,
    queryFn: async () => {
      if (!isGuest) {
        return getMarketAnalysisUseCase.execute();
      }

      const [dashboard, watchlist] = await Promise.all([
        getDashboardUseCase.execute(),
        listWatchlistUseCase.execute(),
      ]);

      return getMarketAnalysisUseCase.execute({
        userHoldings: dashboard.holdings.map((h) => ({ symbol: h.symbol, market: h.market })),
        userWatchlist: watchlist.map((w) => ({ symbol: w.symbol, market: w.market })),
      });
    },
    staleTime: QUERY_STALE.marketReport,
  });
}
