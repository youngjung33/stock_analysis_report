import { NextRequest } from 'next/server';
import { Market, isQuoteChartRange, QUOTE_CHART_RANGE_HINT } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { BadRequestError } from '@/server/http/errors';
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
      throw new BadRequestError('symbol and market (KR|US) are required');
    }
    if (!isQuoteChartRange(rangeParam)) {
      throw new BadRequestError(`range must be one of: ${QUOTE_CHART_RANGE_HINT}`);
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
