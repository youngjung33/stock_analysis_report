import { describe, expect, it } from 'vitest';
import {
  AppSuccessCode,
  APP_SUCCESS_MESSAGES,
  apiSuccessBody,
  isAppSuccessCode,
  resolveAppSuccessMessage,
} from '@sar/shared';

describe('AppSuccessCode', () => {
  it('identifies valid success codes', () => {
    expect(isAppSuccessCode(AppSuccessCode.AUTH_PASSWORD_CHANGED)).toBe(true);
    expect(isAppSuccessCode('UNKNOWN')).toBe(false);
  });

  it('resolves Korean fallback messages', () => {
    expect(resolveAppSuccessMessage(AppSuccessCode.ACCOUNT_DELETED)).toBe(
      APP_SUCCESS_MESSAGES.ACCOUNT_DELETED,
    );
  });

  it('builds api success body with optional fields', () => {
    expect(apiSuccessBody(AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED, { verificationCode: '123456' })).toEqual({
      ok: true,
      code: AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED,
      verificationCode: '123456',
    });
  });
});
