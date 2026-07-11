import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import {
  clearAccessCookie,
  clearRefreshCookie,
  getRefreshToken,
  handleRouteError,
  jsonData,
  requireAuth,
} from '@/server/http/route-utils';

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

/** 회원탈퇴 — User 및 cascade 연관 데이터 삭제 */
export async function DELETE(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:delete-account', 'authLogin');
    const user = requireAuth(req);
    const body = (await req.json().catch(() => ({}))) as { password?: string };

    const { deleteAccountUseCase, logoutUseCase } = getServerServices();
    await deleteAccountUseCase.execute({ userId: user.userId, password: body.password });

    const refreshToken = getRefreshToken(req);
    await logoutUseCase.execute(refreshToken).catch(() => undefined);

    const res = jsonData({ ok: true, message: '회원탈퇴가 완료되었습니다.' });
    clearAccessCookie(res);
    clearRefreshCookie(res);
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
