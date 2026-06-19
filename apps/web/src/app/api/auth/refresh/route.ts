import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import {
  getRefreshToken,
  handleRouteError,
  jsonData,
  setRefreshCookie,
} from '@/server/http/route-utils';
import { UnauthorizedError } from '@/server/http/errors';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token missing');
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
