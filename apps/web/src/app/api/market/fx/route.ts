import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, 'market:fx', 'light');
    const { getFxRateUseCase } = getServerServices();
    const result = await getFxRateUseCase.execute();
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
