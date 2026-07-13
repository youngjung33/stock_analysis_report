import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { getPortfolioSimulationUseCase } = getServerServices();
    const result = await getPortfolioSimulationUseCase.execute(user.userId);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
