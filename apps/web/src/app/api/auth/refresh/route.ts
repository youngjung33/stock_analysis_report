import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import {
  getRefreshToken,
  handleRouteError,
  jsonData,
  setRefreshCookie,
} from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      return jsonData({ accessToken: null, username: null });
    }

    const { refreshTokenUseCase } = getServerServices();
    const result = await refreshTokenUseCase.execute(refreshToken);

    const res = jsonData({ accessToken: result.accessToken, username: result.username });
    setRefreshCookie(res, result.refreshToken);
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
