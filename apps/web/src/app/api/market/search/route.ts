import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'market:search', 'standard');
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const marketParam = req.nextUrl.searchParams.get('market');
    const market = marketParam === Market.US ? Market.US : Market.KR;

    const { searchStocksUseCase } = getServerServices();
    const results = await searchStocksUseCase.execute(q, market);
    return jsonData(results);
  }, { maxDurationSec: 10 });
}
