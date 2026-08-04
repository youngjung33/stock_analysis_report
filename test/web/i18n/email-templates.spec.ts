import { describe, expect, it } from 'vitest';
import { buildEmailVerificationEmail, buildPasswordResetEmail } from '@/i18n/email-templates';

describe('buildPasswordResetEmail', () => {
  it('builds English password reset email', () => {
    const email = buildPasswordResetEmail('en', 'https://example.com/reset?token=abc');
    expect(email.subject).toContain('Reset your password');
    expect(email.text).toContain('https://example.com/reset?token=abc');
    expect(email.text).toContain('1 hour');
  });

  it('builds Korean password reset email', () => {
    const email = buildPasswordResetEmail('ko', 'https://example.com/reset?token=abc');
    expect(email.subject).toContain('비밀번호 재설정');
    expect(email.text).toContain('1시간');
  });
});

describe('buildEmailVerificationEmail', () => {
  it('includes code and link in Korean email', () => {
    const email = buildEmailVerificationEmail('ko', '123456', 'https://example.com/verify?code=123456');
    expect(email.subject).toContain('이메일 인증');
    expect(email.text).toContain('123456');
    expect(email.text).toContain('https://example.com/verify?code=123456');
  });

  it('includes code and link in English email', () => {
    const email = buildEmailVerificationEmail('en', '654321', 'https://example.com/verify?code=654321');
    expect(email.subject).toContain('Verify your email');
    expect(email.text).toContain('654321');
  });
});
