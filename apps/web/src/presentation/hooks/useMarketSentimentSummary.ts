import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildMarketPersonalizationScopeKey } from '@sar/shared';
import { useAuth } from './useAuth';
import { useDashboard } from './useDashboard';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketSentimentSummary() {
  const { getMarketSentimentSummaryUseCase, getDashboardUseCase, listWatchlistUseCase } = useServices();
  const { isGuest } = useAuth();
  const { data: dashboard } = useDashboard();

  const watchlistQuery = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => listWatchlistUseCase.execute(),
    enabled: isGuest,
    staleTime: QUERY_STALE.dashboard,
  });

  const personalizationKey = useMemo(() => {
    if (!isGuest) return 'member';
    return buildMarketPersonalizationScopeKey({
      userHoldings: dashboard?.holdings.map((h) => ({ symbol: h.symbol, market: h.market })),
      userWatchlist: watchlistQuery.data?.map((w) => ({ symbol: w.symbol, market: w.market })),
    });
  }, [isGuest, dashboard?.holdings, watchlistQuery.data]);

  return useQuery({
    queryKey: [...MARKET_QUERY_KEYS.marketSentimentSummary, personalizationKey],
    queryFn: async () => {
      if (!isGuest) {
        return getMarketSentimentSummaryUseCase.execute();
      }

      const [dash, watchlist] = await Promise.all([
        getDashboardUseCase.execute(),
        listWatchlistUseCase.execute(),
      ]);

      return getMarketSentimentSummaryUseCase.execute({
        userHoldings: dash.holdings.map((h) => ({
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
    enabled: !isGuest || dashboard !== undefined,
  });
}
