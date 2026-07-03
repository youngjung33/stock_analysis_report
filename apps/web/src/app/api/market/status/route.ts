import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, 'market:status', 'light');
    const { getMarketStatusUseCase } = getServerServices();
    return jsonData(getMarketStatusUseCase.execute());
  } catch (error) {
    return handleRouteError(error);
  }
}
