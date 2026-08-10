import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:recommendation-history', 'apiRead');
    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Math.min(90, Math.max(1, Number(limitParam) || 30)) : 30;
    const { listRecommendationHistoryUseCase } = getServerServices();
    const batches = await listRecommendationHistoryUseCase.execute({ limit });
    return jsonData({ batches });
  } catch (error) {
    return handleRouteError(error);
  }
}
