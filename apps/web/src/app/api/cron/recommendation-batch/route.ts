import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireCronSecret } from '@/server/http/route-utils';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    requireCronSecret(req);
    const { runGlobalRecommendationBatchUseCase } = getServerServices();
    const result = await runGlobalRecommendationBatchUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
