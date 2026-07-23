import { describe, expect, it, vi } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import {
  OAuthProvider,
  proposeUsernameFromOAuthProfile,
  validateLoginInput,
  validatePasswordFormat,
  validateRegisterFields,
  validateRegisterInput,
  validateUsernameFormat,
  withUsernameSuffix,
} from '@sar/shared';

describe('validateUsernameFormat', () => {
  it('rejects numeric-only short invalid patterns via length', () => {
    expect(validateUsernameFormat('111')).toBeNull();
    expect(validateUsernameFormat('ab')).toBeTruthy();
  });
});

describe('validatePasswordFormat', () => {
  it('accepts letter and digit password', () => {
    expect(validatePasswordFormat('password1')).toBeNull();
  });

  it('rejects digits only', () => {
    expect(validatePasswordFormat('11111111')).toBeTruthy();
  });

  it('rejects too short password', () => {
    expect(validatePasswordFormat('111')).toBeTruthy();
  });
});

describe('validateRegisterInput', () => {
  it('accepts valid credentials', () => {
    expect(
      validateRegisterInput({
        username: 'user_01',
        password: 'password1',
        passwordConfirm: 'password1',
      }),
    ).toBeNull();
  });

  it('rejects all-111 style weak password', () => {
    expect(
      validateRegisterInput({
        username: 'user111',
        password: '111',
        passwordConfirm: '111',
      }),
    ).toBeTruthy();
  });

  it('rejects mismatched password confirmation', () => {
    expect(
      validateRegisterInput({
        username: 'valid_user',
        password: 'password1',
        passwordConfirm: 'password2',
      }),
    ).toBe('AUTH_PASSWORD_MISMATCH');
  });

  it('returns field errors map', () => {
    const errors = validateRegisterFields({
      username: '111',
      password: '111',
      passwordConfirm: '111',
      email: '111',
    });
    expect(errors.password).toBeTruthy();
    expect(errors.email).toBeTruthy();
  });
});

describe('validateLoginInput', () => {
  it('rejects empty credentials', () => {
    expect(validateLoginInput('', 'password')).toBeTruthy();
    expect(validateLoginInput('admin', '')).toBeTruthy();
  });
});

describe('proposeUsernameFromOAuthProfile', () => {
  it('prefers display name', () => {
    expect(
      proposeUsernameFromOAuthProfile({
        provider: OAuthProvider.GOOGLE,
        providerUserId: '123',
        email: 'a@b.com',
        displayName: 'John Doe',
      }),
    ).toBe('john_doe');
  });
});

describe('withUsernameSuffix', () => {
  it('appends numeric suffix within length limit', () => {
    expect(withUsernameSuffix('myusername', 2)).toBe('myusername_2');
  });
});
