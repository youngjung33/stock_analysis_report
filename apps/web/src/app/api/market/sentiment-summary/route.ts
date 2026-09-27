import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import {
  resolveMarketPersonalization,
  type MarketPersonalizationInput,
} from '@/server/http/market-personalization';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 25;

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:sentiment-summary', 'heavy');
    const options = await resolveMarketPersonalization(req);
    const { getMarketSentimentSummaryUseCase } = getServerServices();
    const result = await getMarketSentimentSummaryUseCase.execute(options);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Guest/client personalization — holdings·watchlist in body */
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'market:sentiment-summary', 'heavy');
    const body = (await req.json().catch(() => ({}))) as MarketPersonalizationInput;
    const options = await resolveMarketPersonalization(req, body);
    const { getMarketSentimentSummaryUseCase } = getServerServices();
    const result = await getMarketSentimentSummaryUseCase.execute(options);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
