import { AppErrorCode, Market } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { ValidationError } from '@/server/domain/errors/domain.errors';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'market:quotes', 'standard');
    const body = (await req.json()) as {
      stocks?: { stockId?: string; symbol?: string; market?: Market }[];
    };

    const stocks = (body.stocks ?? [])
      .filter((s) => s.stockId && s.symbol && s.market)
      .map((s) => ({
        stockId: s.stockId!,
        symbol: s.symbol!,
        market: s.market!,
      }));

    if (stocks.length === 0) {
      throw new ValidationError(AppErrorCode.MARKET_STOCKS_REQUIRED);
    }

    const { fetchQuotesUseCase } = getServerServices();
    const result = await fetchQuotesUseCase.execute(stocks);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
