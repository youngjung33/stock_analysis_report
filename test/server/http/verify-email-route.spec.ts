import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as verifyEmailGet } from '@/app/api/auth/verify-email/route';

describe('GET /api/auth/verify-email', () => {
  beforeEach(() => {
    vi.mocked(getServerServices).mockReturnValue({
      verifyEmailUseCase: {
        execute: vi.fn().mockResolvedValue(undefined),
      },
    } as never);
  });

  it('redirects to settings with verified=1 on success', async () => {
    const req = new NextRequest('http://localhost/api/auth/verify-email?code=123456');
    const res = await verifyEmailGet(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?verified=1');
  });

  it('redirects to settings with verifyError=1 when code missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/verify-email');
    const res = await verifyEmailGet(req);
    expect(res.headers.get('location')).toContain('/settings?verifyError=1');
  });

  it('redirects to settings with verifyError=1 when verification fails', async () => {
    vi.mocked(getServerServices).mockReturnValue({
      verifyEmailUseCase: {
        execute: vi.fn().mockRejectedValue(new Error('invalid')),
      },
    } as never);

    const req = new NextRequest('http://localhost/api/auth/verify-email?code=000000');
    const res = await verifyEmailGet(req);
    expect(res.headers.get('location')).toContain('/settings?verifyError=1');
  });
});
