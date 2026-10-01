import { NextRequest } from 'next/server';
import { Market, type StoredInvestorProfile } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { tryGetAuth } from './route-utils';

export interface MarketPersonalizationInput {
  userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
  userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
  investorProfile?: StoredInvestorProfile | null;
}

/** Logged-in user holdings/watchlist·성향, or guest body for market analysis & sentiment APIs */
export async function resolveMarketPersonalization(
  req: NextRequest,
  body?: MarketPersonalizationInput,
): Promise<MarketPersonalizationInput | undefined> {
  const user = tryGetAuth(req);
  if (user) {
    const { getDashboardUseCase, listWatchlistUseCase, getPortfolioPreferencesUseCase } =
      getServerServices();
    const [dashboard, watchlist, preferences] = await Promise.all([
      getDashboardUseCase.execute(user.userId),
      listWatchlistUseCase.execute(user.userId),
      getPortfolioPreferencesUseCase.execute(user.userId),
    ]);
    return {
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
      investorProfile: preferences.investorProfile ?? null,
    };
  }

  if (
    body?.userHoldings?.length ||
    body?.userWatchlist?.length ||
    body?.investorProfile != null
  ) {
    return {
      userHoldings: body.userHoldings,
      userWatchlist: body.userWatchlist,
      investorProfile: body.investorProfile ?? null,
    };
  }

  return undefined;
}
