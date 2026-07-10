import {
  AppErrorCode,
  AuthTokenType,
  OAuthProviderId,
  isOAuthProvider,
  validatePasswordFormat,
} from '@sar/shared';
import { AuthenticationError, ConflictError, ValidationError } from '../../errors/domain.errors';
import { IEmailSenderPort } from '../../ports/email-sender.port';
import {
  IAuthTokenRepository,
  IPasswordHasher,
  IUserOAuthAccountRepository,
  IUserRepository,
} from '../../repositories';
import {
  EmailVerificationIssued,
  issueEmailVerificationCode,
} from '../../services/email-verification.service';
import {
  authTokenExpiresAt,
  buildAppUrl,
  generateAuthTokenRaw,
  hashAuthToken,
  isEmailVerificationCode,
} from '../../../data/auth/auth-token.utils';

export interface AccountProfile {
  username: string;
  email: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  oauthAccounts: { provider: OAuthProviderId; email: string | null; linkedAt: string }[];
}

export class GetAccountUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly oauthAccountRepo: IUserOAuthAccountRepository,
  ) {}

  async execute(userId: string): Promise<AccountProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AuthenticationError(AppErrorCode.AUTH_UNAUTHORIZED);

    const oauthAccounts = await this.oauthAccountRepo.findByUserId(userId);
    return {
      username: user.username,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      hasPassword: !!user.passwordHash,
      oauthAccounts: oauthAccounts
        .filter((a) => isOAuthProvider(a.provider))
        .map((a) => ({
          provider: a.provider as OAuthProviderId,
          email: a.email,
          linkedAt: a.createdAt.toISOString(),
        })),
    };
  }
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }) {
    if (input.newPassword !== input.newPasswordConfirm) {
      throw new ValidationError(AppErrorCode.AUTH_PASSWORD_MISMATCH);
    }
    const pwError = validatePasswordFormat(input.newPassword);
    if (pwError) throw new ValidationError(AppErrorCode.AUTH_PASSWORD_INVALID, pwError);

    const user = await this.userRepo.findById(input.userId);
    if (!user?.passwordHash) {
      throw new ValidationError(AppErrorCode.AUTH_SOCIAL_ONLY);
    }

    const ok = await this.passwordHasher.compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new ValidationError(AppErrorCode.AUTH_CURRENT_PASSWORD_INVALID);

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepo.updatePasswordHash(user.id, passwordHash);
  }
}

export class ChangeEmailUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authTokenRepo: IAuthTokenRepository,
  ) {}

  async execute(input: { userId: string; email: string }): Promise<EmailVerificationIssued> {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new ValidationError(AppErrorCode.AUTH_EMAIL_INVALID);
    }

    const existing = await this.userRepo.findByEmail(email);
    if (existing && existing.id !== input.userId) {
      throw new ConflictError(AppErrorCode.AUTH_EMAIL_TAKEN);
    }

    await this.userRepo.updateEmail(input.userId, email);
    return issueEmailVerificationCode(this.authTokenRepo, input.userId, email);
  }
}

export class RequestEmailVerificationUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authTokenRepo: IAuthTokenRepository,
  ) {}

  async execute(userId: string): Promise<EmailVerificationIssued | null> {
    const user = await this.userRepo.findById(userId);
    if (!user?.email) throw new ValidationError(AppErrorCode.AUTH_EMAIL_REQUIRED);
    if (user.emailVerifiedAt) return null;

    return issueEmailVerificationCode(this.authTokenRepo, userId, user.email);
  }
}

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authTokenRepo: IAuthTokenRepository,
  ) {}

  async execute(rawCode: string) {
    const code = rawCode.trim();
    if (!isEmailVerificationCode(code)) {
      throw new ValidationError(AppErrorCode.AUTH_TOKEN_INVALID);
    }

    const token = await this.authTokenRepo.consumeValid(
      hashAuthToken(code),
      AuthTokenType.EMAIL_VERIFY,
    );
    if (!token) throw new ValidationError(AppErrorCode.AUTH_TOKEN_INVALID);

    if (token.email) {
      const existing = await this.userRepo.findByEmail(token.email);
      if (existing && existing.id !== token.userId) {
        throw new ConflictError(AppErrorCode.AUTH_EMAIL_TAKEN);
      }
      await this.userRepo.updateEmail(token.userId, token.email);
    }

    await this.userRepo.markEmailVerified(token.userId);
  }
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authTokenRepo: IAuthTokenRepository,
    private readonly emailSender: IEmailSenderPort,
  ) {}

  /** 이메일 존재 여부와 관계없이 동일 응답 (계정 열거 방지) */
  async execute(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    if (!email) throw new ValidationError(AppErrorCode.AUTH_EMAIL_INVALID);

    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    await this.authTokenRepo.invalidateUserTokens(user.id, AuthTokenType.PASSWORD_RESET);
    const raw = generateAuthTokenRaw();
    await this.authTokenRepo.create({
      userId: user.id,
      type: AuthTokenType.PASSWORD_RESET,
      tokenHash: hashAuthToken(raw),
      email,
      expiresAt: authTokenExpiresAt(AuthTokenType.PASSWORD_RESET),
    });

    const link = buildAppUrl(`/reset-password?token=${raw}`);
    await this.emailSender.send({
      to: email,
      subject: '[SAR Portfolio] 비밀번호 재설정',
      text: `비밀번호 재설정 링크입니다.\n\n${link}\n\n1시간 내에 유효합니다.`,
    });
  }
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authTokenRepo: IAuthTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: { token: string; password: string; passwordConfirm: string }) {
    if (input.password !== input.passwordConfirm) {
      throw new ValidationError(AppErrorCode.AUTH_PASSWORD_MISMATCH);
    }
    const pwError = validatePasswordFormat(input.password);
    if (pwError) throw new ValidationError(AppErrorCode.AUTH_PASSWORD_INVALID, pwError);

    const token = await this.authTokenRepo.consumeValid(
      hashAuthToken(input.token.trim()),
      AuthTokenType.PASSWORD_RESET,
    );
    if (!token) throw new ValidationError(AppErrorCode.AUTH_TOKEN_INVALID);

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.userRepo.updatePasswordHash(token.userId, passwordHash);
  }
}

export class UnlinkOAuthAccountUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly oauthAccountRepo: IUserOAuthAccountRepository,
  ) {}

  async execute(userId: string, provider: string) {
    if (!isOAuthProvider(provider)) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_PROVIDER_INVALID);
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new AuthenticationError(AppErrorCode.AUTH_UNAUTHORIZED);

    const accounts = await this.oauthAccountRepo.findByUserId(userId);
    const hasProvider = accounts.some((a) => a.provider === provider);
    if (!hasProvider) throw new ValidationError(AppErrorCode.NOT_FOUND);

    const remainingOAuth = accounts.filter((a) => a.provider !== provider).length;
    if (!user.passwordHash && remainingOAuth === 0) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_UNLINK_FORBIDDEN);
    }

    await this.oauthAccountRepo.deleteByUserAndProvider(userId, provider);
  }
}
