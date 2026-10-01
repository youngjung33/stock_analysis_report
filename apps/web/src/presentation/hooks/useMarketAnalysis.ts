import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildMarketPersonalizationScopeKey } from '@sar/shared';
import { useAuth } from './useAuth';
import { useDashboard } from './useDashboard';
import { useInvestorProfile } from './useInvestorProfile';
import { useServices } from './useServices';
import { MARKET_QUERY_KEYS, QUERY_STALE } from '../lib/query-config';

export function useMarketAnalysis() {
  const { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase } = useServices();
  const { isGuest } = useAuth();
  const { data: dashboard } = useDashboard();
  const { stored: investorProfile, loading: profileLoading } = useInvestorProfile();

  const watchlistQuery = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => listWatchlistUseCase.execute(),
    enabled: isGuest,
    staleTime: QUERY_STALE.dashboard,
  });

  const personalizationKey = useMemo(() => {
    if (!isGuest) {
      return buildMarketPersonalizationScopeKey({ investorProfile });
    }
    return buildMarketPersonalizationScopeKey({
      userHoldings: dashboard?.holdings.map((h) => ({ symbol: h.symbol, market: h.market })),
      userWatchlist: watchlistQuery.data?.map((w) => ({ symbol: w.symbol, market: w.market })),
      investorProfile,
    });
  }, [isGuest, dashboard?.holdings, watchlistQuery.data, investorProfile]);

  return useQuery({
    queryKey: [...MARKET_QUERY_KEYS.marketAnalysis, personalizationKey],
    queryFn: async () => {
      if (!isGuest) {
        return getMarketAnalysisUseCase.execute();
      }

      const [dash, watchlist] = await Promise.all([
        getDashboardUseCase.execute(),
        listWatchlistUseCase.execute(),
      ]);

      return getMarketAnalysisUseCase.execute({
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
        investorProfile,
      });
    },
    staleTime: QUERY_STALE.marketReport,
    enabled: (!isGuest || dashboard !== undefined) && !profileLoading,
  });
}
