import { AuthTokenType } from '@sar/shared';
import { IAuthTokenRepository } from '../../domain/repositories';
import {
  authTokenExpiresAt,
  generateEmailVerificationCode,
  hashAuthToken,
} from '../../data/auth/auth-token.utils';

export interface EmailVerificationIssued {
  verificationCode: string;
}

/** 이메일 인증 코드 발급 — DB 저장 후 코드 반환 (클라이언트 toast용) */
export async function issueEmailVerificationCode(
  authTokenRepo: IAuthTokenRepository,
  userId: string,
  email: string,
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

  // TODO: Resend/SMTP 등 EmailSender로 인증 코드 메일 발송. 현재는 API 응답 → 클라이언트 toast로 안내.
  // await emailSender.send({
  //   to: email,
  //   subject: '[SAR Portfolio] 이메일 인증',
  //   text: `인증 코드: ${verificationCode}\n\n24시간 내에 입력해 주세요.`,
  // });

  return { verificationCode };
}
