import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, requireAuth, runApiRoute } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'api:portfolio-dashboard', 'apiRead');
    const user = requireAuth(req);
    const { getDashboardUseCase } = getServerServices();
    const result = await getDashboardUseCase.execute(user.userId);
    return jsonData(result);
  });
}
