import { describe, expect, it } from 'vitest';
import {
  AppErrorCode,
  APP_ERROR_MESSAGES,
  resolveAppErrorMessage,
  USER_FACING_SERVER_ERROR_MESSAGE,
} from '@sar/shared';

describe('resolveAppErrorMessage', () => {
  it('returns custom message for user-safe validation codes', () => {
    expect(resolveAppErrorMessage(AppErrorCode.AUTH_USERNAME_TAKEN, '커스텀')).toBe('커스텀');
  });

  it('falls back to code default message for user-safe codes', () => {
    expect(resolveAppErrorMessage(AppErrorCode.AUTH_USERNAME_TAKEN)).toBe(
      APP_ERROR_MESSAGES[AppErrorCode.AUTH_USERNAME_TAKEN],
    );
  });

  it('hides internal server details from users', () => {
    expect(resolveAppErrorMessage(AppErrorCode.DB_UNAVAILABLE)).toBe(USER_FACING_SERVER_ERROR_MESSAGE);
    expect(resolveAppErrorMessage(AppErrorCode.DB_UNAVAILABLE, 'npm run db:push')).toBe(
      USER_FACING_SERVER_ERROR_MESSAGE,
    );
    expect(resolveAppErrorMessage(AppErrorCode.INTERNAL, 'Prisma P2021 table missing')).toBe(
      USER_FACING_SERVER_ERROR_MESSAGE,
    );
  });

  it('returns generic message for unknown code', () => {
    expect(resolveAppErrorMessage(undefined)).toBe(USER_FACING_SERVER_ERROR_MESSAGE);
  });
});
