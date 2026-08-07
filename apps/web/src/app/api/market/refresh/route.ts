import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:market-refresh', 'apiHeavy');
    const user = requireAuth(req);
    const { refreshQuotesUseCase } = getServerServices();
    const result = await refreshQuotesUseCase.execute(user.userId);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
