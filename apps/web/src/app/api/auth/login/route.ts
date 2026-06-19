import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import {
  handleRouteError,
  jsonData,
  setRefreshCookie,
} from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return jsonData({ message: 'username and password required' }, { status: 400 });
    }

    const { loginUseCase } = getServerServices();
    const result = await loginUseCase.execute({
      username: body.username,
      password: body.password,
    });

    const res = jsonData({ accessToken: result.accessToken, username: result.username });
    setRefreshCookie(res, result.refreshToken);
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
