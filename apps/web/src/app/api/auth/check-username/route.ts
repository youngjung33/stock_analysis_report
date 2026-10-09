import { NextRequest } from 'next/server';
import { AppErrorCode } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

/** GET — 아이디 중복 여부 조회 (`?username=`) */
export async function GET(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:check-username', 'authCheckUsername');
    const username = req.nextUrl.searchParams.get('username');
    if (!username?.trim()) {
      throw new ValidationError(AppErrorCode.AUTH_USERNAME_INVALID);
    }

    const { checkUsernameAvailabilityUseCase } = getServerServices();
    const result = await checkUsernameAvailabilityUseCase.execute(username);
    return jsonData(result);
  });
}
