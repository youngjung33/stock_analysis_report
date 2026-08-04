import { AuthTokenType, type SupportedLocale } from '@sar/shared';
import { IAuthTokenRepository } from '../../domain/repositories';
import { IEmailSenderPort } from '../../domain/ports/email-sender.port';
import {
  authTokenExpiresAt,
  buildAppUrl,
  generateEmailVerificationCode,
  hashAuthToken,
} from '../../data/auth/auth-token.utils';
import { buildEmailVerificationEmail } from '@/i18n/email-templates';

export interface EmailVerificationIssued {
  verificationCode: string;
}

export interface IssueEmailVerificationOptions {
  emailSender?: IEmailSenderPort;
  locale?: SupportedLocale;
}

/** 이메일 인증 코드 발급 — DB 저장 후 코드 반환 (메일 발송 또는 클라이언트 toast) */
export async function issueEmailVerificationCode(
  authTokenRepo: IAuthTokenRepository,
  userId: string,
  email: string,
  options?: IssueEmailVerificationOptions,
): Promise<EmailVerificationIssued> {
  await authTokenRepo.invalidateUserTokens(userId, AuthTokenType.EMAIL_VERIFY);
  const verificationCode = generateEmailVerificationCode();
  await authTokenRepo.create({
    userId,
    type: AuthTokenType.EMAIL_VERIFY,
    tokenHash: hashAuthToken(verificationCode),
    email,
    expiresAt: authTokenExpiresAt(AuthTokenType.EMAIL_VERIFY),
  });

  if (options?.emailSender) {
    const link = buildAppUrl(`/api/auth/verify-email?code=${verificationCode}`);
    const content = buildEmailVerificationEmail(options.locale ?? 'ko', verificationCode, link);
    await options.emailSender.send({
      to: email,
      subject: content.subject,
      text: content.text,
    });
  }

  return { verificationCode };
}
