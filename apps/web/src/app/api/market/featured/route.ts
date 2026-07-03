import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 15;

export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, 'market:featured', 'standard');
    const { getFeaturedQuotesUseCase } = getServerServices();
    const result = await getFeaturedQuotesUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
