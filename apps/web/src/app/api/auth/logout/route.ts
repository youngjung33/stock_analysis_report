import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import {
  clearAccessCookie,
  clearRefreshCookie,
  getRefreshToken,
  handleRouteError,
  jsonData,
} from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'auth:logout', 'authLogout');
    const refreshToken = getRefreshToken(req);
    const { logoutUseCase } = getServerServices();
    await logoutUseCase.execute(refreshToken);

    const res = jsonData({ success: true });
    clearAccessCookie(res);
    clearRefreshCookie(res);
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
