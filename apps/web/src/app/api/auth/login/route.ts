import { AppErrorCode } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { ValidationError } from '@/server/domain/errors/domain.errors';
import { enforceRateLimit } from '@/server/http/rate-limit';
import {
  handleRouteError,
  jsonData,
  setAccessCookie,
  setRefreshCookie,
} from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'auth:login', 'authLogin');
    const body = (await req.json()) as { username?: string; password?: string };
    if (!body.username || !body.password) {
      throw new ValidationError(AppErrorCode.AUTH_LOGIN_REQUIRED);
    }

    const { loginUseCase } = getServerServices();
    const result = await loginUseCase.execute({
      username: body.username,
      password: body.password,
    });

    const res = jsonData({ username: result.username });
    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
