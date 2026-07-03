import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, 'market:search', 'standard');
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const marketParam = req.nextUrl.searchParams.get('market');
    const market = marketParam === Market.US ? Market.US : Market.KR;

    const { searchStocksUseCase } = getServerServices();
    const results = await searchStocksUseCase.execute(q, market);
    return jsonData(results);
  } catch (error) {
    return handleRouteError(error);
  }
}
