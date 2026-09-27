import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { tryGetAuth } from './route-utils';

export interface MarketPersonalizationInput {
  userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
  userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
}

/** Logged-in user holdings/watchlist, or guest body for market analysis & sentiment APIs */
export async function resolveMarketPersonalization(
  req: NextRequest,
  body?: MarketPersonalizationInput,
): Promise<MarketPersonalizationInput | undefined> {
  const user = tryGetAuth(req);
  if (user) {
    const { getDashboardUseCase, listWatchlistUseCase } = getServerServices();
    const [dashboard, watchlist] = await Promise.all([
      getDashboardUseCase.execute(user.userId),
      listWatchlistUseCase.execute(user.userId),
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
    };
  }

  if (body?.userHoldings?.length || body?.userWatchlist?.length) {
    return {
      userHoldings: body.userHoldings,
      userWatchlist: body.userWatchlist,
    };
  }

  return undefined;
}
