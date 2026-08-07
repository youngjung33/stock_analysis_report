import { describe, expect, it } from 'vitest';
import {
  GUEST_SESSION_COOKIE,
  PUBLIC_PAGE_PATHS,
  hasAppSessionCookie,
  isPublicPagePath,
  normalizePagePath,
  sanitizePostAuthPath,
} from '@sar/shared';

describe('route-access', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePagePath('/login/')).toBe('/login');
  });

  it('identifies public paths', () => {
    for (const path of PUBLIC_PAGE_PATHS) {
      expect(isPublicPagePath(path)).toBe(true);
    }
    expect(isPublicPagePath('/')).toBe(false);
  });

  it('detects refresh session cookie', () => {
    expect(
      hasAppSessionCookie({
        get: (name) => (name === 'refreshToken' ? { value: 'x' } : undefined),
      }),
    ).toBe(true);
    expect(
      hasAppSessionCookie({
        get: (name) => (name === GUEST_SESSION_COOKIE ? { value: '1' } : undefined),
      }),
    ).toBe(false);
    expect(
      hasAppSessionCookie({
        get: () => undefined,
      }),
    ).toBe(false);
  });

  describe('sanitizePostAuthPath', () => {
    it('returns fallback for missing or unsafe targets', () => {
      expect(sanitizePostAuthPath(null)).toBe('/');
      expect(sanitizePostAuthPath('')).toBe('/');
      expect(sanitizePostAuthPath('https://evil.com')).toBe('/');
      expect(sanitizePostAuthPath('//evil.com')).toBe('/');
      expect(sanitizePostAuthPath('/login')).toBe('/');
    });

    it('allows safe internal paths', () => {
      expect(sanitizePostAuthPath('/tax')).toBe('/tax');
      expect(sanitizePostAuthPath('/guide?category=type-analysis')).toBe('/guide?category=type-analysis');
    });
  });
});
