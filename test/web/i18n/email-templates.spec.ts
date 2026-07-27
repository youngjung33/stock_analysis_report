import { describe, expect, it } from 'vitest';
import { buildPasswordResetEmail } from '@/i18n/email-templates';

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
