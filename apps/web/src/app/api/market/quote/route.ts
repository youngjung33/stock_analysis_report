import { AppErrorCode, Market, isQuoteChartRange } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { ValidationError } from '@/server/domain/errors/domain.errors';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, 'market:quote', 'standard');
    const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
    const market = req.nextUrl.searchParams.get('market') as Market | null;
    const rangeParam = req.nextUrl.searchParams.get('range') ?? '1d';

    if (!symbol || (market !== Market.KR && market !== Market.US)) {
      throw new ValidationError(AppErrorCode.MARKET_QUOTE_PARAMS_REQUIRED);
    }
    if (!isQuoteChartRange(rangeParam)) {
      throw new ValidationError(AppErrorCode.MARKET_QUOTE_RANGE_INVALID);
    }

    const { getStockQuoteUseCase } = getServerServices();
    const result = await getStockQuoteUseCase.execute({
      symbol,
      market,
      range: rangeParam,
    });
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
