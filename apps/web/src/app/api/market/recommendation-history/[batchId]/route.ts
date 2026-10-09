import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';
import { EntityNotFoundError } from '@/server/domain/errors/domain.errors';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'api:recommendation-history-detail', 'apiRead');
    const { batchId } = await context.params;
    const { getRecommendationBatchUseCase } = getServerServices();
    const batch = await getRecommendationBatchUseCase.execute(batchId);
    if (!batch) {
      throw new EntityNotFoundError();
    }
    return jsonData({ batch });
  });
}
