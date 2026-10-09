import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'market:indices', 'standard');
    const { getMarketIndicesUseCase } = getServerServices();
    const result = await getMarketIndicesUseCase.execute();
    return jsonData(result);
  });
}
