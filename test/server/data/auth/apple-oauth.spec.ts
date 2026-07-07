import { describe, expect, it } from 'vitest';
import { normalizeApplePrivateKey, isAppleOAuthConfigured } from '@server/data/auth/apple-oauth';

describe('apple-oauth', () => {
  it('normalizes escaped newlines in PEM', () => {
    const raw = '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----';
    expect(normalizeApplePrivateKey(raw)).toBe('-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----');
  });

  it('isAppleOAuthConfigured returns false when env is missing', () => {
    expect(isAppleOAuthConfigured()).toBe(false);
  });
});
