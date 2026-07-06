import { describe, expect, it } from 'vitest';
import { AppErrorCode, USER_FACING_SERVER_ERROR_MESSAGE } from '@sar/shared';
import { Prisma } from '@prisma/client';
import { ValidationError, ConflictError } from '@server/domain/errors/domain.errors';
import { handleRouteError } from '@server/http/route-error';

describe('handleRouteError', () => {
  it('returns code and message for ValidationError', async () => {
    const res = handleRouteError(
      new ValidationError(AppErrorCode.AUTH_PASSWORD_INVALID, '비밀번호는 8자 이상'),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe(AppErrorCode.AUTH_PASSWORD_INVALID);
    expect(body.message).toBe('비밀번호는 8자 이상');
  });

  it('returns code and message for ConflictError', async () => {
    const res = handleRouteError(new ConflictError(AppErrorCode.AUTH_USERNAME_TAKEN));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe(AppErrorCode.AUTH_USERNAME_TAKEN);
    expect(body.message).toContain('아이디');
  });

  it('maps Prisma P2021 to generic user message without infra details', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('table missing', {
      code: 'P2021',
      clientVersion: '6.0.0',
    });
    const res = handleRouteError(prismaError);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe(AppErrorCode.DB_UNAVAILABLE);
    expect(body.message).toBe(USER_FACING_SERVER_ERROR_MESSAGE);
    expect(body.message).not.toContain('db');
  });
});
