import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { refreshQuotesUseCase } = getServerServices();
    const result = await refreshQuotesUseCase.execute(user.userId);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
