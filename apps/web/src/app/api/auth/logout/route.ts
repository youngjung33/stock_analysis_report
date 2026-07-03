import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import {
  clearAccessCookie,
  clearRefreshCookie,
  getRefreshToken,
  handleRouteError,
  jsonData,
} from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
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
