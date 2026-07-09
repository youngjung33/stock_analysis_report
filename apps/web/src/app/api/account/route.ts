import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { getAccountUseCase } = getServerServices();
    const profile = await getAccountUseCase.execute(user.userId);
    return jsonData(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
