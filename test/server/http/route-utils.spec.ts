import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@sar/shared';
import { AuthenticationError } from '@server/domain/errors/domain.errors';
import { requireAuth, extractAccessToken } from '@server/http/route-utils';
import { createMockTokenService } from '../mocks/repositories.mock';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';

describe('extractAccessToken', () => {
  it('prefers httpOnly cookie over Authorization header', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer header-token' },
    });
    req.cookies.set(ACCESS_TOKEN_COOKIE, 'cookie-token');
    expect(extractAccessToken(req)).toBe('cookie-token');
  });

  it('falls back to Bearer token', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer header-token' },
    });
    expect(extractAccessToken(req)).toBe('header-token');
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    vi.mocked(getServerServices).mockReturnValue({
      tokenService: createMockTokenService(),
    } as never);
  });

  it('returns userId from JWT payload sub', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer valid-token' },
    });
    const user = requireAuth(req);
    expect(user.userId).toBe('user-1');
    expect(user.username).toBe('admin');
  });

  it('throws when token missing', () => {
    const req = new NextRequest('http://localhost/api/test');
    expect(() => requireAuth(req)).toThrow(AuthenticationError);
  });
});
