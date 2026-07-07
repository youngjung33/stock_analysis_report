import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

/** GET /api/auth/check-username?username= — 아이디 중복·형식 확인 */
export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:check-username', 'authCheckUsername');
    const username = req.nextUrl.searchParams.get('username');
    if (!username?.trim()) {
      throw new ValidationError('username query is required');
    }

    const { checkUsernameAvailabilityUseCase } = getServerServices();
    const result = await checkUsernameAvailabilityUseCase.execute(username);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
