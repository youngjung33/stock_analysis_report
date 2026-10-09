import { describe, expect, it } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import { NextResponse } from 'next/server';
import { runApiRoute } from '@server/http/run-api-route';

describe('runApiRoute', () => {
  it('returns handler response on success', async () => {
    const res = await runApiRoute(async () => NextResponse.json({ ok: true }), {
      deadlineMs: 5_000,
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('returns 504 REQUEST_TIMEOUT when handler exceeds deadline', async () => {
    const res = await runApiRoute(
      () =>
        new Promise<NextResponse>((resolve) => {
          setTimeout(() => resolve(NextResponse.json({ ok: true })), 200);
        }),
      { deadlineMs: 30 },
    );
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.code).toBe(AppErrorCode.REQUEST_TIMEOUT);
  });
});
