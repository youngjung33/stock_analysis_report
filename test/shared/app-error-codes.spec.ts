import { describe, expect, it } from 'vitest';
import {
  AppErrorCode,
  APP_ERROR_MESSAGES,
  resolveAppErrorMessage,
} from '@sar/shared';

describe('resolveAppErrorMessage', () => {
  it('returns server message when provided', () => {
    expect(resolveAppErrorMessage(AppErrorCode.AUTH_USERNAME_TAKEN, '커스텀')).toBe('커스텀');
  });

  it('falls back to code default message', () => {
    expect(resolveAppErrorMessage(AppErrorCode.DB_UNAVAILABLE)).toBe(
      APP_ERROR_MESSAGES[AppErrorCode.DB_UNAVAILABLE],
    );
  });

  it('returns internal message for unknown code', () => {
    expect(resolveAppErrorMessage(undefined)).toBe(APP_ERROR_MESSAGES[AppErrorCode.INTERNAL]);
  });
});
