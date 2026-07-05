import { NextRequest } from 'next/server';
import { AppErrorCode } from '@sar/shared';
import { getServerServices } from '@/server/container';
import {
  handleRouteError,
  jsonData,
  setAccessCookie,
  setRefreshCookie,
} from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

/** 아이디·비밀번호 회원가입 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
      passwordConfirm?: string;
      email?: string | null;
    };

    if (!body.username || !body.password || body.passwordConfirm === undefined) {
      throw new ValidationError(AppErrorCode.AUTH_REGISTER_FIELDS_REQUIRED);
    }

    const { registerUseCase } = getServerServices();
    const result = await registerUseCase.execute({
      username: body.username,
      password: body.password,
      passwordConfirm: body.passwordConfirm,
      email: body.email,
    });

    const res = jsonData({ username: result.username, isNewUser: result.isNewUser });
    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
