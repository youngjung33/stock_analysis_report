import {
  AppErrorCode,
  getRegisterValidationError,
  proposeUsernameFromOAuthProfile,
  withUsernameSuffix,
} from '@sar/shared';
import type { OAuthUserProfile, RegisterInput } from '@sar/shared';
import { ConflictError, ValidationError } from '../../errors/domain.errors';
import { IPasswordHasher, IUserRepository } from '../../repositories';
import { AuthSessionService, AuthSessionResult } from '../../services/auth-session.service';

export type { RegisterInput };

export interface RegisterResult extends AuthSessionResult {
  isNewUser: true;
}

/** 아이디·비밀번호 회원가입 use case */
export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly authSession: AuthSessionService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    const validationError = getRegisterValidationError(input);
    if (validationError) {
      throw new ValidationError(validationError.code, validationError.message);
    }

    const username = input.username.trim();
    const email = input.email?.trim() || null;

    if (await this.userRepo.findByUsername(username)) {
      throw new ConflictError(AppErrorCode.AUTH_USERNAME_TAKEN);
    }
    if (email && (await this.userRepo.findByEmail(email))) {
      throw new ConflictError(AppErrorCode.AUTH_EMAIL_TAKEN);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepo.create({ username, email, passwordHash });

    const session = await this.authSession.issueForUser(user);
    return { ...session, isNewUser: true };
  }
}

/** OAuth 가입 시 username 중복 회피 */
export async function resolveUniqueUsername(
  userRepo: IUserRepository,
  profile: OAuthUserProfile,
): Promise<string> {
  const base = proposeUsernameFromOAuthProfile(profile);
  let candidate = base;
  let attempt = 1;

  while (await userRepo.findByUsername(candidate)) {
    candidate = withUsernameSuffix(base, attempt);
    attempt += 1;
  }

  return candidate;
}
