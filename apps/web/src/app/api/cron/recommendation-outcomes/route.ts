import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireCronSecret } from '@/server/http/route-utils';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    requireCronSecret(req);
    const { evaluateRecommendationOutcomesUseCase } = getServerServices();
    const result = await evaluateRecommendationOutcomesUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
