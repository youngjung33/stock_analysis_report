import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, tryGetAuth } from '@/server/http/route-utils';

export const maxDuration = 25;

interface PersonalizationInput {
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
}

async function resolvePersonalization(
  req: NextRequest,
  body?: PersonalizationInput,
): Promise<PersonalizationInput | undefined> {
  const user = tryGetAuth(req);
  if (user) {
    const { getDashboardUseCase, listWatchlistUseCase } = getServerServices();
    const [dashboard, watchlist] = await Promise.all([
      getDashboardUseCase.execute(user.userId),
      listWatchlistUseCase.execute(user.userId),
    ]);
    return {
      userHoldings: dashboard.holdings.map((h) => ({ symbol: h.symbol, market: h.market })),
      userWatchlist: watchlist.map((w) => ({ symbol: w.symbol, market: w.market })),
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

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:analysis', 'heavy');
    const options = await resolvePersonalization(req);
    const { getMarketAnalysisUseCase } = getServerServices();
    const result = await getMarketAnalysisUseCase.execute(options);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Guest/client personalization — holdings·watchlist in body */
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:analysis', 'heavy');
    const body = (await req.json().catch(() => ({}))) as PersonalizationInput;
    const options = await resolvePersonalization(req, body);
    const { getMarketAnalysisUseCase } = getServerServices();
    const result = await getMarketAnalysisUseCase.execute(options);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
