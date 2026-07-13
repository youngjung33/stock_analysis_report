import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { AppErrorCode, OAuthProvider } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as getAccount, DELETE as deleteAccount } from '@/app/api/account/route';
import { POST as changeEmail } from '@/app/api/account/email/route';
import { DELETE as unlinkOAuth } from '@/app/api/account/oauth/[provider]/route';

const authUser = { userId: 'user-1', username: 'admin' };

function authedRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, {
    ...init,
    headers: {
      authorization: 'Bearer test-token',
      ...(init?.headers ?? {}),
    },
  });
}

function mockServices(overrides: Record<string, unknown> = {}) {
  vi.mocked(getServerServices).mockReturnValue({
    tokenService: {
      verifyAccessToken: vi.fn().mockReturnValue({ sub: authUser.userId, username: authUser.username }),
    },
    getAccountUseCase: {
      execute: vi.fn().mockResolvedValue({
        username: 'admin',
        email: 'user@example.com',
        emailVerified: true,
        hasPassword: true,
        oauthAccounts: [],
      }),
    },
    changeEmailUseCase: {
      execute: vi.fn().mockResolvedValue({ verificationCode: '123456' }),
    },
    deleteAccountUseCase: {
      execute: vi.fn().mockResolvedValue(undefined),
    },
    logoutUseCase: {
      execute: vi.fn().mockResolvedValue(undefined),
    },
    unlinkOAuthAccountUseCase: {
      execute: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  } as never);
}

describe('account API routes', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    mockServices();
  });

  it('GET /api/account returns 401 without auth', async () => {
    const res = await getAccount(new NextRequest('http://localhost/api/account'));
    expect(res.status).toBe(401);
  });

  it('GET /api/account returns profile for authed user', async () => {
    const res = await getAccount(authedRequest('http://localhost/api/account'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('admin');
    expect(body.email).toBe('user@example.com');
  });

  it('POST /api/account/email returns verification code', async () => {
    const req = authedRequest('http://localhost/api/account/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({ email: 'new@example.com' }),
    });
    const res = await changeEmail(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verificationCode).toBe('123456');
  });

  it('DELETE /api/account/oauth/[provider] unlinks provider', async () => {
    const req = authedRequest('http://localhost/api/account/oauth/google');
    const res = await unlinkOAuth(req, { params: Promise.resolve({ provider: OAuthProvider.GOOGLE }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('DELETE /api/account clears cookies on success', async () => {
    const req = authedRequest('http://localhost/api/account', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        cookie: 'refresh_token=rt-1',
      },
      body: JSON.stringify({ password: 'secret' }),
    });
    const res = await deleteAccount(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.getSetCookie?.() ?? [];
    expect(setCookie.some((c) => c.includes('Max-Age=0'))).toBe(true);
  });

  it('DELETE /api/account returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/account', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'secret' }),
    });
    const res = await deleteAccount(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe(AppErrorCode.AUTH_UNAUTHORIZED);
  });
});
