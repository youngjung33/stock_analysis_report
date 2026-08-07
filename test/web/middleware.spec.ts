import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GUEST_SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  issueGuestSessionToken,
} from '@sar/shared';

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: vi.fn(() => ({ type: 'next', cookies: { set: vi.fn() } })),
      redirect: vi.fn((url: URL | string) => ({
        type: 'redirect',
        url: typeof url === 'string' ? url : url.toString(),
      })),
    },
  };
});

import { NextResponse } from 'next/server';
import { middleware } from '@/middleware';

const TEST_SECRET = 'middleware-test-secret-32-characters!!';
const VALID_REFRESH = 'a'.repeat(128);

function request(path: string, cookies: Record<string, string> = {}) {
  const headers: Record<string, string> = { 'accept-language': 'ko-KR' };
  if (Object.keys(cookies).length > 0) {
    headers.cookie = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('middleware route access', () => {
  beforeEach(() => {
    vi.mocked(NextResponse.next).mockClear();
    vi.mocked(NextResponse.redirect).mockClear();
    process.env.JWT_ACCESS_SECRET = TEST_SECRET;
  });

  it('allows public login without session', async () => {
    await middleware(request('/login'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users from dashboard to login', async () => {
    await middleware(request('/'));
    expect(NextResponse.redirect).toHaveBeenCalled();
    const url = vi.mocked(NextResponse.redirect).mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe('/login');
  });

  it('preserves next path when redirecting from protected route', async () => {
    await middleware(request('/tax'));
    const url = vi.mocked(NextResponse.redirect).mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/tax');
  });

  it('allows signed guest cookie on protected routes', async () => {
    const token = await issueGuestSessionToken(TEST_SECRET);
    await middleware(request('/my-info', { [GUEST_SESSION_COOKIE]: token }));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('rejects spoofed plain guest cookie', async () => {
    await middleware(request('/my-info', { [GUEST_SESSION_COOKIE]: '1' }));
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('allows plausible refresh token on protected routes', async () => {
    await middleware(request('/transactions', { [REFRESH_TOKEN_COOKIE]: VALID_REFRESH }));
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
