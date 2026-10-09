import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'market:fx', 'light');
    const { getFxRateUseCase } = getServerServices();
    const result = await getFxRateUseCase.execute();
    return jsonData(result);
  }, { maxDurationSec: 10 });
}
