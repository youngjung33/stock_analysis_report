import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:indices', 'standard');
    const { getMarketIndicesUseCase } = getServerServices();
    const result = await getMarketIndicesUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
