import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { EntityNotFoundError } from '@/server/domain/errors/domain.errors';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    await enforceRateLimit(req, 'api:recommendation-history-detail', 'apiRead');
    const { batchId } = await context.params;
    const { getRecommendationBatchUseCase } = getServerServices();
    const batch = await getRecommendationBatchUseCase.execute(batchId);
    if (!batch) {
      throw new EntityNotFoundError();
    }
    return jsonData({ batch });
  } catch (error) {
    return handleRouteError(error);
  }
}
