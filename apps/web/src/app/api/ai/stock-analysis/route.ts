import { NextRequest } from 'next/server';
import { Market, normalizeLocale, AppErrorCode } from '@sar/shared';
import { isAiEnabled } from '@/server/data/ai/ai-config';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { requireAiMemberAuth } from '@/server/http/ai-auth';
import { ValidationError } from '@/server/domain/errors/domain.errors';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isAiEnabled()) {
      return jsonData({ enabled: false });
    }

    await enforceRateLimit(req, 'api:ai-stock', 'apiHeavy');
    const user = requireAiMemberAuth(req);

    const body = (await req.json().catch(() => ({}))) as {
      symbol?: string;
      name?: string;
      market?: string;
      yahooSymbol?: string;
      locale?: string;
    };

    if (!body.symbol?.trim() || !body.name?.trim()) {
      throw new ValidationError(AppErrorCode.MARKET_QUOTE_PARAMS_REQUIRED);
    }
    if (body.market !== Market.KR && body.market !== Market.US) {
      throw new ValidationError(AppErrorCode.MARKET_INVALID);
    }

    const locale = normalizeLocale(body.locale ?? req.headers.get('accept-language') ?? 'ko');
    const market = body.market as Market;

    const {
      listWatchlistUseCase,
      getDashboardUseCase,
      buildStockAiContextUseCase,
      runAiAnalysisUseCase,
    } = getServerServices();

    const [dashboard, watchlist] = await Promise.all([
      getDashboardUseCase.execute(user.userId),
      listWatchlistUseCase.execute(user.userId),
    ]);

    const context = await buildStockAiContextUseCase.execute({
      userId: user.userId,
      symbol: body.symbol.trim(),
      name: body.name.trim(),
      market,
      yahooSymbol: body.yahooSymbol?.trim(),
      locale,
      userHoldings: dashboard.holdings.map((h) => ({ symbol: h.symbol, market: h.market })),
      userWatchlist: watchlist.map((w) => ({ symbol: w.symbol, market: w.market })),
    });

    const insight = await runAiAnalysisUseCase.execute({
      userId: user.userId,
      kind: 'stock',
      context,
      locale,
    });

    return jsonData({ enabled: true, insight });
  } catch (error) {
    return handleRouteError(error);
  }
}
