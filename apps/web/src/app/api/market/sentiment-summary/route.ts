import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 25;

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:sentiment-summary', 'heavy');
    const { getMarketSentimentSummaryUseCase } = getServerServices();
    const result = await getMarketSentimentSummaryUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
