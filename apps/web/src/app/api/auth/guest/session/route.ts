import { NextRequest } from 'next/server';
import { issueGuestSessionToken } from '@sar/shared';
import { resolveGuestSessionSecret } from '@/server/config/env';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, setGuestSessionCookie, clearGuestSessionCookie, runApiRoute } from '@/server/http/route-utils';

/** Issue HttpOnly signed guest session cookie (cannot be forged from client JS). */
export async function POST(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:guest-session', 'authLogin');
    const token = await issueGuestSessionToken(resolveGuestSessionSecret());
    const res = jsonData({ success: true });
    setGuestSessionCookie(res, token);
    return res;
  });
}

export async function DELETE(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:guest-session-clear', 'authLogout');
    const res = jsonData({ success: true });
    clearGuestSessionCookie(res);
    return res;
  });
}
