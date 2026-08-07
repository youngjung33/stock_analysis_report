import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'api:portfolio-dashboard', 'apiRead');
    const user = requireAuth(req);
    const { getDashboardUseCase } = getServerServices();
    const result = await getDashboardUseCase.execute(user.userId);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
