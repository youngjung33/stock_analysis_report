import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { getRefreshToken, jsonData, setAccessCookie, setRefreshCookie, runApiRoute } from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:refresh', 'authRefresh');
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      return jsonData({ username: null });
    }

    const { refreshTokenUseCase } = getServerServices();
    const result = await refreshTokenUseCase.execute(refreshToken);

    const res = jsonData({ username: result.username });
    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    return res;
  });
}
