import { describe, expect, it } from 'vitest';
import { isAllowedOAuthRedirectUri } from '@sar/shared';

describe('isAllowedOAuthRedirectUri', () => {
  const origin = 'https://app.example.com';

  it('allows same-origin oauth callback path', () => {
    expect(
      isAllowedOAuthRedirectUri(`${origin}/api/auth/oauth/google/callback`, origin),
    ).toBe(true);
  });

  it('rejects external origins', () => {
    expect(
      isAllowedOAuthRedirectUri('https://evil.com/api/auth/oauth/google/callback', origin),
    ).toBe(false);
  });

  it('rejects non-callback paths on same origin', () => {
    expect(isAllowedOAuthRedirectUri(`${origin}/login`, origin)).toBe(false);
  });
});
