import { describe, expect, it } from 'vitest';
import { issueGuestSessionToken, verifyGuestSessionToken } from '@sar/shared';

const SECRET = 'test-guest-session-secret-32chars!!';

describe('guest-session-token', () => {
  it('issues and verifies signed guest tokens', async () => {
    const token = await issueGuestSessionToken(SECRET);
    expect(await verifyGuestSessionToken(token, SECRET)).toBe(true);
  });

  it('rejects tampered tokens', async () => {
    const token = await issueGuestSessionToken(SECRET);
    expect(await verifyGuestSessionToken(`${token}x`, SECRET)).toBe(false);
  });

  it('rejects legacy plain cookie values', async () => {
    expect(await verifyGuestSessionToken('1', SECRET)).toBe(false);
  });
});
