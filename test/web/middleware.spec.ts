import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GUEST_SESSION_COOKIE, REFRESH_TOKEN_COOKIE } from '@sar/shared';

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
  });

  it('allows public login without session', () => {
    middleware(request('/login'));
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users from dashboard to login', () => {
    middleware(request('/'));
    expect(NextResponse.redirect).toHaveBeenCalled();
    const url = vi.mocked(NextResponse.redirect).mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe('/login');
  });

  it('allows guest cookie on protected routes', () => {
    middleware(request('/my-info', { [GUEST_SESSION_COOKIE]: '1' }));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('allows refresh token on protected routes', () => {
    middleware(request('/transactions', { [REFRESH_TOKEN_COOKIE]: 'token' }));
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
