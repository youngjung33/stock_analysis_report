import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decryptApiKey, encryptApiKey } from '@/server/data/ai/credential-cipher';

const ORIGINAL = process.env.AI_CREDENTIALS_SECRET;

describe('credential-cipher', () => {
  beforeEach(() => {
    process.env.AI_CREDENTIALS_SECRET = 'test-ai-credentials-secret-min-32-chars!!';
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.AI_CREDENTIALS_SECRET;
    else process.env.AI_CREDENTIALS_SECRET = ORIGINAL;
  });

  it('encrypts and decrypts API key roundtrip', () => {
    const plain = 'AIzaSyExampleKeyForTestingOnly123456';
    const { encryptedKey, keyIv } = encryptApiKey(plain);
    expect(encryptedKey).not.toContain(plain);
    expect(decryptApiKey(encryptedKey, keyIv)).toBe(plain);
  });

  it('throws when secret is too short', () => {
    process.env.AI_CREDENTIALS_SECRET = 'short';
    expect(() => encryptApiKey('key')).toThrow(/AI_CREDENTIALS_SECRET/);
  });
});
