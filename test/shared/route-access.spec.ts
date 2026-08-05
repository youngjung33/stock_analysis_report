import { describe, expect, it } from 'vitest';
import {
  GUEST_SESSION_COOKIE,
  PUBLIC_PAGE_PATHS,
  hasAppSessionCookie,
  isPublicPagePath,
  normalizePagePath,
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

  it('detects refresh or guest session cookies', () => {
    expect(
      hasAppSessionCookie({
        get: (name) => (name === 'refreshToken' ? { value: 'x' } : undefined),
      }),
    ).toBe(true);
    expect(
      hasAppSessionCookie({
        get: (name) => (name === GUEST_SESSION_COOKIE ? { value: '1' } : undefined),
      }),
    ).toBe(true);
    expect(
      hasAppSessionCookie({
        get: () => undefined,
      }),
    ).toBe(false);
  });
});
