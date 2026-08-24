import { useQuery } from '@tanstack/react-query';
import { guestSession } from '@/client/data/guest/guest-session';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketAnalysis() {
  const { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase } = useServices();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketAnalysis,
    queryFn: async () => {
      if (!guestSession.isActive()) {
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
