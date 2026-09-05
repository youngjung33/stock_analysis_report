import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, tryGetAuth } from '@/server/http/route-utils';

export const maxDuration = 25;

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:stock-analysis', 'heavy');

    const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
    const name = req.nextUrl.searchParams.get('name')?.trim();
    const marketParam = req.nextUrl.searchParams.get('market');
    const yahooSymbol = req.nextUrl.searchParams.get('yahooSymbol')?.trim() || undefined;

    if (!symbol || !name || (marketParam !== Market.KR && marketParam !== Market.US)) {
      return handleRouteError(new Error('INVALID_PARAMS'));
    }

    const market = marketParam as Market;
    const user = tryGetAuth(req);
    let userHoldings: Array<{ symbol: string; market: Market }> | undefined;
    let userWatchlist: Array<{ symbol: string; market: Market }> | undefined;

    if (user) {
      const { getDashboardUseCase, listWatchlistUseCase } = getServerServices();
      const [dashboard, watchlist] = await Promise.all([
        getDashboardUseCase.execute(user.userId),
        listWatchlistUseCase.execute(user.userId),
      ]);
      userHoldings = dashboard.holdings.map((h) => ({ symbol: h.symbol, market: h.market }));
      userWatchlist = watchlist.map((w) => ({ symbol: w.symbol, market: w.market }));
    }

    const { buildStockAnalysisReportUseCase } = getServerServices();
    const result = await buildStockAnalysisReportUseCase.execute({
      symbol,
      name,
      market,
      yahooSymbol,
      userHoldings,
      userWatchlist,
    });

    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
