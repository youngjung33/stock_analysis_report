import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { enforceRateLimit, resetRateLimitStoreForTests } from '@server/http/rate-limit';
import { HttpError } from '@server/http/errors';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { POST as login } from '@/app/api/auth/login/route';
import { GET as checkUsername } from '@/app/api/auth/check-username/route';

describe('auth API rate limit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    vi.mocked(getServerServices).mockReturnValue({
      loginUseCase: {
        execute: vi.fn().mockResolvedValue({
          username: 'test',
          accessToken: 'access',
          refreshToken: 'refresh',
        }),
      },
      checkUsernameAvailabilityUseCase: {
        execute: vi.fn().mockResolvedValue({ available: true, message: '사용 가능' }),
      },
    } as never);
  });

  it('allows login requests under limit', () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(() => enforceRateLimit(req, 'auth:login', 'authLogin')).not.toThrow();
  });

  it('returns 429 when login limit exceeded', async () => {
    const ip = '9.9.9.9';
    for (let i = 0; i < 20; i++) {
      enforceRateLimit(
        new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'x-forwarded-for': ip },
        }),
        'auth:login',
        'authLogin',
      );
    }

    expect(() =>
      enforceRateLimit(
        new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'x-forwarded-for': ip },
        }),
        'auth:login',
        'authLogin',
      ),
    ).toThrow(HttpError);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'a', password: 'b' }),
    });
    const res = await login(req);
    expect(res.status).toBe(429);
  });

  it('returns 429 when check-username limit exceeded', async () => {
    const ip = '8.8.8.8';
    for (let i = 0; i < 30; i++) {
      enforceRateLimit(
        new NextRequest('http://localhost/api/auth/check-username?username=a', {
          headers: { 'x-forwarded-for': ip },
        }),
        'auth:check-username',
        'authCheckUsername',
      );
    }

    const req = new NextRequest('http://localhost/api/auth/check-username?username=testuser', {
      headers: { 'x-forwarded-for': ip },
    });
    const res = await checkUsername(req);
    expect(res.status).toBe(429);
  });
});
