import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketSentimentSummary() {
  const { getMarketSentimentSummaryUseCase, getDashboardUseCase, listWatchlistUseCase } = useServices();
  const { isGuest } = useAuth();

  return useQuery({
    queryKey: MARKET_QUERY_KEYS.marketSentimentSummary,
    queryFn: async () => {
      if (!isGuest) {
        return getMarketSentimentSummaryUseCase.execute();
      }

      const [dashboard, watchlist] = await Promise.all([
        getDashboardUseCase.execute(),
        listWatchlistUseCase.execute(),
      ]);

      return getMarketSentimentSummaryUseCase.execute({
        userHoldings: dashboard.holdings.map((h) => ({
          symbol: h.symbol,
          market: h.market,
          name: h.name,
        })),
        userWatchlist: watchlist.map((w) => ({
          symbol: w.symbol,
          market: w.market,
          name: w.name,
        })),
      });
    },
    staleTime: QUERY_STALE.marketReport,
  });
}
